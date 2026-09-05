import React, { useEffect, useState } from 'react';
import { productService } from '../../services/product.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Trash2, Edit } from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [basePrice, setBasePrice] = useState(100);
  const [costPrice, setCostPrice] = useState(60);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.list();
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setCategoryId(1);
    setBasePrice(100);
    setCostPrice(60);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.category_id || 1);
    setBasePrice(p.base_price);
    setCostPrice(p.cost_price);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productService.update(editingId, {
          name,
          sku,
          category_id: Number(categoryId),
          base_price: Number(basePrice),
          cost_price: Number(costPrice),
        });
      } else {
        await productService.create({
          name,
          sku,
          category_id: Number(categoryId),
          base_price: Number(basePrice),
          cost_price: Number(costPrice),
        });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate product?')) return;
    try {
      await productService.remove(id);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading product catalog..." />;

  const filtered = products.filter(
    (p) => {
      const haystack = [p.name, p.sku, p.description, p.category_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || String(p.category_id) === categoryFilter;
      return matchesSearch && matchesCategory;
    }
  );
  const categories = [...new Map(products.filter((p) => p.category_id != null).map((p) => [String(p.category_id), p.category_name || `Category #${p.category_id}`])).entries()];

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              {products.length} Products Total
            </span>
          </div>
          <p className="text-sm text-gray-500">Configure products, base prices, costs, and categories</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Product Name or SKU..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          {(search || categoryFilter !== 'ALL') && (
            <button type="button" onClick={() => { setSearch(''); setCategoryFilter('ALL'); }} className="text-sm text-blue-600 font-semibold px-2">
              Reset
            </button>
          )}
        </div>
        <div className="text-xs font-semibold text-gray-500">
          Showing {paginated.length} of {filtered.length} products
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {filtered.length === 0 ? (
          <EmptyState title="No products found" message={search || categoryFilter !== 'ALL' ? 'No products match the current filters.' : 'No products have been configured yet.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Base Price</th>
                  <th className="px-6 py-3.5 text-right">Cost Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">{p.sku}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-medium text-purple-700">{p.category_name || `Category #${p.category_id}`}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">${Number(p.base_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">${Number(p.cost_price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Create Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SKU Code *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Base Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cost Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
