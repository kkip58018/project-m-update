import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  // Sidebar visibility state – default open on large screens, closed on mobile
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // On mount, check window width
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return true;
  });

  // Update sidebar visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarVisible(true);
      } else {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-dark-100 text-white overflow-hidden">
      {/* Sidebar – hidden on mobile when not visible */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '16rem' }}
      >
        <Sidebar />
      </div>

      {/* Main content – shifts when sidebar is open/closed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay on mobile when sidebar is open */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default Layout;