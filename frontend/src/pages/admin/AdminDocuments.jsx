import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Upload, CheckCircle, XCircle, Clock, Search, FileText, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  Pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const DEMO_DOCS = [
  { id: 1, student_name: 'Arjun Kumar', reg_no: 'CS2023001', department: 'CSE', doc_type: 'Bonafide Certificate', description: 'Need for bank account opening', status: 'Pending', submitted_at: '2026-10-22', admin_reply: null },
  { id: 2, student_name: 'Priya Rajan', reg_no: 'CS2023002', department: 'CSE', doc_type: 'Fee Receipt Request', description: 'Duplicate receipt for Sem 5', status: 'Approved', submitted_at: '2026-10-18', admin_reply: 'Receipt issued. Please collect from admin office.' },
  { id: 3, student_name: 'Vikram Pillai', reg_no: 'IT2023005', department: 'IT', doc_type: 'No Objection Certificate', description: 'For internship application', status: 'Pending', submitted_at: '2026-10-23', admin_reply: null },
];

export default function AdminDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [replies, setReplies] = useState({});
  const [processing, setProcessing] = useState({});

  const fetchDocs = () => {
    client.get('/admin/documents')
      .then((res) => setDocs(Array.isArray(res.data) ? res.data : DEMO_DOCS))
      .catch(() => setDocs(DEMO_DOCS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await client.patch(`/admin/documents/${id}`, { status: action, admin_reply: replies[id] || '' });
    } catch {}
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: action, admin_reply: replies[id] || '' } : d));
    setProcessing(p => ({ ...p, [id]: false }));
  };

  const counts = { All: docs.length, Pending: docs.filter(d => d.status === 'Pending').length, Approved: docs.filter(d => d.status === 'Approved').length, Rejected: docs.filter(d => d.status === 'Rejected').length };

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.student_name.toLowerCase().includes(search.toLowerCase()) || d.reg_no.includes(search);
    const matchFilter = filter === 'All' || d.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <LoadingSpinner message="Loading document requests..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
          <h1 className="text-lg font-bold text-slate-900">Document Requests</h1>
        </div>
        <p className="text-xs text-slate-500">Review and respond to student document requests</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s} <span className="ml-1 opacity-70">{counts[s]}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="erp-card p-10 text-center text-slate-400 text-sm">No {filter.toLowerCase()} requests.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.Pending;
            return (
              <div key={d.id} className="erp-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800">{d.student_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({d.reg_no})</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{d.department}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{d.status}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{d.doc_type}</p>
                    {d.description && <p className="text-[11px] text-slate-400 italic mt-0.5">"{d.description}"</p>}
                    <p className="text-[10px] text-slate-400 mt-1">Submitted: {d.submitted_at}</p>
                    {d.admin_reply && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[11px] text-blue-700">Your reply: {d.admin_reply}</p>
                      </div>
                    )}
                  </div>
                  {d.status === 'Pending' && (
                    <div className="flex flex-col gap-2 sm:min-w-[200px]">
                      <textarea rows={2} placeholder="Reply to student (optional)..."
                        value={replies[d.id] || ''}
                        onChange={(e) => setReplies(r => ({ ...r, [d.id]: e.target.value }))}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                      <div className="flex gap-2">
                        <button disabled={processing[d.id]} onClick={() => handleAction(d.id, 'Approved')}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                          Approve
                        </button>
                        <button disabled={processing[d.id]} onClick={() => handleAction(d.id, 'Rejected')}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
