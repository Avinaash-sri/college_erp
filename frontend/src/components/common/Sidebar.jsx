import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Clock,
  FileText,
  CreditCard,
  Briefcase,
  Bell,
  Bot,
  BookOpen,
  Users,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  Building2,
  AlertTriangle,
  Settings,
  MessageSquare
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', to: '/student/profile', icon: User },
    { name: 'Attendance', to: '/student/attendance', icon: CalendarCheck },
    { name: 'Timetable', to: '/student/timetable', icon: Clock },
    { name: 'Exams & Marks', to: '/student/exams', icon: FileText },
    { name: 'Fees', to: '/student/fees', icon: CreditCard },
    { name: 'Placements', to: '/student/placements', icon: Briefcase },
    { name: 'Grievances & Support', to: '/student/complaints', icon: MessageSquare },
    { name: 'Notifications', to: '/student/notifications', icon: Bell },
    { name: 'AI ERP Assistant', to: '/student/ai-assistant', icon: Bot, highlight: true },
  ];

  const facultyLinks = [
    { name: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', to: '/faculty/profile', icon: User },
    { name: 'My Subjects', to: '/faculty/subjects', icon: BookOpen },
    { name: 'Attendance', to: '/faculty/attendance', icon: CalendarCheck },
    { name: 'Students', to: '/faculty/students', icon: Users },
    { name: 'Marks', to: '/faculty/marks', icon: FileSpreadsheet },
    { name: 'Timetable', to: '/faculty/timetable', icon: Clock },
    { name: 'Announcements', to: '/faculty/announcements', icon: Megaphone },
    { name: 'Student Grievances', to: '/faculty/complaints', icon: MessageSquare },
  ];

  const adminLinks = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', to: '/admin/students', icon: Users },
    { name: 'Faculty', to: '/admin/faculty', icon: UserCheck },
    { name: 'Departments', to: '/admin/departments', icon: Building2 },
    { name: 'Subjects', to: '/admin/subjects', icon: BookOpen },
    { name: 'Timetable', to: '/admin/timetable', icon: Clock },
    { name: 'Exams', to: '/admin/exams', icon: FileText },
    { name: 'Fees', to: '/admin/fees', icon: CreditCard },
    { name: 'Placements', to: '/admin/placements', icon: Briefcase },
    { name: 'Grievance Central', to: '/admin/complaints', icon: MessageSquare },
    { name: 'Notifications', to: '/admin/notifications', icon: Bell },
    { name: 'Attendance Alerts', to: '/admin/attendance-alerts', icon: AlertTriangle, highlight: true },
    { name: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  let links = [];
  if (user.role === 'student') links = studentLinks;
  else if (user.role === 'faculty') links = facultyLinks;
  else if (user.role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {user.role} Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : link.highlight
                    ? 'text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 hover:text-indigo-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${link.highlight ? 'text-indigo-600' : ''}`} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Role Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium text-slate-600">Cloud Sync: Active</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">College ERP Mini-Project v1.0</p>
      </div>
    </aside>
  );
}
