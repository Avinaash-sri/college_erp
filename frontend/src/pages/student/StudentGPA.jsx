import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { GraduationCap, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';

const GRADE_POINTS = {
  'O':  10, 'A+': 9, 'A': 8, 'B+': 7,
  'B':  6,  'C':  5, 'F': 0,
};

const getGrade = (marks) => {
  if (marks >= 91) return 'O';
  if (marks >= 81) return 'A+';
  if (marks >= 71) return 'A';
  if (marks >= 61) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  return 'F';
};

const getGradeColor = (grade) => {
  const colors = {
    'O': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'A': 'text-blue-600 bg-blue-50 border-blue-200',
    'B+': 'text-blue-500 bg-blue-50 border-blue-100',
    'B': 'text-amber-600 bg-amber-50 border-amber-200',
    'C': 'text-orange-600 bg-orange-50 border-orange-200',
    'F': 'text-rose-600 bg-rose-50 border-rose-200',
  };
  return colors[grade] || 'text-slate-600 bg-slate-50 border-slate-200';
};

export default function StudentGPA() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/my-marks')
      .then((res) => {
        const marksData = Array.isArray(res.data) ? res.data : (res.data?.marks || []);
        if (marksData.length > 0) {
          setMarks(marksData);
        } else {
          return client.get('/students/me/marks').then((r) => {
            setMarks(Array.isArray(r.data) ? r.data : (r.data?.marks || []));
          });
        }
      })
      .catch(() => {
        client.get('/students/me/marks')
          .then((r) => setMarks(Array.isArray(r.data) ? r.data : (r.data?.marks || [])))
          .catch(() => setMarks([]));
      })
      .finally(() => setLoading(false));
  }, []);

  // Build subject rows from marks
  const subjectMap = {};
  marks.forEach((m) => {
    const key = m.subject_name || m.subject_code || `Subject ${m.subject_id}`;
    if (!subjectMap[key]) {
      subjectMap[key] = { 
        name: key, 
        code: m.subject_code, 
        credits: m.credits || 3, 
        scores: [] 
      };
    }
    const score = m.marks_obtained !== undefined && m.marks_obtained !== null 
      ? m.marks_obtained 
      : (m.total !== undefined && m.total !== null ? m.total : null);
    if (score !== null) {
      subjectMap[key].scores.push(parseFloat(score));
    }
  });

  const subjectRows = Object.values(subjectMap).map((s) => {
    const avg = s.scores.length > 0
      ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length
      : null;
    const grade = avg !== null ? getGrade(avg) : null;
    const gradePoint = grade ? GRADE_POINTS[grade] : null;
    return { ...s, avg, grade, gradePoint };
  });

  // CGPA calculation
  const validRows = subjectRows.filter((s) => s.gradePoint !== null);
  const totalCredits = validRows.reduce((sum, s) => sum + s.credits, 0);
  const totalWeighted = validRows.reduce((sum, s) => sum + s.gradePoint * s.credits, 0);
  const cgpa = totalCredits > 0 ? (totalWeighted / totalCredits).toFixed(2) : null;

  const cgpaColor = cgpa >= 8.5 ? 'text-emerald-600' : cgpa >= 7 ? 'text-blue-600' : cgpa >= 5 ? 'text-amber-600' : 'text-rose-600';
  const cgpaLabel = cgpa >= 9 ? 'Outstanding' : cgpa >= 8 ? 'Excellent' : cgpa >= 7 ? 'Good' : cgpa >= 6 ? 'Average' : 'Needs Improvement';

  if (loading) return <LoadingSpinner message="Calculating your academic performance..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
              <h1 className="text-lg font-bold text-slate-900">Academic CGPA Calculator & Transcript</h1>
            </div>
            <p className="text-xs text-slate-500">Official university grading engine: CGPA is calculated on a 10-point scale and stored in your academic database record.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold self-start sm:self-auto shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Stored in Database</span>
          </div>
        </div>

        {/* Formula Callout */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Official Evaluation Formula</p>
            <p className="font-mono text-xs font-bold text-blue-900">
              CGPA = &Sigma;(Grade Points &times; Credits) / &Sigma;(Credits)
            </p>
          </div>
          <div className="text-[11.5px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>&bull; O (91-100) = <strong>10 GP</strong></span>
            <span>&bull; A+ (81-90) = <strong>9 GP</strong></span>
            <span>&bull; A (71-80) = <strong>8 GP</strong></span>
            <span>&bull; B+ (61-70) = <strong>7 GP</strong></span>
            <span>&bull; B (50-60) = <strong>6 GP</strong></span>
            <span>&bull; C (40-49) = <strong>5 GP</strong></span>
            <span>&bull; F (&lt;40) = <strong>0 GP</strong></span>
          </div>
        </div>
      </div>

      {/* CGPA Display */}
      <div className="erp-card p-6 text-center">
        {cgpa ? (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Cumulative Grade Point Average</p>
            <p className={`text-6xl font-extrabold ${cgpaColor} tabular-nums tracking-tight`}>{cgpa}</p>
            <p className={`mt-2 text-sm font-bold ${cgpaColor}`}>{cgpaLabel}</p>

            {/* Formula Step-by-Step Fraction */}
            <div className="mt-4 max-w-sm mx-auto p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 font-mono flex items-center justify-center gap-2">
              <span>CGPA =</span>
              <span className="inline-flex flex-col items-center leading-none">
                <span className="font-bold border-b border-blue-300 pb-0.5">{totalWeighted.toFixed(1)} (Weighted Points)</span>
                <span className="font-bold pt-0.5">{totalCredits} (Total Credits)</span>
              </span>
              <span>= <strong className="text-sm font-bold text-blue-800">{cgpa}</strong></span>
            </div>

            <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500">
              <div><span className="font-bold text-slate-800">{totalCredits}</span> Total Credits</div>
              <div><span className="font-bold text-slate-800">{validRows.length}</span> Evaluated Courses</div>
              <div><span className="font-bold text-slate-800">{totalWeighted.toFixed(1)}</span> Cumulative Points</div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-400">No marks available yet. Your CGPA will appear once faculty enter your marks.</p>
          </div>
        )}
      </div>

      {/* Subject-wise table */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
            <h2 className="text-sm font-bold text-slate-800">Subject-wise Grade &amp; Credit Ledger</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Weighted = Grade Point &times; Credits</span>
        </div>
        {subjectRows.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No marks recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Avg Marks</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Grade Point</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Weighted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subjectRows.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      {s.code && <p className="text-[10px] text-slate-400 font-mono">{s.code}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium">{s.credits}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800 tabular-nums">
                      {s.avg !== null ? s.avg.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.grade ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getGradeColor(s.grade)}`}>
                          {s.grade}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{s.gradePoint ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-slate-600 tabular-nums">
                      {s.gradePoint !== null ? (s.gradePoint * s.credits).toFixed(0) : '—'}
                    </td>
                  </tr>
                ))}
                {validRows.length > 0 && (
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-3 font-bold text-blue-800">Total / CGPA</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-800">{totalCredits}</td>
                    <td className="px-4 py-3 text-center">—</td>
                    <td className="px-4 py-3 text-center">—</td>
                    <td className="px-4 py-3 text-center">—</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-800">{cgpa} CGPA</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center pb-2">
        Credits per subject default to 3 if not configured. Contact your faculty to update credit values.
      </p>
    </div>
  );
}
