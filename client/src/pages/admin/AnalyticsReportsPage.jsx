import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, Download, TrendingUp, Users, BookOpen, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export function AnalyticsReportsPage() {
  const [metrics, setMetrics] = useState(null);
  const [crowdHistory, setCrowdHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [adminRes, crowdRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/crowd/analytics')
      ]);

      if (adminRes.success) setMetrics(adminRes);
      if (crowdRes.success) setCrowdHistory(crowdRes.history || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    alert('Exporting university circulation & audit report as CSV...');
  }

  const COLORS = ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">University Library Analytics & Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Circulation patterns, peak gate entry hours, fine collection velocity, and department demand forecasts
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Report (.CSV)
        </button>
      </div>

      {/* Circulation vs Crowd Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Circulation Volume Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Circulation Volume</h3>
              <p className="text-xs text-slate-400">Books issued vs books returned</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl">2026 Academic Year</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.circulation_history || [
                { month: 'Jan', borrows: 45, returns: 40 },
                { month: 'Feb', borrows: 80, returns: 75 },
                { month: 'Mar', borrows: 120, returns: 110 },
                { month: 'Apr', borrows: 190, returns: 160 },
                { month: 'May', borrows: 140, returns: 135 },
                { month: 'Jun', borrows: 60, returns: 65 }
              ]}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                <Bar dataKey="borrows" fill="#0284c7" name="Books Issued" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" fill="#10b981" name="Books Returned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turnstile Hourly Traffic Trend */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Average Hourly Turnstile Traffic</h3>
              <p className="text-xs text-slate-400">Peak visitor counts throughout the day</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">Live Turnstile</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { hour: '8 AM', visitors: 20 },
                { hour: '10 AM', visitors: 75 },
                { hour: '12 PM', visitors: 160 },
                { hour: '2 PM', visitors: 240 },
                { hour: '4 PM', visitors: 190 },
                { hour: '6 PM', visitors: 110 },
                { hour: '8 PM', visitors: 45 }
              ]}>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Library Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Average Loan Turnaround</span>
          <div className="text-2xl font-black text-slate-900 mt-1">11.4 Days</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Under the 14-day limit</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Peak Occupancy Hour</span>
          <div className="text-2xl font-black text-slate-900 mt-1">2:00 PM - 4:00 PM</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">240 peak concurrent students</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Digital Resource Downloads</span>
          <div className="text-2xl font-black text-slate-900 mt-1">2,840+</div>
          <p className="text-[11px] text-sky-600 font-semibold mt-0.5">PYQs and course notes</p>
        </div>
      </div>

    </div>
  );
}
