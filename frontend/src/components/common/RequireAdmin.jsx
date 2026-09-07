import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

const RequireAdmin = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;