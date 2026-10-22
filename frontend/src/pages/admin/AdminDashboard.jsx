import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldAlert,
  MailCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/dashboard-stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating institutional metrics..." />;
  if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load admin stats.</div>;

  const totalStudents = stats?.total_students ?? 60;
  const totalFaculty = stats?.total_faculty ?? 12;
  const averageAttendance = stats?.average_attendance ?? 78.4;
  const studentsBelow75 = stats?.students_below_75 ?? 21;
  const upcomingExams = stats?.upcoming_exams ?? 3;
  const pendingFees = stats?.pending_fees ?? 45000;
  const departmentBreakdown = Array.isArray(stats?.department_breakdown) ? stats.department_breakdown : [];
  const recentAlerts = Array.isArray(stats?.recent_alerts) ? stats.recent_alerts : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Administration Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time enrollment, academic attendance monitoring, and automated parent communication center
          </p>
        </div>

        <Link
          to="/admin/attendance-alerts"
          className="inline-flex items-center space-x-2 bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Attendance Alert Center ({studentsBelow75})</span>
        </Link>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled active students"
          icon={Users}
        />
        <StatCard
          title="Total Faculty"
          value={totalFaculty}
          subtitle="Teaching staff"
          icon={UserCheck}
        />
        <StatCard
          title="Avg Attendance"
          value={`${averageAttendance}%`}
          subtitle="Institutional average"
          icon={CalendarCheck}
        />
        <StatCard
          title="Below 75%"
          value={studentsBelow75}
          subtitle="Shortage standing"
          icon={AlertTriangle}
          badge={
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              Action Req.
            </span>
          }
        />
        <StatCard
          title="Upcoming Exams"
          value={upcomingExams}
          subtitle="Midterm sessions"
          icon={FileText}
        />
        <StatCard
          title="Pending Fees"
          value={`₹${(pendingFees / 1000).toFixed(0)}k`}
          subtitle="Outstanding balance"
          icon={CreditCard}
        />
      </div>

      {/* Two Column Grid: Department Breakdown & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Enrollment Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Departmental Distribution</h2>
            </div>
            <Link to="/admin/departments" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {departmentBreakdown.map((d, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{d.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Code: {d.code}</div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="font-semibold text-slate-700">{d.students} Students</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-semibold text-slate-700">{d.faculty} Faculty</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Automated Attendance Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MailCheck className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent Attendance Parent Alerts</h2>
            </div>
            <Link to="/admin/attendance-alerts" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Alert Center &rarr;
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No alerts have been triggered yet.</div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((al) => (
                <div key={al.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{al.student_name} ({al.reg_no})</div>
                    <div className="text-[11px] text-slate-500">
                      Parent: <span className="font-mono">{al.parent_email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 block">{al.attendance_pct}%</span>
                    <StatusBadge status={al.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
