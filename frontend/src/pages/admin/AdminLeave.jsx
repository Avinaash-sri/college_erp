import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CalendarDays, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

const STATUS_CONFIG = {
  Pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200',      label: 'Pending' },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
  Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200',         label: 'Rejected' },
};

const DEMO_LEAVES = [
  { id: 1, student_name: 'Arjun Kumar', reg_no: 'CS2023001', department: 'CSE', leave_type: 'Medical Leave', from_date: '2026-10-22', to_date: '2026-10-24', reason: 'Fever', status: 'Pending', submitted_at: '2026-10-21' },
  { id: 2, student_name: 'Priya Rajan', reg_no: 'CS2023002', department: 'CSE', leave_type: 'Family Emergency', from_date: '2026-10-20', to_date: '2026-10-20', reason: 'Family function', status: 'Approved', submitted_at: '2026-10-19', admin_remark: 'Approved by admin.' },
  { id: 3, student_name: 'Vikram Pillai', reg_no: 'IT2023005', department: 'IT', leave_type: 'Event Participation', from_date: '2026-10-25', to_date: '2026-10-26', reason: 'Hackathon', status: 'Pending', submitted_at: '2026-10-23' },
];

export default function AdminLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState({});
  const [remarks, setRemarks] = useState({});

  const fetchLeaves = () => {
    client.get('/admin/leave-requests')
      .then((res) => setLeaves(Array.isArray(res.data) ? res.data : DEMO_LEAVES))
      .catch(() => setLeaves(DEMO_LEAVES))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleDecision = async (id, decision) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await client.patch(`/admin/leave-requests/${id}`, { status: decision, admin_remark: remarks[id] || '' });
    } catch {}
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: decision, admin_remark: remarks[id] || '' } : l));
    setProcessing(p => ({ ...p, [id]: false }));
  };

  const counts = { All: leaves.length, Pending: leaves.filter(l => l.status === 'Pending').length, Approved: leaves.filter(l => l.status === 'Approved').length, Rejected: leaves.filter(l => l.status === 'Rejected').length };

  const filtered = leaves.filter(l => {
    const matchSearch = !search || l.student_name.toLowerCase().includes(search.toLowerCase()) || l.reg_no.includes(search);
    const matchFilter = filter === 'All' || l.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <LoadingSpinner message="Loading leave requests..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
          <h1 className="text-lg font-bold text-slate-900">Leave Approvals</h1>
        </div>
        <p className="text-xs text-slate-500">Review all student leave requests from every department</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`erp-card p-3 text-center transition-all ${filter === s ? 'ring-2 ring-blue-400' : ''}`}>
            <p className={`text-2xl font-bold ${s === 'Approved' ? 'text-emerald-600' : s === 'Rejected' ? 'text-rose-500' : s === 'Pending' ? 'text-amber-600' : 'text-slate-700'}`}>{counts[s]}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>

      {filtered.length === 0 ? (
        <div className="erp-card p-10 text-center text-slate-400 text-sm">No {filter.toLowerCase()} leave requests.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const cfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.Pending;
            return (
              <div key={l.id} className="erp-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800">{l.student_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({l.reg_no})</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{l.department}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{l.leave_type}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{l.from_date} → {l.to_date}</p>
                    {l.reason && <p className="text-[11px] text-slate-400 italic mt-1">"{l.reason}"</p>}
                    {l.admin_remark && <p className="text-[11px] text-blue-600 mt-1">Your remark: {l.admin_remark}</p>}
                  </div>
                  {l.status === 'Pending' && (
                    <div className="flex flex-col gap-2 sm:min-w-[180px]">
                      <input placeholder="Add remark..." value={remarks[l.id] || ''}
                        onChange={(e) => setRemarks(r => ({ ...r, [l.id]: e.target.value }))}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <div className="flex gap-2">
                        <button disabled={processing[l.id]} onClick={() => handleDecision(l.id, 'Approved')}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                          Approve
                        </button>
                        <button disabled={processing[l.id]} onClick={() => handleDecision(l.id, 'Rejected')}
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
