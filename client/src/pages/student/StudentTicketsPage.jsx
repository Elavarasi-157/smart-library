import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  MessageSquareText, PlusCircle, Send, CheckCircle2, 
  AlertCircle, Bot, User, Clock, AlertTriangle, HelpCircle 
} from 'lucide-react';

export function StudentTicketsPage({ initialMissingBook = null }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New Ticket Form State
  const [showCreateModal, setShowCreateModal] = useState(!!initialMissingBook);
  const [formData, setFormData] = useState({
    subject: initialMissingBook ? `Missing Book Report: ${initialMissingBook.title}` : '',
    category: initialMissingBook ? 'MISSING_BOOK' : 'GENERAL_QUERY',
    priority: initialMissingBook ? 'HIGH' : 'MEDIUM',
    book_id: initialMissingBook ? initialMissingBook.id : '',
    message: initialMissingBook ? `I was looking for '${initialMissingBook.title}' at Rack A12, Shelf 4 but the physical copy was not present on the shelf.` : ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTicket && activeTicket.id) {
      fetchTicketDetails(activeTicket.id);
    }
  }, [activeTicket]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await api.get('/tickets');
      if (res && res.success) {
        const list = res.tickets || [];
        setTickets(list);
        if (list.length > 0 && !activeTicket) {
          setActiveTicket(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTicketDetails(ticketId) {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res && res.success) {
        setTicketMessages(res.ticket?.messages || res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load ticket messages:', err);
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    try {
      const payload = {
        subject: formData.subject.trim(),
        category: formData.category || 'GENERAL_QUERY',
        priority: formData.priority || 'MEDIUM',
        book_id: formData.book_id || null,
        description: formData.message.trim(),
        message: formData.message.trim()
      };

      const res = await api.post('/tickets/create', payload);
      if (res && (res.success || res.ticketId)) {
        setActionMessage({ type: 'success', text: res.message || 'Inquiry ticket submitted successfully! The librarian desk has received it.' });
        setShowCreateModal(false);
        setFormData({
          subject: '',
          category: 'GENERAL_QUERY',
          priority: 'MEDIUM',
          book_id: '',
          message: ''
        });

        // Safely refresh list
        try {
          const listRes = await api.get('/tickets');
          if (listRes && listRes.success) {
            const freshList = listRes.tickets || [];
            setTickets(freshList);
            const createdTicket = freshList.find(t => t.id === res.ticketId) || freshList[0];
            if (createdTicket) {
              setActiveTicket(createdTicket);
            }
          }
        } catch (listErr) {
          console.warn('Could not refresh tickets list immediately:', listErr);
        }
      } else {
        setActionMessage({ type: 'error', text: res?.message || 'Failed to submit inquiry.' });
      }
    } catch (err) {
      console.error('Ticket creation error:', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to create ticket.' });
    }
  }

  async function handleSendReply(e) {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/tickets/${activeTicket.id}/reply`, { message: replyText.trim() });
      if (res && res.success) {
        setReplyText('');
        await fetchTicketDetails(activeTicket.id);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to send reply.' });
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Student Support & Inquiries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct communication channel with MIT Library circulation desk and missing shelf reports
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise New Inquiry</span>
        </button>
      </div>

      {/* Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          actionMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Main Conversation Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Tickets Queue */}
        <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-4 shadow-xl space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm px-2">Your Inquiries ({tickets.length})</h3>

          {loading ? (
            <p className="text-xs text-slate-400 p-4 text-center">Loading inquiries...</p>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p>No active inquiries.</p>
              <p className="text-[11px] text-slate-500">Need help finding a book or reporting an issue? Click 'Raise New Inquiry'.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {tickets.map(t => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B] border-slate-100 dark:border-[#233044]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <StatusBadge status={t.status} className="text-[9px]" />
                      <span className="text-[10px] text-slate-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>#{t.id}</span>
                      <span className="font-semibold text-amber-500">{t.priority}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Live Message Thread */}
        <div className="md:col-span-2 bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
          {activeTicket ? (
            <div className="flex flex-col h-full space-y-4 justify-between">
              
              {/* Ticket Header */}
              <div className="border-b border-slate-100 dark:border-[#233044] pb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={activeTicket.status} />
                    <span className="text-xs font-mono text-slate-400">Inquiry #{activeTicket.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1">{activeTicket.subject}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B111E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#233044]">
                  {activeTicket.category ? activeTicket.category.replace(/_/g, ' ') : 'General'}
                </span>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-72">
                {ticketMessages.map(msg => {
                  const isMe = msg.sender_id === user?.id || msg.sender_role === 'STUDENT';

                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isMe ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-white'
                      }`}>
                        {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-sm' 
                          : 'bg-slate-100 dark:bg-[#0B111E] text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-[#233044]'
                      }`}>
                        <div className="font-bold text-[11px] mb-0.5 opacity-80">
                          {msg.sender_name || (isMe ? user?.name : 'Librarian')} ({msg.sender_role})
                        </div>
                        <p>{msg.message}</p>
                        <div className="text-[10px] opacity-60 text-right mt-1">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 dark:border-[#233044] flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message to the librarian..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-16 space-y-2">
              <MessageSquareText className="w-10 h-10 text-slate-500 opacity-60" />
              <p className="font-bold text-slate-300">No inquiry selected</p>
              <p className="text-slate-500">Raise an inquiry or select one from the list to view the conversation thread.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Ticket Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Raise Ticket / Missing Book Report" maxWidth="max-w-xl">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject / Summary *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Missing Book Report / Renewal Query"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="GENERAL_QUERY">General Query</option>
                <option value="MISSING_BOOK">Missing Book on Shelf</option>
                <option value="RENEWAL_ISSUE">Renewal Assistance</option>
                <option value="FINE_DISPUTE">Fine Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Message *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your inquiry or the missing book shelf details..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            >
              Submit Inquiry
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
