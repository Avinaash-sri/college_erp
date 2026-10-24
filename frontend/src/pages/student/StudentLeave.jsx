import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CalendarDays, Plus, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const STATUS_CONFIG = {
  Pending:   { color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock,         label: 'Pending' },
  Approved:  { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Approved' },
  Rejected:  { color: 'bg-rose-50 text-rose-700 border-rose-200',     icon: XCircle,       label: 'Rejected' },
};

const LEAVE_TYPES = ['Medical Leave', 'Personal Leave', 'Family Emergency', 'Event Participation', 'Other'];

export default function StudentLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0],
    from_date: '',
    to_date: '',
    reason: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchLeaves = () => {
    client.get('/students/leave-requests')
      .then((res) => setLeaves(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason.trim()) {
      setFeedback({ type: 'error', msg: 'Please fill all required fields.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await client.post('/students/leave-requests', form);
      setFeedback({ type: 'success', msg: 'Leave request submitted successfully.' });
      setShowForm(false);
      setForm({ leave_type: LEAVE_TYPES[0], from_date: '', to_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Failed to submit leave request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const getDays = (from, to) => {
    const d1 = new Date(from), d2 = new Date(to);
    return Math.max(1, Math.round((d2 - d1) / (1000*60*60*24)) + 1);
  };

  if (loading) return <LoadingSpinner message="Loading your leave requests..." />;

  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
            <h1 className="text-lg font-bold text-slate-900">Leave Requests</h1>
          </div>
          <p className="text-xs text-slate-500">Apply for leave — your faculty will review and approve</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFeedback(null); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-500' },
        ].map((s) => (
          <div key={s.label} className="erp-card p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`erp-card p-3 flex items-center gap-2 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {/* Apply Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
                <select
                  value={form.leave_type}
                  onChange={(e) => setForm({...form, leave_type: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                  <input
                    type="date" min={today} value={form.from_date}
                    onChange={(e) => setForm({...form, from_date: e.target.value})}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
                  <input
                    type="date" min={form.from_date || today} value={form.to_date}
                    onChange={(e) => setForm({...form, to_date: e.target.value})}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the reason for your leave request..."
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Your Leave History</h2>
        </div>
        {leaves.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No leave requests yet</p>
            <p className="text-xs text-slate-300 mt-1">Click "Apply for Leave" to submit your first request</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {leaves.map((l) => {
              const cfg = getStatusConfig(l.status);
              const StatusIcon = cfg.icon;
              return (
                <div key={l.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{l.leave_type}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {l.from_date} → {l.to_date}
                        {l.from_date && l.to_date && ` · ${getDays(l.from_date, l.to_date)} day${getDays(l.from_date, l.to_date) > 1 ? 's' : ''}`}
                      </p>
                      {l.reason && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{l.reason}"</p>}
                      {l.faculty_remark && <p className="text-[11px] text-blue-600 mt-0.5">Faculty: {l.faculty_remark}</p>}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
