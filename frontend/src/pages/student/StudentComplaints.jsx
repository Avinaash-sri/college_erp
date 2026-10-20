import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { MessageSquare, Plus, CheckCircle2, Clock, HelpCircle, AlertCircle } from 'lucide-react';

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Academic',
    description: ''
  });

  const fetchComplaints = () => {
    client.get('/students/me/complaints')
      .then((res) => setComplaints(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await client.post('/students/me/complaints', formData);
      setToast('Grievance ticket lodged successfully. Department officers have been notified.');
      setModalOpen(false);
      setFormData({ subject: '', category: 'Academic', description: '' });
      fetchComplaints();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit grievance ticket.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading support & grievance history..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Support &amp; Grievances</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit academic, attendance, facility, or administrative concerns directly to faculty &amp; administration
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setModalOpen(true); setError(''); }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge New Grievance</span>
        </button>
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center space-x-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>You have no active or historical grievances on record.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-slate-900">{c.subject}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {c.category}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-400">
                    Submitted: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <StatusBadge status={c.status.toUpperCase()} />
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{c.description}</p>

              {/* Administrative Resolution Response */}
              {c.response ? (
                <div className="mt-3 rounded-lg bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                  <div className="font-bold flex items-center space-x-1.5 mb-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Resolution Response:</span>
                  </div>
                  <p className="leading-relaxed">{c.response}</p>
                  <span className="block text-[10px] text-emerald-700 mt-2">
                    Updated: {new Date(c.updated_at).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Awaiting review by faculty advisor or department chairperson.</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lodge Grievance Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Lodge Student Grievance / Inquiry" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              <option value="Academic">Academic (Curriculum, Lectures, Exams)</option>
              <option value="Attendance">Attendance (Discrepancy, Leave, Medical)</option>
              <option value="Facilities">Campus Facilities &amp; Labs</option>
              <option value="Fees">Fee Clearance &amp; Payments</option>
              <option value="Other">Other Administrative Query</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subject / Summary Title *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide complete facts, relevant dates, and details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
