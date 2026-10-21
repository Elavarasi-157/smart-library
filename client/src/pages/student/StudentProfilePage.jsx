import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  UserCircle, QrCode, Bell, Mail, Phone, ShieldCheck, 
  CheckCircle2, AlertCircle, Save, Calendar, Sparkles, BookMarked, GraduationCap, Shield 
} from 'lucide-react';

export function StudentProfilePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const [preferences, setPreferences] = useState({
    email_due_reminders: 1,
    in_app_due_reminders: 1,
    reservation_ready_alerts: 1,
    calendar_sync_enabled: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (isStudent) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [isStudent]);

  async function fetchPreferences() {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.success && res.preferences) {
        setPreferences(res.preferences);
      }
    } catch (err) {
      console.warn('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreferences(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/notifications/preferences', preferences);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Notification preferences updated successfully.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {isStudent ? 'Student Profile & Digital ID' : `${user?.role || 'Staff'} Profile & Credentials`}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isStudent 
            ? 'Institutional identity credentials, digital library access card, and automated reminder preferences'
            : 'Institutional faculty credentials, system privileges, and access logs'}
        </p>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          actionMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Digital ID Pass */}
        <div className="bg-[#161F30] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#233044] flex flex-col justify-between relative overflow-hidden">
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  MIT
                </div>
                <span className="font-extrabold text-sm tracking-tight text-amber-400">
                  {isStudent ? 'MIT STUDENT PASS' : `MIT ${user?.role || 'FACULTY'} PASS`}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                VERIFIED
              </span>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'ST'}
              </div>
              <div>
                <h3 className="font-black text-base text-white">{user?.name}</h3>
                <p className="text-xs font-mono text-amber-400">{user?.institutional_id}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{user?.department_name || (user?.role === 'ADMIN' ? 'Central Administration' : 'Department Faculty')}</p>
              </div>
            </div>

            {isStudent ? (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#233044] text-[11px]">
                <div>
                  <span className="text-slate-500 block">Year</span>
                  <span className="font-bold text-slate-200">{user?.year || 2}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Semester</span>
                  <span className="font-bold text-slate-200">{user?.semester || 4}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Limit</span>
                  <span className="font-bold text-amber-400">4 Books</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-black/40 border border-[#233044] text-xs space-y-1 mt-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorized Role: {user?.role}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {user?.role === 'ADMIN' && 'Full Root Administration, User Management, and System Procurement Privileges.'}
                  {user?.role === 'HOD' && `Department Academic Curriculum Review & Book Acquisition Approvals.`}
                  {user?.role === 'LIBRARIAN' && 'Circulation Desk, Barcode Cataloging, Fine Management & Inquiry Desk.'}
                </p>
              </div>
            )}
          </div>

          {/* QR Code for Gate Scanning */}
          <div className="mt-6 pt-4 border-t border-[#233044] flex items-center justify-between bg-black/30 p-3 rounded-2xl relative z-10 border border-[#233044]/60">
            <div className="text-[11px] text-slate-300">
              <p className="font-bold text-amber-400">
                {isStudent ? 'Turnstile Gate Pass' : 'Staff Access Credential'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isStudent ? 'Scan at entrance gate' : 'Institutional NFC / QR pass'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-900" />
            </div>
          </div>

          {/* Ambient light glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Right 2 Columns: Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Details Card */}
          <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {isStudent ? 'Academic Credentials' : 'Staff & Faculty Credentials'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{user?.name}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{user?.email}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Role / Designation</span>
                <span className="font-bold text-amber-500 uppercase">{user?.role}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{user?.department_name || (user?.role === 'ADMIN' ? 'Administration' : 'Information Technology')}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Institutional ID</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{user?.institutional_id}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
                <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{user?.phone || 'Institutional Direct'}</span>
              </div>
            </div>
          </div>

          {/* Preferences Card ONLY FOR STUDENTS */}
          {isStudent && (
            <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Automated Alert Preferences</h3>

              <form onSubmit={handleSavePreferences} className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Due Date Email Reminders</div>
                    <div className="text-[11px] text-slate-400">Receive reminder alerts 3 days & 1 day before due date</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!preferences.email_due_reminders}
                    onChange={(e) => setPreferences({ ...preferences, email_due_reminders: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">In-App Notification Bell</div>
                    <div className="text-[11px] text-slate-400">Show badge alerts and popups on the navigation header</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!preferences.in_app_due_reminders}
                    onChange={(e) => setPreferences({ ...preferences, in_app_due_reminders: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
