import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  FileText,
  CreditCard,
  Briefcase,
  Bell,
  AlertTriangle,
  ArrowRight,
  Bot
} from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/me/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load student dashboard.</div>;

  const { student, attendance, today_classes, current_day, upcoming_exams, fees, recent_notifications, placement_announcements } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Welcome back, {student.name}</h1>
            <StatusBadge status={attendance.risk_status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Reg No: <span className="font-semibold text-slate-700">{student.reg_no}</span> &bull; {student.department} &bull; Semester {student.semester} (Sec {student.section})
          </p>
        </div>

        <Link
          to="/student/ai-assistant"
          className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          <Bot className="w-4 h-4 text-indigo-600" />
          <span>Ask AI ERP Assistant</span>
        </Link>
      </div>

      {/* Attendance Recovery Alert Banner if < 75% */}
      {attendance.overall_percentage < 75 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
              Attendance Shortage Alert ({attendance.overall_percentage}% - Below 75% Threshold)
            </h3>
            <p className="text-xs text-rose-700 mt-1">
              Your attendance is currently under the mandatory minimum 75%.
              <span className="font-bold"> Attend {attendance.recovery_classes} more consecutive classes</span> without absence to restore safe standing. Automated notifications have been logged.
            </p>
            <div className="mt-2">
              <Link to="/student/attendance" className="text-xs font-semibold text-rose-800 underline hover:text-rose-900">
                View Subject-wise Attendance Breakdown &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${attendance.overall_percentage}%`}
          subtitle={`${attendance.total_attended} / ${attendance.total_conducted} classes attended`}
          icon={CalendarCheck}
          badge={<StatusBadge status={attendance.risk_status} />}
        />
        <StatCard
          title="Today's Classes"
          value={`${today_classes.length} Lectures`}
          subtitle={`Schedule for ${current_day}`}
          icon={Clock}
        />
        <StatCard
          title="Upcoming Exams"
          value={`${upcoming_exams.length}`}
          subtitle="Midterm Examination"
          icon={FileText}
        />
        <StatCard
          title="Pending Fees"
          value={`₹${fees.pending.toLocaleString()}`}
          subtitle={fees.pending === 0 ? 'All dues cleared' : 'Due for clearance'}
          icon={CreditCard}
          badge={<StatusBadge status={fees.pending === 0 ? 'PAID' : (fees.paid > 0 ? 'PARTIALLY PAID' : 'PENDING')} />}
        />
      </div>

      {/* Timetable & Exams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Class Schedule</h2>
              <p className="text-xs text-slate-400">{current_day} &bull; Semester {student.semester}</p>
            </div>
            <Link to="/student/timetable" className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1">
              <span>Full Week</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {today_classes.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No scheduled lectures for today.</p>
          ) : (
            <div className="space-y-2.5">
              {today_classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 text-center font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 py-1 rounded">
                      {cls.start_time.split(' ')[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{cls.subject_name}</div>
                      <div className="text-[11px] text-slate-500">{cls.subject_code} &bull; {cls.faculty_name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Room {cls.room}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Upcoming Exams</h2>
            <Link to="/student/exams" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Details &rarr;
            </Link>
          </div>

          {upcoming_exams.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No upcoming exams scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcoming_exams.map((ex) => (
                <div key={ex.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="text-xs font-bold text-slate-900">{ex.name}</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">{ex.subject_name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="font-semibold text-slate-700">{ex.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications & Placements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent Notifications</h2>
            </div>
            <Link to="/student/notifications" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              View All
            </Link>
          </div>

          {recent_notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No recent notifications.</p>
          ) : (
            <div className="space-y-2.5">
              {recent_notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placement Announcements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Campus Placements</h2>
            </div>
            <Link to="/student/placements" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Explore Drives &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {placement_announcements.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{p.company}</div>
                  <div className="text-[11px] text-slate-500">{p.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700">{p.package_lpa} LPA</div>
                  <div className="text-[10px] text-slate-400">Deadline: {new Date(p.deadline).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
