import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quotationService } from '../../services/quotation.service';
import { discountService } from '../../services/discount.service';
import { recommendationService } from '../../services/recommendation.service';
import { warehouseService } from '../../services/warehouse.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';

export const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

      {/* Quotation Line Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Line Items</h3>
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
                  <td className="px-4 py-3.5 text-right text-rose-600 font-medium">{item.discount_percent}%</td>
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
            <h3 className="text-base font-bold text-gray-900">AI Intelligent Upsell Recommendations</h3>
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
