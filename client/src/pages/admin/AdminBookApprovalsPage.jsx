import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertCircle, 
  ShoppingCart, PlusCircle, ArrowRight, User 
} from 'lucide-react';

export function AdminBookApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Procurement Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [copiesToCreate, setCopiesToCreate] = useState(3);
  const [initialRack, setInitialRack] = useState('Rack A12');
  const [initialShelf, setInitialShelf] = useState('Shelf 4');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  async function fetchAdminRequests() {
    setLoading(true);
    try {
      const res = await api.get('/book-requests/admin-requests');
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(status) {
    if (!selectedReq) return;

    setProcessing(true);
    try {
      const res = await api.put(`/book-requests/${selectedReq.id}/admin-review`, {
        status,
        comments: adminComments.trim() || `Admin decision: ${status}`,
        createCopiesCount: status === 'APPROVED' ? copiesToCreate : 0,
        rack: initialRack,
        shelf: initialShelf
      });

      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Request for "${selectedReq.title}" marked as ${status}${status === 'APPROVED' ? ` and ${copiesToCreate} physical copies registered in catalog.` : '.'}`
        });
        setSelectedReq(null);
        setAdminComments('');
        await fetchAdminRequests();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit procurement decision.' });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">University Book Procurement Queue</h2>
        <p className="text-xs text-slate-500 mt-1">
          Final executive approval and catalog addition for HOD-validated student textbook recommendations
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

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-900">HOD-Approved Procurement Queue</h3>
          </div>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100">
            {requests.length} Requests Pending Admin Action
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading procurement queue...</p>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No pending procurement requests!</h4>
            <p className="text-xs text-slate-400">All HOD-approved submissions have been procured and added to the library catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Book Title & Details</th>
                  <th className="py-2.5 px-3">Requester & Dept</th>
                  <th className="py-2.5 px-3">HOD Endorsement</th>
                  <th className="py-2.5 px-3">Admin Decision</th>
                  <th className="py-2.5 px-3 text-right">Procurement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-sm">{req.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        By {req.author} {req.publisher ? `• ${req.publisher}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{req.student_name}</div>
                      <div className="text-[11px] text-slate-400">{req.department_code} Sem {req.semester}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={req.hod_status} className="text-[10px]" />
                      {req.hod_comments && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                          "{req.hod_comments}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={req.admin_status} className="text-[10px]" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setSelectedReq(req); setAdminComments(req.admin_comments || ''); }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Procure & Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Procurement Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`Admin Procurement: ${selectedReq.title}`}
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
                <span className="text-slate-500">HOD Approval Status:</span>
                <span className="font-bold text-emerald-700">APPROVED by {selectedReq.department_code} HOD</span>
              </div>
              {selectedReq.hod_comments && (
                <div className="pt-1 text-slate-600 italic">
                  HOD Note: "{selectedReq.hod_comments}"
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Copies to Order *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={copiesToCreate}
                  onChange={(e) => setCopiesToCreate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Rack</label>
                <input
                  type="text"
                  value={initialRack}
                  onChange={(e) => setInitialRack(e.target.value)}
                  placeholder="Rack A12"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Shelf</label>
                <input
                  type="text"
                  value={initialShelf}
                  onChange={(e) => setInitialShelf(e.target.value)}
                  placeholder="Shelf 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Admin Procurement Notes</label>
              <textarea
                rows={2}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Purchase order details, supplier invoice number, acquisition grant..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            {/* Decision Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecision('APPROVED')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Add {copiesToCreate} Copies to Catalog
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecision('REJECTED')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Procurement
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
