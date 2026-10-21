import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { QrCode, Scan, ArrowRightCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useNotification } from '../../context/NotificationContext';

export function QrScannerModal({ isOpen, onClose, defaultMode = 'ENTRY' }) {
  const [mode, setMode] = useState(defaultMode); // 'ENTRY' | 'EXIT'
  const [studentIdInput, setStudentIdInput] = useState('STU2024001');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const { fetchCrowdStatus } = useNotification();

  async function handleScan(e) {
    if (e) e.preventDefault();
    if (!studentIdInput.trim()) return;

    setLoading(true);
    setScanResult(null);
    setScanError(null);

    try {
      const endpoint = mode === 'ENTRY' ? '/crowd/entry' : '/crowd/exit';
      const res = await api.post(endpoint, { studentIdentifier: studentIdInput.trim() });
      if (res.success) {
        setScanResult(res);
        await fetchCrowdStatus();
      }
    } catch (err) {
      setScanError(err.message || 'Failed to process turnstile scan.');
    } finally {
      setLoading(false);
    }
  }

  const sampleStudents = [
    { id: 'STU2024001', name: 'Rahul Sharma (IT Sem 4)' },
    { id: 'STU2024002', name: 'Ananya Iyer (CSE Sem 4)' },
    { id: 'STU2024003', name: 'Vikram Patel (ECE Sem 2)' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Library Gate Turnstile QR Scanner" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('ENTRY'); setScanResult(null); setScanError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'ENTRY' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🟢 Turnstile Check-In (Entry +1)
          </button>
          <button
            type="button"
            onClick={() => { setMode('EXIT'); setScanResult(null); setScanError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'EXIT' 
                ? 'bg-white text-rose-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔴 Turnstile Check-Out (Exit -1)
          </button>
        </div>

        {/* QR Scanner Visual Animation */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="w-28 h-28 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center relative">
            <QrCode className="w-16 h-16 text-slate-800" />
            <div className="absolute inset-x-0 h-0.5 bg-sky-500 animate-bounce shadow-sm opacity-80" />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Turnstile Optical Scanner Active
          </p>
        </div>

        {/* Scanner Form */}
        <form onSubmit={handleScan} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scan / Enter Student Institutional ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="e.g. STU2024001"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Scan className="w-4 h-4" />
                {loading ? 'Scanning...' : 'Simulate Scan'}
              </button>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 self-center mr-1">Quick ID:</span>
            {sampleStudents.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudentIdInput(s.id)}
                className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-md border border-slate-200 text-slate-600 transition-colors font-mono"
              >
                {s.id}
              </button>
            ))}
          </div>
        </form>

        {/* Scan Result Feedback */}
        {scanResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {scanResult.message}
            </div>
            {scanResult.student && (
              <div className="pt-2 text-emerald-700 space-y-0.5">
                <p><strong>Student:</strong> {scanResult.student.name} ({scanResult.student.institutionalId})</p>
                {scanResult.student.entryTime && <p><strong>Check-In Time:</strong> {scanResult.student.entryTime}</p>}
                {scanResult.student.durationMinutes && <p><strong>Total Duration:</strong> {scanResult.student.durationMinutes} mins</p>}
              </div>
            )}
          </div>
        )}

        {scanError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Scan Error
            </div>
            <p className="text-rose-700">{scanError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
