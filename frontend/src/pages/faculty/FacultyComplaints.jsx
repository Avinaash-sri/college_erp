import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { MessageSquare, CheckCircle2, Clock, Send, AlertCircle, Filter } from 'lucide-react';

export default function FacultyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [statusVal, setStatusVal] = useState('Resolved');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchComplaints = () => {
    client.get(`/faculty/complaints?status_filter=${filter}`)
      .then((res) => setComplaints(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const handleOpenRespond = (c) => {
    setSelectedComplaint(c);
    setResponseText(c.response || '');
    setStatusVal(c.status === 'Open' ? 'Resolved' : c.status);
    setModalOpen(true);
  };

  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSaving(true);

    try {
      await client.put(`/faculty/complaints/${selectedComplaint.id}/respond`, {
        status: statusVal,
        response: responseText
      });
      setToast('Response and resolution saved successfully.');
      setModalOpen(false);
      fetchComplaints();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update grievance ticket.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading department student complaints..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department Student Grievances</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and respond to academic, attendance, and campus concerns submitted by department students
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs font-semibold">
          {['All', 'Open', 'In Progress', 'Resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === s ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
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
            <p>No complaints found matching the "{filter}" filter.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold text-slate-900">{c.subject}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {c.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Student: <strong className="text-slate-800">{c.student_name}</strong> ({c.student_reg_no}) &bull; {c.department_name}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <StatusBadge status={c.status.toUpperCase()} />
                  <button
                    type="button"
                    onClick={() => handleOpenRespond(c)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    {c.response ? 'Update Response' : 'Respond'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                {c.description}
              </p>

              {c.response && (
                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                  <div className="font-bold flex items-center space-x-1.5 mb-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Faculty Response on Record:</span>
                  </div>
                  <p className="leading-relaxed">{c.response}</p>
                  <span className="block text-[10px] text-emerald-700 mt-1.5">
                    Last modified: {new Date(c.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Respond to Grievance: ${selectedComplaint?.subject || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedComplaint && (
          <form onSubmit={handleSaveResponse} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Student Description:</span>
              <p>{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Resolution Status *
              </label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Open">Open (Pending Further Investigation)</option>
                <option value="In Progress">In Progress (Under Active Resolution)</option>
                <option value="Resolved">Resolved (Matter Closed / Addressed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Faculty Resolution Remarks *
              </label>
              <textarea
                required
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter formal response or instructions for the student..."
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
                {saving ? 'Saving...' : 'Submit Resolution'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
