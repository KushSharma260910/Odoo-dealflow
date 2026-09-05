import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quotationService } from '../../services/quotation.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, Search, Eye, Filter } from 'lucide-react';

export const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await quotationService.list();
      if (res.success) {
        setQuotations(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.id.toString().includes(search) ||
      (q.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.sales_rep_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <LoadingSpinner label="Loading quotations..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
              {quotations.length} Quotations Total
            </span>
          </div>
          <p className="text-sm text-gray-500">Manage active sales proposals and deal pipeline</p>
        </div>
        <Link
          to="/sales/quotations/new"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Customer, Sales Rep..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CONFIRMED">CONFIRMED</option>
            </select>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Showing {paginated.length} of {filtered.length} quotations
          </span>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No quotations found"
          message="Try adjusting your search query or create a new sales quotation."
          action={
            <Link
              to="/sales/quotations/new"
              className="inline-flex items-center space-x-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Sales Rep</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Risk Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">#QT-{q.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{q.customer_name || `Customer #${q.customer_id}`}</td>
                    <td className="px-6 py-4">{q.sales_rep_name || `User #${q.sales_rep_id}`}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ${Number(q.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold">{q.risk_score ?? 0}</span>
                        <StatusBadge status={q.risk_level || 'LOW'} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/sales/quotations/${q.id}`}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
