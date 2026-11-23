// EconomicCalendar.jsx
'use client';

import * as React from 'react';

export default function EconomicCalendar() {
  const container = React.useRef(null);

  React.useEffect(() => {
    // Prevent duplicate scripts in React Strict Mode
    if (container.current?.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://www.tradays.com/c/js/widgets/calendar/widget.js?v=16';
    script.async = true;
    script.dataset.type = 'calendar-widget-component';
    
    // Set height to "650" instead of "100%" to force the widget to fill the space
    script.textContent = JSON.stringify({
      width: '100%',
      height: '900', 
      mode: '2',
      fw: 'react',
      theme: 1,
    });
    
    container.current?.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">📅 Economic Calendar</h2>
      
      {/* 
        Added a style tag to force the injected iframe to take up 100% of the container.
      */}
      <style>{`
        .tradays-widget-container iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
      `}</style>

      <div 
        ref={container} 
        className="tradays-widget-container"
        style={{ width: '100%', height: '900px', backgroundColor: 'transparent' }}
      ></div>
      
      <div className="text-sm text-gray-400 mt-2 hover:text-white transition">
        <a 
          href="https://www.metatrader.com/?utm_source=calendar.widget&utm_medium=link&utm_term=economic.calendar&utm_content=visit.mql5.calendar&utm_campaign=202.calendar.widget" 
          rel="noopener nofollow" 
          target="_blank"
        >
        </a>
      </div>
    </div>
  );
}
