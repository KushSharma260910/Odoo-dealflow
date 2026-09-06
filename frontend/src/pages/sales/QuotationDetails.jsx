import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quotationService } from '../../services/quotation.service';
import { discountService } from '../../services/discount.service';
import { recommendationService } from '../../services/recommendation.service';
import { warehouseService } from '../../services/warehouse.service';
import { approvalService } from '../../services/approval.service';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quotation, setQuotation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [approvalTasks, setApprovalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await quotationService.get(id);
      if (res.success) {
        setQuotation(res.data);
      }
      const recRes = await recommendationService.forQuotation(id);
      if (recRes.success) {
        setRecommendations(recRes.data || []);
      }
      const appRes = await approvalService.list({ quotation_id: id });
      if (appRes.success) {
        setApprovalTasks(appRes.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeRisk = async () => {
    try {
      setActionLoading(true);
      const res = await quotationService.analyzeRisk(id);
      if (res.success) {
        setMessage(`Risk Analyzed: Score ${res.data.risk_score} (${res.data.risk_level})`);
        fetchDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvaluateDiscount = async () => {
    try {
      setActionLoading(true);
      const res = await discountService.evaluate(id);
      if (res.success) {
        setMessage(
          res.data.approval_required
            ? 'Discount thresholds exceeded: Manager Approval Required!'
            : 'Discount evaluation passed cleanly.'
        );
        fetchDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      const res = await quotationService.submit(id);
      if (res.success) {
        setMessage('Quotation submitted successfully.');
        fetchDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setActionLoading(true);
      const res = await warehouseService.createOrder(id);
      if (res.success) {
        setMessage(`Confirmed Order #${res.data.id} created from quotation!`);
        navigate('/operations/fulfillment');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      setActionLoading(true);
      const res = await approvalService.approve(taskId, decisionReason);
      if (res.success) {
        setMessage('Approval decision registered successfully.');
        setDecisionReason('');
        fetchDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      setActionLoading(true);
      const res = await approvalService.reject(taskId, decisionReason);
      if (res.success) {
        setMessage('Proposal rejected and marked accordingly.');
        setDecisionReason('');
        fetchDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading quotation details..." />;
  if (error || !quotation)
    return <div className="p-4 bg-rose-50 text-rose-700 rounded-xl font-medium">{error || 'Quotation not found'}</div>;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/sales/quotations')}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Quotation #QT-{quotation.id}</h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-sm text-gray-500">Customer: {quotation.customer_name}</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAnalyzeRisk}
            disabled={actionLoading}
            className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Analyze Risk</span>
          </button>

          <button
            onClick={handleEvaluateDiscount}
            disabled={actionLoading}
            className="inline-flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Evaluate Rules</span>
          </button>

          {quotation.status === 'DRAFT' && (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Send className="w-4 h-4" />
              <span>Submit Proposal</span>
            </button>
          )}

          {(quotation.status === 'APPROVED' || quotation.status === 'CONFIRMED' || quotation.status === 'SENT') && (
            <button
              onClick={handleCreateOrder}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Convert to Order</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Subtotal</span>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            ${Number(quotation.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Discount Amount</span>
          <p className="text-lg font-bold text-rose-600 mt-0.5">
            -${Number(quotation.discount_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Total Amount</span>
          <p className="text-xl font-black text-gray-900 mt-0.5">
            ${Number(quotation.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Deal Risk Assessment</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="font-bold text-gray-900 text-base">{quotation.risk_score ?? 0}/100</span>
            <StatusBadge status={quotation.risk_level || 'LOW'} />
          </div>
        </div>
      </div>

      {/* Approval Governance Card */}
      {approvalTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-gray-900">Governance & Role Approval Tasks</h3>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Risk Level: {quotation.risk_level} (Score: {quotation.risk_score})
            </span>
          </div>

          <div className="space-y-3">
            {approvalTasks.map((task) => {
              const canUserApprove = 
                user?.role === 'ADMIN' || 
                user?.role === task.required_role || 
                (user?.role === 'SALES_MANAGER' && (task.required_role === 'SALES_MANAGER' || task.required_role === 'SALES_REP'));

              return (
                <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">
                        {task.required_role}
                      </span>
                      <span className="text-xs font-medium text-gray-500">Level {task.approval_level}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-xs text-gray-600">
                      {task.status === 'PENDING'
                        ? `Awaiting approval from ${task.required_role} due to ${quotation.risk_level} risk score (${quotation.risk_score})`
                        : `Decided by ${task.approver_name || 'System'}: ${task.reason || 'No note provided'}`}
                    </p>
                  </div>

                  {task.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      {canUserApprove ? (
                        <>
                          <input
                            type="text"
                            value={decisionReason}
                            onChange={(e) => setDecisionReason(e.target.value)}
                            placeholder="Optional decision note..."
                            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproveTask(task.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectTask(task.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          Requires {task.required_role} Authorization
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quotation Line Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
          {['SALES_MANAGER', 'ADMIN'].includes(user?.role) && (
            <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-semibold border border-blue-200">
              Manager Discount Override Enabled
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(quotation.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{item.product_name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3.5 text-right font-medium">{item.quantity}</td>
                  <td className="px-4 py-3.5 text-right">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right">
                    {['SALES_MANAGER', 'ADMIN', 'SALES_REP'].includes(user?.role) && quotation.status !== 'CONFIRMED' ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          defaultValue={item.discount_percent}
                          onBlur={async (e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== Number(item.discount_percent)) {
                              await quotationService.updateItem(item.id, { discount_percent: val });
                              fetchDetails();
                            }
                          }}
                          className="w-16 border border-gray-300 rounded px-1.5 py-1 text-right text-xs font-bold text-rose-600 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-rose-600">%</span>
                      </div>
                    ) : (
                      <span className="text-rose-600 font-medium">{item.discount_percent}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-900">${Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Side Panel */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Recommended Product Bundles & Cross-Sells</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase">{rec.recommendation_type}</span>
                  <h4 className="text-sm font-semibold text-gray-900">{rec.product_name}</h4>
                  <p className="text-xs text-gray-500">Suggested Price: ${Number(rec.base_price || 0).toFixed(2)}</p>
                </div>
                <button
                  onClick={async () => {
                    await quotationService.addItem(quotation.id, {
                      product_id: rec.recommended_product_id,
                      quantity: 1,
                      discount_percent: 0,
                    });
                    fetchDetails();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
