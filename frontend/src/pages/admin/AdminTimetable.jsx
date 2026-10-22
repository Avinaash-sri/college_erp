import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { Clock, Plus, Trash2, MapPin } from 'lucide-react';

export default function AdminTimetable() {
  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '09:00 AM',
    end_time: '10:00 AM',
    subject_id: '',
    faculty_id: '',
    room: 'LH-301',
    department_id: '',
    semester: 6,
    section: 'A'
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [ttRes, subRes, facRes, deptRes] = await Promise.all([
        client.get('/admin/timetable'),
        client.get('/admin/subjects'),
        client.get('/admin/faculty'),
        client.get('/admin/departments')
      ]);
      const ttList = Array.isArray(ttRes.data) ? ttRes.data : [];
      const subList = Array.isArray(subRes.data) ? subRes.data : [];
      const facList = Array.isArray(facRes.data) ? facRes.data : [];
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : [];
      setEntries(ttList);
      setSubjects(subList);
      setFacultyList(facList);
      setDepartments(deptList);
      if (subList.length > 0 && !formData.subject_id) {
        setFormData(prev => ({
          ...prev,
          subject_id: subList[0].id,
          faculty_id: facList[0]?.id || 1,
          department_id: deptList[0]?.id || 1
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
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await client.delete(`/admin/timetable/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete timetable slot');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/timetable', {
        ...formData,
        subject_id: parseInt(formData.subject_id),
        faculty_id: parseInt(formData.faculty_id),
        department_id: parseInt(formData.department_id)
      });
      setModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to create timetable slot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading institutional timetable slots..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Master Timetable</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure period timings, room allocations, and faculty lecture schedules</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Timetable Slot</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Day</th>
                <th className="py-3 px-3">Period Timing</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Faculty</th>
                <th className="py-3 px-3">Room / Lab</th>
                <th className="py-3 px-3">Class Section</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{t.day_of_week}</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{t.start_time} - {t.end_time}</td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{t.subject_name} ({t.subject_code})</td>
                  <td className="py-3 px-3 text-slate-700">{t.faculty_name}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{t.room}</td>
                  <td className="py-3 px-3 text-slate-600">Sem {t.semester} - {t.section}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-700 transition-colors"
                      title="Delete slot"
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Timetable Slot" maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Day of Week *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Room / Venue *
              </label>
              <input
                type="text"
                required
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Start Time (e.g. 09:00 AM)
              </label>
              <input
                type="text"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                End Time (e.g. 10:00 AM)
              </label>
              <input
                type="text"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Teaching Faculty *
            </label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.department_name})</option>
              ))}
            </select>
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
              {saving ? 'Scheduling...' : 'Save Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
