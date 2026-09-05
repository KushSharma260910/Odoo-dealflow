import React, { useEffect, useState } from 'react';
import { customerService } from '../../services/customer.service';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Trash2, Edit } from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tier, setTier] = useState('BRONZE');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.list();
      if (res.success) setCustomers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setCompanyName('');
    setTier('BRONZE');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email || '');
    setCompanyName(c.company_name || '');
    setTier(c.tier || 'BRONZE');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerService.update(editingId, {
          name,
          email,
          company_name: companyName,
          tier,
        });
      } else {
        await customerService.create({
          name,
          email,
          company_name: companyName,
          tier,
        });
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate customer account?')) return;
    try {
      await customerService.remove(id);
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading customer accounts..." />;

  const filtered = customers.filter(
    (c) => [c.name, c.email, c.company_name, c.tier, c.status]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Customer Accounts</h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200">
              {customers.length} Customers Total
            </span>
          </div>
          <p className="text-sm text-gray-500">Manage B2B customer profiles and pricing tiers</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Email, Company..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-gray-500">
          Showing {paginated.length} of {filtered.length} customers
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState title="No customer accounts" message={search ? 'No customer accounts match your search query.' : 'No customer accounts exist yet.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Customer Tier</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-gray-700">{c.company_name || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{c.email || '—'}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-700">{c.tier} TIER</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Customer' : 'Create Customer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="BRONZE">BRONZE (Standard)</option>
              <option value="SILVER">SILVER (Silver Preferred)</option>
              <option value="GOLD">GOLD (Gold Partner)</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Save Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
