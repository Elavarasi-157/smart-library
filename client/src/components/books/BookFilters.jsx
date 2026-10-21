import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export function BookFilters({
  departments = [],
  categories = [],
  selectedDepartment,
  selectedSemester,
  selectedCategory,
  selectedAvailability,
  minRating,
  onDepartmentChange,
  onSemesterChange,
  onCategoryChange,
  onAvailabilityChange,
  onMinRatingChange,
  onReset
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Filter className="w-4 h-4 text-sky-600" />
          Filter Catalog
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Department Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Department</label>
          <select
            value={selectedDepartment || ''}
            onChange={(e) => onDepartmentChange(e.target.value || null)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Semester</label>
          <select
            value={selectedSemester || ''}
            onChange={(e) => onSemesterChange(e.target.value || null)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Category</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Availability</label>
          <select
            value={selectedAvailability || 'ALL'}
            onChange={(e) => onAvailabilityChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="ALL">All Copies</option>
            <option value="AVAILABLE_ONLY">🟢 Available on Shelf Now</option>
          </select>
        </div>

        {/* Minimum Rating Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Rating</label>
          <select
            value={minRating || 0}
            onChange={(e) => onMinRatingChange(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value={0}>Any Rating</option>
            <option value={4.5}>⭐ 4.5 & above</option>
            <option value={4.0}>⭐ 4.0 & above</option>
            <option value={3.5}>⭐ 3.5 & above</option>
          </select>
        </div>
      </div>
    </div>
  );
}
