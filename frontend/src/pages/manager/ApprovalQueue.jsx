import React, { useEffect, useState } from 'react';
import { approvalService } from '../../services/approval.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { CheckCircle, XCircle, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Approval Queue</h1>
          <p className="text-sm text-gray-500">Review proposals exceeding discount thresholds or risk scores</p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="PENDING">PENDING ONLY</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ALL">ALL STATUSES</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {approvals.length === 0 ? (
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
                  <th className="px-6 py-3.5">Required Role</th>
                  <th className="px-6 py-3.5">Level</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Decided By</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvals.map((appr) => (
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
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-purple-700">
                      {appr.required_role}
                    </td>
                    <td className="px-6 py-4 font-medium">Level {appr.approval_level}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appr.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {appr.approver_name || 'Pending'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {appr.status === 'PENDING' ? (
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
                        <span className="text-xs text-gray-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Please provide a decision note or justification for Quotation #QT-{selectedApproval?.quotation_id}.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Decision Note / Reason
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
