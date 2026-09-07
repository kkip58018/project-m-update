import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

const Header = ({ toggleSidebar, sidebarVisible }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-dark-200 border-b border-dark-300 px-4 sm:px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {/* Hamburger button – visible on mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-400 hover:text-white transition"
          aria-label="Toggle sidebar"
        >
          {sidebarVisible ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-xl font-semibold text-white hidden sm:block">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-400 text-sm hidden md:inline">{user?.email}</span>
        <button
          onClick={signOut}
          className="bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30 transition text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;