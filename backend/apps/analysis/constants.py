# Constants copied from original Streamlit app, with minor cleanup.

CORE_INDICATORS = [
    "GDP",
    "Retail Sales",
    "Manufacturing PMI",
    "Services PMI",
    "CPI YoY",
    "PPI YoY",
    "Unemployment Rate",
]

EXTRA_INDICATORS = {
    "USD": [
        "PCE YoY",
        "NFP",
        "Unemployment claims",
        "ADP",
        "JOLTS job openings",
        "Average Hourly Earnings",
    ],
    "JPY": ["Household spending"],
}
SCORING_ONLY_INDICATORS = ["Consumer Confidence"]
SCORING_EXCLUDED_INDICATORS = {"USD": ["Average Hourly Earnings"]}

DIRECTION = {
    "GDP": "higher",
    "Retail Sales": "higher",
    "Manufacturing PMI": "higher",
    "Services PMI": "higher",
    "CPI YoY": "higher",
    "PPI YoY": "higher",
    "Unemployment Rate": "lower",
    "PCE YoY": "higher",
    "NFP": "higher",
    "Unemployment claims": "lower",
    "ADP": "higher",
    "JOLTS job openings": "higher",
    "Average Hourly Earnings": "higher",
    "Household spending": "higher",
    "Consumer Confidence": "higher",
}

STANDARD_CURRENCIES = ["AUD", "CAD", "CHF", "EUR", "GBP", "JPY", "NZD", "USD"]

FOREX_PAIRS = [
    "AUD/CAD", "AUD/CHF", "AUD/JPY", "AUD/NZD", "AUD/USD",
    "CAD/CHF", "CAD/JPY",
    "CHF/JPY",
    "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/GBP", "EUR/JPY", "EUR/NZD", "EUR/USD",
    "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/JPY", "GBP/NZD", "GBP/USD",
    "NZD/CAD", "NZD/CHF", "NZD/JPY", "NZD/USD",
    "USD/CAD", "USD/CHF", "USD/JPY",
]

INDICATOR_ORDER = [
    "GDP",
    "Retail Sales",
    "Manufacturing PMI",
    "Services PMI",
    "Consumer Confidence",
    "CPI YoY",
    "PPI YoY",
    "PCE YoY",
    "NFP",
    "ADP",
    "Unemployment Rate",
    "Unemployment claims",
    "JOLTS job openings",
    "Average Hourly Earnings",
    "Household spending",
]

ECON_SCRAPE_URLS = {
    # ==========================================
    # UNITED STATES (USD)
    # ==========================================
    "USD - GDP": {
        "primary": "https://tradingeconomics.com/united-states/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/375/occurrences?domain_id=1&limit=1000",
    },
    "USD - Retail Sales": {
        "primary": "https://tradingeconomics.com/united-states/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/256/occurrences?domain_id=1&limit=1000",
    },
    "USD - Manufacturing PMI": {
        "primary": "https://tradingeconomics.com/united-states/business-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/173/occurrences?domain_id=1&limit=1000",
    },
    "USD - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/176/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "USD - Consumer Confidence": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/48/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/united-states/consumer-confidence",
    },
    "USD - CPI YoY": {
        "primary": "https://tradingeconomics.com/united-states/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/733/occurrences?domain_id=1&limit=1000",
    },
    "USD - PPI YoY": {
        "primary": "https://tradingeconomics.com/united-states/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/734/occurrences?domain_id=1&limit=1000",
    },
    "USD - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/united-states/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/300/occurrences?domain_id=1&limit=1000",
    },
    "USD - PCE YoY": {
        "primary": "https://tradingeconomics.com/united-states/core-pce-price-index-annual-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/905/occurrences?domain_id=1&limit=1000",
    },
    "USD - NFP": {
        "primary": "https://tradingeconomics.com/united-states/non-farm-payrolls",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/227/occurrences?domain_id=1&limit=1000",
    },
    "USD - ADP": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/united-states/adp-employment-change",
    },
    "USD - Unemployment claims": {
        "primary": "https://tradingeconomics.com/united-states/jobless-claims",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/294/occurrences?domain_id=1&limit=1000",
    },
    "USD - JOLTS job openings": {
        "primary": "https://tradingeconomics.com/united-states/job-offers",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1057/occurrences?domain_id=1&limit=1000",
    },
    "USD - Average Hourly Earnings": {
        "primary": "https://tradingeconomics.com/united-states/average-hourly-earnings-yoy",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1777/occurrences?domain_id=1&limit=1000",
    },
    # ==========================================
    # EURO AREA (EUR)
    # ==========================================
    "EUR - GDP": {
        "primary": "https://tradingeconomics.com/euro-area/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/120/occurrences?domain_id=1&limit=1000",
    },
    "EUR - Retail Sales": {
        "primary": "https://tradingeconomics.com/euro-area/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/255/occurrences?domain_id=1&limit=1000",
    },
    "EUR - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/201/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "EUR - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/272/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "EUR - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/euro-area/consumer-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/49/occurrences?domain_id=1&limit=1000",
    },
    "EUR - CPI YoY": {
        "primary": "https://tradingeconomics.com/euro-area/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/68/occurrences?domain_id=1&limit=1000",
    },
    "EUR - PPI YoY": {
        "primary": "https://tradingeconomics.com/euro-area/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/935/occurrences?domain_id=1&limit=1000",
    },
    "EUR - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/euro-area/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/299/occurrences?domain_id=1&limit=1000eu",
    },
    # ==========================================
    # UNITED KINGDOM (GBP)
    # ==========================================
    "GBP - GDP": {
        "primary": "https://tradingeconomics.com/united-kingdom/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/121/occurrences?domain_id=1&limit=1000",
    },
    "GBP - Retail Sales": {
        "primary": "https://tradingeconomics.com/united-kingdom/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/258/occurrences?domain_id=1&limit=1000",
    },
    "GBP - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/204/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "GBP - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/274/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "GBP - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/united-kingdom/consumer-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/330/occurrences?domain_id=1&limit=1000",
    },
    "GBP - CPI YoY": {
        "primary": "https://tradingeconomics.com/united-kingdom/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/67/occurrences?domain_id=1&limit=1000",
    },
    "GBP - PPI YoY": {
        "primary": "https://tradingeconomics.com/united-kingdom/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/730/occurrences?domain_id=1&limit=1000",
    },
    "GBP - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/united-kingdom/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/297/occurrences?domain_id=1&limit=1000",
    },
    # ==========================================
    # AUSTRALIA (AUD)
    # ==========================================
    "AUD - GDP": {
        "primary": "https://tradingeconomics.com/australia/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/124/occurrences?domain_id=1&limit=1000",
    },
    "AUD - Retail Sales": {
        "primary": "https://tradingeconomics.com/australia/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/262/occurrences?domain_id=1&limit=1000",
    },
    "AUD - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1838/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "AUD - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1839/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "AUD - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/australia/consumer-confidence",
        "fallback": "",
    },
    "AUD - CPI YoY": {
        "primary": "https://tradingeconomics.com/australia/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1011/occurrences?domain_id=1&limit=1000",
    },
    "AUD - PPI YoY": {
        "primary": "https://tradingeconomics.com/australia/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1164/occurrences?domain_id=1&limit=1000",
    },
    "AUD - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/australia/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/302/occurrences?domain_id=1&limit=1000",
    },
    # ==========================================
    # CANADA (CAD)
    # ==========================================
    "CAD - GDP": {
        "primary": "https://tradingeconomics.com/canada/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1024/occurrences?domain_id=1&limit=1000",
    },
    "CAD - Retail Sales": {
        "primary": "https://tradingeconomics.com/canada/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/260/occurrences?domain_id=1&limit=1000",
    },
    "CAD - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1029/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "CAD - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/2265/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "CAD - Consumer Confidence": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/2068/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "CAD - CPI YoY": {
        "primary": "https://tradingeconomics.com/canada/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/741/occurrences?domain_id=1&limit=1000",
    },
    "CAD - PPI YoY": {
        "primary": "https://tradingeconomics.com/canada/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/742/occurrences?domain_id=1&limit=1000",
    },
    "CAD - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/canada/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/301/occurrences?domain_id=1&limit=1000",
    },
    # ==========================================
    # NEW ZEALAND (NZD)
    # ==========================================
    "NZD - GDP": {
        "primary": "https://tradingeconomics.com/new-zealand/gdp-growth",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/125/occurrences?domain_id=1&limit=1000",
    },
    "NZD - Retail Sales": {
        "primary": "https://tradingeconomics.com/new-zealand/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/257/occurrences?domain_id=1&limit=1000",
    },
    "NZD - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/338/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "NZD - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/910/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "NZD - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/new-zealand/consumer-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/357/occurrences?domain_id=1&limit=1000",
    },
    "NZD - CPI YoY": {
        "primary": "https://tradingeconomics.com/new-zealand/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1063/occurrences?domain_id=1&limit=1000",
    },
    "NZD - PPI YoY": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/247/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/new-zealand/producer-price-inflation-mom",
    },
    "NZD - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/new-zealand/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/295/occurrences?domain_id=1&limit=1000",
    },
    # ==========================================
    # SWISS FRANC (CHF)
    # ==========================================
    "CHF - GDP": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/122/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/switzerland/gdp-growth",
    },
    "CHF - Retail Sales": {
        "primary": "https://tradingeconomics.com/switzerland/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/259/occurrences?domain_id=1&limit=1000",
    },
    "CHF - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/278/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "CHF - Services PMI": {"primary": "", "fallback": ""},
    "CHF - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/switzerland/consumer-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/362/occurrences?domain_id=1&limit=1000",
    },
    "CHF - CPI YoY": {
        "primary": "https://tradingeconomics.com/switzerland/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/956/occurrences?domain_id=1&limit=1000",
    },
    "CHF - PPI YoY": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/960/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/switzerland/producer-prices-change",
    },
    "CHF - Unemployment Rate": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/959/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/switzerland/unemployment-rate",
    },
    # ==========================================
    # JAPAN (JPY)
    # ==========================================
    "JPY - GDP": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/119/occurrences?domain_id=1&limit=1000",
        "fallback": "https://tradingeconomics.com/japan/gdp-growth",
    },
    "JPY - Retail Sales": {
        "primary": "https://tradingeconomics.com/japan/retail-sales",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/190/occurrences?domain_id=1&limit=1000",
    },
    "JPY - Manufacturing PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/202/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "JPY - Services PMI": {
        "primary": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/1912/occurrences?domain_id=1&limit=1000",
        "fallback": "",
    },
    "JPY - Consumer Confidence": {
        "primary": "https://tradingeconomics.com/japan/consumer-confidence",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/148/occurrences?domain_id=1&limit=1000",
    },
    "JPY - CPI YoY": {
        "primary": "https://tradingeconomics.com/japan/inflation-cpi",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/992/occurrences?domain_id=1&limit=1000",
    },
    "JPY - PPI YoY": {
        "primary": "https://tradingeconomics.com/japan/producer-prices-change",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/35/occurrences?domain_id=1&limit=1000",
    },
    "JPY - Unemployment Rate": {
        "primary": "https://tradingeconomics.com/japan/unemployment-rate",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/298/occurrences?domain_id=1&limit=1000",
    },
    "JPY - Household spending": {
        "primary": "https://tradingeconomics.com/japan/household-spending",
        "fallback": "https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/361/occurrences?domain_id=1&limit=1000",
    },
}