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
    { label: 'Audit Logs', path: '/admin/audit', roles: ['ADMIN'], icon: ShieldCheck },
  ];

  // Filter links visible to current user's role
  const visibleNav = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-4 transform transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:flex lg:flex-col`}
      >
        <div className="flex items-center justify-between h-12 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">D</div>
            <span className="font-bold text-xl tracking-tight">DealFlow360</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</div>
        <nav className="mt-2 space-y-1 flex-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 pt-4 mt-4">
          <div className="px-3 text-xs text-slate-400 truncate">{user?.name || user?.email}</div>
          <div className="px-3 mt-1 text-xs text-blue-300 font-mono">{role || 'USER'}</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-slate-300 hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="lg:hidden font-bold text-gray-900">DealFlow360</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
      </main>
      </div>
    </div>
  );
};
