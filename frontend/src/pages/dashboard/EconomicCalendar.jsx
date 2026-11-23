const EconomicCalendar = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">📅 Economic Calendar</h2>

      {/* 
        WRAPPER: 
        This container crops out the "Powered by" footer and removes the bottom gap.
        We set a fixed height here, and hide the overflow.
      */}
      <div
        style={{
          width: '100%',
          height: '680px', // Adjust this number to crop right where the calendar content ends
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '8px',
          backgroundColor: '#1a1d24', // Matches your app's dark background
        }}
      >
        <iframe
          /* 
            We add ?theme=dark to the URL in case COT-Reports natively supports it.
          */
          src="https://cot-reports.com/embed/economic-calendar?theme=dark"
          style={{
            width: '100%',
            height: '760px', // Make the iframe TALLER than the wrapper so the footer is pushed out of view
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,

            /* 
              DARK MODE FALLBACK: 
              If the URL parameter above doesn't make it dark, uncomment the line below.
              Note: This will invert the colors of the entire iframe, which makes 
              it dark, but it will also invert the colors of the country flags. 
            */
            // filter: 'invert(0.9) hue-rotate(180deg)', 
          }}
          title="Economic Calendar by COT-Reports.com"
          loading="lazy"
        />
      </div>

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
