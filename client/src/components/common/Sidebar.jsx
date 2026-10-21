import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, BookOpen, Search, FolderDown, CreditCard, 
  Ticket, Bell, UserCircle, Settings, LogOut, ShieldCheck, 
  CheckSquare, AlertTriangle, MessageSquareText, QrCode, BarChart3, FileText
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Student Navigation matching reference image exactly
  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-books', label: 'My Books', icon: BookOpen, badge: user.currently_borrowed_count ? `${user.currently_borrowed_count}/4` : null },
    { id: 'search', label: 'Search Books', icon: Search },
    { id: 'resources', label: 'Resources', icon: FolderDown },
    { id: 'fines', label: 'My Fines', icon: CreditCard, badge: user.outstanding_fine > 0 ? `₹${user.outstanding_fine}` : null, badgeColor: 'rose' },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'syllabus', label: 'Syllabus', icon: ShieldCheck },
    { id: 'book-requests', label: 'Book Requests', icon: MessageSquareText },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Librarian Navigation
  const librarianNav = [
    { id: 'librarian-dashboard', label: 'Circulation Desk', icon: LayoutDashboard },
    { id: 'issue-return', label: 'Issue & Return', icon: BookOpen },
    { id: 'inventory', label: 'Shelf Inventory', icon: CheckSquare },
    { id: 'missing-books', label: 'Missing Books', icon: AlertTriangle },
    { id: 'librarian-tickets', label: 'Student Inquiries', icon: MessageSquareText },
    { id: 'crowd-management', label: 'Gate QR Turnstile', icon: QrCode },
    { id: 'resources', label: 'Moderate Resources', icon: FolderDown },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  // HOD Navigation
  const hodNav = [
    { id: 'hod-dashboard', label: 'HOD Overview', icon: LayoutDashboard },
    { id: 'hod-requests', label: 'Book Approvals', icon: ShieldCheck },
    { id: 'hod-resources', label: 'Resource Approvals', icon: FolderDown },
    { id: 'syllabus', label: 'Department Syllabus', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  // Admin Navigation
  const adminNav = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: UserCircle },
    { id: 'admin-approvals', label: 'Procurement Approvals', icon: ShieldCheck },
    { id: 'library-settings', label: 'Library Settings', icon: Settings },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const navItems = role === 'ADMIN' 
    ? adminNav 
    : (role === 'HOD' ? hodNav : (role === 'LIBRARIAN' ? librarianNav : studentNav));

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-[#233044] min-h-[calc(100vh-4rem)] p-3.5 space-y-4 transition-colors">
      
      {/* Navigation Links */}
      <nav className="space-y-1 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#161F30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive 
                    ? 'bg-slate-950/20 text-slate-950' 
                    : (item.badgeColor === 'rose' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-100 dark:bg-[#161F30] text-slate-600 dark:text-slate-300')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout Button */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#233044]">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}
