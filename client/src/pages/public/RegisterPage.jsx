import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Lock, Phone, ArrowLeft, Sun, Moon, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function RegisterPage({ onLoginClick, onBackClick }) {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    institutional_id: 'STU2024004',
    name: 'Pooja Reddy',
    email: 'pooja@mit.edu',
    password: 'Password@123',
    phone: '+91 98765 43214'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(formData);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your Institutional ID.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-[#0B111E] to-[#060A13] pointer-events-none" />

      {/* Top Header controls */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onBackClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[#161F30] border border-[#233044] text-amber-400 hover:bg-[#1E293B] transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Auth Center Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-[#161F30] rounded-3xl border border-[#233044] p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 mx-auto flex flex-col items-center justify-center font-black shadow-xl shadow-amber-500/20 border border-amber-400">
              <span className="text-xs leading-none font-black tracking-tighter">MIT</span>
              <span className="text-[7px] font-extrabold uppercase tracking-widest text-slate-900">ESTD 1949</span>
            </div>
            <h2 className="text-2xl font-black text-amber-400 tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-slate-400">
              Institutional Library Registration
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="p-1 rounded-2xl bg-[#0B111E] border border-[#233044] flex">
            <button
              type="button"
              onClick={onLoginClick}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Login
            </button>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md"
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Institutional ID (e.g. STU2024004)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="institutional_id"
                  value={formData.institutional_id}
                  onChange={handleChange}
                  required
                  placeholder="STU2024..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@mit.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Password@123"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>

          </form>

        </div>
      </div>

      <div />

    </div>
  );
}
