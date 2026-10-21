import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ShelfLocationBadge } from '../../components/common/ShelfLocationBadge';
import { 
  GraduationCap, BookOpen, Star, ChevronDown, CheckCircle2, 
  ArrowRight, Sparkles 
} from 'lucide-react';

export function AcademicSyllabusPage({ onSelectBook }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('DEPT_IT');
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [selectedDept, selectedYear, selectedSemester]);

  async function fetchDepartments() {
    try {
      const res = await api.get('/books/departments');
      if (res.success) setDepartments(res.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/recommendations', {
        department_id: selectedDept,
        semester: selectedSemester
      });
      if (res.success) {
        setRecommendations(res);
      }
    } catch (err) {
      console.error('Failed to load syllabus recommendations:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Semester Wise Recommendations
        </h1>
      </div>

      {/* Selectors Card matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Department Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="DEPT_IT">Information Technology</option>
                <option value="DEPT_CSE">Computer Science & Engineering</option>
                <option value="DEPT_ECE">Electronics & Communication</option>
                <option value="DEPT_EEE">Electrical & Electronics</option>
                <option value="DEPT_MECH">Mechanical Engineering</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Year Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  setSelectedSemester(y === 1 ? 1 : (y === 2 ? 4 : 6));
                }}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Semester Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Semester
            </label>
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {selectedYear === 1 && (
                  <>
                    <option value={1}>1st Semester</option>
                    <option value={2}>2nd Semester</option>
                  </>
                )}
                {selectedYear === 2 && (
                  <>
                    <option value={3}>3rd Semester</option>
                    <option value={4}>4th Semester</option>
                  </>
                )}
                {selectedYear === 3 && (
                  <>
                    <option value={5}>5th Semester</option>
                    <option value={6}>6th Semester</option>
                  </>
                )}
                {selectedYear === 4 && (
                  <>
                    <option value={7}>7th Semester</option>
                    <option value={8}>8th Semester</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Recommended Textbooks Table Card matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl space-y-4">
        
        <h3 className="font-extrabold text-sm text-amber-500 uppercase tracking-wider">
          Recommended Textbooks
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#233044] text-slate-400 font-bold">
                <th className="pb-3 w-8">#</th>
                <th className="pb-3 pr-4">Book</th>
                <th className="pb-3 px-4 text-center">Availability</th>
                <th className="pb-3 pl-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#233044]/60 font-medium">
              
              {/* Row 1: Programming in C */}
              <tr 
                onClick={() => onSelectBook && onSelectBook('BK1007')}
                className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
              >
                <td className="py-3.5 text-slate-400 font-bold">1</td>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Programming in C</div>
                  <div className="text-[11px] text-slate-400">By E. Balagurusamy</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-500">3/5</td>
                <td className="py-3.5 pl-4 text-right font-bold text-amber-500">★ 4.5</td>
              </tr>

              {/* Row 2: Engineering Mathematics - I */}
              <tr 
                onClick={() => onSelectBook && onSelectBook('BK1008')}
                className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
              >
                <td className="py-3.5 text-slate-400 font-bold">2</td>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Engineering Mathematics - I</div>
                  <div className="text-[11px] text-slate-400">By B. S. Grewal</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-500">2/4</td>
                <td className="py-3.5 pl-4 text-right font-bold text-amber-500">★ 4.4</td>
              </tr>

              {/* Row 3: Digital Logic Design */}
              <tr 
                onClick={() => onSelectBook && onSelectBook('BK1009')}
                className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
              >
                <td className="py-3.5 text-slate-400 font-bold">3</td>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Digital Logic Design</div>
                  <div className="text-[11px] text-slate-400">By M. Morris Mano</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-rose-500">0/3</td>
                <td className="py-3.5 pl-4 text-right font-bold text-amber-500">★ 4.3</td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

      {/* Reference Books Table Card matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 shadow-xl space-y-4">
        
        <h3 className="font-extrabold text-sm text-amber-500 uppercase tracking-wider">
          Reference Books
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#233044] text-slate-400 font-bold">
                <th className="pb-3 w-8">#</th>
                <th className="pb-3 pr-4">Book</th>
                <th className="pb-3 px-4 text-center">Availability</th>
                <th className="pb-3 pl-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#233044]/60 font-medium">
              
              {/* Ref 1: Problem Solving and C Programming */}
              <tr 
                onClick={() => onSelectBook && onSelectBook('BK1011')}
                className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
              >
                <td className="py-3.5 text-slate-400 font-bold">1</td>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Problem Solving and C Programming</div>
                  <div className="text-[11px] text-slate-400">By Yashavant Kanetkar</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-500">2/6</td>
                <td className="py-3.5 pl-4 text-right font-bold text-amber-500">★ 4.2</td>
              </tr>

              {/* Ref 2: Computer Fundamentals */}
              <tr 
                onClick={() => onSelectBook && onSelectBook('BK1012')}
                className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
              >
                <td className="py-3.5 text-slate-400 font-bold">2</td>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Computer Fundamentals</div>
                  <div className="text-[11px] text-slate-400">By P. K. Sinha</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-500">4/7</td>
                <td className="py-3.5 pl-4 text-right font-bold text-amber-500">★ 4.1</td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
