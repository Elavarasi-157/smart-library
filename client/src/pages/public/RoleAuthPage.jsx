import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  GraduationCap, BookOpen, ShieldCheck, Settings, Lock, 
  Mail, User, Phone, Eye, EyeOff, ArrowLeft, Sun, Moon, 
  Sparkles, CheckCircle2, ChevronDown, Building, BookMarked
} from 'lucide-react';

export function RoleAuthPage({ selectedRole = 'STUDENT', onBackClick, onChangeRole }) {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login form state
  const defaultEmails = {
    STUDENT: 'karthik.r@mit.edu',
    LIBRARIAN: 'librarian@mit.edu',
    HOD: 'hod.it@mit.edu',
    ADMIN: 'admin@mit.edu'
  };

  const defaultPasswords = {
    STUDENT: 'Password@123',
    LIBRARIAN: 'Password@123',
    HOD: 'Password@123',
    ADMIN: 'admin'
  };

  const [identifier, setIdentifier] = useState(defaultEmails[selectedRole] || '');
  const [password, setPassword] = useState(defaultPasswords[selectedRole] || '');

  // Registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    phone: '',
    department_id: 'DEPT_IT',
    department_code: 'IT',
    year: 2,
    semester: 4,
    institutional_id: ''
  });

  const roleConfig = {
    STUDENT: {
      title: 'Student Portal',
      subtitle: 'Access your student library card, borrow history & syllabus',
      icon: GraduationCap,
      badge: 'MIT Student',
      allowRegister: true
    },
    LIBRARIAN: {
      title: 'Librarian Portal',
      subtitle: 'Circulation desk, catalog management & shelf inventory',
      icon: BookOpen,
      badge: 'Library Staff',
      allowRegister: true
    },
    HOD: {
      title: 'HOD Portal',
      subtitle: 'Department syllabus & student book procurement approvals',
      icon: ShieldCheck,
      badge: 'Department Head',
      allowRegister: true
    },
    ADMIN: {
      title: 'Admin Portal',
      subtitle: 'Institutional system administration & security controls',
      icon: Settings,
      badge: 'Administrator',
      allowRegister: false // No register for admin as requested
    }
  };

  const currentRole = roleConfig[selectedRole] || roleConfig.STUDENT;
  const RoleIcon = currentRole.icon;

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your Email/ID and Password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({
        ...regData,
        role: selectedRole
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFillDemo() {
    setIdentifier(defaultEmails[selectedRole] || '');
    setPassword(defaultPasswords[selectedRole] || '');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-[#0B111E] to-[#060A13] pointer-events-none" />

      {/* Top Header controls */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onBackClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Role Selection</span>
        </button>

        {/* Top Right controls */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switcher pills */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-[#161F30] border border-[#233044] rounded-xl text-[11px] font-bold">
            {['STUDENT', 'LIBRARIAN', 'HOD', 'ADMIN'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onChangeRole(r);
                  setIdentifier(defaultEmails[r] || '');
                  setPassword(defaultPasswords[r] || '');
                  setActiveTab('login');
                  setError(null);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedRole === r ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#161F30] border border-[#233044] text-amber-400 hover:bg-[#1E293B] transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Auth Center Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-[#161F30] rounded-3xl border border-[#233044] p-7 sm:p-8 shadow-2xl space-y-6">
          
          {/* Role Header Banner with Golden MIT Emblem */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1.5 shadow-xl shadow-amber-500/30 flex items-center justify-center border border-amber-300/80 mx-auto">
              <img src="/mit_logo.png" alt="MIT Emblem" className="w-full h-full object-contain filter drop-shadow-xs" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold uppercase text-amber-400 tracking-wider mb-1">
                {currentRole.badge}
              </div>
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                {currentRole.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentRole.subtitle}
              </p>
            </div>
          </div>

          {/* Login / Register Toggle Tabs (Disabled for Admin) */}
          {currentRole.allowRegister ? (
            <div className="p-1 rounded-2xl bg-[#0B111E] border border-[#233044] flex">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'login' 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {selectedRole} Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'register' 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {selectedRole} Register
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-400">
              Institutional Administrator Sign-In
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedRole === 'ADMIN' ? 'Admin Email' : 'Email Address / ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder={selectedRole === 'ADMIN' ? 'admin@mit.edu' : 'your.email@mit.edu'}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={selectedRole === 'ADMIN' ? 'admin' : 'Password@123'}
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

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleQuickFillDemo}
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold"
                  >
                    Auto-Fill Demo Credentials
                  </button>
                  <span className="text-[11px] text-slate-500">
                    MIT Central Library
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
              </button>

            </form>
          )}

          {/* TAB 2: REGISTER FORM (For Student, Librarian, HOD) */}
          {activeTab === 'register' && currentRole.allowRegister && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="e.g. Karthik R"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="your.email@mit.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Choose a secure password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={regData.department_id}
                    onChange={(e) => setRegData({ ...regData, department_id: e.target.value })}
                    className="w-full appearance-none pl-10 pr-8 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="DEPT_IT">Information Technology (IT)</option>
                    <option value="DEPT_CSE">Computer Science & Engineering (CSE)</option>
                    <option value="DEPT_ECE">Electronics & Communication (ECE)</option>
                    <option value="DEPT_EEE">Electrical & Electronics (EEE)</option>
                    <option value="DEPT_MECH">Mechanical Engineering (MECH)</option>
                  </select>
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Student-specific Year and Semester selectors */}
              {selectedRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Academic Year
                    </label>
                    <select
                      value={regData.year}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setRegData({ ...regData, year: y, semester: y === 1 ? 1 : (y === 2 ? 4 : (y === 3 ? 5 : 7)) });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B111E] border border-[#233044] text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Semester
                    </label>
                    <select
                      value={regData.semester}
                      onChange={(e) => setRegData({ ...regData, semester: Number(e.target.value) })}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B111E] border border-[#233044] text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value={1}>1st Sem</option>
                      <option value={2}>2nd Sem</option>
                      <option value={3}>3rd Sem</option>
                      <option value={4}>4th Sem</option>
                      <option value={5}>5th Sem</option>
                      <option value={6}>6th Sem</option>
                      <option value={7}>7th Sem</option>
                      <option value={8}>8th Sem</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B111E] border border-[#233044] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 mt-2"
              >
                {loading ? 'Registering...' : `Complete ${selectedRole} Registration`}
              </button>

            </form>
          )}

          {/* Footer Quote */}
          <div className="pt-2 text-center text-xs font-semibold text-amber-500/80 tracking-widest uppercase">
            Read • Learn • Grow
          </div>

        </div>
      </main>

      {/* Empty bottom spacer */}
      <footer className="relative z-10 py-2 text-center text-xs text-slate-500">
        <p>© Madras Institute of Technology • Central Library System</p>
      </footer>

    </div>
  );
}
