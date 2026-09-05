import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { productService } from '../../services/product.service';
import { quotationService } from '../../services/quotation.service';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Plus, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const CreateQuotation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          customerService.list(),
          productService.list(),
        ]);
        if (cRes.success) setCustomers(cRes.data || []);
        if (pRes.success) setProducts(pRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        product_id: products[0].id,
        quantity: 1,
        discount_percent: 0,
      },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product line item.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create Quotation Draft
      const qRes = await quotationService.create({
        customer_id: Number(customerId),
        sales_rep_id: user?.id,
        valid_until: validUntil || null,
      });

      if (!qRes.success || !qRes.data?.id) {
        throw new Error('Failed to initialize quotation draft.');
      }

      const quoteId = qRes.data.id;

      // 2. Add Item Lines
      for (const item of items) {
        await quotationService.addItem(quoteId, {
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          discount_percent: Number(item.discount_percent || 0),
        });
      }

      // 3. Analyze Risk automatically
      await quotationService.analyzeRisk(quoteId);

      navigate(`/sales/quotations/${quoteId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading customer and product catalogs..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/sales/quotations')}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Build New Quotation</h1>
          <p className="text-sm text-gray-500">Configure proposal items, quantities, and pricing</p>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">1. Proposal Header</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier || 'BRONZE'} Tier)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Valid Until Date
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">2. Proposal Line Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Line Item</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No line items added yet. Click "Add Line Item" above.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === Number(item.product_id));
                const unitPrice = selectedProd ? Number(selectedProd.base_price || 0) : 0;
                const gross = unitPrice * Number(item.quantity || 0);
                const discount = (gross * Number(item.discount_percent || 0)) / 100;
                const lineTotal = gross - discount;

                return (
                  <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Product</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${Number(p.base_price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_percent}
                        onChange={(e) => handleItemChange(idx, 'discount_percent', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="w-32 text-right">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Line Total</label>
                      <span className="text-sm font-bold text-gray-900">${lineTotal.toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-4 md:mt-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/sales/quotations')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Creating Quotation...' : 'Create & Analyze Risk'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
