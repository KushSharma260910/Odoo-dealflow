import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quotationService } from '../../services/quotation.service';
import { dashboardService } from '../../services/dashboard.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ShieldAlert, TrendingUp, Eye, FileText } from 'lucide-react';

export const DealMonitoring = () => {
  const [quotations, setQuotations] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const [qRes, rRes] = await Promise.all([
          quotationService.list(),
          dashboardService.risks(),
        ]);
        if (qRes.success) setQuotations(qRes.data || []);
        if (rRes.success) setRisks(rRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDeals();
  }, []);

  if (loading) return <LoadingSpinner label="Loading deal monitoring metrics..." />;

  const highRiskDeals = quotations.filter((q) => q.risk_level === 'HIGH' || q.risk_level === 'CRITICAL');
  const pendingApprovalDeals = quotations.filter((q) => q.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Deal Monitoring</h1>
        <p className="text-sm text-gray-500">Real-time governance and risk surveillance</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">High Risk Deals</span>
              <h3 className="text-2xl font-black text-rose-900 mt-1">{highRiskDeals.length}</h3>
            </div>
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Manager Approval</span>
              <h3 className="text-2xl font-black text-amber-900 mt-1">{pendingApprovalDeals.length}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* High Risk Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">At-Risk Proposals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Quotation ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Sales Rep</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">#QT-{q.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{q.customer_name}</td>
                  <td className="px-4 py-3">{q.sales_rep_name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    ${Number(q.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.risk_level || 'LOW'} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/manager/deals/${q.id}`}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
