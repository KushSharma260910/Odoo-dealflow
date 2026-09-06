import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Pages
import { Login } from '../pages/auth/Login';

// Sales
import { Dashboard } from '../pages/sales/Dashboard';
import { Quotations } from '../pages/sales/Quotations';
import { CreateQuotation } from '../pages/sales/CreateQuotation';
import { QuotationDetails } from '../pages/sales/QuotationDetails';
import { Negotiations } from '../pages/sales/Negotiations';

// Manager
import { ApprovalQueue } from '../pages/manager/ApprovalQueue';
import { DealMonitoring } from '../pages/manager/DealMonitoring';
import { DealDetails } from '../pages/manager/DealDetails';

// Finance
import { Billing } from '../pages/finance/Billing';
import { Invoices } from '../pages/finance/Invoices';

// Operations
import { Warehouses as OperationsWarehouses } from '../pages/operations/Warehouses';
import { Fulfillment } from '../pages/operations/Fulfillment';

// Customer
import { Portal } from '../pages/customer/Portal';
import { Negotiation } from '../pages/customer/Negotiation';

// Admin
import { Products } from '../pages/admin/Products';
import { Customers } from '../pages/admin/Customers';
import { DiscountRules } from '../pages/admin/DiscountRules';
import { Audit } from '../pages/admin/Audit';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <LoadingSpinner label="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect customer to customer portal, internal users to sales dashboard
    return <Navigate to={role === 'CUSTOMER' ? '/customer' : '/sales/dashboard'} replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'CUSTOMER' ? '/customer' : '/sales/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Authenticated Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Sales */}
        <Route path="/sales/dashboard" element={<Dashboard />} />
        <Route path="/sales/quotations" element={<Quotations />} />
        <Route path="/sales/quotations/new" element={<CreateQuotation />} />
        <Route path="/sales/quotations/:id" element={<QuotationDetails />} />
        <Route path="/sales/negotiations" element={<Negotiations />} />

        {/* Manager */}
        <Route
          path="/manager/approvals"
          element={
            <ProtectedRoute allowedRoles={['SALES_MANAGER', 'ADMIN', 'FINANCE']}>
              <ApprovalQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/deals"
          element={
            <ProtectedRoute allowedRoles={['SALES_MANAGER', 'ADMIN']}>
              <DealMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/deals/:id"
          element={
            <ProtectedRoute allowedRoles={['SALES_MANAGER', 'ADMIN']}>
              <DealDetails />
            </ProtectedRoute>
          }
        />

        {/* Finance */}
        <Route
          path="/finance/billing"
          element={
            <ProtectedRoute allowedRoles={['FINANCE', 'ADMIN']}>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoices"
          element={
            <ProtectedRoute allowedRoles={['FINANCE', 'ADMIN']}>
              <Invoices />
            </ProtectedRoute>
          }
        />

        {/* Operations */}
        <Route
          path="/operations/warehouses"
          element={
            <ProtectedRoute allowedRoles={['OPERATIONS', 'ADMIN']}>
              <OperationsWarehouses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operations/fulfillment"
          element={
            <ProtectedRoute allowedRoles={['OPERATIONS', 'ADMIN']}>
              <Fulfillment />
            </ProtectedRoute>
          }
        />

        {/* Customer Portal */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <Portal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/negotiation/:id"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SALES_REP', 'SALES_MANAGER']}>
              <Negotiation />
            </ProtectedRoute>
          }
        />

        {/* Admin Configuration */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/discount-rules"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DiscountRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Audit />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (role === 'CUSTOMER' ? '/customer' : '/sales/dashboard') : '/login'} replace />}
      />
    </Routes>
  );
};
