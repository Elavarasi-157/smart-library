import React from 'react';
import { Users, Clock, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function CrowdMeter({ detailed = false, compact = false }) {
  const { crowdStatus } = useNotification();

  // Mock hourly trend matching screenshot
  const hourlyTrend = [
    { time: '8 AM', occupancy: 20 },
    { time: '10 AM', occupancy: 42 },
    { time: '12 PM', occupancy: 70 },
    { time: '2 PM', occupancy: 58 },
    { time: '4 PM', occupancy: 85 },
    { time: '6 PM', occupancy: 60 },
    { time: '8 PM', occupancy: 35 }
  ];

  const currentVisitors = crowdStatus?.current_visitors || 135;
  const maxCapacity = crowdStatus?.max_capacity || 300;
  const occupancyPct = crowdStatus?.occupancy_pct || Math.round((currentVisitors / maxCapacity) * 100);
  const statusLabel = crowdStatus?.status_label || (occupancyPct < 35 ? 'Low' : (occupancyPct < 70 ? 'Moderate' : 'High'));

  const statusColor = occupancyPct < 35 
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' 
    : (occupancyPct < 70 ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 'text-rose-500 border-rose-500/30 bg-rose-500/10');

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusColor}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-500" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span>{statusLabel}</span>
        <span className="text-slate-400 font-normal">|</span>
        <span>{currentVisitors}/{maxCapacity}</span>
      </div>
    );
  }

  // Circular gauge calculations
  const strokeWidth = 10;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (occupancyPct / 100) * circumference;

  return (
    <div className="space-y-6">
      
      {/* 2-Column Overview: Gauge + Trend Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Circular Gauge Card */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#233044] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">Current Crowd Level</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="text-slate-100 dark:text-[#0B111E]"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {/* Active progress */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="text-amber-500 transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{occupancyPct}%</span>
              <span className="text-xs font-bold text-amber-500">{statusLabel}</span>
            </div>
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">People in Library</span>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {currentVisitors} <span className="text-xs text-slate-400 font-normal">/ {maxCapacity}</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Trend Chart */}
        <div className="md:col-span-2 bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#233044] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Live Crowd Trend (Today)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hourly occupancy rate</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#233044" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis unit="%" stroke="#94A3B8" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#233044', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                  formatter={(val) => [`${val}%`, 'Occupancy']}
                />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#F59E0B" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F59E0B' }}
                  activeDot={{ r: 6, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Insights: Best Time + Real-time status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Best Time to Visit</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Today: After 4:00 PM</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time Updates</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Last updated: Just now</div>
          </div>
        </div>
      </div>

    </div>
  );
}
