import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerPortalService } from '../../services/customerPortal.service';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ArrowLeft, Send, MessageSquare, CheckCircle } from 'lucide-react';

export const Negotiation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [negotiation, setNegotiation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.negotiations(id);
      if (res.success) {
        setNegotiation(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      setSending(true);
      const res = await customerPortalService.message(id, newMessage.trim());
      if (res.success) {
        setNewMessage('');
        fetchThread();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading negotiation thread..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/customer')}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposal Negotiation Thread</h1>
          <p className="text-sm text-gray-500">Quotation #QT-{negotiation?.quotation_id || id}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}

      {/* Chat Messages Window */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-900">Direct Discussion Channel</span>
          </div>
          <StatusBadge status={negotiation?.status || 'OPEN'} />
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              No messages exchanged yet. Type a question or counter-proposal below.
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_user_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-xs text-gray-400 mb-1 px-1">
                    {msg.sender_name || (isMine ? 'You' : 'Sales Representative')} •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex items-center space-x-3">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type counter-proposal or message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
