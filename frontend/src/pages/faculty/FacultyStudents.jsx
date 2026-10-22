import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { Users, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents(filter);
  }, [filter]);

  const fetchStudents = (selectedFilter) => {
    setLoading(true);
    client.get(`/faculty/students?risk_filter=${selectedFilter}`)
      .then((res) => setStudents(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : [])))
      .catch((err) => {
        console.error(err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Academic Performance &amp; Risk Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional attendance tracking and continuous assessment marks per student
          </p>
        </div>

        {/* Risk Level Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto self-start sm:self-auto">
          {['All', 'Safe', 'Warning', 'High Risk'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Filtering department students..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Showing {(Array.isArray(students) ? students : []).length} Students {filter !== 'All' && `(${filter} Standing)`}
            </span>
            <span className="text-xs text-slate-400">Semester 6 &bull; Section A</span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No students found under the "{filter}" filter category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Reg No</th>
                    <th className="py-3 px-3 text-center">Attendance %</th>
                    <th className="py-3 px-3 text-center">Risk Standing</th>
                    <th className="py-3 px-3">Recovery Requirement</th>
                    <th className="py-3 px-3">Parent Contact</th>
                    <th className="py-3 px-3 text-center">Continuous Eval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">{st.reg_no}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                        {st.overall_attendance}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={st.risk_status} />
                      </td>
                      <td className="py-3.5 px-3">
                        {st.overall_attendance < 75 ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Attend {st.recovery_classes} more classes
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 flex items-center space-x-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Safe (&ge;75%)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-xs font-semibold text-slate-800">{st.parent_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.parent_email}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex justify-center gap-1">
                          {(Array.isArray(st.marks) ? st.marks : []).map((m, idx) => (
                            <span key={idx} className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title={`${m.subject_code}: ${m.total} pts (${m.grade})`}>
                              {m.grade}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
