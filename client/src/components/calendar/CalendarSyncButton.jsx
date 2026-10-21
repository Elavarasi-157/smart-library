import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, Check, Bell } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';

export function CalendarSyncButton({ bookTitle, dueDate, author, bookId, variant = 'button' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const cleanDate = (dueDate || '').split(/[T ]/)[0];
  const dateObj = new Date(dueDate || Date.now());

  // Direct Google Calendar Event URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Return Book: ${bookTitle} to Smart Library`)}&dates=${dateObj.toISOString().replace(/-|:|\.\d+/g, '')}/${dateObj.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(`Reminder to return or renew '${bookTitle}' by ${author || 'Author'}. Avoid overdue fines of ₹1/day.`)}&location=${encodeURIComponent('Central University Library')}`;

  const icsDownloadUrl = `/api/calendar/ics?title=${encodeURIComponent(bookTitle)}&dueDate=${encodeURIComponent(dueDate)}&author=${encodeURIComponent(author || '')}&bookId=${encodeURIComponent(bookId || '')}`;

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-xs font-semibold transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          Add to Calendar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline"
        >
          Calendar Sync
        </button>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Calendar Due Date Reminder" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-sky-950">
            <Calendar className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm">Add Return Due Date to Your Calendar</p>
              <p className="text-slate-600 mt-1">
                Would you like to sync the return reminder for <strong>"{bookTitle}"</strong> (Due: {cleanDate})?
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Add to Google Calendar
            </a>

            <a
              href={icsDownloadUrl}
              download={`smart_library_${cleanDate}.ics`}
              onClick={() => setDownloaded(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors"
            >
              {downloaded ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
              {downloaded ? 'Downloaded .ICS File' : 'Download iCalendar / Apple Calendar (.ICS)'}
            </a>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
            <span>You can toggle automatic reminders in Settings.</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-700 font-semibold hover:text-slate-900 px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
