import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Globe,
  Calendar,
  LineChart,
  Flame,
  FileText,
  Users,
  RefreshCw,
  Settings,
  UserCog,
  ChartArea,
  DollarSign,
  PieChart,
  Gauge,
  TrendingDown,
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  const links = [
    { to: '/top-setups', icon: Trophy, label: 'Top Setups' },
    { to: '/asset-scorecard', icon: ClipboardList, label: 'Asset Scorecard' },
    { to: '/forex-scorecard', icon: BarChart3, label: 'Forex Scorecard' },
    { to: '/latest-cot', icon: FileText, label: 'Latest COT' },
    { to: '/cot-trends', icon: TrendingDown, label: 'COT Trends' },
    { to: '/cot-history', icon: PieChart, label: 'COT History' },
    { to: '/eco-surprise', icon: TrendingUp, label: 'Eco Surprise' },
    { to: '/economic-strength', icon: Globe, label: 'Economic Strength' },
    { to: '/monthly-seasonality', icon: Calendar, label: 'Monthly Seasonality' },
    { to: '/annual-seasonality', icon: LineChart, label: 'Annual Seasonality' },
    { to: '/economic-heatmap', icon: Flame, label: 'Economic Heatmap' },
    { to: '/retail-sentiment', icon: Users, label: 'Retail Sentiment' },
    { to: '/put-call', icon: ChartArea, label: 'Put-Call Ratio' },
    { to: '/economic-calendar', icon: Calendar, label: 'Economic Calendar' },
  ];

  const adminLinks = [
    { to: '/data-updates', icon: RefreshCw, label: 'Data Updates' },
    { to: '/trend-settings', icon: Settings, label: 'Trend Settings' },
    { to: '/user-approvals', icon: UserCog, label: 'User Approvals' },
  ];

  return (
    <aside className="w-64 bg-dark-200 border-r border-dark-300 p-4 flex-shrink-0 overflow-y-auto h-screen sticky top-0">
      <div className="flex items-center gap-2 text-2xl font-bold text-green-400 mb-8">
        <BarChart3 className="w-7 h-7" />
        <span>MacroPulse</span>
      </div>
      <nav className="space-y-1">
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive ? 'bg-dark-300 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
        {isAdmin && (
          <>
            <div className="border-t border-dark-300 my-4"></div>
            {adminLinks.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive ? 'bg-dark-300 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;