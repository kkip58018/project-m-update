// EconomicCalendar.jsx
// Renders the COT-Reports.com economic calendar widget in an iframe.
// No data fetching / local state is needed anymore.

const EconomicCalendar = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">📅 Economic Calendar</h2>

      {/* COT-Reports.com Economic Calendar widget */}
      <iframe
        src="https://cot-reports.com/embed/economic-calendar"
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="auto"
        title="Economic Calendar by COT-Reports.com"
        style={{ border: 0, display: 'block', borderRadius: '8px' }}
        loading="lazy"
      />

      <p style={{ font: '12px/1.4 sans-serif', margin: '6px 0 0', color: '#9ca3af' }}>
        Economic calendar by{' '}
        <a
          href="https://cot-reports.com/economic-calendar/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#22c55e' }}
        >
          COT-Reports.com
        </a>
      </p>
    </div>
  );
};

export default EconomicCalendar;
