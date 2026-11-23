import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, Loader2 } from 'lucide-react';

const Header = ({ toggleSidebar, sidebarVisible }) => {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    if (loggingOut) return;
    setError('');
    setLoggingOut(true);
    try {
      await signOut();
      // keep `loggingOut` true so the spinner persists through the redirect
    } catch (err) {
      setError(err?.message || 'Failed to sign out');
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-dark-200 border-b border-dark-300 px-4 sm:px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {/* Hamburger button – visible on mobile */}
        <button
          onClick={toggleSidebar}
          disabled={loggingOut}
          className="lg:hidden text-gray-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Toggle sidebar"
        >
          {sidebarVisible ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-xl font-semibold text-white hidden sm:block">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        {error && (
          <span className="text-red-400 text-xs hidden sm:inline">{error}</span>
        )}
        <span className="text-gray-400 text-sm hidden md:inline">{user?.email}</span>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          aria-busy={loggingOut}
          className={`flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm transition
            ${loggingOut ? 'opacity-70 cursor-wait' : 'hover:bg-red-500/30'}`}
        >
          {loggingOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
