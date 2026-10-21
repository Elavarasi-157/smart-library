import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  MessageSquareText, Send, CheckCircle2, AlertCircle, 
  User, Bot, Clock, HelpCircle, ShieldCheck 
} from 'lucide-react';

export function LibrarianTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

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
      if (res.success) {
        setTickets(res.tickets || []);
        if (res.tickets?.length > 0 && !activeTicket) {
          setActiveTicket(res.tickets[0]);
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
      if (res.success) {
        setTicketMessages(res.ticket?.messages || res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load ticket conversation:', err);
    }
  }

  async function handleSendReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/tickets/${activeTicket.id}/reply`, {
        message: replyText.trim()
      });
      if (res.success) {
        setReplyText('');
        await fetchTicketDetails(activeTicket.id);
        await fetchTickets();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to send reply.' });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleUpdateStatus(newStatus) {
    if (!activeTicket) return;
    try {
      const res = await api.put(`/tickets/${activeTicket.id}/status`, { status: newStatus });
      if (res.success) {
        setActionMessage({ type: 'success', text: `Inquiry status updated to ${newStatus}` });
        setActiveTicket({ ...activeTicket, status: newStatus });
        await fetchTickets();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update ticket status.' });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Student Support & Circulation Inquiries
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Respond to student ticket threads, address missing book investigations, and resolve inquiries
        </p>
      </div>

      {/* Action Notification */}
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

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Tickets List */}
        <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-4 shadow-xl space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm px-2">Support Queue ({tickets.length})</h3>

          {loading ? (
            <p className="text-xs text-slate-400 p-4 text-center">Loading inquiry queue...</p>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p>No active student inquiries.</p>
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
                      <span className="text-[10px] text-slate-400">{t.student_name || 'Student'}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{t.subject}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.description || t.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Message Thread */}
        <div className="md:col-span-2 bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
          {activeTicket ? (
            <div className="flex flex-col h-full space-y-4 justify-between">
              
              {/* Ticket Controls Header */}
              <div className="border-b border-slate-100 dark:border-[#233044] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={activeTicket.status} />
                    <span className="text-xs font-mono text-slate-400">#{activeTicket.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1">{activeTicket.subject}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Student: <strong className="text-slate-800 dark:text-slate-200">{activeTicket.student_name || 'Student'}</strong> ({activeTicket.student_email || activeTicket.student_id_code || ''})
                  </p>
                </div>

                {/* Status Updater */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_STUDENT">WAITING FOR STUDENT</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-72">
                {ticketMessages.map(msg => {
                  const isMe = msg.sender_id === user?.id || msg.sender_role === 'LIBRARIAN';

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
                          {msg.sender_name} ({msg.sender_role})
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
                  placeholder="Type official reply to student..."
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
              <p className="text-slate-500">Select an inquiry from the support queue on the left to review and respond.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
