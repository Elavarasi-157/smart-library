import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertCircle, 
  HelpCircle, ArrowRight, User, BookOpen 
} from 'lucide-react';

export function HodBookRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [hodComments, setHodComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDepartmentRequests();
  }, []);

  async function fetchDepartmentRequests() {
    setLoading(true);
    try {
      const res = await api.get('/book-requests/department-requests');
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load department requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(status) {
    if (!selectedReq) return;

    setProcessing(true);
    try {
      const res = await api.put(`/book-requests/${selectedReq.id}/hod-review`, {
        status,
        comments: hodComments.trim() || `HOD decision: ${status}`
      });

      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Request for "${selectedReq.title}" marked as ${status}.`
        });
        setSelectedReq(null);
        setHodComments('');
        await fetchDepartmentRequests();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit HOD decision.' });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">HOD Book Procurement Approvals</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review and validate student textbook recommendations for curriculum alignment before forwarding to Admin procurement
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

      {/* Requests Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Department Review Queue</h3>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
            {requests.length} Submissions
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading department submissions...</p>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">All requests reviewed!</h4>
            <p className="text-xs text-slate-400">There are no pending student book requests in your department queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Book Title & Author</th>
                  <th className="py-2.5 px-3">Student Requester</th>
                  <th className="py-2.5 px-3">Curriculum Target</th>
                  <th className="py-2.5 px-3">HOD Status</th>
                  <th className="py-2.5 px-3">Admin Status</th>
                  <th className="py-2.5 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-sm">{req.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        By {req.author} {req.isbn ? `• ISBN: ${req.isbn}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">{req.student_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{req.institutional_id}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {req.department_code} Sem {req.semester}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={req.hod_status} className="text-[10px]" />
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={req.admin_status} className="text-[10px]" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setSelectedReq(req); setHodComments(req.hod_comments || ''); }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`HOD Evaluation: ${selectedReq.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-bold text-slate-900">{selectedReq.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Author & Publisher:</span>
                <span className="font-semibold text-slate-800">{selectedReq.author} ({selectedReq.publisher || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Requester:</span>
                <span className="text-slate-800">{selectedReq.student_name} ({selectedReq.institutional_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Semester:</span>
                <span className="font-bold text-indigo-700">{selectedReq.department_code} Semester {selectedReq.semester}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Student Academic Justification:</span>
                <p className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic">
                  "{selectedReq.reason}"
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">HOD Review Notes / Recommendation</label>
              <textarea
                rows={3}
                value={hodComments}
                onChange={(e) => setHodComments(e.target.value)}
                placeholder="Specify recommendation for university library acquisition..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Decision Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('APPROVED')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Escalate to Admin
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('NEED_INFO')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" />
                Request More Information
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('REJECTED')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
