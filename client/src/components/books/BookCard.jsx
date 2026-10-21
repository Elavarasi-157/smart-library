import React, { useState } from 'react';
import { StarRating } from '../common/StarRating';
import { ShelfLocationBadge } from '../common/ShelfLocationBadge';
import { BookOpen, Eye, Bookmark, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { PdfPreviewModal } from './PdfPreviewModal';

export function BookCard({ book, onSelect, onReserve, isSelected = false }) {
  const [showPreview, setShowPreview] = useState(false);

  const totalCopies = book.total_copies || 5;
  const availableCopies = book.available_copies !== undefined ? book.available_copies : 2;
  const isAvailable = availableCopies > 0;

  return (
    <div className={`bg-white dark:bg-[#161F30] rounded-2xl border transition-all duration-200 hover:shadow-xl hover:border-amber-500/50 flex flex-col justify-between overflow-hidden group ${
      isSelected ? 'ring-2 ring-amber-500 border-amber-500 shadow-md' : 'border-slate-200 dark:border-[#233044]'
    }`}>
      <div className="p-4 sm:p-5">
        
        {/* Top Header: Availability Count & Category */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isAvailable 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isAvailable ? `${availableCopies}/${totalCopies} Available` : `${availableCopies}/${totalCopies} Not Available`}
          </span>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1E293B] px-2 py-0.5 rounded-md truncate max-w-[120px]">
            {book.category || 'Computer Science'}
          </span>
        </div>

        {/* Book Main Body */}
        <div className="flex gap-3.5 cursor-pointer" onClick={() => onSelect && onSelect(book.id)}>
          <div className="w-20 h-28 sm:w-22 sm:h-32 shrink-0 rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-[#0B111E] relative group-hover:shadow-md transition-shadow">
            <img
              src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                {book.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 truncate">
                By {book.author}
              </p>
              {book.isbn && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                  ISBN: {book.isbn}
                </p>
              )}
            </div>

            <div className="mt-2 space-y-1.5">
              <StarRating 
                rating={book.avg_rating || 4.6} 
                reviewCount={book.review_count || 128} 
                showScore 
                size="xs" 
              />
              
              <div className="pt-0.5">
                <ShelfLocationBadge location={book.primary_location || 'Block A > Floor 2 > Rack A12 > Shelf 4'} size="xs" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#111827] border-t border-slate-100 dark:border-[#233044] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors px-2 py-1 rounded-md"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Preview / PDF
        </button>

        <div className="flex items-center gap-2">
          {onReserve && isAvailable && (
            <button
              type="button"
              onClick={() => onReserve(book.id)}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/20 transition-colors"
            >
              Reserve Book
            </button>
          )}
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(book.id)}
              className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-[#233044] transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </div>

      {/* PDF Modal */}
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
