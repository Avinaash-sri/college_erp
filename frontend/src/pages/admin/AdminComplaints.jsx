import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { MessageSquare, CheckCircle2, Trash2, Edit2, Search } from 'lucide-react';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [statusVal, setStatusVal] = useState('Resolved');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchComplaints = () => {
    client.get(`/admin/complaints?status_filter=${filter}`)
      .then((res) => setComplaints(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const handleOpenEdit = (c) => {
    setSelectedComplaint(c);
    setResponseText(c.response || '');
    setStatusVal(c.status);
    setModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSaving(true);

    try {
      await client.put(`/admin/complaints/${selectedComplaint.id}`, {
        status: statusVal,
        response: responseText
      });
      setToast('Complaint record updated successfully.');
      setModalOpen(false);
      fetchComplaints();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Failed to update complaint status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grievance record?')) return;
    try {
      await client.delete(`/admin/complaints/${id}`);
      fetchComplaints();
    } catch (err) {
      alert('Failed to delete complaint');
    }
  };

  const filtered = complaints.filter(
    (c) =>
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.student_reg_no.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading institutional complaints & grievances..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Grievance Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, arbitrate, and resolve student support tickets and academic appeals across all departments
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

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, reg no, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filtered.length} Grievance Tickets
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No grievances found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Category &amp; Subject</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Response</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{c.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.student_reg_no} &bull; {c.department_name || c.department || 'Computer Science and Engineering'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-1">
                        {c.category}
                      </span>
                      <div className="font-semibold text-slate-800">{c.subject}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={c.status.toUpperCase()} />
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      {c.response ? (
                        <p className="text-[11px] text-emerald-800 line-clamp-2">{c.response}</p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No response logged</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-md text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Review / Resolve Ticket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Respond Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Review Grievance Ticket #${selectedComplaint?.id || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedComplaint && (
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                <strong>Student:</strong> {selectedComplaint.student_name} ({selectedComplaint.student_reg_no})
              </div>
              <div>
                <strong>Subject:</strong> {selectedComplaint.subject}
              </div>
              <div>
                <strong>Description:</strong> {selectedComplaint.description}
              </div>
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
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Official Resolution Response
              </label>
              <textarea
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter administrative resolution notes..."
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
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
