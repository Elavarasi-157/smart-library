import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CrowdMeter } from '../../components/crowd/CrowdMeter';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  BookOpen, Users, AlertTriangle, MessageSquareText, CheckSquare, 
  ArrowRight, ShieldCheck, Clock, CheckCircle2, RotateCw 
} from 'lucide-react';

export function LibrarianDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await api.get('/admin/librarian-metrics');
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      console.error('Failed to load librarian metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Circulation Desk & Librarian Operations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time physical copy tracking, book issue/return desk, missing book inquiries, and turnstile monitoring
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Borrowings</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{stats?.active_loans_count || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Checked out by students</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Overdue Loans</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-rose-600">{stats?.overdue_loans_count || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Accruing ₹1/day fine</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Missing / Damaged</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-amber-600">{stats?.missing_damaged_copies_count || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Copies under inspection</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Open Student Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquareText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-purple-600">{stats?.open_tickets_count || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting librarian response</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Live Queue & Operations Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Quick Circulation Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Circulation Desk Workflows</h3>
              <span className="text-xs text-sky-600 font-bold">Standard Rules Enforced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => onNavigate('issue-return')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Issue / Return Book</h4>
                <p className="text-xs text-slate-500">
                  Scan barcode, enforce student max 4-books limit, check unpaid fines, assess copy condition on return.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('inventory')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Inventory & Shelf Locations</h4>
                <p className="text-xs text-slate-500">
                  Manage physical barcodes, update Rack & Shelf coordinates, update copy conditions.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('missing-books')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Missing Books Queue</h4>
                <p className="text-xs text-slate-500">
                  Investigate reports from students looking for misplaced books at specific rack locations.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('librarian-tickets')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Student Inquiries & Tickets</h4>
                <p className="text-xs text-slate-500">
                  Reply to 1-to-1 student inquiries, clarify fine questions, and update ticket resolution statuses.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Crowd Meter & Turnstile */}
        <div className="space-y-6">
          <CrowdMeter detailed />
        </div>

      </div>

    </div>
  );
}
