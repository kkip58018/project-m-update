from rest_framework.views import APIView
from rest_framework.response import Response
from apps.analysis.services import get_analyzer
from apps.api.serializers import RetailSentimentSerializer
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
analyzer = get_analyzer()

CACHE_12HOURS = 60 * 60 * 12
CACHE_30MIN = 60 * 30

@method_decorator(cache_page(CACHE_30MIN), name='dispatch')
class PublicRetailSentimentView(APIView):
    permission_classes = []  # No authentication

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
class PublicLatestCOTView(APIView):
    permission_classes = []  # No authentication

    def get(self, request):
        # Same logic as LatestCOTView but without auth
        current = analyzer.cot.get_current()
        previous = analyzer.cot.get_previous()
        raw = analyzer.cot.get_raw()

        # Asset table
        asset_data = []
        for item in raw:
            asset_data.append({
                'asset': item['asset'],
                'long_contracts': item['latest_long'],
                'short_contracts': item['latest_short'],
                'delta_long': 0,  # compute from previous if available
                'delta_short': 0,
                'long_pct': item['latest_long_pct'],
                'short_pct': 100 - item['latest_long_pct'],
                'net_pct_change': 0,
                'net_position': 'Bullish' if item['latest_long_pct'] >= 60 else 'Bearish' if item['latest_long_pct'] <= 40 else 'Neutral',
            })

        # Pair table
        from apps.analysis.constants import FOREX_PAIRS
        pair_data = []
        for pair in FOREX_PAIRS:
            base, quote = pair.split('/')
            net_base = analyzer.cot.get_net_position(base)
            net_quote = analyzer.cot.get_net_position(quote)
            current_diff = net_base - net_quote
            prev_base = analyzer.cot.get_previous_net_position(base)
            prev_quote = analyzer.cot.get_previous_net_position(quote)
            prev_diff = prev_base - prev_quote
            net_change = current_diff - prev_diff
            sentiment = 'Bullish' if net_change > 0.1 else 'Bearish' if net_change < -0.1 else 'Neutral'
            position = 'Bullish' if current_diff >= 20 else 'Bearish' if current_diff <= -20 else 'Neutral'
            pair_data.append({
                'pair': pair,
                'net_change': net_change,
                'sentiment': sentiment,
                'net_positioning': position,
            })

        assets = sorted(current.keys())
        long_vals = [current[a] for a in assets]
        short_vals = [100 - v for v in long_vals]

        return Response({
            'assets': assets,
            'long_vals': long_vals,
            'short_vals': short_vals,
            'asset_table': asset_data,
            'pair_table': pair_data,
        })