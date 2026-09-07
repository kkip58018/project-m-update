import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RedirectIfAuthenticated from './components/common/RedirectIfAuthenticated';
import RequireAuth from './components/common/RequireAuth';
import RequireAdmin from './components/common/RequireAdmin';
import TopSetups from './pages/dashboard/TopSetups';
import AssetScorecard from './pages/dashboard/AssetScorecard';
import ForexScorecard from './pages/dashboard/ForexScorecard';
import EcoSurprise from './pages/dashboard/EcoSurprise';
import EconomicStrength from './pages/dashboard/EconomicStrength';
import MonthlySeasonality from './pages/dashboard/MonthlySeasonality';
import AnnualSeasonality from './pages/dashboard/AnnualSeasonality';
import EconomicHeatmap from './pages/dashboard/EconomicHeatmap';
import LatestCOT from './pages/dashboard/LatestCOT';
import COTTrends from './pages/dashboard/COTTrends';
import COTHistory from './pages/dashboard/COTHistory';
import RetailSentiment from './pages/dashboard/RetailSentiment';
import PutCallRatio from './pages/dashboard/PutCallRatio';
import EconomicCalendar from './pages/dashboard/EconomicCalendar';
import DataUpdates from './pages/dashboard/DataUpdates';
import TrendSettings from './pages/dashboard/TrendSettings';
import UserApprovals from './pages/dashboard/UserApprovals';
import FreeRetailSentiment from './pages/FreeRetailSentiment';
import FreeLatestCOT from './pages/FreeLatestCOT';
import PositionSizeCalculator from './pages/PositionSizeCalculator';

const router = createBrowserRouter([
   {
    path: '/',
    element: 
        <Landing />
  },
  {
  path: '/free-retail-sentiment',
  element: <FreeRetailSentiment />,
  },
  {
    path: '/free-latest-cot',
    element: <FreeLatestCOT />,
  },
  {
    path: '/free-position-size-calculator',
    element: <PositionSizeCalculator />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      // { index: true, element: <Navigate to="/top-setups" replace /> },
      { path: 'top-setups', element: <TopSetups /> },
      { path: 'asset-scorecard', element: <AssetScorecard /> },
      { path: 'forex-scorecard', element: <ForexScorecard /> },
      { path: 'eco-surprise', element: <EcoSurprise /> },
      { path: 'economic-strength', element: <EconomicStrength /> },
      { path: 'monthly-seasonality', element: <MonthlySeasonality /> },
      { path: 'annual-seasonality', element: <AnnualSeasonality /> },
      { path: 'economic-heatmap', element: <EconomicHeatmap /> },
      { path: 'latest-cot', element: <LatestCOT /> },
      { path: 'cot-trends', element: <COTTrends /> },
      { path: 'cot-history', element: <COTHistory /> },
      { path: 'retail-sentiment', element: <RetailSentiment /> },
      { path: 'put-call', element: <PutCallRatio /> },
      { path: 'economic-calendar', element: <EconomicCalendar /> },
      {
        path: 'data-updates',
        element: <RequireAdmin><DataUpdates /></RequireAdmin>,
      },
      {
        path: 'trend-settings',
        element: <RequireAdmin><TrendSettings /></RequireAdmin>,
      },
      {
        path: 'user-approvals',
        element: <RequireAdmin><UserApprovals /></RequireAdmin>,
      },
    ],
  },
]);

export default router;