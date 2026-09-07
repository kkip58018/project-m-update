import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import { Calendar } from 'lucide-react';

const ALL_PAIRS = [
  "AUD/CAD", "AUD/CHF", "AUD/JPY", "AUD/NZD", "AUD/USD",
  "CAD/CHF", "CAD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD",
  "EUR/CHF", "EUR/GBP", "EUR/JPY", "EUR/NZD", "EUR/USD",
  "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/JPY", "GBP/NZD",
  "GBP/USD", "NZD/CAD", "NZD/CHF", "NZD/JPY", "NZD/USD",
  "USD/CAD", "USD/CHF", "USD/JPY",
  "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", "USOIL/USD", "SPX500/USD", "NAS100/USD"
];

const getLastCompletedMonthIndex = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  // Use previous month to avoid showing incomplete data for the current month
  return currentMonth === 0 ? 11 : currentMonth - 1;
};

const MonthlySeasonality = () => {
  const [pair, setPair] = useState('AUD/CAD');
  const { data, isLoading, error } = useQuery({
    queryKey: ['monthlySeasonality', pair],
    queryFn: () => analysis.getMonthlySeasonality(pair).then(res => res.data),
    enabled: !!pair,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  const months = data.map(d => d.month);
  const avgReturns = data.map(d => d.avg_return);
  const ytdReturns = data.map(d => d.ytd_performance !== undefined ? d.ytd_performance : null);

  // Use last completed month
  const lastCompletedMonthIdx = getLastCompletedMonthIndex();
  const lineMonths = months.slice(0, lastCompletedMonthIdx + 1);
  const lineYtd = ytdReturns.slice(0, lastCompletedMonthIdx + 1);

  const barColors = avgReturns.map(v => v >= 0 ? '#1d70b8' : '#b83a1d');

  const chartData = [
    {
      type: 'bar',
      x: months,
      y: avgReturns,
      name: '10‑Year Average',
      marker: { color: barColors },
      text: avgReturns.map(v => v.toFixed(2) + '%'),
      textposition: 'outside',
      textfont: { color: 'white', size: 10 },
    },
    ...(lineMonths.length > 0 && lineYtd.some(v => v !== null) ? [{
      type: 'scatter',
      mode: 'lines+markers',
      x: lineMonths,
      y: lineYtd,
      name: 'This Year (YTD)',
      line: {
        color: '#ffffff',
        width: 2,
        dash: 'dot',
        shape: 'spline',
      },
      marker: { color: '#ffffff', size: 6 },
      text: lineYtd.map(v => v !== null ? v.toFixed(2) + '%' : ''),
      textposition: 'top center',
      textfont: { color: 'white', size: 9 },
    }] : []),
  ];

  const layout = {
    xaxis: {
      title: '',
      tickangle: 0,
      gridcolor: 'rgba(128,128,128,0.1)',
    },
    yaxis: {
      title: '',
      tickformat: '.2f%',
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
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><Calendar className="w-6 h-6" />  Monthly Seasonality</h2>
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

export default MonthlySeasonality;