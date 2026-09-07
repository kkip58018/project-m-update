import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import { ChartArea } from 'lucide-react'

const ASSET_CONFIG = {
  'Bitcoin': { ticker: 'IBIT', highPut: 1.4, highCall: 0.6, yMin: 0.1, yMax: 2.8 },
  'Gold': { ticker: 'GLD', highPut: 0.84, highCall: 0.32, yMin: 0.0, yMax: 1.8 },
  'Silver': { ticker: 'SLV', highPut: 0.50, highCall: 0.29, yMin: 0.0, yMax: 1.0 },
  'Nasdaq': { ticker: 'QQQ', highPut: 1.58, highCall: 0.7, yMin: 0.0, yMax: 2.0 },
  'S&P500': { ticker: 'SPY', highPut: 1.30, highCall: 0.95, yMin: 0.6, yMax: 1.6 },
  'USDollar': { ticker: 'UUP', highPut: 0.89, highCall: 0.08, yMin: 0.0, yMax: 2.5 },
  'USOil': { ticker: 'USO', highPut: 1.71, highCall: 0.82, yMin: 0.0, yMax: 2.7 },
};

const PutCallRatio = () => {
  const [selectedAsset, setSelectedAsset] = useState('Bitcoin');
  const config = ASSET_CONFIG[selectedAsset];
  const { data, isLoading, error } = useQuery({
    queryKey: ['putCallRatio', config.ticker],
    queryFn: () => analysis.getPutCallRatio(config.ticker).then(res => res.data),
    enabled: !!config.ticker,
    refetchInterval: 30 * 60 * 1000, // pick up the daily refresh shortly after it runs
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  const dates = data.map(d => d.date);
  const ratios = data.map(d => d.ratio);

  // Build chart with step line (90° corners) and no title
  const chartData = [
    {
      type: 'scatter',
      mode: 'lines',
      x: dates,
      y: ratios,
      name: 'Put-Call Ratio',
      line: {
        color: '#ffffff',
        width: 2.5,
        shape: 'hv',  // step line for 90° corners
      },
    },
    // High put threshold
    {
      type: 'scatter',
      mode: 'lines',
      x: [dates[0], dates[dates.length - 1]],
      y: [config.highPut, config.highPut],
      name: 'High Put Volume',
      line: { color: '#ef4444', width: 2, dash: 'dash' },
      hoverinfo: 'skip',
    },
    // High call threshold
    {
      type: 'scatter',
      mode: 'lines',
      x: [dates[0], dates[dates.length - 1]],
      y: [config.highCall, config.highCall],
      name: 'High Call Volume',
      line: { color: '#3b82f6', width: 2, dash: 'dash' },
      hoverinfo: 'skip',
    },
  ];

  const layout = {
    // No title
    xaxis: {
      title: '',
      tickformat: '%d %b',
      gridcolor: 'rgba(128,128,128,0.1)',
      showspikes: false,
    },
    yaxis: {
      title: '',
      range: [config.yMin, config.yMax],
      gridcolor: 'rgba(128,128,128,0.1)',
      zerolinecolor: 'rgba(128,128,128,0.3)',
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
      font: { color: '#94a3b8' },
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 50, r: 30, t: 20, b: 40 },
    height: 710, // increased to 710
    hovermode: 'x unified',
    // Dark hover box
    hoverlabel: {
      bgcolor: '#1e2430',
      font: { color: 'white', size: 12 },
      bordercolor: '#2a3340',
      namelength: -1,
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><ChartArea className="w-6 h-6" />Put-Call Ratio</h2>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1"
        >
          {Object.keys(ASSET_CONFIG).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <Plot
          data={chartData}
          layout={layout}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default PutCallRatio;