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
    // theme: 1 enables dark mode
    script.textContent = JSON.stringify({
      width: '100%',
      height: '100%',
      mode: '2',
      fw: 'react',
      theme: 1,
    });
    
    container.current?.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">📅 Economic Calendar</h2>
      
      {/* The widget needs a defined height to render properly */}
      <div 
        ref={container} 
        style={{ width: '100%', height: '650px', backgroundColor: 'transparent' }}
      ></div>
      
      {/* Styled the copyright to match your original theme */}
      <div className="text-sm text-gray-400 mt-2 hover:text-white transition">
        <a 
          href="https://www.metatrader.com/?utm_source=calendar.widget&utm_medium=link&utm_term=economic.calendar&utm_content=visit.mql5.calendar&utm_campaign=202.calendar.widget" 
          rel="noopener nofollow" 
          target="_blank"
        >
          MetaTrader World Markets
        </a>
      </div>
    </div>
  );
}
