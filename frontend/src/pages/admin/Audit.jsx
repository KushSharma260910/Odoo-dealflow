import React, { useEffect, useState } from 'react';
import { auditService } from '../../services/audit.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';

export const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.list();
      if (res.success) setLogs(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading platform audit logs..." />;

  const filtered = logs.filter(
    (l) =>
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
          <p className="text-sm text-gray-500">Immutable platform log of changes and user actions</p>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Action or Entity Type..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState title={search ? 'No matching audit logs' : 'No audit logs recorded'} message={search ? 'No platform action logs match your filter.' : 'No platform action logs have been recorded yet.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">User ID</th>
                  <th className="px-6 py-3.5">Entity</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 font-mono text-xs">
                    <td className="px-6 py-4 font-bold text-gray-900">#{l.id}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-purple-700">{l.user_id ? `User #${l.user_id}` : 'System'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{l.entity_type} #{l.entity_id}</td>
                    <td className="px-6 py-4 font-bold text-blue-700">{l.action}</td>
                    <td className="px-6 py-4 text-gray-400">{l.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
