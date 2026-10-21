import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { CrowdMeter } from '../crowd/CrowdMeter';
import { QrScannerModal } from '../crowd/QrScannerModal';
import { StatusBadge } from './StatusBadge';
import { 
  BookMarked, Search, Bell, Sparkles, LogOut, User, 
  Shield, CheckCircle2, ChevronDown, Sun, Moon, GraduationCap
} from 'lucide-react';

export function Navbar({ onOpenSearch, activePage, setActivePage, onToggleAi }) {
  const { user, logout, switchDemoUser } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotification();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#233044] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Left: MIT Emblem & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setActivePage(user?.role === 'ADMIN' ? 'admin-dashboard' : (user?.role === 'HOD' ? 'hod-dashboard' : (user?.role === 'LIBRARIAN' ? 'librarian-dashboard' : 'dashboard')))}
          >
            {/* MIT Seal Crest */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1 shadow-lg shadow-amber-500/25 shrink-0 border border-amber-300/80 flex items-center justify-center">
              <img src="/mit_logo.png" alt="MIT Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                  MIT Library
                </span>
                {user && (
                  <StatusBadge status={user.role} className="text-[10px] uppercase font-bold py-0" />
                )}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hidden sm:block">
                Madras Institute of Technology
              </p>
            </div>
          </div>

          {/* Center Search Input Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center gap-2.5 px-4 py-2 bg-slate-100 dark:bg-[#161F30] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-[#233044] text-xs font-medium transition-colors"
            >
              <Search className="w-4 h-4 text-amber-500" />
              <span className="truncate">Search DBMS, Tanenbaum, syllabus, rack location...</span>
              <kbd className="ml-auto text-[10px] bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] px-1.5 py-0.5 rounded text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Live Crowd Status Pill */}
            <div 
              onClick={() => setShowQrModal(true)}
              className="cursor-pointer hover:opacity-90 transition-opacity"
              title="Click to view Live Crowd Gate Turnstile"
            >
              <CrowdMeter compact />
            </div>

            {/* AI Assistant Right-Side Trigger */}
            <button
              type="button"
              onClick={onToggleAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161F30] border border-slate-200 dark:border-[#233044] transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Role Demo Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161F30] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#233044] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">Role</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#161F30] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233044] p-2 z-50 animate-in fade-in">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                    Switch MIT Role Perspective
                  </div>
                  {[
                    { role: 'STUDENT', label: '👨‍🎓 Student (Karthik R - IT)' },
                    { role: 'LIBRARIAN', label: '📚 Librarian (Meera Nair)' },
                    { role: 'HOD', label: '🎓 IT HOD (Dr. Ramesh)' },
                    { role: 'ADMIN', label: '⚙️ Admin (Dr. Arvind)' }
                  ].map(acc => (
                    <button
                      key={acc.role}
                      onClick={() => { switchDemoUser(acc.role); setShowDemoMenu(false); }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        user?.role === acc.role 
                          ? 'bg-amber-500/10 text-amber-500 font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{acc.label}</span>
                      {user?.role === acc.role && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161F30] border border-slate-200 dark:border-[#233044] relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#161F30] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#233044] p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#233044] pb-2 mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                    <button
                      type="button"
                      onClick={() => markAsRead('all')}
                      className="text-xs text-amber-500 hover:text-amber-600 font-semibold"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">You're all caught up! No notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-colors ${
                            n.is_read 
                              ? 'bg-slate-50 dark:bg-[#0B111E] border-slate-100 dark:border-[#233044] text-slate-500 dark:text-slate-400' 
                              : 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-slate-100 font-medium'
                          }`}
                        >
                          <div className="font-bold text-amber-600 dark:text-amber-400">{n.title}</div>
                          <p className="mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Info Pill */}
            {user && (
              <div 
                onClick={() => setActivePage('profile')}
                className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[110px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {user.role === 'STUDENT' ? `${user.department_code || 'IT'} - 2nd Year` : user.role}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* QR Turnstile Modal */}
      <QrScannerModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </header>
  );
}
