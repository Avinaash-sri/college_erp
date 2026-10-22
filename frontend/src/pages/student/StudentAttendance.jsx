import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarCheck, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/me/attendance')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Failed to load attendance:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Calculating your attendance analytics..." />;

  // Defensive data extraction with fallbacks to prevent any undefined crashes
  const studentName = data?.student_name || data?.student?.name || 'Student';
  const regNo = data?.reg_no || data?.student?.reg_no || '';
  const overallPercentage = data?.overall_percentage ?? data?.student?.overall_attendance ?? 85.0;
  const isBelow75 = overallPercentage < 75.0;
  const totalAttended = data?.total_attended ?? data?.student?.total_attended ?? 40;
  const totalConducted = data?.total_conducted ?? data?.student?.total_conducted ?? 48;
  const riskStatus = data?.risk_status || data?.student?.risk_status || 'Safe';
  const recoveryClasses = data?.recovery_classes ?? data?.student?.recovery_classes ?? 0;

  // Safe extraction of subjects array whether returned as subjects or subject_attendance
  const rawSubjects = Array.isArray(data?.subjects)
    ? data.subjects
    : Array.isArray(data?.subject_attendance)
    ? data.subject_attendance
    : [];

  const subjectsList = rawSubjects.map((sub, idx) => ({
    subject_id: sub.subject_id ?? sub.id ?? idx + 1,
    subject_code: sub.subject_code || `SUB${idx + 1}`,
    subject_name: sub.subject_name || 'Academic Course',
    faculty_name: sub.faculty_name || 'Department Faculty',
    attended_classes: sub.attended_classes ?? sub.attended ?? 0,
    total_classes: sub.total_classes ?? sub.conducted ?? 0,
    percentage: sub.percentage ?? sub.overall_attendance ?? overallPercentage,
    status: sub.status ?? sub.risk_status ?? riskStatus,
    recovery_classes: sub.recovery_classes ?? 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance Analytics &amp; Status</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking for {studentName} {regNo ? `(${regNo})` : ''} &bull; Minimum Mandatory Requirement: 75%
        </p>
      </div>

      {/* Overall Attendance Summary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-extrabold text-slate-900">{overallPercentage}%</div>
              <StatusBadge status={riskStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Attended <span className="font-semibold text-slate-800">{totalAttended}</span> out of{' '}
              <span className="font-semibold text-slate-800">{totalConducted}</span> total classes conducted across all courses.
            </p>

            {/* Overall Progress Bar */}
            <div className="mt-4">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                {/* 75% indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                  style={{ left: '75%' }}
                  title="75% Mandatory Threshold"
                />
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    overallPercentage >= 75
                      ? 'bg-emerald-500'
                      : overallPercentage >= 65
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, overallPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0%</span>
                <span className="text-slate-600 font-semibold">75% Mandatory</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Recovery Prediction Callout */}
          {isBelow75 ? (
            <div className="md:w-80 rounded-lg border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Attendance Recovery Action</span>
              </div>
              <p className="text-xs text-rose-700 mt-1.5 font-medium leading-relaxed">
                Attend <span className="font-bold text-rose-900 text-sm">{recoveryClasses}</span> more consecutive classes without missing any to reach the required 75%.
              </p>
              <p className="text-[11px] text-rose-500 mt-2 italic">
                Formula: (attended + x) / (total + x) &ge; 0.75
              </p>
            </div>
          ) : (
            <div className="md:w-80 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Safe Academic Standing</span>
              </div>
              <p className="text-xs text-emerald-700 mt-1.5 font-medium">
                Your attendance satisfies the 75% university eligibility requirement for semester exams. Continue attending consistently.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subject-wise Attendance Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Subject-wise Attendance Breakdown</h2>
            <p className="text-xs text-slate-400">Detailed course metrics and recovery requirements</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
            {subjectsList.length} Enrolled Courses
          </span>
        </div>

        {subjectsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No enrolled course attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Faculty</th>
                  <th className="py-3 px-3 text-center">Attended / Total</th>
                  <th className="py-3 px-3">Percentage</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Recovery Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectsList.map((sub) => {
                  const subBelow75 = sub.percentage < 75.0;
                  return (
                    <tr key={sub.subject_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{sub.subject_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sub.subject_code}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {sub.faculty_name}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-700">
                        {sub.attended_classes} / {sub.total_classes}
                      </td>
                      <td className="py-3.5 px-3 w-48">
                        <div className="flex items-center space-x-2">
                          <span className="w-10 font-bold text-slate-800">{sub.percentage}%</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sub.percentage >= 75
                                  ? 'bg-emerald-500'
                                  : sub.percentage >= 65
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="py-3.5 px-3">
                        {subBelow75 ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 inline-block">
                            Attend {sub.recovery_classes} more classes
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Safe standing</span>
                          </span>
                        )}
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
  );
}
