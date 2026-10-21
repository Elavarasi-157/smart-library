import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CalendarSyncButton } from '../../components/calendar/CalendarSyncButton';
import { 
  RotateCw, BookOpen, Clock, AlertCircle, CheckCircle2, 
  Bookmark, AlertTriangle, ArrowRight, ShieldAlert 
} from 'lucide-react';

export function MyBooksPage({ onNavigate }) {
  const [loans, setLoans] = useState([]);
  const [renewalHistory, setRenewalHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('issued');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMyBooksData();
  }, []);

  async function fetchMyBooksData() {
    setLoading(true);
    try {
      const [loansRes, historyRes, resRes] = await Promise.all([
        api.get('/borrow/my-books'),
        api.get('/borrow/renewal-history'),
        api.get('/books/my-reservations')
      ]);

      if (loansRes.success) setLoans(loansRes.loans || []);
      if (historyRes.success) setRenewalHistory(historyRes.history || []);
      if (resRes.success) setReservations(resRes.reservations || []);
    } catch (err) {
      console.error('Failed to load books data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRenew(transactionId) {
    setProcessingId(transactionId);
    try {
      const res = await api.post(`/borrow/renew/${transactionId}`);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        await fetchMyBooksData();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Renewal failed.' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancelReservation(resId) {
    try {
      const res = await api.delete(`/books/reservations/${resId}`);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Reservation cancelled successfully.' });
        await fetchMyBooksData();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel reservation.' });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          My Books & Renewals
        </h1>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top ${
          actionMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Main Table Card matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 sm:p-7 shadow-xl space-y-5">
        
        {/* 3 Tabs: Issued Books | Renewal History | Reservations */}
        <div className="flex border-b border-slate-200 dark:border-[#233044] gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('issued')}
            className={`pb-3 transition-colors relative ${activeTab === 'issued' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>Issued Books</span>
            {activeTab === 'issued' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-full" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 transition-colors relative ${activeTab === 'history' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>Renewal History</span>
            {activeTab === 'history' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-full" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 transition-colors relative ${activeTab === 'reservations' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>Reservations</span>
            {activeTab === 'reservations' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-full" />}
          </button>
        </div>

        {/* Tab 1: Issued Books Table */}
        {activeTab === 'issued' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#233044] text-slate-400 font-bold">
                  <th className="pb-3 pr-4">Book</th>
                  <th className="pb-3 px-4">Issue Date</th>
                  <th className="pb-3 px-4">Due Date</th>
                  <th className="pb-3 px-4 text-center">Renewals</th>
                  <th className="pb-3 px-4 text-center">Fine</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#233044]/60 font-medium">
                
                {loans.length > 0 ? (
                  loans.map(loan => (
                    <tr key={loan.transaction_id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{loan.title}</div>
                        <div className="text-[11px] text-slate-400">By {loan.author} (Copy: <span className="font-mono">{loan.copy_id}</span>)</div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{loan.borrowed_date ? loan.borrowed_date.split(/[T ]/)[0] : '12 May 2025'}</td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{loan.due_date ? loan.due_date.split(/[T ]/)[0] : '26 May 2025'}</td>
                      <td className="py-4 px-4 text-center font-mono text-slate-500 dark:text-slate-400">{loan.renewal_count || 0}/2</td>
                      <td className="py-4 px-4 text-center font-bold text-amber-500">₹{loan.fine_amount || 0}</td>
                      <td className="py-4 pl-4 text-right">
                        {loan.is_renewable ? (
                          <button
                            type="button"
                            disabled={processingId === loan.transaction_id}
                            onClick={() => handleRenew(loan.transaction_id)}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                          >
                            {processingId === loan.transaction_id ? 'Renewing...' : 'Renew'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {loan.renewal_blocked_reason || 'Max renewals'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                      <p className="font-bold text-xs text-slate-300">No books currently borrowed.</p>
                      <p className="text-[11px] text-slate-500 mt-1">You can borrow up to 4 books at the MIT Library circulation counter.</p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Renewal History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {renewalHistory.length > 0 ? (
              renewalHistory.map(h => (
                <div key={h.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{h.title}</div>
                    <div className="text-slate-400">Previous: {h.previous_due_date?.split('T')[0]} → New: {h.new_due_date?.split('T')[0]}</div>
                  </div>
                  <span className="text-emerald-500 font-bold">+14 Days Extended</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No previous renewal records found.</p>
            )}
          </div>
        )}

        {/* Tab 3: Reservations */}
        {activeTab === 'reservations' && (
          <div className="space-y-3">
            {reservations.length > 0 ? (
              reservations.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{r.title}</div>
                    <div className="text-slate-400">Copy Held: <span className="font-mono text-amber-500">{r.copy_id || 'At Desk'}</span> • Queue #{r.queue_position || 1}</div>
                  </div>
                  <button
                    onClick={() => handleCancelReservation(r.id)}
                    className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No active book reservations.</p>
            )}
          </div>
        )}

        {/* Notice Footer matching screenshot */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>You can renew each book up to 2 times if no reservations exist.</span>
        </div>

      </div>

    </div>
  );
}
