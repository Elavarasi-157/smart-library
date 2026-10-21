import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  GraduationCap, ShieldCheck, FolderDown, BookOpen, 
  ArrowRight, CheckCircle2, Clock, Users 
} from 'lucide-react';

export function HodDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const res = await api.get('/admin/hod-metrics');
      if (res.success) {
        setMetrics(res.metrics || res);
      }
    } catch (err) {
      console.error('Failed to load HOD metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Welcome Header */}
      <div className="rounded-3xl bg-[#161F30] text-white p-6 sm:p-8 shadow-2xl border border-[#233044] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Department Leadership Portal
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {user?.name} (Head of Department)
          </h2>
          <p className="text-xs text-slate-400">
            Managing academic curriculum, book procurement approvals, and study resources for <strong className="text-amber-400">{user?.department_name || 'Information Technology'}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('hod-requests')}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2 shrink-0 relative z-10"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Review Book Requests</span>
        </button>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Book Approvals</span>
            <div className="text-3xl font-black text-amber-500 mt-1">
              {metrics?.pending_book_requests || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting HOD syllabus sign-off</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Department Study Resources</span>
            <div className="text-3xl font-black text-emerald-500 mt-1">
              {metrics?.department_resources || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Approved notes and past papers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FolderDown className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <div className="text-3xl font-black text-sky-500 mt-1">
              {metrics?.department_students || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered in department</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div 
          onClick={() => onNavigate('hod-requests')}
          className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500 shadow-xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-500 transition-colors">
              Department Book Procurement Requests
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Verify undergraduate and elective book recommendations submitted by department students. Approved requests escalate directly to Administration for purchasing.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 pt-2">
            <span>View Pending Approvals ({metrics?.pending_book_requests || 0})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('resources')}
          className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500 shadow-xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FolderDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-500 transition-colors">
              Academic Resources & Study Repository
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Access syllabus-aligned semester lecture notes, previous university examination papers, and digital laboratory manuals.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 pt-2">
            <span>Browse Department Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
}
