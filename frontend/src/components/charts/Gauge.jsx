import Plot from 'react-plotly.js';

const Gauge = ({ value, label }) => {
  const color = value >= 60 ? '#00ff88' : value >= 40 ? '#ffaa00' : '#ff4b4b';
  return (
    <Plot
      data={[{
        type: 'pie',
        values: [value, 100 - value],
        labels: ['', ''],
        hole: 0.7,
        marker: { colors: [color, '#1e2430'] },
        textinfo: 'none',
        hoverinfo: 'skip',
        showlegend: false,
      }]}
      layout={{
        height: 200,
        margin: { l: 10, r: 10, t: 20, b: 20 },
        annotations: [
          {
            text: `<b>${value.toFixed(0)}%</b>`,
            x: 0.5, y: 0.5,
            font: { size: 20, color: 'white' },
            showarrow: false,
          },
          {
            text: label,
            x: 0.5, y: 0.1,
            font: { size: 14, color: '#94a3b8' },
            showarrow: false,
          }
        ],
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
      }}
      config={{ displayModeBar: false }}
      style={{ width: '100%' }}
    />
  );
};

export default Gauge;