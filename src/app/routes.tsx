import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
// @ts-ignore
import LandingLayout from '../features/landingPage/LandingLayout';
import AccountsLayout from '../layouts/AccountsLayout';
import { ProtectedRoute, AccountsProtectedRoute, ProductionProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
// @ts-ignore
import Home from '../features/landingPage/pages/Home';
// @ts-ignore
import About from '../features/landingPage/pages/About/About';
// @ts-ignore
import Catalogue from '../features/landingPage/pages/Catalogue/Catalogue';
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
import MonthlyExpenseRegisterPage from '../features/expenseRegister/pages/MonthlyExpenseRegisterPage';
import EmployeeMasterPage from '../features/employeeMaster/pages/EmployeeMasterPage';
import AttendancePage from '../features/attendance/pages/AttendancePage';
import SalarySheetPage from '../features/salarySheet/pages/SalarySheetPage';
import ProductionWagesPage from '../features/productionWages/pages/ProductionWagesPage';
import PurchaseOrderPage from '../features/purchaseOrder/pages/PurchaseOrderPage';
import ProformaInvoicePage from '../features/proformaInvoice/pages/ProformaInvoicePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'products/catalogue',
        element: <Catalogue />,
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />,
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
          {
            path: 'expense-register',
            element: <MonthlyExpenseRegisterPage />,
          },
          {
            path: 'employee-master',
            element: <EmployeeMasterPage />,
          },
          {
            path: 'attendance',
            element: <AttendancePage />,
          },
          {
            path: 'salary-sheet',
            element: <SalarySheetPage />,
          },
          {
            path: 'production-wages',
            element: <ProductionWagesPage />,
          },
          {
            path: 'purchase-order',
            element: <PurchaseOrderPage />,
          },
          {
            path: 'purchase-orders',
            element: <Navigate to="/purchase-order" replace />,
          },
          {
            path: 'proforma-invoice',
            element: <ProformaInvoicePage />,
          },
          {
            path: 'proforma-invoices',
            element: <Navigate to="/proforma-invoice" replace />,
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
            path: 'accounts/purchase-order',
            element: <PurchaseOrderPage accountsMode />,
          },
          {
            path: 'accounts/purchase-orders',
            element: <Navigate to="/accounts/purchase-order" replace />,
          },
          {
            path: 'accounts/proforma-invoice',
            element: <ProformaInvoicePage accountsMode />,
          },
          {
            path: 'accounts/proforma-invoices',
            element: <Navigate to="/accounts/proforma-invoice" replace />,
          },
          {
            path: 'accounts/employee-master',
            element: <EmployeeMasterPage />,
          },
          {
            path: 'accounts/warehouse',
            element: <WarehousePage productionManager />,
          },
          {
            path: 'accounts/expense-register',
            element: <MonthlyExpenseRegisterPage accountsMode />,
          },
          {
            path: 'accounts/attendance',
            element: <AttendancePage />,
          },
          {
            path: 'accounts/salary-sheet',
            element: <SalarySheetPage />,
          },
          {
            path: 'accounts/production-wages',
            element: <ProductionWagesPage />,
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
            path: 'production',
            element: <Navigate to="/production/production-ledger" replace />,
          },
          {
            path: 'production/production-ledger',
            element: <ProductionLedgerPage />,
          },
          {
            path: 'production/warehouse',
            element: <WarehousePage productionManager />,
          },
          {
            path: 'production/dispatch',
            element: <DispatchPage />,
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
