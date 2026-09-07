import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import { TrendingDown } from 'lucide-react';

const COTTrends = () => {
  const availableAssets = [
    'AUD', 'CAD', 'BTC', 'CHF', 'EUR', 'GBP', 'XAU', 'JPY',
    'NAS100', 'NZD', 'XAG', 'SPX500', 'USD', 'USOIL'
  ];

  const [selectedAssets, setSelectedAssets] = useState(['USD']);
  const [currentSelection, setCurrentSelection] = useState('USD');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cotTrends', selectedAssets],
    queryFn: () => {
      const promises = selectedAssets.map(asset =>
        analysis.getCOTHistory(asset).then(res => ({ asset, data: res.data }))
      );
      return Promise.all(promises);
    },
    enabled: selectedAssets.length > 0,
  });

  const addAsset = () => {
    if (!selectedAssets.includes(currentSelection)) {
      setSelectedAssets([...selectedAssets, currentSelection]);
    }
  };

  const removeAsset = (asset) => {
    if (selectedAssets.length === 1) {
      // If only one asset, don't remove it; show a message
      alert('You must keep at least one asset selected.');
      return;
    }
    setSelectedAssets(selectedAssets.filter(a => a !== asset));
  };

  const clearAll = () => {
    // Instead of clearing all, reset to default (USD)
    setSelectedAssets(['USD']);
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  // Prepare traces
  const traces = data.map(({ asset, data: assetData }) => {
    const dates = assetData.map(d => d.date);
    const longPct = assetData.map(d => {
      const total = d.long + d.short;
      return total > 0 ? (d.long / total) * 100 : 50;
    });
    return {
      type: 'scatter',
      mode: 'lines+markers',
      x: dates,
      y: longPct,
      name: asset,
      line: { width: 2.5 },
    };
  });

  // Add 50% reference line
  if (data.length > 0 && data[0].data.length > 0) {
    const firstDates = data[0].data.map(d => d.date);
    traces.push({
      type: 'scatter',
      mode: 'lines',
      x: [firstDates[0], firstDates[firstDates.length - 1]],
      y: [50, 50],
      name: '50%',
      line: { color: 'grey', width: 2, dash: 'dash' },
      showlegend: false,
      hoverinfo: 'skip',
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><TrendingDown className="w-6 h-6" /> COT Trends</h2>
      <p className="text-gray-400 mb-4">Track the historical net positioning of institutional traders over time.</p>

      {/* Selection controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select
          value={currentSelection}
          onChange={(e) => setCurrentSelection(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-2"
        >
          {availableAssets.map((asset) => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
        <button
          onClick={addAsset}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
        >
          Add
        </button>
        <button
          onClick={clearAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          Reset
        </button>
        <div className="text-gray-400 text-sm ml-2">
          Selected: {selectedAssets.join(', ')}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <Plot
          data={traces}
          layout={{
            height: 710,
            margin: { l: 50, r: 30, t: 20, b: 50 },
            hovermode: 'x unified',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            hoverlabel: {
              bgcolor: '#1e2430',
              font: { color: 'white', size: 12 },
              bordercolor: '#2a3340',
              namelength: -1,
            },
            legend: {
              orientation: 'h',
              yanchor: 'bottom',
              y: 1.02,
              xanchor: 'right',
              x: 1,
              font: { color: '#94a3b8' },
            },
            xaxis: {
              title: '',
              tickformat: '%d %b %Y',
              gridcolor: 'rgba(128,128,128,0.1)',
              showspikes: true,
              spikecolor: 'grey',
              spikethickness: 1,
              spikedash: 'dot',
              spikemode: 'across',
              spikesnap: 'hovered data',
            },
            yaxis: {
              title: 'Long %',
              range: [0, 100],
              gridcolor: 'rgba(128,128,128,0.1)',
              zeroline: false,
              ticksuffix: '%',
              showspikes: false,
            },
          }}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default COTTrends;