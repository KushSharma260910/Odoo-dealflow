import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortal.service';
import { productService } from '../../services/product.service';
import { quotationService } from '../../services/quotation.service';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Check, X, MessageSquare, FileText, Receipt, Plus } from 'lucide-react';

export const Portal = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // New Order Request Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, iRes, pRes] = await Promise.all([
        customerPortalService.quotations(),
        customerPortalService.invoices(),
        productService.list(),
      ]);
      if (qRes.success) setQuotations(qRes.data || []);
      if (iRes.success) setInvoices(iRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const res = await customerPortalService.accept(id);
      if (res.success) {
        setActionMessage(`Quotation #QT-${id} confirmed & accepted!`);
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await customerPortalService.reject(id);
      if (res.success) {
        setActionMessage(`Quotation #QT-${id} declined.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOrderRequest = async (e) => {
    e.preventDefault();
    if (!user?.customer_id || !selectedProductId) return;
    try {
      setSubmitting(true);
      setError(null);

      const qRes = await quotationService.create({
        customer_id: user.customer_id,
        sales_rep_id: 1,
      });

      if (qRes.success && qRes.data?.id) {
        const quoteId = qRes.data.id;
        await quotationService.addItem(quoteId, {
          product_id: Number(selectedProductId),
          quantity: Number(quantity),
          discount_percent: 0,
        });
        await quotationService.analyzeRisk(quoteId);

        setModalOpen(false);
        setSelectedProductId('');
        setQuantity(1);
        setActionMessage(`Order proposal request #QT-${quoteId} submitted to sales team!`);
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading customer portal dashboard..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name || 'Customer'}. Review proposals and order equipment.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Order Request</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}
      {actionMessage && <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium">{actionMessage}</div>}

      {/* Proposals Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>My Quotations & Proposals</span>
        </h3>

        {quotations.length === 0 ? (
          <EmptyState
            title="No active proposals"
            message="You have no active proposals under your account."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Place Order Request</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Proposal ID</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900">#QT-{q.id}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      ${Number(q.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <Link
                        to={`/customer/negotiation/${q.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Negotiate</span>
                      </Link>
                      {q.status !== 'CONFIRMED' && q.status !== 'REJECTED' && (
                        <>
                          <button
                            onClick={() => handleAccept(q.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleReject(q.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Invoices Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <span>My Invoices</span>
        </h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No invoices issued to your account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      ${Number(inv.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Request Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Place New Order Request">
        <form onSubmit={handleCreateOrderRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Product *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.base_price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Quantity Requested *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Proposal Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
