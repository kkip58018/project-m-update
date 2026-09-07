import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import { LineChart } from 'lucide-react';

const ALL_PAIRS = [
  "AUD/CAD", "AUD/CHF", "AUD/JPY", "AUD/NZD", "AUD/USD",
  "CAD/CHF", "CAD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD",
  "EUR/CHF", "EUR/GBP", "EUR/JPY", "EUR/NZD", "EUR/USD",
  "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/JPY", "GBP/NZD",
  "GBP/USD", "NZD/CAD", "NZD/CHF", "NZD/JPY", "NZD/USD",
  "USD/CAD", "USD/CHF", "USD/JPY",
  "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", "USOIL/USD", "SPX500/USD", "NAS100/USD"
];

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = (now - start) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
};

const getLastCompletedWeek = () => {
  const currentWeek = getCurrentWeek();
  // Return previous week to avoid incomplete data for the current week
  return Math.max(1, currentWeek - 1);
};

const AnnualSeasonality = () => {
  const [pair, setPair] = useState('AUD/CAD');
  const { data, isLoading, error } = useQuery({
    queryKey: ['annualSeasonality', pair],
    queryFn: () => analysis.getAnnualSeasonality(pair).then(res => res.data),
    enabled: !!pair,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data) return <div className="text-gray-400">No data available</div>;

  const weeks = data.map(d => d.week);
  const avgReturns = data.map(d => d.cumulative_return);
  const ytdPerformance = data.map(d => d.ytd_performance);

  const lastCompletedWeek = getLastCompletedWeek();
  const filteredIndices = weeks.map((w, i) => w <= lastCompletedWeek);
  const lineWeeks = weeks.filter((_, i) => filteredIndices[i]);
  const lineYtd = ytdPerformance.filter((_, i) => filteredIndices[i]);

  const chartData = [
    {
      type: 'scatter',
      mode: 'lines',
      x: weeks,
      y: avgReturns,
      name: '10‑Year Avg Return',
      line: { color: '#aaaaaa', width: 2, dash: 'dash' },
      yaxis: 'y2',
    },
    ...(lineWeeks.length > 0 ? [{
      type: 'scatter',
      mode: 'lines+markers',
      x: lineWeeks,
      y: lineYtd,
      name: 'YTD Performance',
      line: {
        color: '#ff4a5a',
        width: 2.5,
      },
      marker: { color: '#ff4a5a', size: 4 },
      yaxis: 'y1',
    }] : []),
  ];

  const layout = {
    xaxis: {
      title: '',
      tickvals: [1, 5, 9, 14, 18, 22, 27, 31, 36, 40, 44, 49],
      ticktext: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      gridcolor: 'rgba(128,128,128,0.1)',
    },
    yaxis: {
      title: '',
      side: 'left',
      gridcolor: 'rgba(128,128,128,0.1)',
      zeroline: false,
      showspikes: false,
    },
    yaxis2: {
      title: '',
      side: 'right',
      overlaying: 'y',
      ticksuffix: '%',
      gridcolor: 'rgba(128,128,128,0.1)',
      zeroline: false,
      showspikes: false,
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
    margin: { l: 50, r: 50, t: 20, b: 40 },
    height: 750,
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#1e2430',
      font: { color: 'white', size: 12 },
      bordercolor: '#2a3340',
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><LineChart className="w-6 h-6" /> Annual Seasonality</h2>
        <select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1"
        >
          {ALL_PAIRS.map((p) => (
            <option key={p} value={p}>{p}</option>
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

export default AnnualSeasonality;