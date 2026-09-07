import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import SentimentGauge from '../../components/charts/SentimentGauge';
import { BarChart3 } from 'lucide-react';

const FOREX_PAIRS = [
  'AUD/CAD', 'AUD/CHF', 'AUD/JPY', 'AUD/NZD', 'AUD/USD',
  'CAD/CHF', 'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD',
  'EUR/CHF', 'EUR/GBP', 'EUR/JPY', 'EUR/NZD', 'EUR/USD',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/JPY', 'GBP/NZD',
  'GBP/USD', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD',
  'USD/CAD', 'USD/CHF', 'USD/JPY'
];

const ForexScorecard = () => {
  const [pair, setPair] = useState('EUR/USD');
  const { data, isLoading, error } = useQuery({
    queryKey: ['forexScorecard', pair],
    queryFn: () => analysis.getForexScorecard(pair).then(res => res.data),
    enabled: !!pair,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data) return <div className="text-gray-400">No data</div>;

  const { overall, bias, components, history } = data;
  const historyData = history || [];
  const histDates = historyData.map(h => h.date);
  const histScores = historyData.map(h => h.score);

  const componentKeys = ['technicals', 'institutional', 'sentiment', 'growth', 'jobs', 'inflation'];
  const componentLabels = {
    technicals: 'Technicals',
    institutional: 'Institutional',
    sentiment: 'Sentiment',
    growth: 'Growth',
    jobs: 'Jobs',
    inflation: 'Inflation'
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Forex Scorecard</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <select
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="w-full bg-dark-300 text-white border border-dark-400 rounded px-3 py-2"
          >
            {FOREX_PAIRS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="bg-transparent border-0 p-0">
            <SentimentGauge value={overall} min={-18} max={18} />
          </div>

          <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Macropulse Score:</span>
                <span className="font-semibold">{overall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bias:</span>
                <span className={`font-semibold ${
                  bias?.includes('Bullish') ? 'text-green-400' :
                  bias?.includes('Bearish') ? 'text-red-400' : 'text-yellow-400'
                }`}>{bias || 'Neutral'}</span>
              </div>
            </div>
          </div>

          {historyData.length > 0 && (
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Score History</h3>
              <Plot
                data={[{
                  type: 'bar',
                  x: histDates,
                  y: histScores,
                  marker: {
                    color: histScores.map(s => s > 5 ? '#00ff88' : s < -5 ? '#ff4b4b' : '#EDEBEB')
                  },
                }]}
                layout={{
                  height: 300,
                  margin: { l: 0, r: 0, t: 0, b: 20 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  xaxis: { showgrid: false, tickangle: -45, tickfont: { size: 8 } },
                  yaxis: { showgrid: false, tickfont: { size: 8 }, range: [-18, 18] },
                  showlegend: false,
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Right column: 2x3 grid – panel height 325px */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {componentKeys.map((key) => {
              const comp = components?.[key];
              if (!comp) return null;
              const score = comp.score || 0;
              const details = comp.details || [];

              const gaugeValue = Math.min(100, Math.max(0, (score + 6) / 12 * 100));
              const color = score >= 2 ? '#00ff88' : score >= 1 ? '#66cc88' : score >= 0 ? '#ffaa00' : score >= -1 ? '#dd8844' : '#ff4b4b';

              return (
                <div key={key} className="bg-dark-200 p-3 rounded-lg border border-dark-300 h-[320px] flex flex-col">
                  {/* Title at the top */}
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    {componentLabels[key] || key}
                  </div>

                  {/* Gauge – height unchanged (140px) */}
                  <div className="flex-1 flex items-center justify-center">
                    <Plot
                      data={[{
                        type: 'pie',
                        values: [gaugeValue, 100 - gaugeValue],
                        labels: ['', ''],
                        hole: 0.72,
                        marker: { colors: [color, '#1e2430'] },
                        textinfo: 'none',
                        hoverinfo: 'skip',
                        showlegend: false,
                      }]}
                      layout={{
                        height: 140,
                        margin: { l: 0, r: 0, t: 5, b: 5 },
                        annotations: [
                          { 
                            text: `<b>${score}</b>`, 
                            x: 0.5, 
                            y: 0.52,
                            font: { size: 20, color: 'white' }, 
                            showarrow: false 
                          },
                        ],
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>

                  {/* Details – no truncation, all items displayed */}
                  <div className="mt-1 text-xs text-gray-400 space-y-0.5 max-h-[100px] overflow-y-auto">
                    {details.length > 0 ? (
                      details.map((d, i) => (
                        <div key={i} className="text-xs leading-tight">{d}</div>
                      ))
                    ) : (
                      <div className="text-gray-500">No data available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexScorecard;