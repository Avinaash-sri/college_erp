import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  BookMarked,
  Plus,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Download,
  Mail,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [reminderLogsModalOpen, setReminderLogsModalOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterFilter, setRosterFilter] = useState('All'); // 'All', 'Pending', 'Submitted', 'Late', 'Graded'
  const [rosterSearch, setRosterSearch] = useState('');

  // Grading state
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [returnForResubmission, setReturnForResubmission] = useState(false);
  const [gradingSaving, setGradingSaving] = useState(false);

  // Reminder trigger state
  const [triggeringReminder, setTriggeringReminder] = useState(false);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    department_id: '',
    semester: 6,
    section: 'A',
    due_date: '',
    due_time: '23:59',
    max_marks: 10.0,
    allowed_file_types: 'pdf,docx,zip,txt',
    max_file_size_mb: 10,
    submission_format: 'both',
    allow_resubmission: true,
    allow_late: true,
    reminder_interval_minutes: 60,
    status: 'published',
    excluded_student_ids: []
  });

  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await client.get('/faculty/assignments');
      setAssignments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Fetch eligible students when department, semester, section changes
  useEffect(() => {
    if (formData.department_id && createModalOpen) {
      setFetchingStudents(true);
      client.get('/faculty/students-by-filter', {
        params: {
          department_id: formData.department_id,
          semester: formData.semester,
          section: formData.section
        }
      })
        .then((res) => {
          setEligibleStudents(res.data);
          setFormData((prev) => ({ ...prev, excluded_student_ids: [] }));
        })
        .catch((e) => console.error(e))
        .finally(() => setFetchingStudents(false));
    }
  }, [formData.department_id, formData.semester, formData.section, createModalOpen]);

  const handleOpenCreateModal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dateStr = d.toISOString().split('T')[0];

    client.get('/faculty/me').then((res) => {
      setFormData({
        title: '',
        description: '',
        subject_id: '',
        department_id: res.data.department_id || 1,
        semester: 6,
        section: 'A',
        due_date: dateStr,
        due_time: '23:59',
        max_marks: 10.0,
        allowed_file_types: 'pdf,docx,zip,txt',
        max_file_size_mb: 10,
        submission_format: 'both',
        allow_resubmission: true,
        allow_late: true,
        reminder_interval_minutes: 60,
        status: 'published',
        excluded_student_ids: []
      });
      setCreateModalOpen(true);
    });
  };

  const toggleStudentExclusion = (studentId) => {
    setFormData((prev) => {
      const exists = prev.excluded_student_ids.includes(studentId);
      const newExcluded = exists
        ? prev.excluded_student_ids.filter((id) => id !== studentId)
        : [...prev.excluded_student_ids, studentId];
      return { ...prev, excluded_student_ids: newExcluded };
    });
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter an assignment title');
      return;
    }
    if (!formData.subject_id) {
      alert('Please enter a subject ID');
      return;
    }

    setSaving(true);
    try {
      await client.post('/faculty/assignments', {
        ...formData,
        subject_id: parseInt(formData.subject_id),
        department_id: parseInt(formData.department_id),
        max_marks: parseFloat(formData.max_marks),
        reminder_interval_minutes: parseInt(formData.reminder_interval_minutes) || 60
      });
      setCreateModalOpen(false);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRoster = async (asgn) => {
    setSelectedAssignment(asgn);
    setRosterModalOpen(true);
    setRosterLoading(true);
    setRosterFilter('All');
    setRosterSearch('');
    try {
      const res = await client.get(`/faculty/assignments/${asgn.id}/roster`);
      setRosterData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleOpenGradeModal = (item) => {
    setSelectedStudentForGrading(item);
    setGradeMarks(item.marks_obtained !== null ? item.marks_obtained : '');
    setGradeFeedback(item.faculty_feedback || '');
    setReturnForResubmission(false);
    setGradeModalOpen(true);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedStudentForGrading) return;

    setGradingSaving(true);
    try {
      await client.post(`/faculty/assignments/${selectedAssignment.id}/grade/${selectedStudentForGrading.student_id}`, {
        marks_obtained: parseFloat(gradeMarks) || 0.0,
        faculty_feedback: gradeFeedback,
        return_for_resubmission: returnForResubmission
      });

      setGradeModalOpen(false);
      // Refresh roster
      const res = await client.get(`/faculty/assignments/${selectedAssignment.id}/roster`);
      setRosterData(res.data);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit grade');
    } finally {
      setGradingSaving(false);
    }
  };

  const handleTriggerManualReminders = async () => {
    if (!selectedAssignment) return;
    setTriggeringReminder(true);
    try {
      const res = await client.post(`/faculty/assignments/${selectedAssignment.id}/trigger-reminders`);
      alert(`Automated reminders dispatched! Sent: ${res.data.sent_count}, Skipped: ${res.data.skipped_count}, Failed: ${res.data.failed_count}`);
      // Refresh roster
      const rRes = await client.get(`/faculty/assignments/${selectedAssignment.id}/roster`);
      setRosterData(rRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to trigger reminders');
    } finally {
      setTriggeringReminder(false);
    }
  };

  const handleOpenReminderLogs = async () => {
    if (!selectedAssignment) return;
    setReminderLogsModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await client.get(`/faculty/assignments/${selectedAssignment.id}/reminder-logs`);
      setReminderLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment? All submissions and files will be erased.')) return;
    try {
      await client.delete(`/faculty/assignments/${id}`);
      fetchAssignments();
      setRosterModalOpen(false);
    } catch (e) {
      alert('Failed to delete assignment');
    }
  };

  if (loading) return <LoadingSpinner message="Loading faculty assignment manager..." />;

  // Filter roster items
  let filteredRoster = rosterData ? rosterData.roster : [];
  if (rosterFilter === 'Pending') {
    filteredRoster = filteredRoster.filter((r) => r.status.includes('Pending') || r.status.includes('Returned'));
  } else if (rosterFilter === 'Submitted') {
    filteredRoster = filteredRoster.filter((r) => r.status === 'Submitted');
  } else if (rosterFilter === 'Late') {
    filteredRoster = filteredRoster.filter((r) => r.status === 'Late');
  } else if (rosterFilter === 'Graded') {
    filteredRoster = filteredRoster.filter((r) => r.status === 'Graded');
  }

  if (rosterSearch.trim()) {
    const q = rosterSearch.toLowerCase();
    filteredRoster = filteredRoster.filter(
      (r) => r.name.toLowerCase().includes(q) || r.reg_no.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }

  const safeEligible = Array.isArray(eligibleStudents) ? eligibleStudents : [];
  const safeExcluded = Array.isArray(formData?.excluded_student_ids) ? formData.excluded_student_ids : [];
  const totalEligibleCount = safeEligible.length - safeExcluded.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assignment Management &amp; Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create assignments, track submissions with real-time red pending indicators, and manage automated email reminders
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No assignments created yet. Click "Create New Assignment" to publish your first coursework.
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {a.subject_code} &bull; {a.subject_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      a.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Format: {a.submission_format === 'both' ? 'File or Drive' : a.submission_format}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{a.description}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {a.due_date} {a.due_time}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Max: {a.max_marks} Marks</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reminder: Every {a.reminder_interval_minutes}m</span>
                  </span>
                </div>

                {/* Submissions Stats Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                    Total: {a.total_eligible}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Submitted: {a.submitted_count}
                  </span>
                  {a.pending_count > 0 ? (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 animate-pulse">
                      Pending: {a.pending_count}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded">
                      Pending: 0
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    Graded: {a.graded_count}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => handleOpenRoster(a)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 shadow-2xs transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Submission Roster</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Academic Assignment"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Lab Exercise 4: AVL Trees and Hash Tables Implementation"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Detailed Instructions &amp; Objectives *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specify deliverable guidelines, code quality expectations, test cases..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Subject ID *
              </label>
              <input
                type="number"
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                placeholder="e.g. 1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
              <span className="text-[10px] text-slate-400">1=DS, 2=CN, 3=OS, 4=DBMS, 5=SE</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department ID
              </label>
              <input
                type="number"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="All">All Sections (A &amp; B)</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Maximum Marks
              </label>
              <input
                type="number"
                step="0.5"
                min={1}
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Submission Format
              </label>
              <select
                value={formData.submission_format}
                onChange={(e) => setFormData({ ...formData, submission_format: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="both">File Upload or Google Drive Link (Either)</option>
                <option value="file">File Upload Only</option>
                <option value="drive_link">Google Drive Link Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Allowed File Types
              </label>
              <input
                type="text"
                value={formData.allowed_file_types}
                onChange={(e) => setFormData({ ...formData, allowed_file_types: e.target.value })}
                placeholder="pdf,docx,zip,txt"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Automated Reminder Interval (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={1440}
                value={formData.reminder_interval_minutes}
                onChange={(e) => setFormData({ ...formData, reminder_interval_minutes: parseInt(e.target.value) || 60 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
              <span className="text-[10px] text-slate-400">Default: 60 mins (Hourly persistent reminder emails to pending students)</span>
            </div>
          </div>

          {/* Policy Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_resubmission}
                onChange={(e) => setFormData({ ...formData, allow_resubmission: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-semibold text-slate-700">Allow Resubmissions</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_late}
                onChange={(e) => setFormData({ ...formData, allow_late: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-semibold text-slate-700">Accept Late Submissions</span>
            </label>
          </div>

          {/* ELIGIBLE ROSTER & EXCLUSIONS */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-blue-700" />
                  <span>Eligible Students ({totalEligibleCount} Included, {safeExcluded.length} Excluded)</span>
                </h4>
                <p className="text-[11px] text-slate-500">Untick any student to formally exclude them from this assignment.</p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, excluded_student_ids: [] }))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, excluded_student_ids: eligibleStudents.map((s) => s.id) }))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Exclude All
                </button>
              </div>
            </div>

            {fetchingStudents ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading department students...</div>
            ) : eligibleStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No students found matching this department.</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {eligibleStudents.map((s) => {
                  const isExcluded = formData.excluded_student_ids.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                        isExcluded ? 'bg-rose-50/50 text-slate-400' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleStudentExclusion(s.id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[11px] text-slate-400">({s.reg_no} - Sec {s.section})</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isExcluded ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {isExcluded ? 'Excluded' : 'Included'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-2xs"
            >
              {saving ? 'Publishing Assignment...' : 'Publish Assignment & Start Reminders'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUBMISSION ROSTER MODAL WITH RED PENDING INDICATORS */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={selectedAssignment ? `Submission Roster: ${selectedAssignment.title}` : 'Submissions'}
        maxWidth="max-w-5xl"
      >
        {rosterLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student submission roster...</div>
        ) : rosterData ? (
          <div className="space-y-4">
            {/* Top Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-xl font-black text-slate-900">{rosterData.total_eligible}</span>
                <p className="text-[11px] text-slate-500 font-medium">Total Eligible</p>
              </div>

              {/* RED PENDING COUNTER */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-xl font-black text-rose-700">{rosterData.pending_count}</span>
                <p className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">Pending (Not Submitted)</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-xl font-black text-emerald-800">{rosterData.submitted_count}</span>
                <p className="text-[11px] text-emerald-700 font-medium">Submitted</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <span className="text-xl font-black text-blue-800">{rosterData.graded_count}</span>
                <p className="text-[11px] text-blue-700 font-medium">Graded</p>
              </div>
            </div>

            {/* Scheduler Status & Reminder Actions Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-semibold text-slate-800">Automated Hourly Reminder Service:</span>
                <span className="text-slate-600">Active (Repeats every 60 mins for pending students)</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={triggeringReminder}
                  onClick={handleTriggerManualReminders}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs disabled:opacity-50"
                  title="Dispatches email reminders immediately to all pending students"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{triggeringReminder ? 'Sending Reminders...' : 'Send Manual Reminder Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenReminderLogs}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-700 hover:bg-slate-50"
                  title="View delivery log history"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Reminder Logs</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'Pending', 'Submitted', 'Late', 'Graded'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setRosterFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      rosterFilter === f
                        ? f === 'Pending'
                          ? 'bg-rose-700 text-white'
                          : 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or reg no..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-3 py-2.5">Reg No</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Submission / Link</th>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-4 py-2.5">Reminder Tracking</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRoster.map((r) => {
                    const isPending = r.status.includes('Pending') || r.status.includes('Returned');
                    return (
                      <tr
                        key={r.student_id}
                        className={`transition-colors ${
                          isPending ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className={`font-semibold ${isPending ? 'text-rose-900 font-bold' : 'text-slate-900'}`}>
                            {r.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{r.email}</p>
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-600">{r.reg_no}</td>

                        {/* STATUS BADGE - CLEAR RED INDICATOR FOR PENDING STUDENTS */}
                        <td className="px-3 py-3">
                          {isPending ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Pending — Not Submitted</span>
                            </span>
                          ) : r.status === 'Graded' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              Graded
                            </span>
                          ) : r.status === 'Late' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              Late Submission
                            </span>
                          ) : r.status === 'Excluded' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400">
                              Excluded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Submitted
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {r.submission_type === 'file' && r.submission_id ? (
                            <a
                              href={r.file_path?.startsWith('http') ? r.file_path : `#submission-${r.submission_id}`}
                              onClick={(e) => {
                                if (!r.file_path?.startsWith('http')) {
                                  e.preventDefault();
                                  alert(`Accessing submitted file: ${r.file_name} for ${r.name} (${r.reg_no})`);
                                }
                              }}
                              className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold underline"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{r.file_name}</span>
                            </a>
                          ) : r.submission_type === 'drive_link' && r.drive_link ? (
                            <a
                              href={r.drive_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 font-semibold underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Google Drive</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No file or link</span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {r.marks_obtained !== null ? (
                            <span className="font-bold text-slate-900">
                              {r.marks_obtained} / {r.max_marks}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {isPending ? (
                            <div>
                              <p className="font-semibold text-rose-700">Notice #{r.reminder_count}</p>
                              <p className="text-[10px] text-slate-400">
                                {r.last_reminder_sent_at ? `Sent ${new Date(r.last_reminder_sent_at).toLocaleTimeString()}` : 'Awaiting dispatch'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-medium">Reminders Stopped</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {!isPending && r.status !== 'Excluded' ? (
                            <button
                              onClick={() => handleOpenGradeModal(r)}
                              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200"
                            >
                              {r.status === 'Graded' ? 'Edit Grade' : 'Grade'}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* GRADE SUBMISSION MODAL */}
      <Modal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title={selectedStudentForGrading ? `Evaluate: ${selectedStudentForGrading.name}` : 'Grade'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitGrade} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Marks Awarded (Max: {selectedStudentForGrading?.max_marks || 10}) *
            </label>
            <input
              type="number"
              step="0.5"
              min={0}
              max={selectedStudentForGrading?.max_marks || 10}
              required={!returnForResubmission}
              value={gradeMarks}
              onChange={(e) => setGradeMarks(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Feedback / Evaluation Notes
            </label>
            <textarea
              rows={3}
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              placeholder="Constructive feedback for student improvement..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={returnForResubmission}
              onChange={(e) => setReturnForResubmission(e.target.checked)}
              className="rounded border-slate-300 text-amber-600"
            />
            <span className="text-amber-800">Return for Resubmission (Requires Student Revision)</span>
          </label>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setGradeModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradingSaving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {gradingSaving ? 'Saving...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* REMINDER AUDIT LOGS MODAL */}
      <Modal
        isOpen={reminderLogsModalOpen}
        onClose={() => setReminderLogsModalOpen(false)}
        title="Automated Email Reminder Audit Trail"
        maxWidth="max-w-3xl"
      >
        {loadingLogs ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading reminder logs...</div>
        ) : reminderLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No reminders dispatched yet for this assignment.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Recipient Email</th>
                  <th className="px-3 py-2">Timestamp (UTC)</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Notice #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reminderLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{l.student_name}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{l.recipient_email}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(l.sent_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        l.status === 'Sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-700">Notice #{l.attempt_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
