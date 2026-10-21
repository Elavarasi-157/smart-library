import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BookCard } from '../../components/books/BookCard';
import { Search, SlidersHorizontal, ArrowLeft, Filter, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export function BookSearchPage({ initialQuery = '', onSelectBook }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState('All');
  const [department, setDepartment] = useState('DEPT_IT');
  const [books, setBooks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reservationMessage, setReservationMessage] = useState(null);

  const filterChips = ['All', 'Books', 'Authors', 'Subjects', 'Categories', 'IT', 'Filters'];

  useEffect(() => {
    fetchDepartments();
    handleSearch();
  }, [department]);

  async function fetchDepartments() {
    try {
      const res = await api.get('/books/departments');
      if (res.success) setDepartments(res.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function handleSearch(searchStr = query) {
    setLoading(true);
    try {
      const params = {};
      if (searchStr.trim()) params.q = searchStr.trim();
      if (department) params.department_id = department;

      const res = await api.get('/books/search', params);
      if (res.success) {
        setBooks(res.books || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve(bookId) {
    try {
      const res = await api.post(`/books/${bookId}/reserve`);
      if (res.success) {
        setReservationMessage({ type: 'success', text: res.message });
        await handleSearch();
      }
    } catch (err) {
      setReservationMessage({ type: 'error', text: err.message || 'Reservation failed.' });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Smart Search
        </h1>
      </div>

      {/* Reservation Notification */}
      {reservationMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top ${
          reservationMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{reservationMessage.text}</span>
          <button onClick={() => setReservationMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Search Input Bar matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-4 sm:p-5 shadow-xl space-y-4">
        
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="database management systems, korth, tanenbaum, machine learning..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <Search className="w-5 h-5 text-amber-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Filter Chips Bar matching screenshot */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#233044]/60">
          {filterChips.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setActiveChip(chip);
                if (chip === 'All') { setDepartment(''); handleSearch(''); }
                else if (chip === 'IT') { setDepartment('DEPT_IT'); handleSearch('database'); }
                else { handleSearch(chip.toLowerCase()); }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeChip === chip
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-[#0B111E] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#233044]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <span>Showing {books.length} academic textbooks & references</span>
        <span>Ranked by Relevance & Availability</span>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Searching MIT Library catalog...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">No books found</h3>
          <p className="text-xs text-slate-400">Try searching for keywords like DBMS, algorithms, or programming.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}

    </div>
  );
}
