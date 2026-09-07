from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.api.permissions import IsAdminUser
from apps.analysis.services import get_analyzer, reload_analyzer
from apps.services import supabase_client, turso_client
from apps.analysis.constants import STANDARD_CURRENCIES, DIRECTION, FOREX_PAIRS
from datetime import datetime
from django.core.cache import cache
from apps.scrapers.put_call import fetch_and_store_put_call_ratio
from apps.services import supabase_client, turso_client
import logging
from curl_cffi import requests
from bs4 import BeautifulSoup
import time
from apps.analysis.constants import ECON_SCRAPE_URLS, DIRECTION



logger = logging.getLogger(__name__)
analyzer = get_analyzer()


class UpdateIndicatorView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency, indicator):
        data = request.data
        actual = data.get('actual')
        forecast = data.get('forecast')
        date_str = data.get('date')
        previous = data.get('previous')

        if actual is None or forecast is None or date_str is None:
            return Response(
                {'error': 'actual, forecast, and date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert date string to datetime if needed
        if isinstance(date_str, str):
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                date_obj = datetime.now().date()
        else:
            date_obj = date_str

        success = analyzer.indicators.update_indicator(
            currency=currency,
            indicator=indicator,
            actual=float(actual),
            forecast=float(forecast),
            date=date_obj.isoformat(),
            previous=float(previous) if previous is not None else None
        )

        if success:
            cache.clear()
            return Response({'message': f'Indicator {indicator} for {currency} updated successfully'})
        else:
            return Response({'error': 'Failed to update indicator'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateCOTRecordView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        data = request.data
        asset = data.get('asset')
        asset_class = data.get('class', 'forex')
        date_str = data.get('date')
        long_pos = data.get('long_pos')
        short_pos = data.get('short_pos')

        if not all([asset, date_str, long_pos is not None, short_pos is not None]):
            return Response(
                {'error': 'asset, date, long_pos, and short_pos are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate date format
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return Response(
                {'error': 'date must be in YYYY-MM-DD format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success = analyzer.cot.update_record(
            asset=asset,
            asset_class=asset_class,
            date=date_str,
            long_pos=float(long_pos),
            short_pos=float(short_pos)
        )

        if success:
            cache.clear()
            return Response({'message': f'COT record for {asset} updated successfully'})
        else:
            return Response({'error': 'Failed to update COT record'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateBondYieldView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency):
        score = request.data.get('score')
        if score is None:
            return Response({'error': 'score is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score = int(score)
            if score not in [-1, 0, 1]:
                return Response({'error': 'score must be -1, 0, or 1'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'score must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        success = analyzer.bond_yield.update_score(currency, score)
        if success:
            cache.clear()
            return Response({'message': f'Bond yield score for {currency} updated to {score}'})
        else:
            return Response({'error': 'Failed to update bond yield score'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateEconomicStrengthView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency):
        data = request.data
        required_fields = ['gdp_growth', 'unemployment_rate', 'interest_rate', 'cpi_yoy']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            payload = {
                'gdp_growth': float(data['gdp_growth']),
                'unemployment_rate': float(data['unemployment_rate']),
                'interest_rate': float(data['interest_rate']),
                'cpi_yoy': float(data['cpi_yoy']),
                'real_yield': float(data.get('real_yield', 0.0)),
                'bias': data.get('bias', 'Neutral'),
                'relative_strength_score': int(data.get('relative_strength_score', 50)),
                'delta_score': int(data.get('delta_score', 0)),
                'delta_real_yield': float(data.get('delta_real_yield', 0.0)),
            }
        except ValueError:
            return Response(
                {'error': 'All numeric fields must be valid numbers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success = analyzer.econ_strength.update_strength(currency, payload)
        if success:
            cache.clear()
            return Response({'message': f'Economic strength for {currency} updated successfully'})
        else:
            return Response({'error': 'Failed to update economic strength'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPendingUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get all users with approved=False
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin') \
            .eq('approved', False) \
            .execute()
        return Response(resp.data)


class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            supabase_client.admin.table('user_profiles') \
                .update({'approved': True}) \
                .eq('id', user_id) \
                .execute()
            # Also fetch the user's email for response
            resp = supabase_client.admin.table('user_profiles') \
                .select('email') \
                .eq('id', user_id) \
                .execute()
            email = resp.data[0]['email'] if resp.data else user_id
            return Response({'message': f'User {email} approved successfully'})
        except Exception as e:
            logger.error(f"Failed to approve user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetApprovedUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin') \
            .eq('approved', True) \
            .execute()
        return Response(resp.data)


class TrendSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # We'll store settings in database or a config file
        # For now, get from analyzer
        return Response({
            'ma_periods': analyzer.trend.ma_periods
        })

    def put(self, request):
        periods = request.data.get('ma_periods')
        if not periods or not isinstance(periods, list):
            return Response(
                {'error': 'ma_periods must be a list of integers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            periods = [int(p) for p in periods]
            if any(p <= 0 for p in periods):
                return Response(
                    {'error': 'All periods must be positive integers'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'All periods must be integers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update in analyzer
        analyzer.trend.ma_periods = periods
        # Clear caches so recomputed scores are fresh on next request
        cache.clear()
        return Response({'message': 'Trend settings updated successfully', 'ma_periods': periods})
class RefreshIndicatorsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        currency = request.data.get('currency', '').upper()
        if not currency or currency not in STANDARD_CURRENCIES:
            return Response(
                {'error': f'Invalid currency. Must be one of {STANDARD_CURRENCIES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Use the analyzer's refresh method (which calls the scraper)
            updated, message = analyzer.indicators.refresh_from_web(currency)
            # Reload the shared in-memory state and drop cached responses so the
            # frontend receives the freshly scraped values on its next request.
            reload_analyzer()
            cache.clear()
            return Response({
                'message': f'Refresh completed for {currency}',
                'updated': updated,
                'details': message
            })
        except Exception as e:
            logger.error(f"Refresh indicators failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RefreshCOTView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        try:
            updated = analyzer.cot.refresh_from_web()
            reload_analyzer()
            cache.clear()
            return Response({
                'message': f'COT data refreshed successfully',
                'updated': updated
            })
        except Exception as e:
            logger.error(f"Refresh COT failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshRetailSentimentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            success = analyzer.retail.refresh_from_api()
            if success:
                reload_analyzer()
                cache.clear()
                return Response({'message': 'Retail sentiment updated successfully'})
            else:
                return Response({'error': 'Failed to refresh retail sentiment'}, status=500)
        except Exception as e:
            logger.error(f"Refresh retail sentiment failed: {e}")
            return Response({'error': str(e)}, status=500)
        
class RefreshPutCallView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        assets = [
            ("BTC", "IBIT"),
            ("XAU", "GLD"),
            ("XAG", "SLV"),
            ("NAS100", "QQQ"),
            ("SPX500", "SPY"),
            ("USD", "UUP"),
            ("USOIL", "USO"),
        ]
        results = {}
        for asset_name, ticker in assets:
            ratio = fetch_and_store_put_call_ratio(asset_name, ticker, supabase_client, turso_client)
            results[asset_name] = ratio if ratio is not None else "failed"
        reload_analyzer()
        cache.clear()
        return Response({'message': 'Put/Call ratios refreshed', 'results': results})

class ClearCacheAndReloadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            reload_analyzer()
            cache.clear()
            return Response({'message': 'Cache cleared and all data reloaded successfully'})
        except Exception as e:
            logger.error(f"Clear cache and reload failed: {e}")
            return Response({'error': str(e)}, status=500)
        
class RefreshAllDataView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            reload_analyzer()
            cache.clear()
            return Response({'message': 'All data refreshed and cache cleared'})
        except Exception as e:
            logger.error(f"Refresh all data failed: {e}")
            return Response({'error': str(e)}, status=500)
        

class ClearCacheView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        reload_analyzer()
        # Also reload seasonality from DB (if needed)
        from apps.analysis.services.seasonality_db import seasonality_db
        seasonality_db.reload()
        cache.clear()
        return Response({'message': 'Cache cleared and data reloaded'})
class RefreshSeasonalityView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            from apps.analysis.services.seasonality_db import seasonality_db
            result = seasonality_db.refresh_from_yfinance()
            seasonality_db.reload()
            reload_analyzer()
            cache.clear()
            return Response({
                'message': 'Seasonality data refreshed successfully',
                'details': result
            })
        except Exception as e:
            logger.error(f"Refresh seasonality failed: {e}")
            return Response({'error': str(e)}, status=500)
        
class RemoveUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, user_id):
        try:
            # Delete from user_profiles table
            supabase_client.admin.table('user_profiles').delete().eq('id', user_id).execute()
            # Also delete from auth.users (requires admin privileges)
            supabase_client.admin.auth.admin.delete_user(user_id)
            return Response({'message': 'User removed successfully'})
        except Exception as e:
            logger.error(f"Failed to remove user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PauseUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            supabase_client.admin.table('user_profiles') \
                .update({'paused': True}) \
                .eq('id', user_id) \
                .execute()
            return Response({'message': 'User paused successfully'})
        except Exception as e:
            logger.error(f"Failed to pause user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UnpauseUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            supabase_client.admin.table('user_profiles') \
                .update({'paused': False}) \
                .eq('id', user_id) \
                .execute()
            return Response({'message': 'User unpaused successfully'})
        except Exception as e:
            logger.error(f"Failed to unpause user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            supabase_client.admin.table('user_profiles').update({'approved': True}).eq('id', user_id).execute()
            return Response({'message': 'User approved successfully'})
        except Exception as e:
            logger.error(f"Failed to approve user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class GetPendingUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin, paused') \
            .eq('approved', False) \
            .execute()
        return Response(resp.data)


class GetApprovedUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin, paused') \
            .eq('approved', True) \
            .execute()
        return Response(resp.data)

class RefreshAllIndicatorsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Origin": "https://www.investing.com",
            "Referer": "https://www.investing.com/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        }

        def clean_value(val):
            if val in [None, "N/A", ""]:
                return None
            val_str = str(val)
            for char in ["%", "K", "M", "B", ","]:
                val_str = val_str.replace(char, "")
            try:
                return float(val_str)
            except:
                return None

        def scrape_data(url):
            if not url:
                return None
            try:
                response = requests.get(url, headers=headers, timeout=10, impersonate="chrome120")
                if response.status_code != 200:
                    return None

                if "investing.com" in url:
                    try:
                        json_data = response.json()
                        occurrences = json_data.get("occurrences", [])
                        if not occurrences:
                            return None
                        latest = None
                        for occ in occurrences:
                            if occ.get("actual") is not None:
                                latest = occ
                                break
                        if not latest:
                            latest = occurrences[0]
                        raw_time = latest.get("occurrence_time", "")
                        date_str = raw_time.split("T")[0] if "T" in raw_time else raw_time
                        return {
                            "date": date_str,
                            "actual": clean_value(latest.get("actual")),
                            "previous": clean_value(latest.get("previous")),
                            "forecast": clean_value(latest.get("forecast")),
                        }
                    except:
                        pass

                elif "tradingeconomics.com" in url:
                    soup = BeautifulSoup(response.text, "html.parser")
                    table = soup.find("table", class_="table")
                    if table:
                        rows = table.find_all("tr")
                        if len(rows) > 2:
                            cols = rows[2].find_all("td")
                            if len(cols) >= 7:
                                return {
                                    "date": cols[0].text.strip(),
                                    "actual": clean_value(cols[4].text.strip()),
                                    "previous": clean_value(cols[5].text.strip()),
                                    "forecast": clean_value(cols[6].text.strip()),
                                }
                            elif len(cols) >= 6:
                                return {
                                    "date": cols[0].text.strip(),
                                    "actual": clean_value(cols[3].text.strip()),
                                    "previous": clean_value(cols[4].text.strip()),
                                    "forecast": clean_value(cols[5].text.strip()),
                                }
                return None
            except Exception as e:
                logger.error(f"Scraping error for {url}: {e}")
                return None

        total_updated = 0
        total_failed = 0
        results = []

        for key, urls in ECON_SCRAPE_URLS.items():
            if not urls.get("primary") and not urls.get("fallback"):
                continue

            currency_code = key.split(" - ")[0]
            indicator_name = key.split(" - ")[1]

            scraped = None
            if urls.get("primary"):
                scraped = scrape_data(urls["primary"])
            if not scraped and urls.get("fallback"):
                scraped = scrape_data(urls["fallback"])
                time.sleep(0.5)

            if scraped and scraped["actual"] is not None and scraped["forecast"] is not None:
                direction = DIRECTION.get(indicator_name, "higher")
                if direction == "higher":
                    score = 1 if scraped["actual"] > scraped["forecast"] else -1 if scraped["actual"] < scraped["forecast"] else 0
                else:
                    score = 1 if scraped["actual"] < scraped["forecast"] else -1 if scraped["actual"] > scraped["forecast"] else 0

                data = {
                    'currency_code': currency_code,
                    'indicator_name': indicator_name,
                    'actual_value': scraped["actual"],
                    'forecast_value': scraped["forecast"],
                    'release_date': scraped["date"],
                    'previous_value': scraped["previous"],
                    'score': score,
                }
                success = supabase_client.upsert_indicator(data)
                if success:
                    total_updated += 1
                else:
                    total_failed += 1
                    results.append(f"{key} (DB error)")
            else:
                total_failed += 1
                results.append(f"{key} (scrape failed)")

            time.sleep(1.5)  # Delay between indicators

        reload_analyzer()
        cache.clear()
        msg = f"Updated {total_updated} indicators, failed {total_failed}"
        if results:
            msg += f". Failures: {', '.join(results[:10])}"
        return Response({'message': msg, 'updated': total_updated, 'failed': total_failed})