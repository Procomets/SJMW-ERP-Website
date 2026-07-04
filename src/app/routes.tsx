import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AccountsLayout from '../layouts/AccountsLayout';
import { ProtectedRoute, AccountsProtectedRoute, ProductionProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import AccountsLoginPage from '../pages/AccountsLoginPage';
import ProductionManagerLoginPage from '../pages/ProductionManagerLoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ProductionLedgerPage from '../features/productionLedger/pages/ProductionLedgerPage';
import CostLedgerPage from '../features/costLedger/pages/CostLedgerPage';
import ExportCenterPage from '../features/exports/pages/ExportCenterPage';
import UserManagementPage from '../features/users/pages/UserManagementPage';
import MasterControllerPage from '../features/masterController/pages/MasterControllerPage';
import WarehousePage from '../features/warehouse/pages/WarehousePage';
import FinishedGoodsPage from '../features/finishedGoods/pages/FinishedGoodsPage';
import VendorMasterPage from '../features/vendorMaster/pages/VendorMasterPage';
import AlloyMasterPage from '../features/alloyMaster/pages/AlloyMasterPage';
import DispatchPage from '../features/dispatch/pages/DispatchPage';
import ProductionManagerLayout from '../layouts/ProductionManagerLayout';
import PMQualityControlPage from '../features/productionManager/pages/PMQualityControlPage';
import PMCostLedgerPage from '../features/productionManager/pages/PMCostLedgerPage';

export const router = createBrowserRouter([
  {
    // Redirect root to login
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/accounts-login',
    element: <AccountsLoginPage />,
  },
  {
    path: '/production-login',
    element: <ProductionManagerLoginPage />,
  },
  {
    // All admin app routes are protected
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'production-ledger',
            element: <ProductionLedgerPage />,
          },
          {
            path: 'cost-ledger',
            element: <CostLedgerPage />,
          },
          {
            path: 'exports',
            element: <ExportCenterPage />,
          },
          {
            path: 'users',
            element: <UserManagementPage />,
          },
          {
            path: 'master-controller',
            element: <MasterControllerPage />,
          },
          {
            path: 'warehouse',
            element: <WarehousePage />,
          },
          {
            path: 'finished-goods',
            element: <FinishedGoodsPage />,
          },
          {
            path: 'vendor-master',
            element: <VendorMasterPage />,
          },
          {
            path: 'alloy-master',
            element: <AlloyMasterPage />,
          },
          {
            path: 'dispatch',
            element: <DispatchPage />,
          },
        ],
      },
    ],
  },
  {
    // Accounts Manager routes — restricted portal
    element: <AccountsProtectedRoute />,
    children: [
      {
        element: <AccountsLayout />,
        children: [
          {
            path: 'accounts/finished-goods',
            element: <FinishedGoodsPage readOnly />,
          },
          {
            path: 'accounts/dispatch',
            element: <DispatchPage noDelete />,
          },
          {
            path: 'accounts/vendor-master',
            element: <VendorMasterPage noDelete />,
          },
          {
            path: 'accounts/warehouse',
            element: <WarehousePage readOnly />,
          },
        ],
      },
    ],
  },
  {
    // Production Manager routes — restricted portal
    element: <ProductionProtectedRoute />,
    children: [
      {
        element: <ProductionManagerLayout />,
        children: [
          {
            path: 'production/warehouse',
            element: <WarehousePage productionManager />,
          },
          {
            path: 'production/quality-control',
            element: <PMQualityControlPage />,
          },
          {
            path: 'production/cost-ledger',
            element: <PMCostLedgerPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
