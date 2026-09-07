import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { resetQueryCaches } from '../../utils/reactQuery';
import { Users } from 'lucide-react';

const CRYPTO_PAIRS = ['BTC/USD', 'ETH/USD'];
const METAL_PAIRS = ['XAU/USD', 'XAG/USD'];
const INDEX_PAIRS = ['SPX500/USD', 'NAS100/USD'];
const FOREX_PAIRS = [
  'AUD/CAD', 'AUD/CHF', 'AUD/JPY', 'AUD/NZD', 'AUD/USD',
  'CAD/CHF', 'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD',
  'EUR/CHF', 'EUR/GBP', 'EUR/JPY', 'EUR/NZD', 'EUR/USD',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/JPY', 'GBP/NZD',
  'GBP/USD', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD',
  'USD/CAD', 'USD/CHF', 'USD/JPY'
];

const RetailSentiment = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['retailSentiment'],
    queryFn: () => analysis.getRetailSentiment().then(res => res.data),
    refetchInterval: 30 * 60 * 1000, // refresh every 30 minutes
  });

  const handleRefresh = async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    try {
      await api.post('/admin/refresh-retail-sentiment/');
      // Backend cache is cleared server-side; reset the client cache so the
      // visible sentiment bars refetch the fresh data.
      resetQueryCaches(queryClient);
      alert('Retail sentiment refreshed successfully!');
    } catch (err) {
      alert(`Refresh failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  let filtered = data;
  if (filter === 'Forex') {
    filtered = data.filter(item => FOREX_PAIRS.includes(item.pair));
  } else if (filter === 'Crypto') {
    filtered = data.filter(item => CRYPTO_PAIRS.includes(item.pair));
  } else if (filter === 'Metals') {
    filtered = data.filter(item => METAL_PAIRS.includes(item.pair));
  } else if (filter === 'Indices') {
    filtered = data.filter(item => INDEX_PAIRS.includes(item.pair));
  }

  filtered.sort((a, b) => a.pair.localeCompare(b.pair));

  return (
    <div>
      {/* Title row with refresh button (admin only) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><Users className="w-6 h-6" /> Retail Sentiment</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-dark-300 hover:bg-dark-400 text-white border border-dark-400 rounded px-4 py-1.5 text-sm transition w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
            </button>
          )}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm"
          >
            <option value="All">All</option>
            <option value="Forex">Forex</option>
            <option value="Crypto">Crypto</option>
            <option value="Metals">Metals</option>
            <option value="Indices">Indices</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-200 rounded-lg border border-dark-300 p-4">
        <div className="space-y-3">
          {filtered.map((item) => {
            const longPct = item.long_pct;
            const shortPct = item.short_pct;
            const score = item.score;

            let scoreColor = 'text-gray-400';
            if (score > 0) scoreColor = 'text-green-400';
            else if (score < 0) scoreColor = 'text-red-400';

            return (
              <div key={item.pair} className="flex items-center gap-4">
                <div className="w-24 font-medium text-white text-sm">{item.pair}</div>

                <div className="flex-1 relative h-6 bg-dark-300 rounded overflow-hidden">
                  {/* Long portion – left side using COT blue */}
                  <div
                    className="absolute left-0 top-0 h-full"
                    style={{ width: `${longPct}%`, backgroundColor: '#1e3a5f' }}
                  />
                  {/* Short portion – right side using COT red */}
                  <div
                    className="absolute right-0 top-0 h-full"
                    style={{ width: `${shortPct}%`, backgroundColor: '#5f1e1e' }}
                  />

                  {/* Percentage labels – at the edges of the combined bar */}
                  <span
                    className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10"
                  >
                    {longPct.toFixed(1)}%
                  </span>
                  <span
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10"
                  >
                    {shortPct.toFixed(1)}%
                  </span>
                </div>

                <div className={`w-8 text-right font-bold ${scoreColor}`}>
                  {score > 0 ? `+${score}` : score}
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-gray-400 text-center py-4">No pairs match the selected filter</div>
        )}
      </div>
    </div>
  );
};

export default RetailSentiment;