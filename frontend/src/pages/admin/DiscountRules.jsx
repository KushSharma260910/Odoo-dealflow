import React, { useEffect, useState } from 'react';
import { discountService } from '../../services/discount.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Plus, Sparkles, Edit } from 'lucide-react';

export const DiscountRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customerTier, setCustomerTier] = useState('BRONZE');
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(15);
  const [approvalRequiredAbove, setApprovalRequiredAbove] = useState(10);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await discountService.listRules();
      if (res.success) setRules(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setCustomerTier('BRONZE');
    setMaxDiscountPercent(15);
    setApprovalRequiredAbove(10);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await discountService.updateRule(editingId, {
          customer_tier: customerTier,
          max_discount_percent: Number(maxDiscountPercent),
          approval_required_above: Number(approvalRequiredAbove),
        });
      } else {
        await discountService.createRule({
          customer_tier: customerTier,
          max_discount_percent: Number(maxDiscountPercent),
          approval_required_above: Number(approvalRequiredAbove),
        });
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading discount governance rules..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Governance Rules</h1>
          <p className="text-sm text-gray-500">Configure discount ceilings and manager approval thresholds</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Rule</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {rules.length === 0 ? (
        <EmptyState title="No discount rules" message="No discount governance rules configured yet." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Customer Tier</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Max Discount Ceiling</th>
                  <th className="px-6 py-3.5 text-right">Approval Required Above</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">{r.customer_tier}</td>
                    <td className="px-6 py-4">{r.category_name || 'All Product Categories'}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">{r.max_discount_percent}%</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600">{r.approval_required_above}%</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setCustomerTier(r.customer_tier);
                          setMaxDiscountPercent(r.max_discount_percent);
                          setApprovalRequiredAbove(r.approval_required_above);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Rule' : 'Create Discount Rule'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Tier</label>
            <select
              value={customerTier}
              onChange={(e) => setCustomerTier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="BRONZE">BRONZE</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={maxDiscountPercent}
                onChange={(e) => setMaxDiscountPercent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Approval Above %</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={approvalRequiredAbove}
                onChange={(e) => setApprovalRequiredAbove(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
