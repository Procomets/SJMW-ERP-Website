import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    // you could render a loading spinner here
    return null;
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
