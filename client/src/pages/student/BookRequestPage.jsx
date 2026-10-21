import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PlusCircle, ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export function BookRequestPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    edition: '',
    department_id: user?.department_id || 'DEPT_IT',
    semester: user?.semester || 4,
    reason: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchRequestsAndDepts();
  }, []);

  async function fetchRequestsAndDepts() {
    setLoading(true);
    try {
      const [reqRes, deptRes] = await Promise.all([
        api.get('/book-requests/my-requests'),
        api.get('/books/departments')
      ]);

      if (reqRes.success) setRequests(reqRes.requests || []);
      if (deptRes.success) setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load book requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/book-requests/create', formData);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setFormData({
          title: '',
          author: '',
          isbn: '',
          publisher: '',
          edition: '',
          department_id: user?.department_id || 'DEPT_IT',
          semester: user?.semester || 4,
          reason: '',
          priority: 'MEDIUM'
        });
        await fetchRequestsAndDepts();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit book request.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Request New Book Procurement</h2>
        <p className="text-xs text-slate-500 mt-1">
          Multi-tier institutional workflow: Student Request → Department HOD Review → Admin Approval → Library Catalog
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

      {/* Request Form & Pipeline Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PlusCircle className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Book Procurement Form</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Designing Data-Intensive Applications"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Author Name *</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Martin Kleppmann"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ISBN (Optional)</label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="978-1449373320"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Publisher</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="O'Reilly Media"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Curriculum Core)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Justification & Reason *</label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain why this book is needed (e.g. required for semester elective course or undergraduate project research)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting Request...' : 'Submit to Department HOD'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Workflow Info Card (1 Col) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Institutional Governance
            </span>
            <h4 className="text-base font-bold text-white">Multi-Tier Approval Process</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              To ensure optimal budget allocation and curriculum alignment, all student procurement requests must be validated by the department head.
            </p>

            <div className="space-y-3 pt-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                <div>
                  <p className="font-bold text-slate-200">Student Submission</p>
                  <p className="text-[11px] text-slate-400">Request entered into department queue.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                <div>
                  <p className="font-bold text-slate-200">Department HOD Review</p>
                  <p className="text-[11px] text-slate-400">HOD validates syllabus relevance.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
                <div>
                  <p className="font-bold text-slate-200">Admin Procurement & Catalog</p>
                  <p className="text-[11px] text-slate-400">Admin grants budget and creates copies.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 text-xs text-slate-300 border border-white/10">
            💡 <strong>Tip:</strong> Provide clear academic reasons to expedite HOD approval!
          </div>
        </div>

      </div>

      {/* Student's Past Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Your Procurement Requests History</h3>

        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">You haven't submitted any book requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Book Title & Author</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">HOD Status</th>
                  <th className="py-2.5 px-3">Admin Status</th>
                  <th className="py-2.5 px-3">Procurement</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{req.title}</div>
                      <div className="text-slate-500 text-[11px]">By {req.author} {req.isbn ? `• ISBN: ${req.isbn}` : ''}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{req.department_code} Sem {req.semester}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.hod_status} className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.admin_status} className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {req.procurement_status || 'PENDING'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{new Date(req.created_at).toLocaleDateString()}</td>
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
