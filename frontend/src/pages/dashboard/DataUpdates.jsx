import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../api/client';
import { resetQueryCaches } from '../../utils/reactQuery';

const CORE_INDICATORS = [
  'GDP',
  'Retail Sales',
  'Manufacturing PMI',
  'Services PMI',
  'CPI YoY',
  'PPI YoY',
  'Unemployment Rate',
];

const SCORING_ONLY_INDICATORS = ['Consumer Confidence'];

const EXTRA_INDICATORS = {
  USD: ['PCE YoY', 'NFP', 'Unemployment Claims', 'ADP', 'JOLTS Job Openings', 'Average Hourly Earnings'],
  JPY: ['Household Spending YoY'],
};

const SCORING_EXCLUDED_INDICATORS = {
  USD: ['Average Hourly Earnings'],
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'CHF', 'JPY'];

const ASSET_OPTIONS = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'JPY', label: 'Japanese Yen' },
  { value: 'AUD', label: 'Australian Dollar' },
  { value: 'CAD', label: 'Canadian Dollar' },
  { value: 'CHF', label: 'Swiss Franc' },
  { value: 'NZD', label: 'New Zealand Dollar' },
  { value: 'XAU/USD', label: 'Gold' },
  { value: 'XAG/USD', label: 'Silver' },
  { value: 'BTC/USD', label: 'Bitcoin' },
  { value: 'ETH/USD', label: 'Ethereum' },
  { value: 'USOIL/USD', label: 'US Oil' },
  { value: 'SPX500/USD', label: 'S&P 500' },
  { value: 'NAS100/USD', label: 'Nasdaq' },
];

const FOREX_PAIRS = [
  'AUD/CAD', 'AUD/CHF', 'AUD/JPY', 'AUD/NZD', 'AUD/USD',
  'CAD/CHF', 'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD',
  'EUR/CHF', 'EUR/GBP', 'EUR/JPY', 'EUR/NZD', 'EUR/USD',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/JPY', 'GBP/NZD',
  'GBP/USD', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD',
  'USD/CAD', 'USD/CHF', 'USD/JPY',
];

const getIndicatorsForCurrency = (currency) => {
  const base = [...CORE_INDICATORS, ...SCORING_ONLY_INDICATORS];
  const extras = EXTRA_INDICATORS[currency] || [];
  const excluded = SCORING_EXCLUDED_INDICATORS[currency] || [];
  const combined = [...base, ...extras];
  return combined.filter(ind => !excluded.includes(ind));
};

const DataUpdates = () => {
  const [activeTab, setActiveTab] = useState('indicators');
  const queryClient = useQueryClient();

  // Drop the whole client cache after a successful write/refresh. The backend
  // clears its own cache in the same request; active pages then refetch the
  // fresh data immediately and inactive pages refetch on next visit.
  const resetData = () => resetQueryCaches(queryClient);

  // Indicator form
  const [indicatorData, setIndicatorData] = useState({
    currency: 'USD',
    indicator: 'GDP',
    actual: '',
    forecast: '',
    date: new Date().toISOString().split('T')[0],
    previous: '',
  });

  // COT form
  const [cotData, setCotData] = useState({
    asset: 'EUR',
    class: 'forex',
    date: new Date().toISOString().split('T')[0],
    long_pos: 0,
    short_pos: 0,
  });

  // Bond yield form
  const [bondData, setBondData] = useState({
    currency: 'USD',
    score: 0,
  });

  // Economic strength form
  const [strengthData, setStrengthData] = useState({
    currency: 'USD',
    gdp_growth: 0,
    unemployment_rate: 0,
    interest_rate: 0,
    cpi_yoy: 0,
  });

  // Score history form
  const [scoreType, setScoreType] = useState('asset'); // 'asset' | 'forex'
  const [scoreAsset, setScoreAsset] = useState('USD');
  const [scorePair, setScorePair] = useState('EUR/USD');

  // ---------- Mutations ----------
  const updateIndicator = useMutation({
    mutationFn: (data) => api.put(`/admin/indicators/${data.currency}/${data.indicator}/`, data),
    onSuccess: () => {
      alert('Indicator updated successfully');
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateCOT = useMutation({
    mutationFn: (data) => api.post('/admin/cot/', data),
    onSuccess: () => {
      alert('COT record updated successfully');
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateBond = useMutation({
    mutationFn: (data) => api.put(`/admin/bond-yield/${data.currency}/`, { score: data.score }),
    onSuccess: () => {
      alert('Bond yield score updated successfully');
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateStrength = useMutation({
    mutationFn: (data) => api.put(`/admin/economic-strength/${data.currency}/`, data),
    onSuccess: () => {
      alert('Economic strength updated successfully');
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const refreshIndicators = useMutation({
    mutationFn: (currency) => api.post('/admin/refresh-indicators/', { currency }),
    onSuccess: (response) => {
      alert(`Refresh completed: ${response.data.message}`);
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const refreshAllIndicators = useMutation({
    mutationFn: () => api.post('/admin/refresh-all-indicators/'),
    onSuccess: (response) => {
      alert(`All indicators refreshed: ${response.data.message}`);
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const refreshSeasonality = useMutation({
    mutationFn: () => api.post('/admin/refresh-seasonality/'),
    onSuccess: (response) => {
      alert(`Seasonality refreshed: ${response.data.message}`);
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const refreshPutCall = useMutation({
    mutationFn: () => api.post('/admin/refresh-put-call/'),
    onSuccess: (response) => {
      const results = response.data.results || {};
      const summary = Object.entries(results)
        .map(([ticker, status]) => `${ticker}: ${status}`)
        .join('\n');
      alert(`Put-call refresh completed:\n${summary}`);
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const clearCache = useMutation({
    mutationFn: () => api.post('/admin/clear-cache/'),
    onSuccess: () => {
      alert('Cache cleared successfully');
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const saveScoreHistory = useMutation({
    mutationFn: ({ type, key }) => api.post('/admin/save-score-history/', { type, key }),
    onSuccess: (response) => {
      alert(response.data.message);
      resetData();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  // ---------- Form handlers ----------
  const handleIndicatorSubmit = (e) => {
    e.preventDefault();
    updateIndicator.mutate(indicatorData);
  };

  const handleCOTSubmit = (e) => {
    e.preventDefault();
    updateCOT.mutate(cotData);
  };

  const handleBondSubmit = (e) => {
    e.preventDefault();
    updateBond.mutate(bondData);
  };

  const handleStrengthSubmit = (e) => {
    e.preventDefault();
    updateStrength.mutate(strengthData);
  };

  // ---------- Compute available indicators for dropdown ----------
  const availableIndicators = getIndicatorsForCurrency(indicatorData.currency);

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">✏️ Data Updates</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('indicators')}
          className={`px-4 py-2 rounded ${
            activeTab === 'indicators' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Indicators
        </button>
        <button
          onClick={() => setActiveTab('cot')}
          className={`px-4 py-2 rounded ${
            activeTab === 'cot' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          COT Data
        </button>
        <button
          onClick={() => setActiveTab('bond')}
          className={`px-4 py-2 rounded ${
            activeTab === 'bond' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Bond Yield
        </button>
        <button
          onClick={() => setActiveTab('strength')}
          className={`px-4 py-2 rounded ${
            activeTab === 'strength' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Economic Strength
        </button>
        <button
          onClick={() => setActiveTab('seasonality')}
          className={`px-4 py-2 rounded ${
            activeTab === 'seasonality' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Seasonality
        </button>
        <button
          onClick={() => setActiveTab('putcall')}
          className={`px-4 py-2 rounded ${
            activeTab === 'putcall' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Put-Call Ratio
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded ${
            activeTab === 'history' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Save Score History
        </button>
        <button
          onClick={() => setActiveTab('cache')}
          className={`px-4 py-2 rounded ${
            activeTab === 'cache' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Cache
        </button>
        <button
          onClick={() => setActiveTab('refresh')}
          className={`px-4 py-2 rounded ${
            activeTab === 'refresh' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'
          }`}
        >
          Refresh Frontend
        </button>
      </div>

      {/* Content */}
      <div className="bg-dark-200 p-6 rounded-lg border border-dark-300">
        {/* --- Indicators Tab --- */}
        {activeTab === 'indicators' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Economic Indicator</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => refreshIndicators.mutate(indicatorData.currency)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition text-sm"
                  disabled={refreshIndicators.isPending}
                >
                  {refreshIndicators.isPending ? 'Refreshing...' : `Refresh ${indicatorData.currency}`}
                </button>
                <button
                  onClick={() => refreshAllIndicators.mutate()}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition text-sm"
                  disabled={refreshAllIndicators.isPending}
                >
                  {refreshAllIndicators.isPending ? 'Refreshing All...' : 'Refresh All Currencies'}
                </button>
              </div>
            </div>
            <form onSubmit={handleIndicatorSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Currency</label>
                  <select
                    value={indicatorData.currency}
                    onChange={(e) => {
                      const newCurrency = e.target.value;
                      const newIndicators = getIndicatorsForCurrency(newCurrency);
                      setIndicatorData({
                        ...indicatorData,
                        currency: newCurrency,
                        indicator: newIndicators.length > 0 ? newIndicators[0] : '',
                      });
                    }}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Indicator</label>
                  <select
                    value={indicatorData.indicator}
                    onChange={(e) => setIndicatorData({ ...indicatorData, indicator: e.target.value })}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  >
                    {availableIndicators.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Actual</label>
                  <input
                    type="number"
                    step="any"
                    value={indicatorData.actual}
                    onChange={(e) => setIndicatorData({ ...indicatorData, actual: e.target.value })}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Forecast</label>
                  <input
                    type="number"
                    step="any"
                    value={indicatorData.forecast}
                    onChange={(e) => setIndicatorData({ ...indicatorData, forecast: e.target.value })}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={indicatorData.date}
                    onChange={(e) => setIndicatorData({ ...indicatorData, date: e.target.value })}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Previous (optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={indicatorData.previous}
                    onChange={(e) => setIndicatorData({ ...indicatorData, previous: e.target.value })}
                    className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                disabled={updateIndicator.isPending}
              >
                {updateIndicator.isPending ? 'Updating...' : 'Update Indicator'}
              </button>
            </form>
          </div>
        )}

        {/* --- COT Tab --- */}
        {activeTab === 'cot' && (
          <form onSubmit={handleCOTSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update COT Record</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Asset</label>
                <input
                  type="text"
                  value={cotData.asset}
                  onChange={(e) => setCotData({ ...cotData, asset: e.target.value.toUpperCase() })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  placeholder="e.g., EUR, XAU, BTC"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Class</label>
                <select
                  value={cotData.class}
                  onChange={(e) => setCotData({ ...cotData, class: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value="forex">Forex</option>
                  <option value="metal">Metal</option>
                  <option value="crypto">Crypto</option>
                  <option value="index">Index</option>
                  <option value="commodity">Commodity</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={cotData.date}
                  onChange={(e) => setCotData({ ...cotData, date: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Long Contracts</label>
                <input
                  type="number"
                  value={cotData.long_pos}
                  onChange={(e) => setCotData({ ...cotData, long_pos: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Short Contracts</label>
                <input
                  type="number"
                  value={cotData.short_pos}
                  onChange={(e) => setCotData({ ...cotData, short_pos: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateCOT.isPending}
            >
              {updateCOT.isPending ? 'Updating...' : 'Update COT Record'}
            </button>
          </form>
        )}

        {/* --- Bond Yield Tab --- */}
        {activeTab === 'bond' && (
          <form onSubmit={handleBondSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update 2Y Yield Score</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Currency</label>
                <select
                  value={bondData.currency}
                  onChange={(e) => setBondData({ ...bondData, currency: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Score</label>
                <select
                  value={bondData.score}
                  onChange={(e) => setBondData({ ...bondData, score: parseInt(e.target.value) })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value={1}>+1 (Bullish)</option>
                  <option value={0}>0 (Neutral)</option>
                  <option value={-1}>-1 (Bearish)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateBond.isPending}
            >
              {updateBond.isPending ? 'Updating...' : 'Update Bond Yield Score'}
            </button>
          </form>
        )}

        {/* --- Economic Strength Tab --- */}
        {activeTab === 'strength' && (
          <form onSubmit={handleStrengthSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update Economic Strength</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Currency</label>
                <select
                  value={strengthData.currency}
                  onChange={(e) => setStrengthData({ ...strengthData, currency: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">GDP Growth (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.gdp_growth}
                  onChange={(e) => setStrengthData({ ...strengthData, gdp_growth: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Unemployment Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.unemployment_rate}
                  onChange={(e) => setStrengthData({ ...strengthData, unemployment_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.interest_rate}
                  onChange={(e) => setStrengthData({ ...strengthData, interest_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">CPI YoY (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.cpi_yoy}
                  onChange={(e) => setStrengthData({ ...strengthData, cpi_yoy: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateStrength.isPending}
            >
              {updateStrength.isPending ? 'Updating...' : 'Update Economic Strength'}
            </button>
          </form>
        )}

        {/* --- Seasonality Tab --- */}
        {activeTab === 'seasonality' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Refresh Seasonality Data</h3>
            <p className="text-gray-400 mb-4">
              This will fetch fresh seasonality data from Yahoo Finance for all pairs and update the database.
            </p>
            <button
              onClick={() => refreshSeasonality.mutate()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={refreshSeasonality.isPending}
            >
              {refreshSeasonality.isPending ? 'Refreshing...' : 'Refresh Seasonality'}
            </button>
          </div>
        )}

        {/* --- Put-Call Ratio Tab --- */}
        {activeTab === 'putcall' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Refresh Put-Call Ratio</h3>
            <p className="text-gray-400 mb-4">
              Fetch fresh put-call ratios from Barchart for all assets (IBIT, GLD, SLV, QQQ, SPY, UUP, USO).
            </p>
            <button
              onClick={() => refreshPutCall.mutate()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={refreshPutCall.isPending}
            >
              {refreshPutCall.isPending ? 'Refreshing...' : 'Refresh All'}
            </button>
          </div>
        )}

        {/* --- Save Score History Tab --- */}
        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Save Score History</h3>
            <p className="text-gray-400 mb-4">
              Saves the current overall MacroPulse score for the selected market into its
              history table, so the Scorecard history charts accumulate a new daily point.
            </p>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScoreType('asset')}
                  className={`px-4 py-2 rounded text-sm ${
                    scoreType === 'asset'
                      ? 'bg-green-600 text-white'
                      : 'bg-dark-300 text-gray-400 border border-dark-400'
                  }`}
                >
                  Asset / Currency
                </button>
                <button
                  onClick={() => setScoreType('forex')}
                  className={`px-4 py-2 rounded text-sm ${
                    scoreType === 'forex'
                      ? 'bg-green-600 text-white'
                      : 'bg-dark-300 text-gray-400 border border-dark-400'
                  }`}
                >
                  Forex Pair
                </button>
              </div>
            </div>

            {scoreType === 'asset' ? (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Asset / Currency</label>
                <select
                  value={scoreAsset}
                  onChange={(e) => setScoreAsset(e.target.value)}
                  className="w-full max-w-sm bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  {ASSET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Forex Pair</label>
                <select
                  value={scorePair}
                  onChange={(e) => setScorePair(e.target.value)}
                  className="w-full max-w-sm bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  {FOREX_PAIRS.map((pair) => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() =>
                saveScoreHistory.mutate({
                  type: scoreType,
                  key: scoreType === 'asset' ? scoreAsset : scorePair,
                })
              }
              disabled={saveScoreHistory.isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {saveScoreHistory.isPending ? 'Saving...' : "Save Today's Score"}
            </button>
          </div>
        )}

        {/* --- Cache Tab --- */}
        {activeTab === 'cache' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
            <p className="text-gray-400 mb-4">
              Clear the backend cache to force fresh data on the next request.
            </p>
            <button
              onClick={() => clearCache.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={clearCache.isPending}
            >
              {clearCache.isPending ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>
        )}

        {/* --- Refresh Frontend Tab --- */}
        {activeTab === 'refresh' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Refresh Frontend Data</h3>
            <p className="text-gray-400 mb-4">
              Invalidate and refetch all data from the backend, or perform a hard refresh of the page.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  // Clear backend + client cache, then force-refetch what's visible.
                  resetData();
                  alert('All cached data cleared and refetched.');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Refresh Data
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Hard Refresh (Reload Page)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpdates;