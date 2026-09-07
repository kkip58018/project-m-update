import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Home } from 'lucide-react';

const PositionSizeCalculator = () => {
  const navigate = useNavigate();

  // Input states
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(50);
  const [pipValue, setPipValue] = useState(10); // default for USD pairs (1 standard lot)

  // Result states
  const [riskAmount, setRiskAmount] = useState(0);
  const [positionSizeLots, setPositionSizeLots] = useState(0);
  const [positionSizeUnits, setPositionSizeUnits] = useState(0);

  const calculate = () => {
    const risk = (accountBalance * riskPercent) / 100;
    setRiskAmount(risk);

    if (stopLossPips > 0 && pipValue > 0) {
      const lots = risk / (stopLossPips * pipValue);
      setPositionSizeLots(lots);
      setPositionSizeUnits(lots * 100000);
    } else {
      setPositionSizeLots(0);
      setPositionSizeUnits(0);
    }
  };

  const reset = () => {
    setAccountBalance(10000);
    setRiskPercent(1);
    setStopLossPips(50);
    setPipValue(10);
    setRiskAmount(0);
    setPositionSizeLots(0);
    setPositionSizeUnits(0);
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Header */}
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

      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">📊 Position Size Calculator</h2>

        <div className="bg-dark-200 rounded-lg border border-dark-300 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Account Balance ($)</label>
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Risk per Trade (%)</label>
              <input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Stop Loss (pips)</label>
              <input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Pip Value ($ per standard lot)</label>
              <input
                type="number"
                value={pipValue}
                onChange={(e) => setPipValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                min="0"
                step="0.1"
              />
              <p className="text-gray-500 text-xs mt-1">Default 10 for most USD pairs. Adjust for exotic pairs.</p>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={calculate}
              className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-6 py-2 rounded-lg transition flex-1"
            >
              Calculate
            </button>
            <button
              onClick={reset}
              className="bg-dark-300 hover:bg-dark-400 text-white px-6 py-2 rounded-lg transition border border-dark-400"
            >
              Reset
            </button>
          </div>

          <div className="border-t border-dark-300 pt-4 mt-2">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-300/50 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Risk Amount</p>
                <p className="text-xl font-bold text-green-400">${riskAmount.toFixed(2)}</p>
              </div>
              <div className="bg-dark-300/50 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Position Size (lots)</p>
                <p className="text-xl font-bold text-white">{positionSizeLots.toFixed(2)}</p>
              </div>
              <div className="bg-dark-300/50 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Position Size (units)</p>
                <p className="text-xl font-bold text-white">{positionSizeUnits.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Position size = (Account Balance × Risk %) / (Stop Loss × Pip Value)</p>
          <p className="text-gray-500 text-xs mt-1">Pip Value is per standard lot (100,000 units).</p>
        </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;