import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // you could render a loading spinner here
    return null;
  }
  if (!user) return <Navigate to="/login" replace />;

  const role = (profile?.role || '').toLowerCase();
  if (role.includes('accounts')) {
    if (location.pathname === '/purchase-order' || location.pathname.startsWith('/purchase-order')) {
      return <Navigate to="/accounts/purchase-order" replace />;
    }
    if (location.pathname === '/proforma-invoice' || location.pathname.startsWith('/proforma-invoice')) {
      return <Navigate to="/accounts/proforma-invoice" replace />;
    }
    return <Navigate to="/accounts/finished-goods" replace />;
  }

  if (role.includes('production')) {
    return <Navigate to="/production/quality-control" replace />;
  }

  return <Outlet />;
};

/** Guards routes that require the Accounts Manager role. */
export const AccountsProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  const role = (profile?.role || '').toLowerCase();
  if (role.includes('admin')) {
    if (location.pathname === '/accounts/purchase-order' || location.pathname.startsWith('/accounts/purchase-order')) {
      return <Navigate to="/purchase-order" replace />;
    }
    if (location.pathname === '/accounts/proforma-invoice' || location.pathname.startsWith('/accounts/proforma-invoice')) {
      return <Navigate to="/proforma-invoice" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (!role.includes('accounts')) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/** Guards routes that require the Production Manager role. */
export const ProductionProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  const role = (profile?.role || '').toLowerCase();
  if (role.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!role.includes('production')) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
