import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Search, BookOpen, FolderDown, UserCircle, ShieldCheck, QrCode } from 'lucide-react';

export function MobileBottomNav({ activePage, setActivePage }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const studentNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'my-books', label: 'My Books', icon: BookOpen, badge: user.currently_borrowed_count ? `${user.currently_borrowed_count}` : null },
    { id: 'resources', label: 'Resources', icon: FolderDown },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const staffNav = [
    { id: role === 'ADMIN' ? 'admin-dashboard' : (role === 'HOD' ? 'hod-dashboard' : 'librarian-dashboard'), label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issue-return', label: 'Desk', icon: BookOpen },
    { id: 'crowd-management', label: 'QR Gate', icon: QrCode },
    { id: role === 'HOD' ? 'hod-requests' : (role === 'ADMIN' ? 'admin-approvals' : 'missing-books'), label: 'Approvals', icon: ShieldCheck },
    { id: 'profile', label: 'Account', icon: UserCircle }
  ];

  const items = role === 'STUDENT' ? studentNav : staffNav;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#233044] px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive ? 'text-amber-500 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
