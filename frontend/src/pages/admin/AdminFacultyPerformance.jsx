import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TrendingUp, Users, FileSpreadsheet, CalendarCheck, Award, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

// Demo performance data
const DEMO_DATA = [
  { id: 1, name: 'Dr. Rajesh Kumar', department: 'CSE', subjects_taught: 2, avg_marks_given: 72.4, attendance_marked_pct: 95.2, quizzes_created: 8, assignments_created: 5, complaints_received: 1 },
  { id: 2, name: 'Prof. Meena Sundar', department: 'CSE', subjects_taught: 3, avg_marks_given: 68.1, attendance_marked_pct: 91.0, quizzes_created: 12, assignments_created: 7, complaints_received: 0 },
  { id: 3, name: 'Dr. Priya Nair', department: 'IT', subjects_taught: 2, avg_marks_given: 75.6, attendance_marked_pct: 98.5, quizzes_created: 6, assignments_created: 4, complaints_received: 2 },
  { id: 4, name: 'Prof. Anand Sharma', department: 'ECE', subjects_taught: 2, avg_marks_given: 65.3, attendance_marked_pct: 88.0, quizzes_created: 4, assignments_created: 3, complaints_received: 0 },
  { id: 5, name: 'Dr. Kavya Reddy', department: 'MECH', subjects_taught: 2, avg_marks_given: 70.9, attendance_marked_pct: 92.3, quizzes_created: 7, assignments_created: 6, complaints_received: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}{p.unit || ''}</p>
      ))}
    </div>
  );
};

export default function AdminFacultyPerformance() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/faculty-performance')
      .then((res) => setFaculty(Array.isArray(res.data) ? res.data : DEMO_DATA))
      .catch(() => setFaculty(DEMO_DATA))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading faculty performance data..." />;

  const avgMarksData = faculty.map(f => ({ name: f.name.split(' ')[f.name.split(' ').length - 1], avg: f.avg_marks_given }));
  const attendanceData = faculty.map(f => ({ name: f.name.split(' ')[f.name.split(' ').length - 1], pct: f.attendance_marked_pct }));

  const topPerformer = [...faculty].sort((a, b) => b.avg_marks_given + b.attendance_marked_pct - (a.avg_marks_given + a.attendance_marked_pct))[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
          <h1 className="text-lg font-bold text-slate-900">Faculty Performance Report</h1>
        </div>
        <p className="text-xs text-slate-500">Metrics: avg marks given, attendance marking consistency, quizzes & assignments created</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="erp-card p-4 stat-accent-blue">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{faculty.length}</p>
        </div>
        <div className="erp-card p-4 stat-accent-emerald">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Marks Given</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {faculty.length > 0 ? (faculty.reduce((s, f) => s + f.avg_marks_given, 0) / faculty.length).toFixed(1) : '—'}
          </p>
        </div>
        <div className="erp-card p-4 stat-accent-amber">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Attendance Marking</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {faculty.length > 0 ? (faculty.reduce((s, f) => s + f.attendance_marked_pct, 0) / faculty.length).toFixed(1) : '—'}%
          </p>
        </div>
        <div className="erp-card p-4 stat-accent-blue">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Performer</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">{topPerformer?.name?.split(' ').slice(-1)[0] || '—'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="erp-card p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Average Marks Given by Faculty</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avgMarksData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Marks" fill="#2563eb" radius={[3, 3, 0, 0]} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="erp-card p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Attendance Marking Consistency (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" name="Attendance Marking" fill="#10b981" radius={[3, 3, 0, 0]} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
          <h2 className="text-sm font-bold text-slate-800">Detailed Faculty Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide">Faculty</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Dept</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Subjects</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Avg Marks</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Attendance %</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Quizzes</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Assignments</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide">Complaints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {faculty.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{f.name}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{f.department}</td>
                  <td className="px-3 py-3 text-center font-medium text-slate-700">{f.subjects_taught}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold ${f.avg_marks_given >= 70 ? 'text-emerald-600' : f.avg_marks_given >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {f.avg_marks_given?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold ${f.attendance_marked_pct >= 90 ? 'text-emerald-600' : f.attendance_marked_pct >= 75 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {f.attendance_marked_pct?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">{f.quizzes_created}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{f.assignments_created}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-semibold ${f.complaints_received > 2 ? 'text-rose-500' : f.complaints_received > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {f.complaints_received}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
