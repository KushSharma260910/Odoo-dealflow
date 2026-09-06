import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
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
  User,
  Shield,
  Building,
  Mail,
} from 'lucide-react';

export const Layout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    // Sales Rep / Shared
    { label: 'Dashboard', path: '/sales/dashboard', roles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'], icon: LayoutDashboard },
    { label: 'Quotations', path: '/sales/quotations', roles: ['SALES_REP', 'SALES_MANAGER', 'FINANCE', 'ADMIN'], icon: FileText },
    { label: 'Negotiations', path: '/sales/negotiations', roles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'], icon: MessageSquare },
    
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

  const getRoleBadgeStyle = (r) => {
    if (r === 'ADMIN') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (r === 'FINANCE') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (r === 'SALES_MANAGER') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (r === 'CUSTOMER') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-slate-900 text-white p-4 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-12 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">D</div>
            <span className="font-bold text-xl tracking-tight">DealFlow360</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Navigation</span>
          <span className="text-[10px] text-slate-500 font-mono font-normal">scrollable</span>
        </div>
        <div className="relative flex-1 min-h-0 flex flex-col">
          <nav className="space-y-1 flex-1 overflow-y-auto custom-sidebar-scrollbar pr-1.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div
          onClick={() => setProfileOpen(true)}
          className="border-t border-slate-800 pt-4 mt-auto cursor-pointer hover:bg-slate-800/60 rounded-lg p-2 transition-colors flex items-center justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-200 font-semibold truncate">{user?.name || user?.email}</div>
            <div className="text-[11px] text-blue-400 font-mono font-semibold">{role || 'USER'}</div>
          </div>
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Container Area - Offset by Sidebar width on Desktop */}
      <div className="min-w-0 flex-1 flex flex-col lg:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <span className="lg:hidden font-bold text-gray-900">DealFlow360</span>
            </div>

            {/* Right Header Action Bar */}
            <div className="flex items-center space-x-3">
              {/* User Profile Quick Access Button */}
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-medium text-gray-900">{user?.name || 'User Profile'}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeStyle(role)}`}>
                  {role || 'USER'}
                </span>
              </button>

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

      {/* User Profile Modal */}
      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="My User Profile">
        <div className="space-y-5">
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user?.name || 'User Account'}</h3>
              <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRoleBadgeStyle(role)}`}>
                {role || 'USER'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Email Address</span>
              </div>
              <span className="font-semibold text-gray-900">{user?.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="font-medium">User Account ID</span>
              </div>
              <span className="font-mono font-bold text-gray-900">#USR-{user?.id || '—'}</span>
            </div>

            {user?.customer_id && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Customer Account ID</span>
                </div>
                <span className="font-mono font-bold text-blue-700">#CUST-{user.customer_id}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">Account Status</span>
              </div>
              <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setProfileOpen(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Close Profile
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
};
