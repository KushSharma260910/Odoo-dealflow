import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortal.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Check, X, MessageSquare, FileText, Receipt, ShieldCheck } from 'lucide-react';

export const Portal = () => {
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, iRes] = await Promise.all([
        customerPortalService.quotations(),
        customerPortalService.invoices(),
      ]);
      if (qRes.success) setQuotations(qRes.data || []);
      if (iRes.success) setInvoices(iRes.data || []);
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

  if (loading) return <LoadingSpinner label="Loading customer portal dashboard..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
        <p className="text-sm text-gray-500">Review proposals, counter-propose terms, and confirm orders</p>
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
          <EmptyState title="No proposals" message="You have no active proposals under your customer account." />
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
    </div>
  );
};
