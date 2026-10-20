import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { FileText, Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Semester Midterm Examination',
    subject_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00 AM',
    end_time: '12:00 PM',
    venue: 'Auditorium Hall A',
    semester: 6,
    department_id: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [exRes, subRes, deptRes] = await Promise.all([
        client.get('/admin/exams'),
        client.get('/admin/subjects'),
        client.get('/admin/departments')
      ]);
      setExams(exRes.data);
      setSubjects(subRes.data);
      setDepartments(deptRes.data);
      if (subRes.data.length > 0 && !formData.subject_id) {
        setFormData(prev => ({
          ...prev,
          subject_id: subRes.data[0].id,
          department_id: deptRes.data[0]?.id || 1
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this scheduled examination?')) return;
    try {
      await client.delete(`/admin/exams/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete exam');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/exams', {
        ...formData,
        subject_id: parseInt(formData.subject_id),
        department_id: parseInt(formData.department_id)
      });
      setModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to schedule exam');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading examinations schedule..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Examinations Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure midterm and semester-end examinations, halls, and timings</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Exam</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Exam Name</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Exam Venue</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{ex.name}</td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{ex.subject_name} ({ex.subject_code})</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{ex.start_time} - {ex.end_time}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{ex.venue}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-700 transition-colors"
                      title="Cancel exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Examination" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course Subject *
            </label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hall / Venue *
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. Auditorium Hall A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
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
              {saving ? 'Scheduling...' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
