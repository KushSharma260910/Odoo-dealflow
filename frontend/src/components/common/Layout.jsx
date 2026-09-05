import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  CheckCircle,
  Warehouse,
  Truck,
  MessageSquare,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  ShieldCheck,
  LogOut,
  UserCheck,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';

export const Layout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    // Sales Rep / Internal Shared
    { label: 'Dashboard', path: '/sales/dashboard', roles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'], icon: LayoutDashboard },
    { label: 'Quotations', path: '/sales/quotations', roles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'], icon: FileText },
    
    // Manager
    { label: 'Approval Queue', path: '/manager/approvals', roles: ['SALES_MANAGER', 'ADMIN', 'FINANCE'], icon: CheckCircle },
    { label: 'Deal Monitoring', path: '/manager/deals', roles: ['SALES_MANAGER', 'ADMIN'], icon: Sparkles },

    // Finance
    { label: 'Billing Schedules', path: '/finance/billing', roles: ['FINANCE', 'ADMIN'], icon: FileSpreadsheet },
    { label: 'Invoices', path: '/finance/invoices', roles: ['FINANCE', 'ADMIN'], icon: Receipt },

    // Operations
    { label: 'Warehouses', path: '/operations/warehouses', roles: ['OPERATIONS', 'ADMIN'], icon: Warehouse },
    { label: 'Order Fulfillment', path: '/operations/fulfillment', roles: ['OPERATIONS', 'ADMIN'], icon: Truck },

    // Customer Portal
    { label: 'Customer Portal', path: '/customer', roles: ['CUSTOMER'], icon: UserCheck },

    // Admin Config
    { label: 'Products', path: '/admin/products', roles: ['ADMIN'], icon: Package },
    { label: 'Customers', path: '/admin/customers', roles: ['ADMIN'], icon: Users },
    { label: 'Discount Rules', path: '/admin/discount-rules', roles: ['ADMIN'], icon: Sparkles },
    { label: 'Warehouse Setup', path: '/admin/warehouses', roles: ['ADMIN'], icon: Warehouse },
    { label: 'Plans (Sub)', path: '/admin/subscription-plans', roles: ['ADMIN'], icon: CreditCard },
    { label: 'Audit Logs', path: '/admin/audit', roles: ['ADMIN'], icon: ShieldCheck },
  ];

  // Filter links visible to current user's role
  const visibleNav = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-slate-300 hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
                D
              </div>
              <span className="font-bold text-xl tracking-tight text-white">DealFlow360</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <div className="text-right">
                  <div className="font-semibold text-slate-200">{user.name || user.email}</div>
                  <div className="text-xs text-blue-400 font-mono font-medium">{role || 'USER'}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <aside
          className={`lg:w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${
            mobileOpen ? 'block fixed inset-x-4 top-20 z-50 bg-white shadow-2xl' : 'hidden lg:block'
          }`}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation ({role})
          </div>
          <nav className="mt-2 space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
