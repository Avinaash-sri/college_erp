import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department_id: '',
    semester: 6,
    credits: 3,
    faculty_id: ''
  });
  const [saving, setSaving] = useState(false);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    department_id: '',
    semester: 6,
    credits: 3,
    faculty_id: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [subRes, deptRes, facRes] = await Promise.all([
        client.get('/admin/subjects'),
        client.get('/admin/departments'),
        client.get('/admin/faculty')
      ]);
      const subList = Array.isArray(subRes.data) ? subRes.data : (Array.isArray(subRes.data?.data) ? subRes.data.data : []);
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : (Array.isArray(deptRes.data?.data) ? deptRes.data.data : []);
      const facList = Array.isArray(facRes.data) ? facRes.data : (Array.isArray(facRes.data?.data) ? facRes.data.data : []);
      setSubjects(subList);
      setDepartments(deptList);
      setFacultyList(facList);
      if (deptList.length > 0 && !formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: deptList[0].id }));
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

  const handleStartEdit = (sub) => {
    setEditingSubject(sub);
    setEditFormData({
      code: sub.code,
      name: sub.name,
      department_id: sub.department_id,
      semester: sub.semester,
      credits: sub.credits,
      faculty_id: sub.faculty_id || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    setEditSaving(true);
    try {
      await client.put(`/admin/subjects/${editingSubject.id}`, {
        ...editFormData,
        faculty_id: editFormData.faculty_id ? parseInt(editFormData.faculty_id) : null
      });
      setEditModalOpen(false);
      setEditingSubject(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update course subject');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Are you sure you want to delete course subject "${sub.name}" (${sub.code})?`)) return;
    try {
      await client.delete(`/admin/subjects/${sub.id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete course subject. It may have linked attendance or marks.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/subjects', {
        ...formData,
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id) : null
      });
      setFormData({
        code: '',
        name: '',
        department_id: departments[0]?.id || 1,
        semester: 6,
        credits: 3,
        faculty_id: ''
      });
      setModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading courses and subjects..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Curriculum &amp; Course Subjects</h1>
          <p className="text-xs text-slate-500 mt-0.5">Catalog of accredited courses, department semester mappings, and assigned faculty</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course Subject</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Subject Code</th>
                <th className="py-3 px-3">Course Title</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">Semester</th>
                <th className="py-3 px-3 text-center">Credits</th>
                <th className="py-3 px-3">Handling Faculty</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-blue-700">{s.code}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">{s.department_name}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-700">Sem {s.semester}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">{s.credits}</td>
                  <td className="py-3.5 px-3 text-slate-700 font-semibold">{s.faculty_name || 'Unassigned'}</td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(s)}
                        className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Edit Subject"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Subject"
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
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Course Subject" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. CS606"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cloud Computing & Microservices"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Assign Faculty Member
            </label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              <option value="">-- Leave Unassigned --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.emp_id})</option>
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
              {saving ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Subject Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Course Subject" maxWidth="max-w-md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              value={editFormData.code}
              onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <select
                value={editFormData.department_id}
                onChange={(e) => setEditFormData({ ...editFormData, department_id: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={editFormData.credits}
                onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Assign Faculty Member
            </label>
            <select
              value={editFormData.faculty_id}
              onChange={(e) => setEditFormData({ ...editFormData, faculty_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              <option value="">-- Leave Unassigned --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.emp_id})</option>
              ))}
            </select>
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              {editSaving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
