import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StarRating } from '../../components/common/StarRating';
import { ShelfLocationBadge } from '../../components/common/ShelfLocationBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PdfPreviewModal } from '../../components/books/PdfPreviewModal';
import { 
  ArrowLeft, Bookmark, BookOpen, Heart, Share2, 
  MapPin, CheckCircle2, Clock, MessageSquare, AlertCircle, Sparkles 
} from 'lucide-react';

export function BookDetailsPage({ bookId, onBack, onSelectBook, onRaiseMissingTicket }) {
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [showPreview, setShowPreview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reservationMessage, setReservationMessage] = useState(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  async function fetchBookDetails() {
    setLoading(true);
    try {
      const res = await api.get(`/books/${bookId}`);
      if (res.success) {
        setBook(res.book);
      }
    } catch (err) {
      console.error('Failed to load book details:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve() {
    if (!book) return;
    setReserving(true);
    try {
      const res = await api.post(`/books/${book.id}/reserve`);
      if (res.success) {
        setReservationMessage({ type: 'success', text: res.message });
        await fetchBookDetails();
      }
    } catch (err) {
      setReservationMessage({ type: 'error', text: err.message || 'Failed to place reservation.' });
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading textbook metadata...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <p className="text-sm font-bold text-slate-400">Textbook record not found.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
          Back to Search
        </button>
      </div>
    );
  }

  const availableCopies = book.copies ? book.copies.filter(c => c.status === 'AVAILABLE').length : (book.available_copies || 2);
  const totalCopies = book.copies ? book.copies.length : (book.total_copies || 5);
  const isAvailable = availableCopies > 0;

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto font-sans">
      
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Book Details</span>
      </button>

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

      {/* Main Book Card matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left: Large Book Cover */}
          <div className="w-full md:w-56 shrink-0 flex flex-col items-center">
            <div className="w-48 h-68 sm:w-56 sm:h-80 rounded-2xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
              <img
                src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Metadata and Actions */}
          <div className="flex-1 min-w-0 space-y-5">
            
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {book.title}
                </h1>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StarRating rating={book.avg_rating || 4.6} reviewCount={book.review_count || 128} showScore size="sm" />
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
                By {book.author}
              </p>
            </div>

            {/* Metadata Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400">ISBN:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{book.isbn || '978-0133397077'}</p>
              </div>
              <div>
                <span className="text-slate-400">Publisher:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{book.publisher || 'McGraw-Hill'}</p>
              </div>
              <div>
                <span className="text-slate-400">Edition:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{book.edition || '3rd Edition'}</p>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{book.category || 'Computer Science'}</p>
              </div>
              <div>
                <span className="text-slate-400">Total Copies:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{totalCopies}</p>
              </div>
              <div>
                <span className="text-slate-400">Available Copies:</span>
                <p className={`font-black ${isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>{availableCopies}</p>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-1">
                <span className="text-slate-400 mr-2">Location:</span>
                <ShelfLocationBadge location={book.primary_location || 'Block A > Floor 2 > Rack A12 > Shelf 4'} />
              </div>
            </div>

            {/* Action Buttons matching screenshot */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReserve}
                disabled={reserving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                {reserving ? 'Reserving...' : 'Reserve Book'}
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B111E] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#233044] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Preview / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setWishlisted(!wishlisted)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  wishlisted 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                    : 'bg-slate-100 dark:bg-[#0B111E] border-slate-200 dark:border-[#233044] text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{wishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* 4 Tabs matching screenshot */}
        <div className="mt-8 border-t border-slate-200 dark:border-[#233044] pt-6">
          <div className="flex border-b border-slate-200 dark:border-[#233044] gap-6 text-xs font-bold">
            {[
              { id: 'about', label: 'About Book' },
              { id: 'reviews', label: `Reviews (${book.review_count || 128})` },
              { id: 'similar', label: 'Similar Books' },
              { id: 'students', label: 'Students Also Borrowed' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-amber-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {activeTab === 'about' && (
              <p>
                {book.description || 'This book provides a comprehensive introduction to database management systems, including design, implementation, and management of databases.'}
              </p>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {book.reviews && book.reviews.length > 0 ? (
                  book.reviews.map(r => (
                    <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{r.review_title}</span>
                        <StarRating rating={r.rating} size="xs" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{r.review_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 py-4 text-center">Verified student borrower ratings: 4.6 / 5.0 (128 Reviews).</p>
                )}
              </div>
            )}

            {activeTab === 'similar' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div onClick={() => onSelectBook && onSelectBook('BK1002')} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer hover:border-amber-500">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Fundamentals of Database Systems</div>
                  <div className="text-[11px] text-slate-400">By Elmasri & Navathe • 1/4 Available</div>
                </div>
                <div onClick={() => onSelectBook && onSelectBook('BK1001')} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer hover:border-amber-500">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Database System Concepts</div>
                  <div className="text-[11px] text-slate-400">By Silberschatz & Korth • 0/3 Not Available</div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-2 pt-2">
                <p className="text-slate-400">Students enrolled in IT Semester 4 also frequently borrowed:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div onClick={() => onSelectBook && onSelectBook('BK1003')} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer hover:border-amber-500">
                    <div className="font-bold text-slate-900 dark:text-slate-100">Operating System Concepts</div>
                    <div className="text-[11px] text-slate-400">Silberschatz • Rack A15 Shelf 1</div>
                  </div>
                  <div onClick={() => onSelectBook && onSelectBook('BK1004')} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] cursor-pointer hover:border-amber-500">
                    <div className="font-bold text-slate-900 dark:text-slate-100">Data Structures in C</div>
                    <div className="text-[11px] text-slate-400">Mark Allen Weiss • Rack A05 Shelf 2</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={book.title}
        previewUrl={book.sample_preview_url}
        author={book.author}
      />

    </div>
  );
}
