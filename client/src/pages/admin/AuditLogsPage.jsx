import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Activity, Search, ShieldCheck, Filter, FileText, ArrowDownCircle, RefreshCw } from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', { action: selectedAction || undefined });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security & Governance Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit logs recording authentication, book circulation, payments, turnstile scans, and rule changes
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by Actor, Action (e.g. ISSUE_BOOK, LOGIN), or Details..."
            className="w-full text-xs text-slate-900 bg-transparent focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="">All Security Events</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_REGISTER">USER_REGISTER</option>
            <option value="ISSUE_BOOK">ISSUE_BOOK</option>
            <option value="RETURN_BOOK">RETURN_BOOK</option>
            <option value="RENEW_BOOK">RENEW_BOOK</option>
            <option value="FINE_PAYMENT">FINE_PAYMENT</option>
            <option value="QR_GATE_ENTRY">QR_GATE_ENTRY</option>
            <option value="QR_GATE_EXIT">QR_GATE_EXIT</option>
            <option value="BOOK_REQUEST_HOD_DECISION">BOOK_REQUEST_HOD_DECISION</option>
            <option value="BOOK_REQUEST_ADMIN_DECISION">BOOK_REQUEST_ADMIN_DECISION</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Audit Events ({filteredLogs.length})</h3>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading audit trail...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No audit records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Details & Audit Payload</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{log.actor_name || 'System'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={log.actor_role} className="text-[9px]" />
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
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
