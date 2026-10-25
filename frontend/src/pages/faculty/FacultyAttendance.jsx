import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarCheck, Save, CheckCircle, AlertTriangle, Users, MailCheck } from 'lucide-react';

export default function FacultyAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('Lecture');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    client.get('/faculty/subjects')
      .then((res) => {
        const subList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setSubjects(subList);
        if (subList.length > 0) {
          setSelectedSubject(subList[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
        setSubjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSessionData(selectedSubject, date);
    }
  }, [selectedSubject, date]);

  const fetchSessionData = (subId, dateVal) => {
    setLoading(true);
    setFeedback(null);
    client.get(`/faculty/attendance/session?subject_id=${subId}&date=${dateVal}`)
      .then((res) => {
        const stList = Array.isArray(res.data?.students)
          ? res.data.students
          : Array.isArray(res.data)
          ? res.data
          : [];
        setStudents(stList);
      })
      .catch((err) => {
        console.error(err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) =>
      (Array.isArray(prev) ? prev : []).map((s) => (s.student_id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAll = (statusVal) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: statusVal })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        subject_id: parseInt(selectedSubject),
        date: date,
        session_name: sessionName,
        records: students.map((s) => ({
          student_id: s.student_id,
          status: s.status,
        })),
      };

      const res = await client.post('/faculty/attendance', payload);
      setFeedback({
        type: 'success',
        message: res.data.message,
        alerts: res.data.alerts_triggered || [],
      });
      // Refresh to update current percentages
      fetchSessionData(selectedSubject, date);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to record attendance.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && subjects.length === 0) return <LoadingSpinner message="Loading course roster..." />;

  const safeStudents = Array.isArray(students) ? students : [];
  const presentCount = safeStudents.filter((s) => s.status === 'Present').length;
  const absentCount = safeStudents.filter((s) => s.status === 'Absent').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mark Class Attendance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record student daily presence. Attendance percentage is recalculated in real time. Parent alerts are triggered if attendance drops below 75%.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Course / Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} (Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Class Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Session Tag
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Regular Lecture, Lab Session"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>

          {/* Triggered Parent Alerts notification */}
          {feedback.alerts && feedback.alerts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                <MailCheck className="w-4 h-4 text-amber-600" />
                <span>Automated Parent Email Alerts Dispatched:</span>
              </div>
              <ul className="mt-1.5 space-y-1 ml-5 list-disc text-slate-700">
                {feedback.alerts.map((al, idx) => (
                  <li key={idx}>
                    <strong>{al.student_name}</strong> ({al.reg_no}) dropped to <strong>{al.new_pct}%</strong> (Status: &lt;75%). Email alert sent to <strong>{al.parent_email}</strong> [{al.email_status}].
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-xs font-bold text-slate-700">Roster ({safeStudents.length} Students)</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Absent: {absentCount}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {safeStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No students found in this course section.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3 text-center">Overall Attendance</th>
                  <th className="py-3 px-3 text-center">Risk Standing</th>
                  <th className="py-3 px-3 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeStudents.map((st) => {
                  const isPresent = st.status === 'Present';
                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">{st.reg_no}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                        {st.overall_attendance}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={st.risk_status} />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/60">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.student_id, 'Present')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.student_id, 'Absent')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              !isPresent
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            disabled={saving || students.length === 0}
            onClick={handleSaveAttendance}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Attendance & Recalculating...' : 'Save & Submit Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
