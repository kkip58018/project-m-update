import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import SentimentGauge from '../../components/charts/SentimentGauge';
import { ClipboardList } from 'lucide-react';

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

const AssetScorecard = () => {
  const [selectedAsset, setSelectedAsset] = useState('USD');
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['assetScorecard', selectedAsset],
    queryFn: () => analysis.getAssetScorecard(selectedAsset).then(res => res.data),
    enabled: !!selectedAsset,
    keepPreviousData: true,
  });

  if (isLoading && !data) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading asset data</div>;
  if (!data) return <div className="text-gray-400">No data</div>;

  const history = data.history || [];
  const historyDates = history.map(h => h.date);
  const historyScores = history.map(h => h.score);

  const technicalScore = (data.trend_score || 0) + (data.seasonality_score || 0);
  const sentimentCOTScore = (data.retail_score || 0) + (data.cot_score || 0);
  const fundamentalScore = data.fund_score || 0;

  // Opacity transition while fetching
  const panelClass = `transition-opacity duration-300 ${isFetching ? 'opacity-70' : 'opacity-100'}`;

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-6 h-6" />  Asset Scorecard</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-dark-300 text-white border border-dark-400 rounded px-3 py-2"
          >
            {ASSET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="bg-transparent border-0 p-0">
            <SentimentGauge value={data.overall_score} min={-18} max={18} />
          </div>

          <div className={`bg-dark-200 p-4 rounded-lg border border-dark-300 ${panelClass}`}>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Macropulse Score:</span>
                <span className="font-semibold">{data.overall_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Technical Score:</span>
                <span className="font-semibold">{technicalScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sentiment + COT Score:</span>
                <span className="font-semibold">{sentimentCOTScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fundamentals Score:</span>
                <span className="font-semibold">{fundamentalScore}</span>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className={`bg-dark-200 p-4 rounded-lg border border-dark-300 ${panelClass}`}>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Score History</h3>
              <Plot
                data={[{
                  type: 'bar',
                  x: historyDates,
                  y: historyScores,
                  marker: {
                    color: historyScores.map(s => s >= 5 ? '#00ff88' : s <= -5 ? '#ff4b4b' : '#EDEBEB')
                  },
                }]}
                layout={{
                  height: 230,
                  margin: { l: 0, r: 0, t: 0, b: 20 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  xaxis: { showgrid: false, tickangle: -45, tickfont: { size: 8 } },
                  yaxis: { showgrid: false, tickfont: { size: 8 }, range: [-10, 10] },
                  showlegend: false,
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Right column: Panels */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`grid grid-cols-2 gap-4 ${panelClass}`}>
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">📈 Technicals</h3>
              <p className="text-white">Trend: {data.trend_score >= 1 ? 'Bullish' : data.trend_score <= -1 ? 'Bearish' : 'Neutral'}</p>
              <p className="text-white">Seasonality: {data.seasonality_score >= 1 ? 'Bullish' : data.seasonality_score <= -1 ? 'Bearish' : 'Neutral'}</p>
            </div>
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">🪙 Sentiment & COT</h3>
              <p className="text-white">Retail: {data.retail_score >= 1 ? 'Bullish' : data.retail_score <= -1 ? 'Bearish' : 'Neutral'}</p>
              <p className="text-white">COT: {data.cot_score >= 1 ? 'Bullish' : data.cot_score <= -1 ? 'Bearish' : 'Neutral'}</p>
            </div>
          </div>

          <div className={`bg-dark-200 p-4 rounded-lg border border-dark-300 ${panelClass}`}>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex justify-between">
              <span>📊 Growth</span>
              <span className="text-xs">Act | Fcst | Surp</span>
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left">Indicator</th>
                  <th className="text-center">Bias</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Forecast</th>
                  <th className="text-right">Surprise</th>
                </tr>
              </thead>
              <tbody>
                {data.growth.map((row, idx) => (
                  <tr key={idx} className="border-t border-dark-300">
                    <td className="py-1">{row.indicator}</td>
                    <td className={`text-center ${row.bias === 'Bullish' ? 'text-green-400' : row.bias === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {row.bias}
                    </td>
                    <td className="text-right">{row.actual}</td>
                    <td className="text-right">{row.forecast}</td>
                    <td className={`text-right ${parseFloat(row.surprise) > 0 ? 'text-green-400' : parseFloat(row.surprise) < 0 ? 'text-red-400' : ''}`}>
                      {row.surprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`bg-dark-200 p-4 rounded-lg border border-dark-300 ${panelClass}`}>
            <h3 className="text-sm font-medium text-gray-400 mb-2">💰 Inflation</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left">Indicator</th>
                  <th className="text-center">Bias</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Forecast</th>
                  <th className="text-right">Surprise</th>
                </tr>
              </thead>
              <tbody>
                {data.inflation.map((row, idx) => (
                  <tr key={idx} className="border-t border-dark-300">
                    <td className="py-1">{row.indicator}</td>
                    <td className={`text-center ${row.bias === 'Bullish' ? 'text-green-400' : row.bias === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {row.bias}
                    </td>
                    <td className="text-right">{row.actual}</td>
                    <td className="text-right">{row.forecast}</td>
                    <td className={`text-right ${parseFloat(row.surprise) > 0 ? 'text-green-400' : parseFloat(row.surprise) < 0 ? 'text-red-400' : ''}`}>
                      {row.surprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`bg-dark-200 p-4 rounded-lg border border-dark-300 ${panelClass}`}>
            <h3 className="text-sm font-medium text-gray-400 mb-2">👥 Jobs</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left">Indicator</th>
                  <th className="text-center">Bias</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Forecast</th>
                  <th className="text-right">Surprise</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((row, idx) => (
                  <tr key={idx} className="border-t border-dark-300">
                    <td className="py-1">{row.indicator}</td>
                    <td className={`text-center ${row.bias === 'Bullish' ? 'text-green-400' : row.bias === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {row.bias}
                    </td>
                    <td className="text-right">{row.actual}</td>
                    <td className="text-right">{row.forecast}</td>
                    <td className={`text-right ${parseFloat(row.surprise) > 0 ? 'text-green-400' : parseFloat(row.surprise) < 0 ? 'text-red-400' : ''}`}>
                      {row.surprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetScorecard;