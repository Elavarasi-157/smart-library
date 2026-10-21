import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  BookOpen, CreditCard, Clock, AlertTriangle, Search, 
  RotateCw, FolderDown, Users, ArrowRight, UserCircle, 
  CheckCircle2, Sparkles, MapPin, GraduationCap 
} from 'lucide-react';

export function StudentDashboard({ onNavigate, onSelectBook }) {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [loansRes, finesRes] = await Promise.all([
        api.get('/borrow/my-books'),
        api.get('/fines/my-fines')
      ]);

      if (loansRes.success) setLoans(loansRes.loans || []);
      if (finesRes.success) setFines(finesRes.fines || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Real calculations only
  const totalUnpaidFines = fines
    .filter(f => f.status === 'UNPAID')
    .reduce((sum, f) => sum + (Number(f.fine_amount) || 0), 0);

  const dueSoonLoans = loans.filter(l => l.display_status === 'DUE_SOON');
  const overdueLoans = loans.filter(l => l.display_status === 'OVERDUE');

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      
      {/* Top Header Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Student Dashboard
        </h1>
      </div>

      {/* Student Profile Card + Metrics Banner matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 sm:p-7 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Avatar & Real Student Details */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-[#0B111E] border-2 border-amber-500/40 p-1 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner">
              {user?.name ? user.name.trim().split(/\s+/).map(n => n ? n[0] : '').filter(Boolean).join('').substring(0, 2).toUpperCase() : 'ST'}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
              {user?.name || 'Student'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div>Department: <strong className="text-slate-900 dark:text-slate-200">{user?.department_name || 'Information Technology'}</strong></div>
              <div>Year / Sem: <strong className="text-slate-900 dark:text-slate-200">{user?.year || 2}nd Year / {user?.semester || 4}th Sem</strong></div>
              <div className="sm:col-span-2">Email: <span className="font-mono text-amber-600 dark:text-amber-400">{user?.email}</span></div>
            </div>
          </div>
        </div>

        {/* Right: 4 Real Metrics Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
          
          {/* Books Issued */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-center flex flex-col items-center justify-center min-w-[90px]">
            <BookOpen className="w-4 h-4 text-amber-500 mb-1" />
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Books Issued</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{loans.length}</div>
          </div>

          {/* Fines */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-center flex flex-col items-center justify-center min-w-[90px]">
            <CreditCard className="w-4 h-4 text-amber-500 mb-1" />
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Fines</div>
            <div className={`text-xl font-black ${totalUnpaidFines > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}`}>
              ₹{totalUnpaidFines}
            </div>
          </div>

          {/* Due Soon */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-center flex flex-col items-center justify-center min-w-[90px]">
            <Clock className="w-4 h-4 text-amber-500 mb-1" />
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Due Soon</div>
            <div className="text-xl font-black text-amber-500">{dueSoonLoans.length}</div>
          </div>

          {/* Overdue */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-center flex flex-col items-center justify-center min-w-[90px]">
            <AlertTriangle className={`w-4 h-4 mb-1 ${overdueLoans.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Overdue</div>
            <div className={`text-xl font-black ${overdueLoans.length > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'}`}>
              {overdueLoans.length}
            </div>
          </div>

        </div>

      </div>

      {/* Currently Issued Books Table Card */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            Currently Issued Books
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('my-books')}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#233044] text-slate-400 font-bold">
                <th className="pb-3 pr-4">Book</th>
                <th className="pb-3 px-4">Author</th>
                <th className="pb-3 px-4">Issue Date</th>
                <th className="pb-3 px-4">Due Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#233044]/60 font-medium text-slate-800 dark:text-slate-200">
              
              {loans.length > 0 ? (
                loans.map(loan => (
                  <tr key={loan.transaction_id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-slate-100">{loan.title}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{loan.author}</td>
                    <td className="py-3.5 px-4">{loan.borrowed_date ? loan.borrowed_date.split(/[T ]/)[0] : 'N/A'}</td>
                    <td className="py-3.5 px-4">{loan.due_date ? loan.due_date.split(/[T ]/)[0] : 'N/A'}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <StatusBadge status={loan.display_status || 'ACTIVE'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                    <p className="font-bold text-xs text-slate-300">You have no books currently issued.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Search the catalog to discover textbooks and borrow at the library desk.</p>
                    <button 
                      type="button"
                      onClick={() => onNavigate('search')} 
                      className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                    >
                      Search Books
                    </button>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>

      {/* Bottom 4 Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Search Books */}
        <div 
          onClick={() => onNavigate('search')}
          className="p-5 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all duration-200 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
              Search Books
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Find books in library
            </p>
          </div>
        </div>

        {/* Card 2: My Renewals */}
        <div 
          onClick={() => onNavigate('my-books')}
          className="p-5 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all duration-200 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
              My Renewals
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Renew issued books
            </p>
          </div>
        </div>

        {/* Card 3: Resources */}
        <div 
          onClick={() => onNavigate('resources')}
          className="p-5 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all duration-200 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
            <FolderDown className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
              Resources
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Notes, Papers & More
            </p>
          </div>
        </div>

        {/* Card 4: Crowd Status */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="p-5 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all duration-200 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
              Crowd Status
            </h4>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Moderate (45%)
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
