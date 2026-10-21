import React from 'react';

export function StatusBadge({ status, label, className = '' }) {
  const statusStyles = {
    // Books & Copies
    AVAILABLE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    ISSUED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    RESERVED: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    MISSING: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    DAMAGED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    MAINTENANCE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    LOST: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',

    // Borrowing & Due
    ACTIVE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    RETURNED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    DUE_SOON: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold',
    OVERDUE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold',

    // Approvals & Requests
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    NEED_INFO: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',

    // Fines
    UNPAID: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold',
    PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',

    // Tickets
    OPEN: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    WAITING_FOR_STUDENT: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    RESOLVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    CLOSED: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',

    // Roles
    STUDENT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    LIBRARIAN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    HOD: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  };

  const style = statusStyles[status] || 'bg-slate-100 dark:bg-[#161F30] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#233044]';
  const displayLabel = label || (status ? status.replace(/_/g, ' ') : 'N/A');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {displayLabel}
    </span>
  );
}
