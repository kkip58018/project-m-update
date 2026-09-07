from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.analysis.services import get_analyzer
from apps.analysis.constants import STANDARD_CURRENCIES, FOREX_PAIRS
from apps.api.serializers import (
    TopSetupsSerializer,
    AssetScorecardSerializer,
    ForexScorecardSerializer,
    EcoSurpriseSerializer,
    EconomicStrengthSerializer,
    SeasonalityDataSerializer,
    COTLatestAssetSerializer,
    COTLatestPairSerializer,
    RetailSentimentSerializer,
    EconomicHeatmapSerializer,
    EconomicEventSerializer,
)
from datetime import datetime
import pandas as pd
import yfinance as yf
from apps.analysis.services.seasonality_db import seasonality_db
from apps.scrapers.economic import refresh_currency_indicators
from apps.api.permissions import IsAdminUser
from apps.analysis.constants import INDICATOR_ORDER
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache

import logging
logger = logging.getLogger(__name__)
analyzer = get_analyzer()

CACHE_12HOURS = 60 * 60 * 12
CACHE_6HOURS = 60 * 60 * 6
CACHE_1HOUR = 60 * 60 * 1
CACHE_30MIN = 60 * 30


@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class TopSetupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enriched = analyzer.get_enriched_pairs(include_currencies=True)
        serializer = TopSetupsSerializer(enriched, many=True)
        return Response(serializer.data)
    
@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class AssetScorecardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asset = request.query_params.get('asset', 'USD')
        try:
            data = analyzer.get_asset_scorecard(asset)
            serializer = AssetScorecardSerializer(data)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class ForexScorecardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pair = request.query_params.get('pair', 'EUR/USD')
        try:
            data = analyzer.get_forex_scorecard(pair)
            serializer = ForexScorecardSerializer(data)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=500)
        
@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class EcoSurpriseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = []
        for curr in STANDARD_CURRENCIES:
            bullish = analyzer.indicators.get_bullish_percentage(curr)
            data.append({
                'currency': curr,
                'bullish_percentage': bullish,
            })
        serializer = EcoSurpriseSerializer(data, many=True)
        return Response(serializer.data)


@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class EconomicStrengthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        strength_data = analyzer.econ_strength.get_all()
        data = []
        for curr in STANDARD_CURRENCIES:
            row = strength_data.get(curr, {})
            data.append({
                'currency': curr,
                'bias': row.get('bias', 'Neutral'),
                'score': row.get('relative_strength_score', 50),
                'delta_score': row.get('delta_score', 0),
                'gdp_growth': row.get('gdp_growth', 0.0),
                'unemployment': row.get('unemployment_rate', 0.0),
                'interest_rate': row.get('interest_rate', 0.0),
                'cpi_yoy': row.get('cpi_yoy', 0.0),
                'real_yield': row.get('real_yield', 0.0),
                'delta_real_yield': row.get('delta_real_yield', 0.0),
            })
        serializer = EconomicStrengthSerializer(data, many=True)
        return Response(serializer.data)

@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class MonthlySeasonalityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pair = request.query_params.get('pair', 'EUR/USD')
        try:
            data = seasonality_db.get_monthly_seasonality(pair)
            return Response(data)
        except Exception as e:
            logger.error(f"Monthly seasonality error: {e}")
            return Response({'error': str(e)}, status=500)


@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class AnnualSeasonalityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pair = request.query_params.get('pair', 'EUR/USD')
        try:
            data = seasonality_db.get_annual_seasonality(pair)
            return Response(data)
        except Exception as e:
            logger.error(f"Annual seasonality error: {e}")
            return Response({'error': str(e)}, status=500)

@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class LatestCOTView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return three parts: stacked bar data, asset table, pair table
        current = analyzer.cot.get_current()
        previous = analyzer.cot.get_previous()
        raw = analyzer.cot.get_raw()

        # Asset table
        asset_data = []
        for item in raw:
            latest_long = item['latest_long']
            latest_short = item['latest_short']
            prev_long = item.get('prev_long', latest_long)
            prev_short = item.get('prev_short', latest_short)
            delta_long = latest_long - prev_long
            delta_short = latest_short - prev_short
            latest_long_pct = item['latest_long_pct']
            latest_short_pct = 100 - latest_long_pct
        
            if item.get('prev_long_pct') is not None:
                prev_long_pct = item['prev_long_pct']
                prev_short_pct = 100 - prev_long_pct
                net_pct_change = (latest_long_pct - latest_short_pct) - (prev_long_pct - prev_short_pct)
            else:
                net_pct_change = 0.0
        
            asset_data.append({
                'asset': item['asset'],
                'long_contracts': latest_long,
                'short_contracts': latest_short,
                'delta_long': delta_long,
                'delta_short': delta_short,
                'long_pct': latest_long_pct,
                'short_pct': latest_short_pct,
                'net_pct_change': net_pct_change,
                'net_position': 'Bullish' if latest_long_pct >= 60 else 'Bearish' if latest_long_pct <= 40 else 'Neutral',
            })
        # Pair table
        pair_data = []
        for pair in FOREX_PAIRS:
            base, quote = pair.split('/')
            net_base = analyzer.cot.get_net_position(base)
            net_quote = analyzer.cot.get_net_position(quote)
            current_diff = net_base - net_quote
        
            # Use previous net position (falls back to current if no previous)
            prev_base = analyzer.cot.get_previous_net_position(base)
            prev_quote = analyzer.cot.get_previous_net_position(quote)
            prev_diff = prev_base - prev_quote
        
            net_change = current_diff - prev_diff  # this is the change in the spread
        
            # Sentiment based on net_change direction
            sentiment = 'Bullish' if net_change > 0.1 else 'Bearish' if net_change < -0.1 else 'Neutral'
            # Net positioning based on current spread
            position = 'Bullish' if current_diff >= 20 else 'Bearish' if current_diff <= -20 else 'Neutral'
        
            pair_data.append({
                'pair': pair,
                'net_change': net_change,
                'sentiment': sentiment,
                'net_positioning': position,
            })

        # Stacked bar data: assets with long and short percentages
        assets = sorted(current.keys())
        long_vals = [current[a] for a in assets]
        short_vals = [100 - v for v in long_vals]
        latest_date = analyzer.cot.get_latest_date()

        return Response({
            'assets': assets,
            'long_vals': long_vals,
            'short_vals': short_vals,
            'asset_table': asset_data,
            'pair_table': pair_data,
            'latest_date': latest_date,
        })


@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class COTHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asset = request.query_params.get('asset', 'USD')
        from apps.services import turso_client
        records = turso_client.get_cot_data(asset)
        history_data = []
        for row in records:
            if isinstance(row, dict):
                long_pos = float(row.get('long_pos', 0) or 0)
                short_pos = float(row.get('short_pos', 0) or 0)
                total = long_pos + short_pos
                long_pct = (long_pos / total * 100) if total > 0 else 50.0
                history_data.append({
                    'date': row.get('date'),
                    'long': long_pos,
                    'short': short_pos,
                    'long_pct': long_pct,
                })
        return Response(history_data)

@method_decorator(cache_page(CACHE_30MIN), name='dispatch')
class RetailSentimentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scores = analyzer.retail.get_scores()
        long_pct = analyzer.retail.get_long_pct()
        data = []
        for pair, score in scores.items():
            lp = long_pct.get(pair, 50.0)
            data.append({
                'pair': pair,
                'long_pct': lp,
                'short_pct': 100 - lp,
                'score': score,
            })
        serializer = RetailSentimentSerializer(data, many=True)
        return Response(serializer.data)

@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class PutCallRatioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ticker = request.query_params.get('ticker', 'IBIT')
        from apps.services import turso_client
        records = turso_client.get_put_call_history(ticker)
        data = []
        for row in records:
            data.append({
                'date': row.get('date'),
                'ratio': float(row.get('ratio', 0.0))
            })
        return Response(data)


@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class EconomicHeatmapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        currency = request.query_params.get('currency', 'USD')
        raw = analyzer.indicators.get_raw_data(currency)
        indicators = list(raw.keys())
        rows = []
        for ind in indicators:
            actual, forecast, date_val, prev_val = raw[ind]
            # Convert date_val to datetime if it's a string
            if date_val:
                if isinstance(date_val, str):
                    try:
                        date_val = datetime.strptime(date_val, '%Y-%m-%d')
                    except ValueError:
                        pass
                date_str = date_val.strftime('%d-%b') if hasattr(date_val, 'strftime') else str(date_val)
            else:
                date_str = 'N/A'
            surprise = actual - forecast if actual is not None and forecast is not None else None
            rows.append({
                'indicator': ind,
                'date': date_str,
                'previous': f"{prev_val:.2f}" if prev_val is not None else 'N/A',
                'forecast': f"{forecast:.2f}" if forecast is not None else 'N/A',
                'actual': f"{actual:.2f}" if actual is not None else 'N/A',
                'surprise': f"{surprise:+.2f}" if surprise is not None else 'N/A',
            })
        bullish = analyzer.indicators.get_bullish_percentage(currency)
        data = {
            'currency': currency,
            'indicators': rows,
            'bullish_pct': bullish,
        }
        serializer = EconomicHeatmapSerializer(data)
        return Response(serializer.data)
@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class EconomicCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.scrapers.calendar import fetch_forexfactory_calendar
        events = fetch_forexfactory_calendar()
        serializer = EconomicEventSerializer(events, many=True)
        return Response(serializer.data)

@method_decorator(cache_page(CACHE_12HOURS), name='dispatch')
class COTTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get assets from query param, e.g., ?assets=USD,EUR,GBP
        assets_param = request.query_params.get('assets', '')
        if not assets_param:
            return Response({'error': 'No assets provided'}, status=400)
        assets = [a.strip() for a in assets_param.split(',') if a.strip()]
        
        from apps.services import turso_client
        data = []
        for asset in assets:
            records = turso_client.get_cot_data(asset)
            # Convert records to list of {date, long_pct}
            asset_data = []
            for rec in records:
                if isinstance(rec, dict):
                    date = rec.get('date')
                    long_pos = float(rec.get('long_pos', 0) or 0)
                    short_pos = float(rec.get('short_pos', 0) or 0)
                    total = long_pos + short_pos
                    long_pct = (long_pos / total * 100) if total > 0 else 50.0
                    asset_data.append({'date': date, 'long_pct': long_pct})
            data.append({'asset': asset, 'data': asset_data})
        return Response(data)

@method_decorator(cache_page(CACHE_6HOURS), name='dispatch')
class EconomicHeatmapRefreshView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        currency = request.data.get('currency', 'USD')
        try:
            updated, message = refresh_currency_indicators(currency, analyzer.indicators)
            return Response({'updated': updated, 'message': message})
        except Exception as e:
            logger.error(f"Refresh failed for {currency}: {e}")
            return Response({'error': str(e)}, status=500)
        
        