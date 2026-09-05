import React, { useEffect, useState } from 'react';
import { warehouseService } from '../../services/warehouse.service';
import { productService } from '../../services/product.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Plus, Warehouse, Package, Edit, RefreshCw } from 'lucide-react';

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [stockList, setStockList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Create Warehouse Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState(1);

  // Stock Update Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(100);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, pRes] = await Promise.all([
        warehouseService.list(),
        productService.list(),
      ]);
      if (wRes.success) setWarehouses(wRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWarehouse = async (w) => {
    setSelectedWarehouse(w);
    try {
      const res = await warehouseService.stock(w.id);
      if (res.success) setStockList(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      const res = await warehouseService.create({
        name,
        location,
        shipping_priority: Number(priority),
      });
      if (res.success) {
        setCreateModalOpen(false);
        setName('');
        setLocation('');
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedWarehouse || !selectedProductId) return;
    try {
      const res = await warehouseService.updateStock(selectedWarehouse.id, {
        product_id: Number(selectedProductId),
        quantity: Number(quantity),
      });
      if (res.success) {
        setStockModalOpen(false);
        handleSelectWarehouse(selectedWarehouse);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading warehouse network & inventory..." />;
  const filteredWarehouses = warehouses.filter((w) => [w.name, w.location, w.status, w.shipping_priority]
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
    .includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Network</h1>
          <p className="text-sm text-gray-500">Stock inventory management & shipping priorities</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search warehouse name, location, or status..." className="w-full sm:w-96 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        {search && <button type="button" onClick={() => setSearch('')} className="text-sm text-blue-600 font-semibold">Reset</button>}
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredWarehouses.map((w) => {
          const isSelected = selectedWarehouse?.id === w.id;
          return (
            <div
              key={w.id}
              onClick={() => handleSelectWarehouse(w)}
              className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-100/50 rounded-lg text-blue-700">
                  <Warehouse className="w-6 h-6" />
                </div>
                <StatusBadge status={w.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-3">{w.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{w.location || 'No location set'}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-600">
                <span>Priority Weight:</span>
                <span className="font-bold text-blue-700">Priority #{w.shipping_priority}</span>
              </div>
            </div>
          );
        })}
      </div>
      {filteredWarehouses.length === 0 && <EmptyState title="No warehouses found" message={search ? 'No warehouses match your search.' : 'No warehouses are configured yet.'} />}

      {/* Selected Warehouse Stock Section */}
      {selectedWarehouse && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Inventory Stock: {selectedWarehouse.name}</h3>
              <p className="text-xs text-gray-500">Live quantity on hand and reserved stock</p>
            </div>
            <button
              onClick={() => setStockModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Package className="w-4 h-4" />
              <span>Update Stock</span>
            </button>
          </div>

          {stockList.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No inventory recorded for this warehouse.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Quantity On Hand</th>
                    <th className="px-4 py-3 text-right">Reserved Quantity</th>
                    <th className="px-4 py-3 text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockList.map((st) => {
                    const available = Number(st.quantity || 0) - Number(st.reserved_quantity || 0);
                    return (
                      <tr key={st.id}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{st.product_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{st.sku}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{st.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-600">{st.reserved_quantity}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600">{available}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Warehouse Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Warehouse">
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Warehouse Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Logistics Hub"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Building 4, West Region"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Shipping Priority (1 = Highest)</label>
            <input
              type="number"
              min="1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Save Warehouse
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} title={`Update Stock: ${selectedWarehouse?.name}`}>
        <form onSubmit={handleUpdateStock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock Quantity On Hand</label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
