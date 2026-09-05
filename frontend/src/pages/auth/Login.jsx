import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email.trim(), password.trim());
      if (user.role === 'CUSTOMER') {
        navigate('/customer');
      } else if (user.role === 'FINANCE') {
        navigate('/finance/invoices');
      } else if (user.role === 'OPERATIONS') {
        navigate('/operations/fulfillment');
      } else if (user.role === 'SALES_MANAGER') {
        navigate('/manager/approvals');
      } else {
        navigate('/sales/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
            D
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DealFlow360</h1>
          <p className="text-slate-400 text-sm mt-1">Self-Governing Sales & Operations Platform</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in to your workspace</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm shadow-md shadow-blue-600/20"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            <span className="inline-flex items-center text-slate-500">
              <Shield className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Role-based JWT Secure Authentication
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
