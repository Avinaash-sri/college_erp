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
  MessageSquare,
  BookMarked,
  HelpCircle,
  X
} from 'lucide-react';

export default function Sidebar({ mobileMenuOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  // Student navigation links - 'My Profile' moved to the very LAST position
  const studentLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', to: '/student/attendance', icon: CalendarCheck },
    { name: 'Timetable', to: '/student/timetable', icon: Clock },
    { name: 'Quizzes', to: '/student/quizzes', icon: HelpCircle },
    { name: 'Assignments', to: '/student/assignments', icon: BookMarked },
    { name: 'Exams & Marks', to: '/student/exams', icon: FileText },
    { name: 'Fees', to: '/student/fees', icon: CreditCard },
    { name: 'Placements', to: '/student/placements', icon: Briefcase },
    { name: 'Grievances & Support', to: '/student/complaints', icon: MessageSquare },
    { name: 'Notifications', to: '/student/notifications', icon: Bell },
    { name: 'Notes', to: '/student/notes', icon: BookOpen },
    { name: 'My Profile', to: '/student/profile', icon: User }, // LAST POSITION
  ];

  // Faculty navigation links - 'My Profile' moved to the very LAST position
  const facultyLinks = [
    { name: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Subjects', to: '/faculty/subjects', icon: BookOpen },
    { name: 'Attendance', to: '/faculty/attendance', icon: CalendarCheck },
    { name: 'Students', to: '/faculty/students', icon: Users },
    { name: 'Quizzes', to: '/faculty/quizzes', icon: HelpCircle },
    { name: 'Assignments', to: '/faculty/assignments', icon: BookMarked },
    { name: 'Marks', to: '/faculty/marks', icon: FileSpreadsheet },
    { name: 'Timetable', to: '/faculty/timetable', icon: Clock },
    { name: 'Announcements', to: '/faculty/announcements', icon: Megaphone },
    { name: 'Student Grievances', to: '/faculty/complaints', icon: MessageSquare },
    { name: 'My Profile', to: '/faculty/profile', icon: User }, // LAST POSITION
  ];

  // Admin navigation links
  const adminLinks = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Campus Announcements', to: '/admin/announcements', icon: Megaphone },
    { name: 'Students', to: '/admin/students', icon: Users },
    { name: 'Faculty', to: '/admin/faculty', icon: UserCheck },
    { name: 'Departments', to: '/admin/departments', icon: Building2 },
    { name: 'Subjects', to: '/admin/subjects', icon: BookOpen },
    { name: 'Timetable', to: '/admin/timetable', icon: Clock },
    { name: 'Exams & Marks', to: '/admin/exams', icon: FileText },
    { name: 'Fees', to: '/admin/fees', icon: CreditCard },
    { name: 'Placements', to: '/admin/placements', icon: Briefcase },
    { name: 'Grievance Central', to: '/admin/complaints', icon: MessageSquare },
    { name: 'Notifications', to: '/admin/notifications', icon: Bell },
    { name: 'Attendance Alerts', to: '/admin/attendance-alerts', icon: AlertTriangle },
    { name: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  let links = [];
  if (user.role === 'student') links = studentLinks;
  else if (user.role === 'faculty') links = facultyLinks;
  else if (user.role === 'admin') links = adminLinks;

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white select-none">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>{user.role} Navigation</span>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-700"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items with Professional Light-Blue Default & Solid Blue Active */}
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white font-bold shadow-xs border border-blue-800'
                    : 'bg-blue-50/40 text-slate-700 hover:bg-blue-100/60 hover:text-blue-900 border border-transparent hover:border-blue-200/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Supabase Cloud &bull; v3.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 flex-col h-[calc(100vh-4rem)] sticky top-16">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-in Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-2xl z-50 transform transition-transform duration-200 ease-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
