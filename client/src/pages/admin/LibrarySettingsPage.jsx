import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Settings, Save, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Sliders, Users, CreditCard, Clock } from 'lucide-react';

export function LibrarySettingsPage() {
  const [config, setConfig] = useState({
    max_books_per_student: 4,
    standard_loan_duration_days: 14,
    renewal_extension_days: 14,
    max_renewals_per_loan: 2,
    fine_rate_per_day: 1.0,
    max_library_capacity: 300,
    crowd_threshold_moderate: 120,
    crowd_threshold_high: 210,
    reservation_pickup_window_hours: 48
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.success && res.config) {
        setConfig(res.config);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', config);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'System rules and threshold policies updated successfully.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update system rules.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration & Library Rules</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure university borrowing limits, 14-day renewal criteria, overdue fine rates, and turnstile capacity thresholds
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

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Borrowing & Renewal Rules */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Borrowing Limits & Renewal Rules</h3>
              <p className="text-xs text-slate-500">Core academic circulation policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Max Books per Student *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={config.max_books_per_student}
                onChange={(e) => setConfig({ ...config, max_books_per_student: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: Strictly 4 books max per student</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Standard Loan Duration (Days) *
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={config.standard_loan_duration_days}
                onChange={(e) => setConfig({ ...config, standard_loan_duration_days: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 14 days from checkout</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Renewal Extension Period (Days) *
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={config.renewal_extension_days}
                onChange={(e) => setConfig({ ...config, renewal_extension_days: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: Extends due date by exactly 14 days</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Max Allowed Consecutive Renewals *
              </label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={config.max_renewals_per_loan}
                onChange={(e) => setConfig({ ...config, max_renewals_per_loan: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 2 renewals before physical check-in</p>
            </div>
          </div>
        </div>

        {/* Card 2: Fine Rates & Payment Policy */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Fine Policy & Overdue Rates</h3>
              <p className="text-xs text-slate-500">Automated daily overdue calculations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Overdue Fine Rate (₹ per day) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  required
                  value={config.fine_rate_per_day}
                  onChange={(e) => setConfig({ ...config, fine_rate_per_day: Number(e.target.value) })}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Enforced rule: ₹1 per day per overdue book</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reservation Hold Window (Hours) *
              </label>
              <input
                type="number"
                min={12}
                max={120}
                required
                value={config.reservation_pickup_window_hours}
                onChange={(e) => setConfig({ ...config, reservation_pickup_window_hours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Held at circulation desk before passing to next waitlisted student</p>
            </div>
          </div>
        </div>

        {/* Card 3: Real-Time Crowd Management Thresholds */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Crowd & Turnstile Thresholds</h3>
              <p className="text-xs text-slate-500">Seat capacity and real-time status thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Max Library Seat Capacity *
              </label>
              <input
                type="number"
                min={50}
                max={2000}
                required
                value={config.max_library_capacity}
                onChange={(e) => setConfig({ ...config, max_library_capacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Total physical study desks (300)</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Moderate Occupancy Cutoff *
              </label>
              <input
                type="number"
                min={10}
                required
                value={config.crowd_threshold_moderate}
                onChange={(e) => setConfig({ ...config, crowd_threshold_moderate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Below this: 🟢 Low crowd (120)</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                High Occupancy Cutoff *
              </label>
              <input
                type="number"
                min={50}
                required
                value={config.crowd_threshold_high}
                onChange={(e) => setConfig({ ...config, crowd_threshold_high: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Above this: 🔴 High / Peak crowd (210)</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Policies...' : 'Save Configuration Changes'}
          </button>
        </div>

      </form>

    </div>
  );
}
