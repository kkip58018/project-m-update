import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';
import { PieChart } from 'lucide-react';

const COTHistory = () => {
  const [selectedAsset, setSelectedAsset] = useState('USD');
  const { data, isLoading, error } = useQuery({
    queryKey: ['cotHistory', selectedAsset],
    queryFn: () => analysis.getCOTHistory(selectedAsset).then(res => res.data),
    enabled: !!selectedAsset,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  const dates = data.map(d => d.date);
  const long = data.map(d => d.long);
  const short = data.map(d => d.short);
  const total = long.map((l, i) => l + short[i]);
  const longPct = long.map((l, i) => (total[i] > 0 ? (l / total[i]) * 100 : 0));

  const maxContracts = Math.max(...total) * 1.1 || 100;

  const assetMaxMap = {
    'AUD': 225000,
    'CAD': 250000,
    'BTC': 70000,
    'CHF': 80000,
    'EUR': 500000,
    'GBP': 225000,
    'XAU': 450000,
    'JPY': 400000,
    'NAS100': 200000,
    'NZD': 100000,
    'XAG': 120000,
    'SPX500': 800000,
    'USD': 60000,
    'USOIL': 700000,
  };
  const yMax = assetMaxMap[selectedAsset] || maxContracts;

  return (
    <div>
      <h2  className="text-2xl font-bold mb-2 text-white flex items-center gap-2"> <PieChart className="w-6 h-6" /> COT Data History</h2>

      <div className="mb-4">
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-2 w-80"
        >
          {Object.keys(assetMaxMap).map((asset) => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
      </div>

      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <Plot
          data={[
            {
              type: 'bar',
              x: dates,
              y: long,
              name: 'Long Contracts',
              marker: { color: '#1e3a5f' },
              yaxis: 'y1',
            },
            {
              type: 'bar',
              x: dates,
              y: short,
              name: 'Short Contracts',
              marker: { color: '#5f1e1e' },
              yaxis: 'y1',
            },
            {
              type: 'scatter',
              mode: 'lines',
              x: dates,
              y: longPct,
              name: 'Long %',
              line: { color: '#FF8C00', width: 3 },
              yaxis: 'y2',
            },
            {
              type: 'scatter',
              mode: 'lines',
              x: [dates[0], dates[dates.length - 1]],
              y: [50, 50],
              name: '50%',
              line: { color: 'grey', width: 2, dash: 'dash' },
              yaxis: 'y2',
              showlegend: false,
              hoverinfo: 'skip',
            },
          ]}
          layout={{
            barmode: 'stack',
            height: 720,
            margin: { l: 50, r: 50, t: 20, b: 50 },
            hovermode: 'x unified',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            // ----- Hover label styling (dark theme) -----
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
              // ----- Dotted grey spike line, thinner -----
              showspikes: true,
              spikecolor: 'black',
              spikethickness: 1,
              spikedash: 'dot',
              spikemode: 'across',
              spikesnap: 'hovered data',
            },
            yaxis: {
              title: '',
              range: [0, yMax],
              side: 'right',
              gridcolor: 'rgba(128,128,128,0.1)',
              zeroline: false,
              // Optional: remove y-axis spikes if any
              showspikes: false,
            },
            yaxis2: {
              title: '',
              range: [0, 100],
              side: 'left',
              overlaying: 'y',
              ticksuffix: '%',
              gridcolor: 'rgba(128,128,128,0.1)',
              zeroline: false,
              showgrid: false,
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

export default COTHistory;