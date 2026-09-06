import React, { useEffect, useState } from 'react';
import { approvalService } from '../../services/approval.service';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { CheckCircle, XCircle, Filter, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApprovalQueue = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await approvalService.list(statusFilter !== 'ALL' ? { status: statusFilter } : {});
      if (res.success) {
        setApprovals(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (appr, type) => {
    setSelectedApproval(appr);
    setActionType(type);
    setReason('');
  };

  const handleConfirmDecision = async () => {
    if (!selectedApproval || !actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'APPROVE') {
        await approvalService.approve(selectedApproval.id, reason);
      } else {
        await approvalService.reject(selectedApproval.id, reason);
      }
      setSelectedApproval(null);
      fetchApprovals();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading approval queue..." />;

  const filtered = approvals.filter((a) => {
    const haystack = [
      `qt-${a.quotation_id}`,
      `apr-${a.id}`,
      a.customer_name,
      a.sales_rep_name,
      a.required_role,
      a.risk_level
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (role === 'FINANCE') return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Quotation Approval Queue</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              {approvals.length} Approval Tasks Total
            </span>
          </div>
          <p className="text-sm text-gray-500">Review proposals exceeding discount thresholds or risk scores</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by QT #, Customer, Role..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="PENDING">PENDING ONLY</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ALL">ALL STATUSES</option>
            </select>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Showing {paginated.length} of {filtered.length} tasks
          </span>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState
          title="No approval tasks found"
          message="There are no quotation proposals requiring manager approval under this filter."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Approval ID</th>
                  <th className="px-6 py-3.5">Quotation</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Risk Score</th>
                  <th className="px-6 py-3.5">Required Role</th>
                  <th className="px-6 py-3.5">Level</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((appr) => {
                  const canUserApprove = user?.role === 'ADMIN' || user?.role === appr.required_role;

                  return (
                    <tr key={appr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">#APR-{appr.id}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/sales/quotations/${appr.quotation_id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Quotation #QT-{appr.quotation_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {appr.customer_name || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ${Number(appr.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold">{appr.risk_score ?? 0}</span>
                          <StatusBadge status={appr.risk_level || 'LOW'} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getRoleBadge(appr.required_role)}`}>
                          {appr.required_role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-xs">Level {appr.approval_level}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appr.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {appr.status === 'PENDING' ? (
                          canUserApprove ? (
                            <>
                              <button
                                onClick={() => handleOpenModal(appr, 'APPROVE')}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenModal(appr, 'REJECT')}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              Requires {appr.required_role}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">
                            Decided by {appr.approver_name || 'System'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Decision Dialog Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Approval Task #APR-${selectedApproval?.id}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a decision note or justification for Quotation #QT-{selectedApproval?.quotation_id} (Customer: {selectedApproval?.customer_name}).
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Decision Note / Reason
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved deal terms based on executive margin review..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setSelectedApproval(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDecision}
              disabled={actionLoading}
              className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm ${
                actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {actionLoading ? 'Processing...' : `Confirm ${actionType === 'APPROVE' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
              placeholder="e.g. Approved special 15% discount for enterprise customer."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setSelectedApproval(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDecision}
              disabled={actionLoading}
              className={`px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-sm ${
                actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {actionLoading ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
