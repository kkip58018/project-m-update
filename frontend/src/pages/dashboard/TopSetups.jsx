import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import { Trophy } from 'lucide-react';

const INDICATOR_KEYS = [
  'GDP', 'Retail Sales', 'Manufacturing PMI', 'Services PMI',
  'Consumer Confidence', 'CPI YoY', 'PPI YoY', 'PCE YoY',
  'NFP', 'Unemployment Rate', 'Unemployment claims', 'ADP', 'JOLTS job openings'
];

const columnLabels = {
  asset: 'Asset',
  bias: 'Bias',
  overall: 'Score',
  trend: 'Trend',
  seasonality: 'Seasonality',
  cot: 'COT',
  retail: 'Crowd Sent',
  'GDP': 'GDP',
  'Retail Sales': 'Retail Sales',
  'Manufacturing PMI': 'mPMI',
  'Services PMI': 'sPMI',
  'Consumer Confidence': 'Cons Conf',
  'CPI YoY': 'CPI YoY',
  'PPI YoY': 'PPI YoY',
  'PCE YoY': 'PCE YoY',
  'NFP': 'NFP',
  'Unemployment Rate': 'Unemp Rate',
  'Unemployment claims': 'Unemp Claims',
  'ADP': 'ADP',
  'JOLTS job openings': 'JOLTS',
};

const columns = ['asset', 'bias', 'overall', 'trend', 'seasonality', 'cot', 'retail', ...INDICATOR_KEYS];

const groups = [
  { label: 'Output', columns: ['asset', 'bias', 'overall'] },
  { label: 'Technicals', columns: ['trend', 'seasonality'] },
  { label: 'Sentiment', columns: ['cot', 'retail'] },
  { label: 'Eco Strength & Growth', columns: ['GDP', 'Retail Sales', 'Manufacturing PMI', 'Services PMI', 'Consumer Confidence'] },
  { label: 'Inflation', columns: ['CPI YoY', 'PPI YoY', 'PCE YoY'] },
  { label: 'Job Market', columns: ['NFP', 'Unemployment Rate', 'Unemployment claims', 'ADP', 'JOLTS job openings'] },
];

const PAGE_SIZE = 20;

const TopSetups = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['topSetups'],
    queryFn: () => analysis.getTopSetups().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;

  // Guard: ensure data is an array
  const itemsData = Array.isArray(data) ? data : (data?.data || []);
  if (itemsData.length === 0) return <div className="text-gray-400">No data available</div>;

  let items = itemsData;
  if (filter === 'Bullish Only') {
    items = items.filter(item => item.bias.includes('Bullish'));
  } else if (filter === 'Bearish Only') {
    items = items.filter(item => item.bias.includes('Bearish'));
  } else if (filter === 'Exclude Neutral') {
    items = items.filter(item => item.bias !== 'Neutral');
  }
  if (search) {
    const lower = search.toLowerCase();
    items = items.filter(item => item.asset.toLowerCase().includes(lower));
  }
  items.sort((a, b) => {
    const aScore = a.overall ?? -999;
    const bScore = b.overall ?? -999;
    return bScore - aScore;
  });

  const paginatedItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6" /> Top Setups</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm"
          >
            <option value="All">All</option>
            <option value="Bullish Only">Bullish Only</option>
            <option value="Bearish Only">Bearish Only</option>
            <option value="Exclude Neutral">Exclude Neutral</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-dark-300 text-gray-400 uppercase text-xs">
              {groups.map((group) => (
                <th key={group.label} colSpan={group.columns.length} className="px-3 py-1 text-center border-b border-dark-400">
                  {group.label}
                </th>
              ))}
            </tr>
            <tr className="bg-dark-300 text-gray-400 uppercase text-xs">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 whitespace-nowrap">{columnLabels[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item, idx) => (
              <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
                {columns.map((col) => {
                  let value;
                  if (col === 'asset') value = item.asset;
                  else if (col === 'bias') value = item.bias;
                  else if (col === 'overall') value = item.overall;
                  else if (col === 'trend') value = item.trend;
                  else if (col === 'seasonality') value = item.seasonality;
                  else if (col === 'cot') value = item.cot;
                  else if (col === 'retail') value = item.retail;
                  else {
                    value = item.indicator_scores ? item.indicator_scores[col] : null;
                    if (value === undefined || value === null) value = '-';
                  }

                  let style = {};
                  if (typeof value === 'number') {
                    if (value > 0) style = { color: '#00ff88' };
                    else if (value < 0) style = { color: '#ff4b4b' };
                  }
                  if (col === 'bias') {
                    if (value.includes('Bullish')) style = { color: '#00ff88', fontWeight: 'bold' };
                    else if (value.includes('Bearish')) style = { color: '#ff4b4b', fontWeight: 'bold' };
                    else if (value === 'Neutral') style = { color: '#ffaa00' };
                  }

                  return (
                    <td key={col} className="px-3 py-2 whitespace-nowrap text-white" style={style}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedItems.length === 0 && (
          <div className="text-gray-400 text-center py-4">No items match the current filters</div>
        )}
        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMore}
              className="bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded border border-dark-400 transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopSetups;