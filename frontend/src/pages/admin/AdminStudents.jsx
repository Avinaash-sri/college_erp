import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { Users, Plus, Edit2, Trash2, Eye, Search, AlertCircle, GraduationCap } from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    reg_no: '',
    email: '',
    phone: '',
    department_id: '',
    semester: 6,
    section: 'A',
    parent_name: '',
    parent_email: '',
    address: '',
    password: 'student123'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStudentsAndDepts = async () => {
    try {
      const [stRes, deptRes] = await Promise.all([
        client.get('/admin/students'),
        client.get('/admin/departments')
      ]);
      const stList = Array.isArray(stRes.data) ? stRes.data : (Array.isArray(stRes.data?.data) ? stRes.data.data : []);
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : (Array.isArray(deptRes.data?.data) ? deptRes.data.data : []);
      setStudents(stList);
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
    fetchStudentsAndDepts();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      reg_no: '',
      email: '',
      phone: '',
      department_id: departments[0]?.id || 1,
      semester: 6,
      section: 'A',
      parent_name: '',
      parent_email: '',
      address: '',
      password: 'student123'
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStudent(st);
    setFormData({
      name: st.name,
      reg_no: st.reg_no,
      email: st.email,
      phone: st.phone || '',
      department_id: st.department_id,
      semester: st.semester,
      section: st.section,
      parent_name: st.parent_name,
      parent_email: st.parent_email,
      address: st.address || '',
      password: ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student account? All attendance records will be removed.')) return;
    try {
      await client.delete(`/admin/students/${id}`);
      fetchStudentsAndDepts();
    } catch (e) {
      alert('Failed to delete student');
    }
  };

  const handleRecalculateCGPA = async () => {
    setRecalculating(true);
    try {
      const res = await client.post('/admin/recalculate-cgpa');
      alert(res.data?.message || 'Academic CGPA evaluated & saved to database for all students!');
      fetchStudentsAndDepts();
    } catch (e) {
      alert('Failed to recalculate CGPA');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingStudent) {
        await client.put(`/admin/students/${editingStudent.id}`, formData);
      } else {
        await client.post('/admin/students', formData);
      }
      setModalOpen(false);
      fetchStudentsAndDepts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save student record.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.reg_no.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading student directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Directory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Enroll new students, configure registered parent alerts, and manage academic records</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRecalculateCGPA}
            disabled={recalculating}
            className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            title="Recalculate & store CGPA = sum(GP * Credits) / sum(Credits) in DB"
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>{recalculating ? 'Evaluating...' : 'Recalculate CGPA (All)'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {/* Search Bar */}
        <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, reg no, email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-400">{filteredStudents.length} Students Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Reg No</th>
                <th className="py-3 px-3">Department &amp; Sem</th>
                <th className="py-3 px-3 text-center">Attendance %</th>
                <th className="py-3 px-3 text-center">Risk Status</th>
                <th className="py-3 px-3 text-center">CGPA</th>
                <th className="py-3 px-3">Registered Parent Info</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{st.name}</div>
                    <div className="text-[11px] text-slate-400">{st.email}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">{st.reg_no}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">
                    {st.department_name} (Sem {st.semester}-{st.section})
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                    {st.overall_attendance}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <StatusBadge status={st.risk_level} />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/80">
                      {st.cgpa ? parseFloat(st.cgpa).toFixed(2) : '--'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-xs font-semibold text-slate-800">{st.parent_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{st.parent_email}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(st)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-700 transition-colors"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(st.id)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-rose-700 transition-colors"
                        title="Delete Student"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Student Full Name *
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
                Register Number *
              </label>
              <input
                type="text"
                required
                disabled={!!editingStudent}
                value={formData.reg_no}
                onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Student Email *
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
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Parent Info */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Parent / Guardian Name *
              </label>
              <input
                type="text"
                required
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Parent Email (For SMTP Alerts) *
              </label>
              <input
                type="email"
                required
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {!editingStudent && (
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
              {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
