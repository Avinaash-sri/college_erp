import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Users,
  GraduationCap
} from 'lucide-react';

export default function AdminExams() {
  const [activeTab, setActiveTab] = useState('marks'); // 'marks' or 'schedules'
  const [loading, setLoading] = useState(true);

  // Schedules state
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
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

  // Marks state
  const [marks, setMarks] = useState([]);
  const [deptFilter, setDeptFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [marksLoading, setMarksLoading] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [exRes, subRes, deptRes, marksRes] = await Promise.all([
        client.get('/admin/exams'),
        client.get('/admin/subjects'),
        client.get('/admin/departments'),
        client.get('/admin/marks')
      ]);
      const exList = Array.isArray(exRes.data) ? exRes.data : [];
      const subList = Array.isArray(subRes.data) ? subRes.data : [];
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : [];
      const marksList = Array.isArray(marksRes.data) ? marksRes.data : [];

      setExams(exList);
      setSubjects(subList);
      setDepartments(deptList);
      setMarks(marksList);

      if (subList.length > 0 && !formData.subject_id) {
        setFormData((prev) => ({
          ...prev,
          subject_id: subList[0].id,
          department_id: deptList[0]?.id || 1
        }));
      }
    } catch (e) {
      console.error('Failed to load admin examination records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch filtered marks whenever department, subject, or search filters change
  const fetchFilteredMarks = async () => {
    try {
      setMarksLoading(true);
      const params = new URLSearchParams();
      if (deptFilter !== 'All') params.append('department_id', deptFilter);
      if (subjectFilter !== 'All') params.append('subject_id', subjectFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await client.get(`/admin/marks?${params.toString()}`);
      setMarks(res.data || []);
    } catch (err) {
      console.error('Failed to query marks:', err);
    } finally {
      setMarksLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchFilteredMarks();
    }
  }, [deptFilter, subjectFilter, searchQuery]);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this scheduled examination?')) return;
    try {
      await client.delete(`/admin/exams/${id}`);
      const exRes = await client.get('/admin/exams');
      setExams(exRes.data || []);
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
      const exRes = await client.get('/admin/exams');
      setExams(exRes.data || []);
    } catch (e) {
      alert('Failed to schedule exam');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Aggregating academic marks and exam schedules..." />;

  // Filtered subjects for dropdown based on dept filter
  const availableSubjects = deptFilter === 'All'
    ? subjects
    : subjects.filter((s) => s.department_id === parseInt(deptFilter));

  // Compute metrics from current marks dataset
  const evaluatedMarks = marks.filter((m) => m.total !== null);
  const avgScore = evaluatedMarks.length > 0
    ? +(evaluatedMarks.reduce((acc, m) => acc + m.total, 0) / evaluatedMarks.length).toFixed(1)
    : 0;
  const passCount = evaluatedMarks.filter((m) => m.grade && m.grade !== 'F').length;
  const passRate = evaluatedMarks.length > 0
    ? +((passCount / evaluatedMarks.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Banner with Tab Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Academic Examinations &amp; Marks</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Institutional Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional Continuous Internal Assessment (CIA) marks records, grade ledger, and exam schedules
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('marks')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'marks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Academic Marks Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'schedules'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Exam Schedules</span>
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: ACADEMIC MARKS & ASSESSMENT RECORDS (Requirement 6) */}
      {/* ====================================================================== */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{marks.length}</div>
              <span className="text-[10px] text-slate-500">Enrolled student courses</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessed Records</span>
              <div className="text-xl font-bold text-blue-700 mt-1">{evaluatedMarks.length}</div>
              <span className="text-[10px] text-slate-500">{marks.length - evaluatedMarks.length} pending entry</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Institutional Average</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{avgScore} <span className="text-xs font-normal text-slate-400">/ 60</span></div>
              <span className="text-[10px] text-emerald-600 font-semibold">CIA Scale</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Passing Rate</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{passRate}%</div>
              <span className="text-[10px] text-slate-500">{passCount} cleared / {evaluatedMarks.length}</span>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Department Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => {
                    setDeptFilter(e.target.value);
                    setSubjectFilter('All');
                  }}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 bg-white font-medium"
                >
                  <option value="All">All Departments (ECE, IT, CSE)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Subject:</span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 bg-white font-medium max-w-[200px] truncate"
                >
                  <option value="All">All Subjects</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, reg no, course..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Continuous Assessment Records &amp; Grades ({marks.length})
              </span>
              <span className="text-xs text-slate-400">Scale: CIA-1 (25) + CIA-2 (25) + Assignment (10) = 60</span>
            </div>

            {marksLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Updating marks records...</div>
            ) : marks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No marks records match the selected department, subject, or search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Reg No</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Dept</th>
                      <th className="py-3 px-3">Subject / Course</th>
                      <th className="py-3 px-3 text-center">CIA 1 (/25)</th>
                      <th className="py-3 px-3 text-center">CIA 2 (/25)</th>
                      <th className="py-3 px-3 text-center">Assignment (/10)</th>
                      <th className="py-3 px-3 text-center">Total (/60)</th>
                      <th className="py-3 px-3 text-center">Calculated Grade</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marks.map((row) => {
                      const isMissing = row.total === null;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800">{row.reg_no}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{row.name}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {row.department_id === 1 ? 'ECE' : row.department_id === 2 ? 'IT' : 'CSE'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-blue-700">{row.subject_code}</span>
                            <span className="text-slate-500 text-[11px] block truncate max-w-[180px]">{row.subject_name}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                            {row.internal_1 !== null ? row.internal_1 : <span className="text-slate-400 italic">Not available</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                            {row.internal_2 !== null ? row.internal_2 : <span className="text-slate-400 italic">Not available</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                            {row.assignment !== null ? row.assignment : <span className="text-slate-400 italic">Not available</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                            {row.total !== null ? row.total : <span className="text-slate-400 font-normal italic">Not available</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.grade ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  row.grade === 'A+'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : row.grade === 'A'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : row.grade === 'B+' || row.grade === 'B'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {row.grade}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Not available</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                row.status === 'Published'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {row.status || 'Published'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: INSTITUTIONAL EXAM SCHEDULES */}
      {/* ====================================================================== */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs"
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
                    <th className="py-3 px-3">Department</th>
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
                      <td className="py-3 px-3 text-slate-600 font-medium">{ex.department}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{ex.start_time} - {ex.end_time}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{ex.venue}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
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
        </div>
      )}

      {/* Modal for Scheduling New Exam */}
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Scheduling...' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
