import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShelfLocationBadge } from '../../components/common/ShelfLocationBadge';
import { 
  AlertTriangle, Search, CheckCircle2, RotateCw, 
  MapPin, ShieldAlert, ArrowRight 
} from 'lucide-react';

export function MissingBooksPage() {
  const [missingCopies, setMissingCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchMissingBooks();
  }, []);

  async function fetchMissingBooks() {
    setLoading(true);
    try {
      const res = await api.get('/books/search', { q: '' });
      if (res.success && res.books) {
        const missingList = [];
        for (const b of res.books) {
          const detail = await api.get(`/books/${b.id}`);
          if (detail.success && detail.book?.copies) {
            detail.book.copies
              .filter(c => c.status === 'MISSING' || c.status === 'DAMAGED')
              .forEach(c => {
                missingList.push({
                  ...c,
                  book_title: detail.book.title,
                  book_isbn: detail.book.isbn,
                  book_author: detail.book.author
                });
              });
          }
        }
        setMissingCopies(missingList);
      }
    } catch (err) {
      console.error('Failed to load missing copies:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkFound(copyId) {
    try {
      const res = await api.put(`/admin/copies/${copyId}/location`, {
        status: 'AVAILABLE'
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: `Copy ${copyId} verified and restored to active shelf availability.` });
        await fetchMissingBooks();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update copy status.' });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Missing Book Investigation Desk</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review shelf misplaced reports, investigate physical aisles, and restore found items to the catalog
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

      {/* Missing Copies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Flagged Copies Queue</h3>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            {missingCopies.length} Copies Flagged
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading missing copies queue...</p>
        ) : missingCopies.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No missing books reported!</h4>
            <p className="text-xs text-slate-400">All physical book copies are accounted for on their respective shelves.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Copy Barcode</th>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Flagged Status</th>
                  <th className="py-2.5 px-3">Designated Shelf Location</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3 text-right">Investigation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {missingCopies.map(copy => (
                  <tr key={copy.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{copy.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{copy.book_title}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={copy.status} className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3">
                      <ShelfLocationBadge location={copy} size="xs" />
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{copy.condition}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleMarkFound(copy.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Found & Available
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
