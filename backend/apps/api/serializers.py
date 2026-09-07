from rest_framework import serializers

class TopSetupsSerializer(serializers.Serializer):
    asset = serializers.CharField()
    bias = serializers.CharField()
    overall = serializers.IntegerField()
    trend = serializers.IntegerField()
    seasonality = serializers.IntegerField()
    cot = serializers.IntegerField()
    retail = serializers.IntegerField()
    indicator_scores = serializers.DictField(child=serializers.IntegerField())
    
class AssetScorecardSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()
    overall_score = serializers.IntegerField()
    bias = serializers.CharField()
    trend_score = serializers.IntegerField()
    seasonality_score = serializers.IntegerField()
    retail_score = serializers.IntegerField()
    cot_score = serializers.IntegerField()
    fund_score = serializers.IntegerField()
    growth = serializers.ListField(child=serializers.DictField())
    jobs = serializers.ListField(child=serializers.DictField())
    inflation = serializers.ListField(child=serializers.DictField())
    bond = serializers.DictField()
    history = serializers.ListField(child=serializers.DictField(), required=False, default=list)

class ForexComponentSerializer(serializers.Serializer):
    name = serializers.CharField()
    score = serializers.IntegerField()
    details = serializers.ListField(child=serializers.CharField())

class ForexScorecardSerializer(serializers.Serializer):
    pair = serializers.CharField()
    overall = serializers.IntegerField()
    bias = serializers.CharField()
    components = serializers.DictField(child=ForexComponentSerializer())  # keyed by component name
    history = serializers.ListField(child=serializers.DictField(), required=False)
    
class EcoSurpriseSerializer(serializers.Serializer):
    currency = serializers.CharField()
    bullish_percentage = serializers.FloatField()


class EconomicStrengthSerializer(serializers.Serializer):
    currency = serializers.CharField()
    bias = serializers.CharField()
    score = serializers.IntegerField()
    delta_score = serializers.IntegerField()
    gdp_growth = serializers.FloatField()
    unemployment = serializers.FloatField()
    interest_rate = serializers.FloatField()
    cpi_yoy = serializers.FloatField()
    real_yield = serializers.FloatField()
    delta_real_yield = serializers.FloatField()


class SeasonalityDataSerializer(serializers.Serializer):
    month = serializers.CharField()
    avg_return = serializers.FloatField()
    current_year_return = serializers.FloatField(allow_null=True)


class COTLatestAssetSerializer(serializers.Serializer):
    asset = serializers.CharField()
    long_contracts = serializers.FloatField()
    short_contracts = serializers.FloatField()
    delta_long = serializers.FloatField()
    delta_short = serializers.FloatField()
    long_pct = serializers.FloatField()
    short_pct = serializers.FloatField()
    net_pct_change = serializers.FloatField()
    net_position = serializers.CharField()


class COTLatestPairSerializer(serializers.Serializer):
    pair = serializers.CharField()
    net_change = serializers.FloatField()
    sentiment = serializers.CharField()
    net_positioning = serializers.CharField()


class RetailSentimentSerializer(serializers.Serializer):
    pair = serializers.CharField()
    long_pct = serializers.FloatField()
    short_pct = serializers.FloatField()
    score = serializers.IntegerField()


class IndicatorRowSerializer(serializers.Serializer):
    indicator = serializers.CharField()
    date = serializers.CharField()
    previous = serializers.CharField()
    forecast = serializers.CharField()
    actual = serializers.CharField()
    surprise = serializers.CharField()

class EconomicHeatmapSerializer(serializers.Serializer):
    currency = serializers.CharField()
    indicators = IndicatorRowSerializer(many=True)
    bullish_pct = serializers.FloatField()

class EconomicEventSerializer(serializers.Serializer):
    date_time = serializers.CharField()
    currency = serializers.CharField()
    event = serializers.CharField()
    actual = serializers.CharField()
    forecast = serializers.CharField()
    previous = serializers.CharField()