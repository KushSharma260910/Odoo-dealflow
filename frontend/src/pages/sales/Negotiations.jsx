import React, { useEffect, useState } from 'react';
import { negotiationService } from '../../services/negotiation.service';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { MessageSquare, Send, CheckCircle, XCircle, Filter, Search, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Negotiations = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Chat Thread Modal
  const [activeNegotiation, setActiveNegotiation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lineRequests, setLineRequests] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const res = await negotiationService.list();
      if (res.success) {
        setNegotiations(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (neg) => {
    try {
      setChatLoading(true);
      setActiveNegotiation(neg);
      const res = await negotiationService.get(neg.id);
      if (res.success) {
        setActiveNegotiation(res.data);
        setMessages(res.data.messages || []);
        setLineRequests(res.data.line_requests || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeNegotiation) return;
    try {
      setSending(true);
      const res = await negotiationService.addMessage(activeNegotiation.id, newMessage.trim());
      if (res.success) {
        setNewMessage('');
        const refresh = await negotiationService.get(activeNegotiation.id);
        if (refresh.success) {
          setMessages(refresh.data.messages || []);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleRespondStatus = async (status) => {
    if (!activeNegotiation) return;
    try {
      setStatusActionLoading(true);
      await negotiationService.respond(activeNegotiation.id, { status });
      const refresh = await negotiationService.get(activeNegotiation.id);
      if (refresh.success) {
        setActiveNegotiation(refresh.data);
      }
      fetchNegotiations();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading deal negotiations..." />;

  const filtered = negotiations.filter((n) => {
    const haystack = [
      `neg-${n.id}`,
      `qt-${n.quotation_id}`,
      n.customer_name,
      n.status
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Deal Negotiations</h1>
          <p className="text-sm text-gray-500">Live discussion channels and proposal discount reviews</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Customer, Quotation #..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState
          title="No negotiation channels"
          message="No active customer negotiations match your filter query."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Negotiation ID</th>
                  <th className="px-6 py-3.5">Quotation</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5 text-right">Proposed Discount</th>
                  <th className="px-6 py-3.5 text-right">Proposed Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((neg) => (
                  <tr key={neg.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">#NEG-{neg.id}</td>
                    <td className="px-6 py-4">
                      <Link to={`/sales/quotations/${neg.quotation_id}`} className="font-semibold text-blue-600 hover:underline">
                        #QT-{neg.quotation_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{neg.customer_name}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-purple-700">
                      {neg.proposed_discount_percent ? `${Number(neg.proposed_discount_percent).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {neg.proposed_total ? `$${Number(neg.proposed_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={neg.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenChat(neg)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Discussion</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discussion Thread & Negotiation Dialog Modal */}
      <Modal
        isOpen={!!activeNegotiation}
        onClose={() => setActiveNegotiation(null)}
        title={`Customer Discussion Channel #NEG-${activeNegotiation?.id} (Quotation #QT-${activeNegotiation?.quotation_id})`}
      >
        {chatLoading ? (
          <LoadingSpinner label="Loading thread messages..." />
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Customer Account</span>
                <p className="text-sm font-bold text-gray-900">{activeNegotiation?.customer_name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium">Negotiation Status</span>
                <div><StatusBadge status={activeNegotiation?.status || 'OPEN'} /></div>
              </div>
            </div>

            {/* Negotiation Line Item Requests */}
            {lineRequests.length > 0 && (
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-3 space-y-2">
                <span className="text-xs font-bold text-purple-900 uppercase">Customer Line Item Adjustment Requests</span>
                <div className="space-y-1">
                  {lineRequests.map((lr) => (
                    <div key={lr.id} className="text-xs bg-white p-2 rounded border border-purple-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">{lr.product_name}:</span>{' '}
                        <span className="text-purple-700 font-medium">{lr.request_type} ({lr.requested_discount_percent ? `${lr.requested_discount_percent}% disc` : `${lr.requested_quantity} qty`})</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">{lr.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Thread Box */}
            <div className="bg-slate-900 rounded-xl p-4 h-64 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-xs">No chat history recorded yet.</div>
              ) : (
                messages.map((msg) => {
                  const isRep = msg.sender_user_id === user?.id || msg.sender_role !== 'CUSTOMER';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isRep ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {msg.sender_name || (isRep ? 'Sales Representative' : 'Customer')} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`max-w-xs rounded-xl px-3 py-2 text-xs font-medium shadow-sm ${isRep ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type response to customer..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 inline-flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            {/* Decision Toolbar */}
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Negotiation Decisions</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRespondStatus('ACCEPTED')}
                  disabled={statusActionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Accept Proposal</span>
                </button>
                <button
                  onClick={() => handleRespondStatus('REJECTED')}
                  disabled={statusActionLoading}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
