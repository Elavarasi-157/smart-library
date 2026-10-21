import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  GraduationCap, BookOpen, ShieldCheck, Settings, 
  Sun, Moon, ArrowRight, Sparkles, BookMarked, Landmark
} from 'lucide-react';

export function LandingPage({ onSelectRole }) {
  const { isDark, toggleTheme } = useTheme();

  const roles = [
    {
      id: 'STUDENT',
      title: 'STUDENT',
      desc: 'Access your library account, search books & borrow resources',
      icon: GraduationCap,
      action: () => onSelectRole('STUDENT')
    },
    {
      id: 'LIBRARIAN',
      title: 'LIBRARIAN',
      desc: 'Manage books, circulation desk & student inquiries',
      icon: BookOpen,
      action: () => onSelectRole('LIBRARIAN')
    },
    {
      id: 'HOD',
      title: 'HOD',
      desc: 'Approve book requests & manage department syllabus',
      icon: ShieldCheck,
      action: () => onSelectRole('HOD')
    },
    {
      id: 'ADMIN',
      title: 'ADMIN',
      desc: 'System control, security audits & procurement management',
      icon: Settings,
      action: () => onSelectRole('ADMIN')
    }
  ];

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* High-Resolution Campus Library Background Photo with Enhanced Quality Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/mit_library_building.png" 
          alt="Shri C. Rajam Library, MIT Campus, Anna University Chennai" 
          className="w-full h-full object-cover object-center filter brightness-[0.22] contrast-[1.15] scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/85 via-[#070D18]/70 to-[#070D18] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        {/* MIT Logo Emblem & College Name - Perfectly Proportioned */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1 shadow-md shadow-amber-500/25 flex items-center justify-center border border-amber-300/80 shrink-0">
            <img 
              src="/mit_logo.png" 
              alt="MIT Emblem" 
              className="w-full h-full object-contain filter drop-shadow-xs" 
            />
          </div>
          <div className="min-w-0">
            <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white block truncate">
              Madras Institute of Technology
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 block truncate">
              Anna University • Shri C. Rajam Central Library
            </span>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-[#161F30]/80 backdrop-blur-md border border-[#233044] text-amber-400 hover:bg-[#1E293B] transition-colors shadow-sm"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('STUDENT')}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            Portal Sign In
          </button>
        </div>
      </header>

      {/* Hero Center Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-center space-y-6 sm:space-y-8 flex-1 flex flex-col justify-center">
        
        {/* Golden MIT Insignia Badge - Refined Size */}
        <div className="mx-auto flex flex-col items-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-2 shadow-2xl shadow-amber-500/30 border border-amber-200 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img 
              src="/mit_logo.png" 
              alt="MIT India Crest" 
              className="w-full h-full object-contain filter drop-shadow-md" 
            />
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 mt-1 bg-amber-500/20 px-3.5 py-0.5 rounded-full border border-amber-500/40 backdrop-blur-md">
            SHRI C. RAJAM LIBRARY • MIT CAMPUS
          </span>
        </div>

        {/* Main Titles */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
            Madras Institute of Technology • Anna University Chennai
          </h2>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-amber-400 tracking-tight drop-shadow-lg">
            SMART LIBRARY
          </h1>
          <p className="text-sm sm:text-lg md:text-xl font-bold text-slate-100 tracking-wide">
            Automated Circulation • Digital Catalog • Real-Time Crowd Analytics
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase">
            In the Service of India • Knowledge • Innovation
          </p>
        </div>

        {/* Role Selector Header */}
        <div className="pt-2 sm:pt-4">
          <p className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">
            Select your institutional portal to continue
          </p>

          {/* 4 Role Selector Cards - Mobile Optimized Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
            {roles.map(r => {
              const Icon = r.icon;
              return (
                <div
                  key={r.id}
                  onClick={r.action}
                  className="p-4 sm:p-5 rounded-2xl bg-[#161F30]/90 hover:bg-[#1E293B] border border-[#233044] hover:border-amber-500 shadow-xl hover:shadow-amber-500/20 cursor-pointer transition-all duration-200 group flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-3 backdrop-blur-md hover:-translate-y-1 text-left sm:text-center"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-colors shadow-inner shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                      {r.desc}
                    </p>
                  </div>
                  <div className="hidden sm:flex pt-1 text-amber-500 font-bold text-[11px] items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500 sm:hidden shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 border-t border-[#233044]/60 bg-[#070D18]/80 backdrop-blur-md px-4">
        <p className="font-semibold text-slate-300 text-[11px] sm:text-xs">Shri C. Rajam Library, MIT Campus, Anna University, Chromepet, Chennai - 600044</p>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">© Madras Institute of Technology • Central Library Automation System</p>
      </footer>

    </div>
  );
}
