import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  Award,
  Layers,
  FileSpreadsheet,
  CalendarCheck,
  HelpCircle,
  BookMarked,
  ChevronRight,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    client.get('/faculty/subjects')
      .then((res) => {
        const enriched = (res.data || []).map((s) => ({
          ...s,
          semester: s.semester || 6,
          section: 'Section A',
          credits: s.credits || 4,
          enrolled_count: 20,
          weekly_hours: s.credits === 2 ? '2 Hours / Week' : '4 Hours / Week',
          venue: s.code === 'CS602' ? 'AI Lab 1' : s.code === 'CS604' ? 'Cloud Computing Lab' : 'Hall 302',
          units: [
            { unit: 'Unit I', title: 'Foundational Principles & Mathematical Frameworks', hours: 9 },
            { unit: 'Unit II', title: 'Core Algorithms, State Space & Optimization Models', hours: 10 },
            { unit: 'Unit III', title: 'Advanced Architectures & System Implementations', hours: 12 },
            { unit: 'Unit IV', title: 'Testing, Complexity Bounds & Case Studies', hours: 9 },
            { unit: 'Unit V', title: 'Emerging Industry Standards & Cloud Integrations', hours: 8 }
          ]
        }));
        setSubjects(enriched);
        if (enriched.length > 0) {
          setSelectedSubject(enriched[0]);
        }
      })
      .catch((err) => console.error('Failed to load faculty subjects:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading assigned courses and curriculum..." />;

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Assigned Courses &amp; Curriculum</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Department of CSE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of academic courses handled, curriculum modules, venues, and student batch enrollment
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/faculty/marks"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Enter Internal Marks</span>
          </Link>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const isSelected = selectedSubject?.id === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={`rounded-xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sub.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{sub.credits} Credits</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                  {sub.name}
                </h3>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Class Batch:</span>
                    <span className="font-medium text-slate-800">Semester {sub.semester} &bull; {sub.section}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Classroom / Lab:</span>
                    <span className="font-medium text-slate-800 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{sub.venue}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Schedule Pace:</span>
                    <span className="font-medium text-slate-800 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{sub.weekly_hours}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Enrolled Students:</span>
                    <span className="font-bold text-blue-700 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>{sub.enrolled_count} Students</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Action Links */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <Link
                  to="/faculty/attendance"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
                >
                  <CalendarCheck className="w-3 h-3 text-emerald-600" />
                  <span>Attendance</span>
                </Link>
                <Link
                  to="/faculty/marks"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                  <span>Marks</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Subject Curriculum & Syllabus Breakdown */}
      {selectedSubject && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedSubject.code}
                </span>
                <h2 className="text-sm font-bold text-slate-900">{selectedSubject.name} — Syllabus Breakdown</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Anna University Regulation 2021 curriculum units, lecture hour allocations, and continuous assessment mapping
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/faculty/assignments"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Assign Work</span>
              </Link>
              <Link
                to="/faculty/quizzes"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Create Quiz</span>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {(selectedSubject.units || []).map((u, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-16 font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {u.unit}
                  </span>
                  <span className="font-semibold text-slate-800">{u.title}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500 font-medium">{u.hours} Lecture Hours</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
