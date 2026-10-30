import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Clock, MapPin, Award, CheckCircle2 } from 'lucide-react';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/students/me/exams').catch(() => ({ data: [] })),
      client.get('/students/me/marks').catch(() => ({ data: [] }))
    ])
      .then(async ([examsRes, marksRes]) => {
        const exData = Array.isArray(examsRes.data) ? examsRes.data : (Array.isArray(examsRes.data?.data) ? examsRes.data.data : []);
        setExams(exData);

        let mData = Array.isArray(marksRes.data) ? marksRes.data : (Array.isArray(marksRes.data?.data) ? marksRes.data.data : (Array.isArray(marksRes.data?.marks) ? marksRes.data.marks : []));
        if (!mData || mData.length === 0) {
          try {
            const fallbackRes = await client.get('/students/my-marks');
            const fallbackData = Array.isArray(fallbackRes.data) ? fallbackRes.data : (Array.isArray(fallbackRes.data?.data) ? fallbackRes.data.data : (Array.isArray(fallbackRes.data?.marks) ? fallbackRes.data.marks : []));
            if (fallbackData && fallbackData.length > 0) {
              mData = fallbackData;
            }
          } catch (e) {
            // keep existing mData
          }
        }
        setMarks(mData || []);
      })
      .catch((err) => console.error('Error loading exams and marks:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading examination schedules and marks..." />;

  const safeExams = Array.isArray(exams) ? exams : [];
  const safeMarks = Array.isArray(marks) ? marks : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exams &amp; Internal Marks</h1>
        <p className="text-xs text-slate-500 mt-0.5">Upcoming examination timetables and published continuous assessment marks</p>
      </div>

      {/* Upcoming Exams Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Upcoming Examination Schedule</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {safeExams.length} Exams Scheduled
          </span>
        </div>

        {safeExams.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No upcoming examinations.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeExams.map((exam) => (
              <div key={exam.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {exam.name}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-500">{exam.subject_code}</span>
                </div>

                <div className="text-sm font-bold text-slate-900 mt-2">{exam.subject_name}</div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.start_time} - {exam.end_time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{exam.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal Assessment Marks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Internal Continuous Assessment Marks</h2>
            <p className="text-xs text-slate-400">Internal 1 (25) + Internal 2 (25) + Assignment (10) = Total (60)</p>
          </div>
          <Award className="w-5 h-5 text-blue-600" />
        </div>

        {safeMarks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No continuous assessment internal marks published yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3 text-center">Internal 1 (25)</th>
                  <th className="py-3 px-3 text-center">Internal 2 (25)</th>
                  <th className="py-3 px-3 text-center">Assignment (10)</th>
                  <th className="py-3 px-3 text-center">Total (60)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeMarks.map((m) => {
                  const i1 = m.internal_1 !== undefined && m.internal_1 !== null ? m.internal_1 : (m.cia1 !== undefined && m.cia1 !== null ? m.cia1 : '-');
                  const i2 = m.internal_2 !== undefined && m.internal_2 !== null ? m.internal_2 : (m.cia2 !== undefined && m.cia2 !== null ? m.cia2 : '-');
                  const ass = m.assignment !== undefined && m.assignment !== null ? m.assignment : '-';
                  const tot = m.total !== undefined && m.total !== null 
                    ? m.total 
                    : (m.total_internal !== undefined ? m.total_internal : ((parseFloat(i1) || 0) + (parseFloat(i2) || 0) + (parseFloat(ass) || 0)).toFixed(1));
                  const gr = m.grade || 'A';

                  return (
                    <tr key={m.id || `${m.subject_code}_${m.subject_id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{m.subject_name || 'Academic Subject'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.subject_code || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{i1}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{i2}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{ass}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">{tot}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {gr}
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
  );
}
