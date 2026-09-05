import React, { useEffect, useState } from 'react';
import { warehouseService } from '../../services/warehouse.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Truck, CheckCircle2, RefreshCw } from 'lucide-react';

export const Fulfillment = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillment, setFulfillment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await warehouseService.listOrders();
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFulfillment = async (ord) => {
    setSelectedOrder(ord);
    try {
      const res = await warehouseService.fulfillmentStatus(ord.id);
      if (res.success) setFulfillment(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAllocate = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await warehouseService.allocate(orderId, []);
      if (res.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) handleInspectFulfillment(selectedOrder);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillStatus = async (orderId, status) => {
    try {
      setActionLoading(true);
      const res = await warehouseService.fulfill(orderId, { status });
      if (res.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) handleInspectFulfillment(selectedOrder);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading order fulfillment pipeline..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Fulfillment & Dispatch</h1>
        <p className="text-sm text-gray-500">Allocate warehouse inventory and manage order shipments</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {orders.length === 0 ? (
        <EmptyState
          title="No confirmed orders"
          message="No sales orders have been submitted for fulfillment yet."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Confirmed Sales Orders</h3>
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => handleInspectFulfillment(ord)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedOrder?.id === ord.id
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900">Order #ORD-{ord.id}</span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Customer: {ord.customer_name}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAllocate(ord.id);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Auto-Allocate Stock
                    </button>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(ord.confirmed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Order Fulfillment Breakdown */}
          {selectedOrder && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Fulfillment Status: #ORD-{selectedOrder.id}</h3>
                  <p className="text-xs text-gray-500">Warehouse splits and shipment tracking</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFulfillStatus(selectedOrder.id, 'SHIPPED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Mark Shipped
                  </button>
                  <button
                    onClick={() => handleFulfillStatus(selectedOrder.id, 'DELIVERED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>

              {fulfillment.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No warehouse allocations yet. Click "Auto-Allocate Stock" to reserve inventory.
                </p>
              ) : (
                <div className="space-y-3">
                  {fulfillment.map((f) => (
                    <div key={f.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-700">
                          Warehouse #{f.warehouse_id || 'BACKORDERED'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Requested: {f.requested_quantity} | Allocated: {f.allocated_quantity}
                        </div>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
