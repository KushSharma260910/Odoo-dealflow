import React, { useState } from 'react';
import { billingService } from '../../services/billing.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FileSpreadsheet, Play, CheckCircle } from 'lucide-react';

export const Billing = () => {
  const [quotationId, setQuotationId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!quotationId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await billingService.calculate(Number(quotationId));
      if (res.success) {
        setCalculation(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await billingService.generate(Number(orderId));
      if (res.success) {
        setGeneratedInvoice(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing Engine & Invoicing</h1>
        <p className="text-sm text-gray-500">Calculate billing schedules and generate customer invoices</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Calculation Tool */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-base font-bold text-gray-900">Calculate Billing</h3>
          </div>
          <form onSubmit={handleCalculate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Quotation ID #
              </label>
              <input
                type="number"
                required
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                placeholder="e.g. 1"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              Run Calculation
            </button>
          </form>

          {calculation && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">${Number(calculation.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-bold">-${Number(calculation.discount_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Tax:</span>
                <span className="font-bold">+${Number(calculation.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-1">
                <span>Total Billed:</span>
                <span>${Number(calculation.total_amount).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Generate Invoice Tool */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600">
            <Play className="w-5 h-5" />
            <h3 className="text-base font-bold text-gray-900">Generate Invoice</h3>
          </div>
          <form onSubmit={handleGenerateInvoice} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Order ID #
              </label>
              <input
                type="number"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 1"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              Generate Invoice
            </button>
          </form>

          {generatedInvoice && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Invoice Created Successfully!</span>
              </div>
              <div className="font-mono">
                <div>Invoice #: {generatedInvoice.invoice_number}</div>
                <div>Amount: ${Number(generatedInvoice.amount).toFixed(2)}</div>
                <div>Type: {generatedInvoice.invoice_type}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
