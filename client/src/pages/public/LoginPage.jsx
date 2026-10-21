import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Lock, User, Eye, EyeOff, ArrowLeft, Sun, Moon, Sparkles } from 'lucide-react';

export function LoginPage({ onRegisterClick, onBackClick }) {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('login');
  const [identifier, setIdentifier] = useState('karthik.r@mit.edu');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your ID/Email and password.');
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

      {/* Auth Center Card matching exact screenshot */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto">
        <div className="bg-[#161F30] rounded-3xl border border-[#233044] p-8 shadow-2xl space-y-6">
          
          {/* MIT Crest Emblem Logo */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 mx-auto flex flex-col items-center justify-center font-black shadow-xl shadow-amber-500/20 border border-amber-400">
              <span className="text-sm leading-none font-black tracking-tighter">MIT</span>
              <span className="text-[7px] font-extrabold uppercase tracking-widest text-slate-900">ESTD 1949</span>
            </div>
            <h2 className="text-2xl font-black text-amber-400 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs text-slate-400">
              Login to your account
            </p>
          </div>

          {/* Login / Register Toggle Tabs */}
          <div className="p-1 rounded-2xl bg-[#0B111E] border border-[#233044] flex">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'login' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={onRegisterClick}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input: ID / Email */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="Enter your ID / Email"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Password */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your Password"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-right">
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact the MIT Central Library administration desk (admin@mit.edu) for password assistance.'); }} className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Gold Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <span className="text-[11px] text-slate-500 bg-[#161F30] px-2 relative z-10">
                or continue with
              </span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#233044]" />
              </div>
            </div>

            {/* Google Sign-in Mock */}
            <button
              type="button"
              onClick={() => login('karthik.r@mit.edu', 'Password@123')}
              className="w-full py-2.5 rounded-2xl bg-[#0B111E] hover:bg-[#1E293B] border border-[#233044] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span>MIT Institutional Google Sign-in</span>
            </button>

          </form>

          {/* Footer Quote */}
          <div className="pt-2 text-center text-xs font-semibold text-amber-500/80 tracking-widest uppercase">
            Read • Learn • Grow
          </div>

        </div>
      </div>

      {/* Empty bottom spacer */}
      <div />

    </div>
  );
}
