import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { BarChart3, Home, Users } from 'lucide-react';

const CRYPTO_PAIRS = ['BTC/USD', 'ETH/USD'];
const METAL_PAIRS = ['XAU/USD', 'XAG/USD'];
const INDEX_PAIRS = ['SPX500/USD', 'NAS100/USD'];
const FOREX_PAIRS = [
  'AUD/CAD', 'AUD/CHF', 'AUD/JPY', 'AUD/NZD', 'AUD/USD',
  'CAD/CHF', 'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD',
  'EUR/CHF', 'EUR/GBP', 'EUR/JPY', 'EUR/NZD', 'EUR/USD',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/JPY', 'GBP/NZD',
  'GBP/USD', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'NZD/USD',
  'USD/CAD', 'USD/CHF', 'USD/JPY'
];

const FreeRetailSentiment = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const { data, isLoading, error } = useQuery({
    queryKey: ['publicRetailSentiment'],
    queryFn: () => api.get('/public/retail-sentiment/').then(res => res.data),
    refetchInterval: 30 * 60 * 1000, // refresh every 30 minutes
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
  
  if (!data || data.length === 0) return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center">
      <div className="text-gray-400">No data available</div>
    </div>
  );

  let filtered = data;
  if (filter === 'Forex') {
    filtered = data.filter(item => FOREX_PAIRS.includes(item.pair));
  } else if (filter === 'Crypto') {
    filtered = data.filter(item => CRYPTO_PAIRS.includes(item.pair));
  } else if (filter === 'Metals') {
    filtered = data.filter(item => METAL_PAIRS.includes(item.pair));
  } else if (filter === 'Indices') {
    filtered = data.filter(item => INDEX_PAIRS.includes(item.pair));
  }

  filtered.sort((a, b) => a.pair.localeCompare(b.pair));

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Header with logo + Home + Login/Sign Up */}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6" /> Retail Sentiment</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm"
          >
            <option value="All">All</option>
            <option value="Forex">Forex</option>
            <option value="Crypto">Crypto</option>
            <option value="Metals">Metals</option>
            <option value="Indices">Indices</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
          {/* Left description */}
          <div className="lg:col-span-1 space-y-4 text-sm text-gray-400">
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">What is this?</h4>
              <p className="leading-relaxed">
                Retail sentiment shows the percentage of retail traders holding long vs short positions. 
                High long percentages often indicate crowded trades and potential contrarian opportunities.
              </p>
            </div>
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">How to use</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-green-400">Bullish</span> when retail is extremely bearish</li>
                <li><span className="text-red-400">Bearish</span> when retail is extremely bullish</li>
                <li>Look for extremes above 80% or below 20%</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-dark-200 rounded-lg border border-dark-300 p-4">
              <div className="space-y-3">
                {filtered.map((item) => {
                  const longPct = item.long_pct;
                  const shortPct = item.short_pct;
                  const score = item.score;

                  let scoreColor = 'text-gray-400';
                  if (score > 0) scoreColor = 'text-green-400';
                  else if (score < 0) scoreColor = 'text-red-400';

                  return (
                    <div key={item.pair} className="flex items-center gap-4">
                      <div className="w-24 font-medium text-white text-sm">{item.pair}</div>
                      <div className="flex-1 relative h-6 bg-dark-300 rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full"
                          style={{ width: `${longPct}%`, backgroundColor: '#1e3a5f' }}
                        />
                        <div
                          className="absolute right-0 top-0 h-full"
                          style={{ width: `${shortPct}%`, backgroundColor: '#5f1e1e' }}
                        />
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10">
                          {longPct.toFixed(1)}%
                        </span>
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10">
                          {shortPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`w-8 text-right font-bold ${scoreColor}`}>
                        {score > 0 ? `+${score}` : score}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="text-gray-400 text-center py-4">No pairs match the selected filter</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 text-sm text-gray-400">
            <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
              <h4 className="text-green-400 font-semibold mb-2">Contrarian Score</h4>
              <p className="leading-relaxed">
                The score on the right shows how extreme the sentiment is:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="text-green-400">+2</span> = extremely bearish retail (bullish signal)</li>
                <li><span className="text-red-400">-2</span> = extremely bullish retail (bearish signal)</li>
                <li><span className="text-gray-400">0</span> = neutral</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeRetailSentiment;