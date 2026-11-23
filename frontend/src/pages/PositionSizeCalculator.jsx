import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Home } from 'lucide-react';

// Pip value per standard lot (100,000 units) for each pair
const PIP_VALUES = {
  EURUSD: 10.0,
  GBPUSD: 10.0,
  AUDUSD: 10.0,
  NZDUSD: 10.0,
  USDCAD: 7.12,
  USDCHF: 12.13,
  USDJPY: 6.33,
  EURGBP: 13.39,
  EURJPY: 6.33,
  EURCHF: 12.13,
  EURAUD: 7.02,
  EURCAD: 7.12,
  EURNZD: 5.69,
  GBPJPY: 6.33,
  GBPCHF: 12.13,
  GBPAUD: 7.02,
  GBPCAD: 7.12,
  GBPNZD: 5.69,
  AUDJPY: 6.33,
  AUDCHF: 12.13,
  AUDCAD: 7.12,
  AUDNZD: 5.69,
  NZDJPY: 6.33,
  NZDCHF: 12.13,
  NZDCAD: 7.12,
  CADJPY: 6.33,
  CADCHF: 12.13,
  CHFJPY: 6.33,
};

const PAIRS = Object.keys(PIP_VALUES);

// Pretty display: "EURUSD" -> "EUR/USD"
const formatPair = (pair) => `${pair.slice(0, 3)}/${pair.slice(3)}`;

const DEFAULTS = {
  accountBalance: '10000',
  riskPercent: '0.5',
  pair: 'EURUSD',
  stopLossPips: '50',
};

const FIELD_LABELS = {
  accountBalance: 'Account Balance',
  riskPercent: 'Risk per Trade',
  stopLossPips: 'Stop Loss',
};

const PositionSizeCalculator = () => {
  const navigate = useNavigate();

  // Input states stored as strings so fields can be left empty
  const [accountBalance, setAccountBalance] = useState(DEFAULTS.accountBalance);
  const [riskPercent, setRiskPercent] = useState(DEFAULTS.riskPercent);
  const [pair, setPair] = useState(DEFAULTS.pair);
  const [stopLossPips, setStopLossPips] = useState(DEFAULTS.stopLossPips);

  // Validation state
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);

  // Result states
  const [riskAmount, setRiskAmount] = useState(0);
  const [positionSizeLots, setPositionSizeLots] = useState(0);
  const [positionSizeUnits, setPositionSizeUnits] = useState(0);
  const [calculatedPipValue, setCalculatedPipValue] = useState(null);

  // Pip value is derived from the selected pair
  const pipValue = PIP_VALUES[pair] ?? 0;

  // Clear validation feedback as soon as the user starts editing
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
    if (invalidFields.length) setInvalidFields([]);
  };

  const clearResults = () => {
    setRiskAmount(0);
    setPositionSizeLots(0);
    setPositionSizeUnits(0);
    setCalculatedPipValue(null);
  };

  const calculate = () => {
    const errors = [];
    const invalid = [];

    const fields = [
      { key: 'accountBalance', value: accountBalance },
      { key: 'riskPercent', value: riskPercent },
      { key: 'stopLossPips', value: stopLossPips },
    ];

    fields.forEach(({ key, value }) => {
      const trimmed = String(value).trim();
      if (trimmed === '') {
        errors.push(`${FIELD_LABELS[key]} is required.`);
        invalid.push(key);
      } else if (isNaN(parseFloat(trimmed))) {
        errors.push(`${FIELD_LABELS[key]} must be a valid number.`);
        invalid.push(key);
      }
    });

    setInvalidFields(invalid);

    if (errors.length > 0) {
      setError(errors.join(' '));
      clearResults();
      return;
    }

    setError('');

    const balance = parseFloat(accountBalance);
    const riskPct = parseFloat(riskPercent);
    const slPips = parseFloat(stopLossPips);

    const risk = (balance * riskPct) / 100;
    setRiskAmount(risk);
    setCalculatedPipValue(pipValue);

    if (slPips > 0 && pipValue > 0) {
      const lots = risk / (slPips * pipValue);
      setPositionSizeLots(lots);
      setPositionSizeUnits(lots * 100000);
    } else {
      setPositionSizeLots(0);
      setPositionSizeUnits(0);
    }
  };

  const reset = () => {
    setAccountBalance(DEFAULTS.accountBalance);
    setRiskPercent(DEFAULTS.riskPercent);
    setPair(DEFAULTS.pair);
    setStopLossPips(DEFAULTS.stopLossPips);
    setError('');
    setInvalidFields([]);
    clearResults();
  };

  const fieldClass = (key) =>
    `w-full bg-dark-300 border rounded px-3 py-2 text-white ${
      invalidFields.includes(key) ? 'border-red-500' : 'border-dark-400'
    }`;

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
                onChange={handleInputChange(setAccountBalance)}
                className={fieldClass('accountBalance')}
                min="0"
                step="100"
                placeholder="e.g. 10000"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Risk per Trade (%)</label>
              <input
                type="number"
                value={riskPercent}
                onChange={handleInputChange(setRiskPercent)}
                className={fieldClass('riskPercent')}
                min="0"
                step="0.1"
                placeholder="e.g. 0.5"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Currency Pair</label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
              >
                {PAIRS.map((p) => (
                  <option key={p} value={p}>
                    {formatPair(p)}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Pip value: <span className="text-green-400 font-semibold">${pipValue.toFixed(2)}</span> per standard lot
              </p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Stop Loss (pips)</label>
              <input
                type="number"
                value={stopLossPips}
                onChange={handleInputChange(setStopLossPips)}
                className={fieldClass('stopLossPips')}
                min="0"
                step="1"
                placeholder="e.g. 50"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-300/50 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Risk Amount</p>
                <p className="text-xl font-bold text-green-400">${riskAmount.toFixed(2)}</p>
              </div>
              <div className="bg-dark-300/50 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Pip Value</p>
                <p className="text-xl font-bold text-white">
                  ${(calculatedPipValue ?? pipValue).toFixed(2)}
                </p>
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
          <p className="text-gray-500 text-xs mt-1">
            Pip Value is per standard lot (100,000 units) for {formatPair(pair)}.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Pip values are approximate and based on current exchange rates — verify with your broker before trading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;
