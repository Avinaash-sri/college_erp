import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  AlertTriangle,
  Users,
  CalendarCheck,
  Megaphone,
  ArrowRight
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/faculty/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading faculty portal..." />;
  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load faculty dashboard.</div>;

  const faculty = data?.faculty || (user?.role === 'faculty' ? user : null) || { name: 'Dr. Kavitha Raman', designation: 'Professor & HOD', department: 'Computer Science and Engineering', emp_id: 'EMP_CSE_01' };
  const subjects_handled = data?.subjects_handled ?? 3;
  const today_classes_count = data?.today_classes_count ?? (data?.today_classes?.length || 2);
  const students_at_risk_count = data?.students_at_risk_count ?? 3;
  const total_dept_students = data?.total_dept_students ?? 20;
  const today_classes = data?.today_classes || data?.today_schedule || [];
  const current_day = data?.current_day || 'Wednesday';
  const recent_announcements = data?.recent_announcements || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{faculty.name}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {faculty.designation} &bull; Department of {faculty.department} &bull; Emp ID: <span className="font-mono font-semibold text-slate-700">{faculty.emp_id}</span>
          </p>
        </div>

        <Link
          to="/faculty/attendance"
          className="inline-flex items-center space-x-2 bg-blue-700 text-white hover:bg-blue-800 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs self-start md:self-auto"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Subjects"
          value={`${subjects_handled} Courses`}
          subtitle="Semester 6 Curriculum"
          icon={BookOpen}
        />
        <StatCard
          title="Today's Classes"
          value={`${today_classes_count} Lectures`}
          subtitle={`Schedule for ${current_day}`}
          icon={Clock}
        />
        <StatCard
          title="Students at Risk"
          value={`${students_at_risk_count}`}
          subtitle="Attendance &lt; 75% in Dept"
          icon={AlertTriangle}
          badge={
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Needs Followup
            </span>
          }
        />
        <StatCard
          title="Department Students"
          value={`${total_dept_students}`}
          subtitle={faculty.department}
          icon={Users}
        />
      </div>

      {/* Today's Classes & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Teaching Schedule</h2>
              <p className="text-xs text-slate-400">{current_day} lecture timetable</p>
            </div>
            <Link to="/faculty/timetable" className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1">
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {today_classes.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2.5">
              {today_classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-20 text-center font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 py-1 rounded">
                      {cls.start_time}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cls.subject_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {cls.subject_code} &bull; Semester {cls.semester} (Sec {cls.section})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Room {cls.room}
                    </span>
                    <Link
                      to="/faculty/attendance"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-white border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-50"
                    >
                      Mark Attendance
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Circulars */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Faculty Shortcuts</h2>
            <div className="space-y-2">
              <Link
                to="/faculty/attendance"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Record Attendance</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/faculty/students"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Student Risk Analysis</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/faculty/marks"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Enter Internal Marks</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Recent Circulars</h2>
            <div className="space-y-2.5">
              {recent_announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-900 block">{a.title}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
