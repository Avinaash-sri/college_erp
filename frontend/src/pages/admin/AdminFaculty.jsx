import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { UserCheck, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    emp_id: '',
    email: '',
    phone: '',
    department_id: '',
    designation: 'Assistant Professor',
    password: 'faculty123'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchFacultyAndDepts = async () => {
    try {
      const [facRes, deptRes] = await Promise.all([
        client.get('/admin/faculty'),
        client.get('/admin/departments')
      ]);
      const facList = Array.isArray(facRes.data) ? facRes.data : (Array.isArray(facRes.data?.data) ? facRes.data.data : []);
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : (Array.isArray(deptRes.data?.data) ? deptRes.data.data : []);
      setFaculty(facList);
      setDepartments(deptList);
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
    fetchFacultyAndDepts();
  }, []);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      emp_id: '',
      email: '',
      phone: '',
      department_id: departments[0]?.id || 1,
      designation: 'Assistant Professor',
      password: 'faculty123'
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFaculty(f);
    setFormData({
      name: f.name,
      emp_id: f.emp_id,
      email: f.email,
      phone: f.phone || '',
      department_id: f.department_id,
      designation: f.designation,
      password: ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty record? Assigned subjects and timetable entries will be unassigned.')) return;
    try {
      await client.delete(`/admin/faculty/${id}`);
      fetchFacultyAndDepts();
    } catch (e) {
      alert('Failed to delete faculty member');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingFaculty) {
        await client.put(`/admin/faculty/${editingFaculty.id}`, formData);
      } else {
        await client.post('/admin/faculty', formData);
      }
      setModalOpen(false);
      fetchFacultyAndDepts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save faculty record.');
    } finally {
      setSaving(false);
    }
  };

  const filteredFaculty = faculty.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.emp_id.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading faculty directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty Staff Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage teaching staff appointments, departments, and course assignments</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name, ID, email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-400">{filteredFaculty.length} Faculty Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Faculty Name</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Contact Email</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-[11px] text-slate-400">{f.phone || '+91 98765 43210'}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">{f.emp_id}</td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">{f.department_name}</td>
                  <td className="py-3.5 px-3 text-slate-600">{f.designation}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-700">{f.email}</td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(f)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-700 transition-colors"
                        title="Edit Faculty"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-rose-700 transition-colors"
                        title="Delete Faculty"
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaculty ? `Edit Faculty: ${editingFaculty.name}` : 'Add Faculty Member'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                disabled={!!editingFaculty}
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </div>
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
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {!editingFaculty && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Default Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
