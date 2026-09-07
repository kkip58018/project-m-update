import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import api from '../../api/client';
import Plot from 'react-plotly.js';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { resetQueryCaches } from '../../utils/reactQuery';
import { FileText,CalendarRange  } from 'lucide-react';

const LatestCOT = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cotLatest'],
    queryFn: () => analysis.getLatestCOT().then(res => res.data),
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data) return <div className="text-gray-400">No data available</div>;

  const { assets, long_vals, short_vals, asset_table, pair_table, latest_date } = data;

  // Sort assets by long percentage ascending (lowest on left for chart)
  const sortedIndices = long_vals
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v)
    .map(item => item.i);

  const sortedAssets = sortedIndices.map(i => assets[i]);
  const sortedLong = sortedIndices.map(i => long_vals[i]);
  const sortedShort = sortedIndices.map(i => short_vals[i]);

  // ----- Stacked Bar Chart -----
  const barData = [
    {
      type: 'bar',
      x: sortedAssets,
      y: sortedLong,
      name: 'Long',
      marker: { color: '#1e3a5f' },
      hovertemplate: '%{y:.1f}% Long<extra></extra>',
    },
    {
      type: 'bar',
      x: sortedAssets,
      y: sortedShort,
      name: 'Short',
      marker: { color: '#5f1e1e' },
      hovertemplate: '%{y:.1f}% Short<extra></extra>',
    },
  ];

  // ----- Asset Table: sort by net_pct_change descending -----
  const sortedAssetTable = [...asset_table].sort((a, b) => b.net_pct_change - a.net_pct_change);

  const assetColumns = [
    { key: 'asset', label: 'Symbol' },
    { key: 'long_contracts', label: 'Long Contracts' },
    { key: 'short_contracts', label: 'Short Contracts' },
    { key: 'delta_long', label: 'Δ Long' },
    { key: 'delta_short', label: 'Δ Short' },
    { key: 'long_pct', label: 'Long %' },
    { key: 'short_pct', label: 'Short %' },
    { key: 'net_pct_change', label: 'Net % Change' },
    { key: 'net_position', label: 'Net Position' },
  ];

  // ----- Pair Table: sort by net_change descending -----
  const sortedPairTable = [...pair_table].sort((a, b) => b.net_change - a.net_change);

  const pairColumns = [
    { key: 'pair', label: 'Pair' },
    { key: 'net_change', label: 'Net Change' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'net_positioning', label: 'Net Positioning' },
  ];

  // Refresh handler
  const handleRefresh = async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    try {
      await api.post('/admin/refresh-cot/');
      // Backend cache cleared server-side; reset the client cache so this page
      // and the COT history/trend pages refetch the fresh data.
      resetQueryCaches(queryClient);
      alert('COT data refreshed successfully!');
    } catch (err) {
      alert(`Refresh failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      {/* Title row with date and refresh button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6" />Latest COT Report</h2>
          {latest_date && (
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <CalendarRange className="w-6 h-6" /> last updated: {latest_date}
            </span>
          )}
        </div>
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

      {/* Stacked bar chart */}
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300 mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Current Net Positions</h3>
        <Plot
          data={barData}
          layout={{
            barmode: 'stack',
            height: 450,
            margin: { l: 40, r: 20, t: 10, b: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            yaxis: {
              range: [0, 100],
              ticksuffix: '%',
              gridcolor: 'rgba(128,128,128,0.2)',
              title: '',
            },
            xaxis: {
              title: '',
              tickangle: 0,
              gridcolor: 'rgba(128,128,128,0.1)',
              showspikes: false,
            },
            hoverlabel: {
              bgcolor: '#1e2430',
              font: { color: 'white', size: 12 },
              bordercolor: '#2a3340',
              namelength: -1,
            },
            legend: {
              orientation: 'h',
              yanchor: 'bottom',
              y: 1.02,
              xanchor: 'right',
              x: 1,
              font: { color: '#94a3b8' },
            },
          }}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Asset Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Latest buys and sells – Assets</h3>
        <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
              <tr>
                {assetColumns.map(col => (
                  <th key={col.key} className="px-3 py-2 whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAssetTable.map((row, idx) => (
                <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
                  {assetColumns.map(col => {
                    let value = row[col.key];
                    if (typeof value === 'number') {
                      if (col.key === 'long_pct' || col.key === 'short_pct') {
                        value = value.toFixed(1) + '%';
                      } else if (col.key === 'net_pct_change') {
                        value = (value > 0 ? '+' : '') + value.toFixed(1) + '%';
                      } else if (col.key === 'delta_long' || col.key === 'delta_short') {
                        value = (value > 0 ? '+' : '') + value.toFixed(0);
                      } else {
                        value = value.toFixed(0);
                      }
                    }
                    let style = {};
                    if (col.key === 'net_position') {
                      if (value === 'Bullish') style = { color: '#00b8ff', fontWeight: 'bold' };
                      else if (value === 'Bearish') style = { color: '#ff4b4b', fontWeight: 'bold' };
                      else style = { color: '#ccc' };
                    } else if (col.key === 'delta_long' || col.key === 'delta_short' || col.key === 'net_pct_change') {
                      const num = parseFloat(value);
                      if (!isNaN(num)) {
                        style = num > 0 ? { color: '#00ff88' } : num < 0 ? { color: '#ff4b4b' } : {};
                      }
                    }
                    return (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap text-white" style={style}>
                        {value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pair Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Pairs</h3>
        <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
              <tr>
                {pairColumns.map(col => (
                  <th key={col.key} className="px-3 py-2 whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPairTable.map((row, idx) => (
                <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
                  {pairColumns.map(col => {
                    let value = row[col.key];
                    if (col.key === 'net_change' && typeof value === 'number') {
                      value = (value > 0 ? '+' : '') + value.toFixed(1);
                    }
                    let style = {};
                    if (col.key === 'sentiment' || col.key === 'net_positioning') {
                      if (value === 'Bullish') style = { color: '#00b8ff', fontWeight: 'bold' };
                      else if (value === 'Bearish') style = { color: '#ff4b4b', fontWeight: 'bold' };
                      else style = { color: '#ccc' };
                    } else if (col.key === 'net_change') {
                      const num = parseFloat(value);
                      if (!isNaN(num)) style = num > 0 ? { color: '#00ff88' } : num < 0 ? { color: '#ff4b4b' } : {};
                    }
                    return (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap text-white" style={style}>
                        {value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LatestCOT;