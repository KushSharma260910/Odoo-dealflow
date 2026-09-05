import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileText, ShoppingBag, Users, AlertTriangle, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [deals, setDeals] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ovRes, dlRes, revRes, rskRes] = await Promise.all([
          dashboardService.overview(),
          dashboardService.deals(),
          dashboardService.revenue(),
          dashboardService.risks(),
        ]);
        if (ovRes.success) setOverview(ovRes.data);
        if (dlRes.success) setDeals(dlRes.data || []);
        if (revRes.success) setRevenue(revRes.data || []);
        if (rskRes.success) setRisks(rskRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading Sales Dashboard..." />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-700 rounded-xl font-medium">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales & Operations Overview</h1>
        <p className="text-sm text-gray-500">Live operational metrics and pipeline health</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Quotations"
          value={overview?.quotations ?? 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Confirmed Orders"
          value={overview?.orders ?? 0}
          icon={ShoppingBag}
          color="green"
        />
        <StatCard
          title="Active Customers"
          value={overview?.customers ?? 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Open Risk Alerts"
          value={overview?.open_risks ?? 0}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Pipeline Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Pipeline Stage Breakdown</h3>
            <span className="text-xs text-gray-400">Live counts</span>
          </div>
          <div className="space-y-3">
            {deals.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No deals in pipeline</p>
            ) : (
              deals.map((deal) => (
                <div key={deal.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={deal.status} />
                    <span className="text-sm font-medium text-gray-700">{deal.count} deal(s)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    ${Number(deal.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Monthly Revenue</h3>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {revenue.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No billed invoices recorded</p>
            ) : (
              revenue.map((rev) => (
                <div key={rev.period} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-semibold text-gray-700">{rev.period}</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ${Number(rev.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
