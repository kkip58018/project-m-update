import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Plot from 'react-plotly.js';
import { BarChart3, Home, FileText } from 'lucide-react';

const FreeLatestCOT = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['publicLatestCOT'],
    queryFn: () => api.get('/public/cot-latest/').then(res => res.data),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center">
      <div className="text-red-400">Error loading data</div>
    </div>
  );
  
  if (!data) return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center">
      <div className="text-gray-400">No data available</div>
    </div>
  );

  const { assets, long_vals, short_vals, asset_table, pair_table } = data;

  const sortedIndices = long_vals
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v)
    .map(item => item.i);

  const sortedAssets = sortedIndices.map(i => assets[i]);
  const sortedLong = sortedIndices.map(i => long_vals[i]);
  const sortedShort = sortedIndices.map(i => short_vals[i]);

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

  const pairColumns = [
    { key: 'pair', label: 'Pair' },
    { key: 'net_change', label: 'Net Change' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'net_positioning', label: 'Net Positioning' },
  ];

  const handleRequestAccess = () => {
    window.location.href = '/register';
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      <div className="border-b border-dark-300 py-4 px-6 flex items-center justify-between bg-dark-200/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold text-green-400">MacroPulse</span>
            <span className="text-sm text-gray-400 ml-2">| Free Tools</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="bg-transparent border border-green-500 text-green-500 px-4 py-1.5 rounded hover:bg-green-500 hover:text-dark-100 transition text-sm"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-4 py-1.5 rounded transition text-sm"
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="max-w-[104rem] mx-auto p-4">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-6 h-6" />Latest COT Report </h2>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
          <div className="lg:col-span-1 space-y-4 text-sm text-gray-400">
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">What is COT?</h4>
              <p className="leading-relaxed">
                The Commitment of Traders (COT) report shows the positioning of large institutional traders.
                Following the "smart money" can provide an edge in directional bias.
              </p>
            </div>
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">Key metrics</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-green-400">Bullish</span> when long % {'>'} 60% and increasing</li>
                <li><span className="text-red-400">Bearish</span> when long % {'<'} 40% and decreasing</li>
                <li>Net % change shows weekly momentum</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Current Net Positions</h3>
              <Plot
                data={barData}
                layout={{
                  barmode: 'stack',
                  height: 350,
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

            <div className="relative">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Latest buys and sells – Assets</h3>
              <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300 relative">
                <div className="blur-sm pointer-events-none select-none opacity-70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
                      <tr>
                        {assetColumns.map(col => (
                          <th key={col.key} className="px-3 py-2 whitespace-nowrap">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {asset_table.map((row, idx) => (
                        <tr key={idx} className="border-b border-dark-300">
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
                            return (
                              <td key={col.key} className="px-3 py-2 whitespace-nowrap text-white/50">
                                {value ?? '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-dark-200/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-green-500/30 shadow-lg text-center">
                    <p className="text-lg font-bold text-green-400">🔒 Available for Premium Users</p>
                    <p className="text-sm text-gray-400 mt-1">Upgrade to access full COT data</p>
                    <button
                      onClick={handleRequestAccess}
                      className="mt-3 bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-6 py-2 rounded-lg transition"
                    >
                      Request Access
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Pairs</h3>
              <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300 relative">
                <div className="blur-sm pointer-events-none select-none opacity-70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
                      <tr>
                        {pairColumns.map(col => (
                          <th key={col.key} className="px-3 py-2 whitespace-nowrap">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pair_table.map((row, idx) => (
                        <tr key={idx} className="border-b border-dark-300">
                          {pairColumns.map(col => {
                            let value = row[col.key];
                            if (col.key === 'net_change' && typeof value === 'number') {
                              value = (value > 0 ? '+' : '') + value.toFixed(1);
                            }
                            return (
                              <td key={col.key} className="px-3 py-2 whitespace-nowrap text-white/50">
                                {value ?? '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-dark-200/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-green-500/30 shadow-lg text-center">
                    <p className="text-lg font-bold text-green-400">🔒 Available for Premium Users</p>
                    <p className="text-sm text-gray-400 mt-1">Upgrade to access full COT data</p>
                    <button
                      onClick={handleRequestAccess}
                      className="mt-3 bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-6 py-2 rounded-lg transition"
                    >
                      Request Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 text-sm text-gray-400">
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">Why COT matters</h4>
              <p className="leading-relaxed">
                Institutional traders often set the trend. The COT report helps you see which way they're leaning.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Commercial hedgers are usually right</li>
                <li>Large speculators amplify moves</li>
                <li>Extreme positioning often precedes reversals</li>
              </ul>
            </div>
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">Premium includes</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Full historical data</li>
                <li>Weekly change analysis</li>
                <li>Pair-level sentiment</li>
                <li>Automated alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeLatestCOT;