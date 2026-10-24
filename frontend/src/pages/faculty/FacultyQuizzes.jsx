import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  HelpCircle,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  Share2,
  CheckSquare,
  Square,
  Sparkles,
  Send
} from 'lucide-react';

export default function FacultyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissionsRoster, setSubmissionsRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    department_id: '',
    semester: 6,
    section: 'A',
    duration_minutes: 30,
    deadline: '',
    start_time: '',
    status: 'published',
    allow_multiple_attempts: false,
    max_attempts: 1,
    excluded_student_ids: []
  });

  const [questions, setQuestions] = useState([
    {
      question_text: '',
      question_type: 'mcq',
      marks: 2.5,
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correct_answer: 'A',
      explanation: ''
    }
  ]);

  // Dynamic eligible students list fetched from database
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchQuizzes = async () => {
    try {
      const res = await client.get('/faculty/quizzes');
      setQuizzes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await client.get('/faculty/subjects');
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching faculty subjects:', e);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchSubjects();
  }, []);

  // Whenever department_id, semester, or section changes, automatically fetch eligible students from DB!
  useEffect(() => {
    if (createModalOpen) {
      setFetchingStudents(true);
      client.get('/faculty/students-by-filter', {
        params: {
          department_id: formData.department_id || 1,
          semester: formData.semester || 6,
          section: formData.section || 'All'
        }
      })
        .then((res) => {
          setEligibleStudents(res.data || []);
          // By default, everyone is included (no exclusions)
          setFormData((prev) => ({ ...prev, excluded_student_ids: [] }));
        })
        .catch((e) => {
          console.error(e);
          setEligibleStudents([]);
        })
        .finally(() => setFetchingStudents(false));
    }
  }, [formData.department_id, formData.semester, formData.section, createModalOpen]);

  const handleOpenCreateModal = () => {
    // Default deadline 3 days from now
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const deadlineStr = d.toISOString().slice(0, 16);

    client.get('/faculty/me').then((res) => {
      const deptId = res.data.department_id || 1;
      const defaultSub = subjects[0]?.id ? String(subjects[0].id) : '';
      setFormData({
        title: '',
        description: '',
        subject_id: defaultSub,
        department_id: deptId,
        semester: 6,
        section: 'All',
        duration_minutes: 30,
        deadline: deadlineStr,
        start_time: new Date().toISOString().slice(0, 16),
        status: 'published',
        allow_multiple_attempts: false,
        max_attempts: 1,
        excluded_student_ids: []
      });
      setCreateModalOpen(true);
    }).catch(() => {
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

  const selectAllStudents = () => {
    setFormData((prev) => ({ ...prev, excluded_student_ids: [] }));
  };

  const deselectAllStudents = () => {
    setFormData((prev) => ({
      ...prev,
      excluded_student_ids: eligibleStudents.map((s) => s.id)
    }));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correct_answer: 'A',
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, val) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const updateOptionText = (qIdx, optId, textVal) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options.map((opt) =>
        opt.id === optId ? { ...opt, text: textVal } : opt
      );
      return copy;
    });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!formData.subject_id) {
      alert('Please select a subject');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        subject_id: parseInt(formData.subject_id),
        department_id: parseInt(formData.department_id),
        deadline: new Date(formData.deadline).toISOString(),
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : new Date().toISOString(),
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          marks: parseFloat(q.marks),
          order: idx + 1,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }))
      };

      await client.post('/faculty/quizzes', payload);
      setCreateModalOpen(false);
      fetchQuizzes();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRoster = async (quiz) => {
    setSelectedQuiz(quiz);
    setDetailModalOpen(true);
    setRosterLoading(true);
    try {
      const res = await client.get(`/faculty/quizzes/${quiz.id}/submissions`);
      setSubmissionsRoster(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRosterLoading(false);
    }
  };

  const togglePublishQuiz = async (quizId, shouldPublish) => {
    try {
      await client.post(`/faculty/quizzes/${quizId}/publish?publish=${shouldPublish}`);
      fetchQuizzes();
    } catch (e) {
      alert('Failed to update quiz status: ' + (e.response?.data?.detail || e.message));
    }
  };

  const togglePublishResults = async (quizId, newStatus) => {
    try {
      await client.post(`/faculty/quizzes/${quizId}/publish-results?publish=${newStatus}`);
      fetchQuizzes();
      if (submissionsRoster) {
        setSubmissionsRoster((prev) => ({ ...prev, results_published: newStatus }));
      }
    } catch (e) {
      alert('Failed to update result release setting');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All attempts will be permanently erased.')) return;
    try {
      await client.delete(`/faculty/quizzes/${quizId}`);
      fetchQuizzes();
      setDetailModalOpen(false);
    } catch (e) {
      alert('Failed to delete quiz');
    }
  };

  if (loading) return <LoadingSpinner message="Loading faculty quiz management..." />;

  const safeEligible = Array.isArray(eligibleStudents) ? eligibleStudents : [];
  const safeExcluded = Array.isArray(formData?.excluded_student_ids) ? formData.excluded_student_ids : [];
  const totalEligibleCount = safeEligible.length - safeExcluded.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department-Wise Quiz Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create online assessments, customize student eligibility, evaluate answers, and release verified scores
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {/* Quizzes List Cards */}
      <div className="space-y-4">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No quizzes created yet. Click "Create New Quiz" to publish your first assessment.
          </div>
        ) : (
          quizzes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      q.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {q.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {q.subject_code} &bull; {q.subject_name}
                  </span>
                  {q.results_published ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center space-x-1 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Results Released to Students</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Results Hidden (Under Evaluation)
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                {q.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{q.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{q.duration_minutes} Mins Duration</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(q.deadline).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{q.total_marks} Marks ({q.question_count} Questions)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {q.submitted_count} / {q.eligible_count} Submitted
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => togglePublishQuiz(q.id, q.status !== 'published')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                    q.status === 'published'
                      ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{q.status === 'published' ? 'Unpublish' : 'Publish Quiz'}</span>
                </button>

                <button
                  onClick={() => handleOpenRoster(q)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submissions &amp; Roster</span>
                </button>

                <button
                  onClick={() => togglePublishResults(q.id, !q.results_published)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                    q.results_published
                      ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{q.results_published ? 'Hide Results' : 'Release Results'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE QUIZ MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Department-Wise Quiz"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Unit-2 Data Structures: Trees & Hash Tables Quiz"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Instructions / Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instructions on timing, negative marking, attempt policy..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Subject Course *
              </label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => {
                  const subId = e.target.value;
                  const selectedSub = subjects.find(s => String(s.id) === String(subId));
                  setFormData(prev => ({
                    ...prev,
                    subject_id: subId,
                    department_id: selectedSub?.department_id || prev.department_id || 1,
                    semester: selectedSub?.semester || prev.semester || 6
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="">-- Select Subject Course --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} - ${s.name}` : s.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">Selecting a course automatically configures department &amp; semester</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Target Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="0">All Departments (Campus-wide)</option>
                <option value="1">Computer Science &amp; Engineering (CSE)</option>
                <option value="2">Information Technology (IT)</option>
                <option value="3">Electronics &amp; Communication (ECE)</option>
              </select>
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
                Section Filter
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
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Submission Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* ELIGIBLE STUDENTS SELECTION & EXCLUSION SECTION */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-blue-700" />
                  <span>Eligible Students Selection ({totalEligibleCount} Included, {formData.excluded_student_ids.length} Excluded)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Students fetched from live database. Untick any student's checkbox to formally exclude them from this quiz.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllStudents}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllStudents}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Exclude All
                </button>
              </div>
            </div>

            {fetchingStudents ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading department students from database...</div>
            ) : eligibleStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No students found matching this department and semester.</div>
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
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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

          {/* QUESTIONS BUILDER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Quiz Questions ({questions.length} Added &bull; Total Marks: {questions.reduce((sum, q) => sum + parseFloat(q.marks || 0), 0)})
                </h4>
                <p className="text-[11px] text-slate-400">Define question text, options, and mark the correct answer</p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Question #{idx + 1}
                    </span>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <label className="text-[11px] text-slate-500 font-semibold">Marks:</label>
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          value={q.marks}
                          onChange={(e) => updateQuestion(idx, 'marks', e.target.value)}
                          className="w-16 rounded border border-slate-300 px-2 py-0.5 text-xs text-center"
                        />
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={q.question_text}
                      onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct_${idx}`}
                          checked={q.correct_answer === opt.id}
                          onChange={() => updateQuestion(idx, 'correct_answer', opt.id)}
                          title="Mark as correct answer"
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-600 w-4">{opt.id}:</span>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => updateOptionText(idx, opt.id, e.target.value)}
                          placeholder={`Option ${opt.id}`}
                          className="w-full rounded border border-slate-200 px-2.5 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                      placeholder="Optional explanation shown to student after results release..."
                      className="w-full rounded border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 bg-slate-50"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              {saving ? 'Publishing Quiz...' : 'Publish Quiz Now'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUBMISSIONS ROSTER & ANSWERS MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedQuiz ? `Participation Roster: ${selectedQuiz.title}` : 'Submissions'}
        maxWidth="max-w-4xl"
      >
        {rosterLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student participation and answers...</div>
        ) : submissionsRoster ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="font-semibold text-slate-600">Total Marks:</span> {submissionsRoster.total_marks} &bull;{' '}
                <span className="font-semibold text-slate-600">Release Status:</span>{' '}
                <span className={submissionsRoster.results_published ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {submissionsRoster.results_published ? 'Published to Students' : 'Hidden'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => togglePublishResults(selectedQuiz.id, !submissionsRoster.results_published)}
                  className="px-3 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
                >
                  {submissionsRoster.results_published ? 'Hide Results from Students' : 'Release Results to Students'}
                </button>
                <button
                  onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                  className="p-1 rounded text-rose-600 hover:bg-rose-50"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                    <th className="px-3 py-2.5">Score</th>
                    <th className="px-4 py-2.5">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(submissionsRoster?.roster || []).map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{s.reg_no}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'Submitted' || s.status === 'submitted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : s.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700'
                              : s.status === 'Excluded'
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {s.score !== null ? `${s.score} / ${s.total_marks}` : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'Not submitted'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
