import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import { Globe } from 'lucide-react'

const EconomicStrength = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['economicStrength'],
    queryFn: () => analysis.getEconomicStrength().then(res => res.data),
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><Globe className="w-6 h-6" />  Economic Strength Index</h2>
        <div className="relative group cursor-help">
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-gray-400 border border-dark-400 rounded-full hover:border-dark-300 transition-colors">ℹ️</span>
          <div className="absolute left-0 top-8 w-80 bg-dark-200 border border-dark-300 rounded-lg p-3 text-xs text-gray-300 z-10 hidden group-hover:block">
            <p className="font-semibold text-white mb-1">How it works</p>
            <p>Combines GDP, Unemployment, Interest Rate, CPI, and Real Yield into a 0-100 score. Higher = stronger economy.</p>
            <p className="mt-1 text-gray-500">Δ Score and Δ Real Yield show change from previous update.</p>
          </div>
        </div>
      </div>
      <p className="text-gray-400 mb-6">Long‑term fundamental ranking based on latest data.</p>

      <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
        <table className="w-full text-left text-sm">
          <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3 text-center">Bias</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Δ Score</th>
              <th className="px-4 py-3 text-right">GDP Growth</th>
              <th className="px-4 py-3 text-right">Unemployment</th>
              <th className="px-4 py-3 text-right">Interest Rate</th>
              <th className="px-4 py-3 text-right">CPI YoY</th>
              <th className="px-4 py-3 text-right">Real Yield</th>
              <th className="px-4 py-3 text-center">Δ Real Yield</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const isBullish = row.bias === 'Bullish';
              const isBearish = row.bias === 'Bearish';
              const isNeutral = row.bias === 'Neutral';
              const scoreClass = row.score >= 60 ? 'text-green-400' : row.score <= 40 ? 'text-red-400' : 'text-yellow-400';
              const deltaClass = row.delta_score > 0 ? 'text-green-400' : row.delta_score < 0 ? 'text-red-400' : 'text-gray-400';
              const realYieldDeltaClass = row.delta_real_yield > 0 ? 'text-green-400' : row.delta_real_yield < 0 ? 'text-red-400' : 'text-gray-400';

              return (
                <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
                  <td className="px-4 py-2 font-medium text-white">{row.currency}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isBullish ? 'bg-green-900 text-green-400' :
                      isBearish ? 'bg-red-900 text-red-400' :
                      'bg-yellow-900 text-yellow-400'
                    }`}>{row.bias}</span>
                  </td>
                  <td className={`px-4 py-2 text-center font-bold ${scoreClass}`}>{row.score}</td>
                  <td className={`px-4 py-2 text-center ${deltaClass}`}>
                    {row.delta_score > 0 ? '+' : ''}{row.delta_score}
                  </td>
                  <td className="px-4 py-2 text-right text-white">{row.gdp_growth.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right text-white">{row.unemployment.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right text-white">{row.interest_rate.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right text-white">{row.cpi_yoy.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right text-white">{row.real_yield.toFixed(2)}%</td>
                  <td className={`px-4 py-2 text-center ${realYieldDeltaClass}`}>
                    {row.delta_real_yield > 0 ? '+' : ''}{row.delta_real_yield.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EconomicStrength;