import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

const RedirectIfAuthenticated = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default RedirectIfAuthenticated;