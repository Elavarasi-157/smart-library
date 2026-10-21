import React from 'react';
import { Modal } from '../common/Modal';
import { BookOpen, ExternalLink, ShieldCheck, Info } from 'lucide-react';

export function PdfPreviewModal({ isOpen, onClose, book, title, previewUrl, author }) {
  if (!isOpen) return null;

  const bookData = book || {
    title: title || 'Textbook Preview',
    author: author || 'Academic Author',
    isbn: '978-0133397077',
    edition: 'Latest Edition',
    publisher: 'Academic Press',
    description: 'Comprehensive study materials and chapter walkthrough for academic syllabus preparation.',
    sample_preview_url: previewUrl || 'https://en.wikipedia.org/wiki/Textbook'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Official Preview: ${bookData.title}`} maxWidth="max-w-3xl">
      <div className="space-y-4 font-sans text-xs">
        {/* Compliance Notice */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Academic Cross-Verification Preview</p>
            <p className="mt-0.5">
              This digital sample preview is authorized for institutional reference to help verify syllabus edition, table of contents, and sample chapters before physical checkout.
            </p>
          </div>
        </div>

        {/* Book Header Meta */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044]">
          <img 
            src={bookData.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
            alt={bookData.title} 
            className="w-16 h-22 object-cover rounded-lg shadow-sm"
          />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{bookData.title}</h4>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">By {bookData.author}</p>
            <div className="flex flex-wrap gap-2 text-slate-500 dark:text-slate-400 mt-2">
              <span><strong>ISBN:</strong> {bookData.isbn || '978-0133397077'}</span>
              <span>•</span>
              <span><strong>Edition:</strong> {bookData.edition || 'Latest'}</span>
              <span>•</span>
              <span><strong>Publisher:</strong> {bookData.publisher || 'Academic Press'}</span>
            </div>
          </div>
        </div>

        {/* Interactive Sample View or Embedded Preview */}
        <div className="border border-slate-200 dark:border-[#233044] rounded-xl overflow-hidden bg-white dark:bg-[#161F30]">
          <div className="bg-slate-100 dark:bg-[#0B111E] px-4 py-2.5 border-b border-slate-200 dark:border-[#233044] flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
            <span>Chapter 1: Overview & Key Concepts (Sample Preview)</span>
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Open Preview
            </span>
          </div>

          <div className="p-5 space-y-3 max-h-80 overflow-y-auto leading-relaxed text-slate-700 dark:text-slate-300">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-[#233044] pb-2">
              Table of Contents & Learning Objectives
            </h4>
            <p className="italic text-slate-500 dark:text-slate-400">
              "{bookData.description}"
            </p>

            <div className="space-y-2 pt-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">Unit 1 — Foundational Theoretical Frameworks:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>Core terminology and fundamental principles.</li>
                <li>Design heuristics, mathematical models, and architectural components.</li>
                <li>University examination review problems and case studies.</li>
              </ul>

              <p className="font-bold text-slate-900 dark:text-slate-100 mt-3">Unit 2 — Core Methods and Practical Implementation:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>Algorithms, asymptotic performance, and efficiency optimization.</li>
                <li>Laboratory programming exercises and reference implementations.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {bookData.sample_preview_url ? (
            <a
              href={bookData.sample_preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open Publisher Companion Page
            </a>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 text-xs font-bold shadow-md shadow-amber-500/20 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}
