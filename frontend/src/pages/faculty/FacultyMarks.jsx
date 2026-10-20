import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Save, CheckCircle, BookOpen } from 'lucide-react';

export default function FacultyMarks() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIndex, setSavingIndex] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    client.get('/faculty/subjects')
      .then((res) => {
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchMarks(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchMarks = (subId) => {
    setLoading(true);
    client.get(`/faculty/marks?subject_id=${subId}`)
      .then((res) => setMarksData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (idx, field, value) => {
    const val = parseFloat(value) || 0;
    setMarksData((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      copy[idx].total = (copy[idx].internal_1 || 0) + (copy[idx].internal_2 || 0) + (copy[idx].assignment || 0);
      if (copy[idx].total >= 50) copy[idx].grade = copy[idx].total >= 54 ? 'A+' : 'A';
      else if (copy[idx].total >= 40) copy[idx].grade = 'B';
      else if (copy[idx].total >= 30) copy[idx].grade = 'C';
      else copy[idx].grade = 'F';
      return copy;
    });
  };

  const saveRowMarks = async (idx) => {
    setSavingIndex(idx);
    const row = marksData[idx];
    try {
      await client.post('/faculty/marks', {
        student_id: row.student_id,
        subject_id: parseInt(selectedSubject),
        internal_1: row.internal_1,
        internal_2: row.internal_2,
        assignment: row.assignment,
      });
      setToast(`Marks saved for ${row.name}`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      alert('Failed to save marks');
    } finally {
      setSavingIndex(null);
    }
  };

  if (loading && subjects.length === 0) return <LoadingSpinner message="Loading course marks..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internal Continuous Assessment Entry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record Internal 1 (25), Internal 2 (25), and Assignment (10) scores
          </p>
        </div>

        {/* Subject Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center space-x-2 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Student Marks Sheet</span>
          <span className="text-xs text-slate-400">Total Scale: 60 Marks</span>
        </div>

        {marksData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3 text-center">Internal 1 (/25)</th>
                  <th className="py-3 px-3 text-center">Internal 2 (/25)</th>
                  <th className="py-3 px-3 text-center">Assignment (/10)</th>
                  <th className="py-3 px-3 text-center">Total (/60)</th>
                  <th className="py-3 px-3 text-center">Calculated Grade</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksData.map((row, idx) => (
                  <tr key={row.student_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{row.reg_no}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.5"
                        value={row.internal_1}
                        onChange={(e) => handleInputChange(idx, 'internal_1', e.target.value)}
                        className="w-20 text-center rounded border border-slate-200 py-1 text-xs font-mono font-semibold focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.5"
                        value={row.internal_2}
                        onChange={(e) => handleInputChange(idx, 'internal_2', e.target.value)}
                        className="w-20 text-center rounded border border-slate-200 py-1 text-xs font-mono font-semibold focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={row.assignment}
                        onChange={(e) => handleInputChange(idx, 'assignment', e.target.value)}
                        className="w-20 text-center rounded border border-slate-200 py-1 text-xs font-mono font-semibold focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                      {row.total}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {row.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        disabled={savingIndex === idx}
                        onClick={() => saveRowMarks(idx)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        <span>{savingIndex === idx ? 'Saving...' : 'Save'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
