import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import api from '../../api/client';
import Gauge from '../../components/charts/Gauge';
import DataTable from '../../components/tables/DataTable';
import { useAuth } from '../../context/AuthContext';
import { resetQueryCaches } from '../../utils/reactQuery';
import { Flame } from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// Custom order for table rows
const INDICATOR_ORDER = [
  'GDP',
  'Retail Sales',
  'Manufacturing PMI',
  'Services PMI',
  'Consumer Confidence',
  'CPI YoY',
  'PPI YoY',
  'PCE YoY',
  'NFP',
  'ADP',
  'Unemployment Rate',
  'Unemployment claims',
  'JOLTS job openings',
  'Average Hourly Earnings',
  'Household spending',
];

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg max-w-md`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium whitespace-pre-line">{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">✕</button>
      </div>
    </div>
  );
};

const EconomicHeatmap = () => {
  const [currency, setCurrency] = useState('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['economicHeatmap', currency],
    queryFn: () => analysis.getEconomicHeatmap(currency).then(res => res.data),
    enabled: !!currency,
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 5000);
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data) return <div className="text-gray-400">No data available</div>;

  const { indicators, bullish_pct } = data;

  // Sort indicators based on custom order
  const sortedIndicators = [...indicators].sort((a, b) => {
    const idxA = INDICATOR_ORDER.indexOf(a.indicator);
    const idxB = INDICATOR_ORDER.indexOf(b.indicator);
    // If indicator not in list, push to end
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const columns = [
    { key: 'indicator', label: 'Indicator' },
    { key: 'date', label: 'Date' },
    { key: 'previous', label: 'Previous' },
    { key: 'forecast', label: 'Forecast' },
    { key: 'actual', label: 'Actual' },
    { 
      key: 'surprise', 
      label: 'Surprise',
      render: (row) => {
        const val = parseFloat(row.surprise);
        if (isNaN(val)) return row.surprise;
        return (
          <span className={val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : ''}>
            {row.surprise}
          </span>
        );
      }
    },
  ];

  const handleRefresh = async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    try {
      const response = await api.post('/admin/refresh-indicators/', { currency });
      const { details } = response.data;
      const msg = `✅ Refresh completed\n${details}`;
      showToast(msg, 'success');
      // Backend already cleared its cache; reset the client cache too so the
      // visible table refetches the fresh values immediately.
      resetQueryCaches(queryClient);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      showToast(`❌ Refresh failed: ${errorMsg}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Title row with refresh button (admin only) */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><Flame className="w-6 h-6" /> Economic Heatmap</h2>
        {isAdmin && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-dark-300 hover:bg-dark-400 text-white border border-dark-400 rounded px-4 py-1.5 text-sm transition w-[250px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        )}
      </div>

      {/* Dropdown – fixed width 250px */}
      <div className="mb-4">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1.5 text-sm w-[250px]"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Full-width table with sorted indicators */}
      <div className="mb-4">
        <DataTable columns={columns} data={sortedIndicators} />
      </div>

      {/* Gauge – bottom right, size 200px, with label below */}
      <div className="flex justify-end">
        <div className="w-[200px]">
          <Gauge value={bullish_pct} label="" />
          <div className="text-center text-gray-400 text-sm mt-1">
            {currency} Bullish %
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicHeatmap;