import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CrowdMeter } from '../../components/crowd/CrowdMeter';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  Users, BookOpen, CreditCard, ShieldCheck, Activity, 
  ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, Layers, Settings 
} from 'lucide-react';

export function AdminDashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const res = await api.get('/admin/metrics');
      if (res.success) {
        setMetrics(res.metrics || res);
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-[#161F30] text-white p-6 sm:p-8 shadow-2xl border border-[#233044] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              System Administration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Executive University Library Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            System-wide circulation metrics, budget procurement approvals, user governance, and security logs
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => onNavigate('admin-approvals')}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Procurement Approvals ({metrics?.pending_procurements || metrics?.pending_book_requests || 0})</span>
          </button>
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics?.total_users || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Students ({metrics?.total_students || 0}), Faculty & Staff</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Catalog Collection</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {metrics?.total_copies || 0} <span className="text-xs text-slate-400 font-normal">copies</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across {metrics?.total_titles || metrics?.total_books || 0} unique titles</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Book Loans</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-emerald-500">
              {metrics?.active_loans || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{metrics?.overdue_loans || 0} overdue items</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Approvals</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-rose-500">
              {metrics?.pending_procurements || metrics?.pending_book_requests || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Book procurement requests</p>
          </div>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div 
          onClick={() => onNavigate('admin-approvals')}
          className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500 shadow-xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-500 transition-colors">
              Procurement & Acquisition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Review HOD-approved student book acquisition requests and grant procurement authorizations into the catalog.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 pt-2">
            <span>Review Requests ({metrics?.pending_procurements || 0})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('admin-users')}
          className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500 shadow-xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-500 transition-colors">
              User Directory & Roles
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Manage accounts for {metrics?.total_users || 0} registered scholars, staff, and faculty across all academic departments.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-500 pt-2">
            <span>Manage User Directory</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('admin-audit')}
          className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500 shadow-xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-500 transition-colors">
              Security & Audit Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Immutable audit trails tracking book borrow operations, fine clearances, role updates, and system events.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 pt-2">
            <span>View Activity Stream</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
}
