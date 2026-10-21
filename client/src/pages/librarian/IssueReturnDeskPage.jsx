import React, { useState } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShelfLocationBadge } from '../../components/common/ShelfLocationBadge';
import { 
  BookOpen, CheckCircle2, AlertCircle, ArrowRight, 
  RotateCw, UserCheck, Search, ShieldAlert, Sparkles, Layers 
} from 'lucide-react';

export function IssueReturnDeskPage() {
  const [activeTab, setActiveTab] = useState('ISSUE'); // 'ISSUE' | 'RETURN'
  const [actionMessage, setActionMessage] = useState(null);

  // Issue Form State
  const [issueData, setIssueData] = useState({
    student_id: 'STU2024001',
    copy_id: 'DBMS-002',
    loan_days: 14
  });
  const [issuing, setIssuing] = useState(false);

  // Return Form State
  const [returnData, setReturnData] = useState({
    copy_id: 'DBMS-001',
    condition_on_return: 'GOOD',
    notes: 'Returned in good academic condition.'
  });
  const [returning, setReturning] = useState(false);

  async function handleIssueSubmit(e) {
    e.preventDefault();
    if (!issueData.student_id.trim() || !issueData.copy_id.trim()) return;

    setIssuing(true);
    setActionMessage(null);
    try {
      const res = await api.post('/borrow/issue', issueData);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Book issue rejected.' });
    } finally {
      setIssuing(false);
    }
  }

  async function handleReturnSubmit(e) {
    e.preventDefault();
    if (!returnData.copy_id.trim()) return;

    setReturning(true);
    setActionMessage(null);
    try {
      const res = await api.post('/borrow/return', returnData);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `${res.message} (Overdue Fine Calculated: ₹${res.fine_amount || 0})`
        });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Book return failed.' });
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Circulation Desk: Book Issue & Return</h2>
        <p className="text-xs text-slate-500 mt-1">
          Strict enforcement of max 4 books per student, 14-day standard borrowing period, and ₹1/day overdue fine calculation
        </p>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-200/60 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => { setActiveTab('ISSUE'); setActionMessage(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ISSUE'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Issue Book (Check-Out)
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('RETURN'); setActionMessage(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'RETURN'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Return Book (Check-In)
        </button>
      </div>

      {/* Issue Book Panel */}
      {activeTab === 'ISSUE' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Issue Book to Student</h3>
              <p className="text-xs text-slate-500">Enforces student max limit of 4 active loans and checks pending fines</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-100">
              Loan Term: 14 Days
            </span>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Institutional ID *
                </label>
                <input
                  type="text"
                  required
                  value={issueData.student_id}
                  onChange={(e) => setIssueData({ ...issueData, student_id: e.target.value })}
                  placeholder="e.g. STU2024001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Sample: STU2024001, STU2024002, STU2024003</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Copy Barcode / ID *
                </label>
                <input
                  type="text"
                  required
                  value={issueData.copy_id}
                  onChange={(e) => setIssueData({ ...issueData, copy_id: e.target.value })}
                  placeholder="e.g. DBMS-002, OS-002, CN-002"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Copy barcode scanned from book spine</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Loan Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={issueData.loan_days}
                onChange={(e) => setIssueData({ ...issueData, loan_days: Number(e.target.value) })}
                className="w-48 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={issuing}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {issuing ? 'Verifying & Issuing...' : 'Authorize Book Issue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return Book Panel */}
      {activeTab === 'RETURN' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Return Book from Student</h3>
              <p className="text-xs text-slate-500">Calculates overdue fine at ₹1/day and updates physical copy status</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
              Condition Assessment
            </span>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Copy Barcode / ID *
                </label>
                <input
                  type="text"
                  required
                  value={returnData.copy_id}
                  onChange={(e) => setReturnData({ ...returnData, copy_id: e.target.value })}
                  placeholder="e.g. DBMS-001, OS-001, CN-001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Condition on Return *
                </label>
                <select
                  value={returnData.condition_on_return}
                  onChange={(e) => setReturnData({ ...returnData, condition_on_return: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="GOOD">Good / Excellent Condition</option>
                  <option value="FAIR">Fair (Normal Academic Wear)</option>
                  <option value="DAMAGED">Damaged (Requires Repair / Fine)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Librarian Return Inspection Notes
              </label>
              <textarea
                rows={2}
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={returning}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                {returning ? 'Processing Return...' : 'Process Return & Settle Status'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
