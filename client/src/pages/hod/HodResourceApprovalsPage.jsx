import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  FolderDown, CheckCircle2, XCircle, Download, FileText, 
  ShieldCheck, AlertCircle, Sparkles 
} from 'lucide-react';

export function HodResourceApprovalsPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchDepartmentResources();
  }, []);

  async function fetchDepartmentResources() {
    setLoading(true);
    try {
      const res = await api.get('/resources');
      if (res.success) {
        setResources(res.resources || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(resourceId) {
    try {
      const res = await api.put(`/resources/${resourceId}/approve`);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Resource approved and made publicly visible to all students.' });
        await fetchDepartmentResources();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Approval failed.' });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Resource Quality Moderation</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review previous year exam papers, lecture summaries, and lab guides submitted by department students
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

      {/* Resources Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Department Study Materials Queue</h3>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading study materials...</p>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">All materials approved</h4>
            <p className="text-xs text-slate-400">No pending student resource uploads requiring review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Resource Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Subject & Semester</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{res.title}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{res.description}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {res.resource_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {res.subject_code} (Sem {res.semester})
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={res.status} className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <a
                        href={`/uploads/${res.file_name}`}
                        download={res.file_name}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Preview
                      </a>
                      {res.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(res.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
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
