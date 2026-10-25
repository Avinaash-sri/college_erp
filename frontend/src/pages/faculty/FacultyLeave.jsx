import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CalendarDays, CheckCircle, XCircle, Clock, User, Search } from 'lucide-react';

const STATUS_CONFIG = {
  Pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock,        label: 'Pending' },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Approved' },
  Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200',       icon: XCircle,      label: 'Rejected' },
};

// Demo data for leave requests
const DEMO_LEAVES = [
  { id: 1, student_name: 'Arjun Kumar', reg_no: 'CS2023001', leave_type: 'Medical Leave', from_date: '2026-10-22', to_date: '2026-10-24', reason: 'Fever and illness', status: 'Pending', department_name: 'CSE' },
  { id: 2, student_name: 'Priya Rajan', reg_no: 'CS2023002', leave_type: 'Family Emergency', from_date: '2026-10-20', to_date: '2026-10-20', reason: 'Family function', status: 'Approved', department_name: 'CSE', faculty_remark: 'Approved. Please submit medical certificate if medical leave.' },
  { id: 3, student_name: 'Vikram Pillai', reg_no: 'IT2023005', leave_type: 'Event Participation', from_date: '2026-10-25', to_date: '2026-10-26', reason: 'Inter-college hackathon', status: 'Pending', department_name: 'IT' },
];

export default function FacultyLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Pending');
  const [processing, setProcessing] = useState({});
  const [remarks, setRemarks] = useState({});

  const fetchLeaves = () => {
    client.get('/faculty/leave-requests')
      .then((res) => setLeaves(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleDecision = async (leaveId, decision) => {
    setProcessing(p => ({ ...p, [leaveId]: true }));
    try {
      await client.patch(`/faculty/leave-requests/${leaveId}`, {
        status: decision,
        faculty_remark: remarks[leaveId] || '',
      });
      setLeaves(prev => prev.map(l =>
        l.id === leaveId ? { ...l, status: decision, faculty_remark: remarks[leaveId] || '' } : l
      ));
    } catch {
      // Optimistic update if API not ready
      setLeaves(prev => prev.map(l =>
        l.id === leaveId ? { ...l, status: decision } : l
      ));
    } finally {
      setProcessing(p => ({ ...p, [leaveId]: false }));
    }
  };

  const getDays = (from, to) => Math.max(1, Math.round((new Date(to) - new Date(from)) / (1000*60*60*24)) + 1);

  const filtered = leaves.filter(l => {
    const matchSearch = !search || l.student_name.toLowerCase().includes(search.toLowerCase()) || l.reg_no.includes(search);
    const matchFilter = filter === 'All' || l.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = { All: leaves.length, Pending: leaves.filter(l => l.status === 'Pending').length, Approved: leaves.filter(l => l.status === 'Approved').length, Rejected: leaves.filter(l => l.status === 'Rejected').length };

  if (loading) return <LoadingSpinner message="Loading leave requests..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
          <h1 className="text-lg font-bold text-slate-900">Student Leave Requests</h1>
        </div>
        <p className="text-xs text-slate-500">Review and approve leave requests from your students</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s} <span className="ml-1 opacity-70">{counts[s]}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Leave cards */}
      {filtered.length === 0 ? (
        <div className="erp-card p-10 text-center">
          <p className="text-sm text-slate-400">No {filter.toLowerCase()} leave requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const cfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.Pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={l.id} className="erp-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-800">{l.student_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({l.reg_no})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700">{l.leave_type}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {l.from_date} → {l.to_date}
                      {l.from_date && l.to_date && ` (${getDays(l.from_date, l.to_date)} day${getDays(l.from_date, l.to_date) > 1 ? 's' : ''})`}
                    </p>
                    {l.reason && <p className="text-[11px] text-slate-400 mt-1 italic">"{l.reason}"</p>}
                    {l.faculty_remark && <p className="text-[11px] text-blue-600 mt-1">Your remark: {l.faculty_remark}</p>}
                  </div>

                  {l.status === 'Pending' && (
                    <div className="flex flex-col gap-2 sm:min-w-[200px]">
                      <input
                        placeholder="Add remark (optional)..."
                        value={remarks[l.id] || ''}
                        onChange={(e) => setRemarks(r => ({ ...r, [l.id]: e.target.value }))}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={processing[l.id]}
                          onClick={() => handleDecision(l.id, 'Approved')}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {processing[l.id] ? '...' : 'Approve'}
                        </button>
                        <button
                          disabled={processing[l.id]}
                          onClick={() => handleDecision(l.id, 'Rejected')}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          {processing[l.id] ? '...' : 'Reject'}
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
