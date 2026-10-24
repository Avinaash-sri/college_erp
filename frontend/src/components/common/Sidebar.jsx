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
  X,
  GraduationCap,
  CalendarDays,
  Upload,
  FileUp,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ mobileMenuOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard',          to: '/student/dashboard',    icon: LayoutDashboard },
    { name: 'Attendance',         to: '/student/attendance',   icon: CalendarCheck },
    { name: 'Timetable',          to: '/student/timetable',    icon: Clock },
    { name: 'Quizzes',            to: '/student/quizzes',      icon: HelpCircle },
    { name: 'Assignments',        to: '/student/assignments',  icon: BookMarked },
    { name: 'Exams & Marks',      to: '/student/exams',        icon: FileText },
    { name: 'GPA Calculator',     to: '/student/gpa',          icon: GraduationCap },
    { name: 'Study Materials',    to: '/student/materials',    icon: BookOpen },
    { name: 'Leave Request',      to: '/student/leave',        icon: CalendarDays },
    { name: 'Fees',               to: '/student/fees',         icon: CreditCard },
    { name: 'Placements',         to: '/student/placements',   icon: Briefcase },
    { name: 'Documents',          to: '/student/documents',    icon: Upload },
    { name: 'Grievances',         to: '/student/complaints',   icon: MessageSquare },
    { name: 'Notifications',      to: '/student/notifications',icon: Bell },
    { name: 'AI Notes Assistant', to: '/student/notes',        icon: Bot },
    { name: 'My Profile',         to: '/student/profile',      icon: User },
  ];

  const facultyLinks = [
    { name: 'Dashboard',          to: '/faculty/dashboard',    icon: LayoutDashboard },
    { name: 'My Subjects',        to: '/faculty/subjects',     icon: BookOpen },
    { name: 'Attendance',         to: '/faculty/attendance',   icon: CalendarCheck },
    { name: 'Students',           to: '/faculty/students',     icon: Users },
    { name: 'Quizzes',            to: '/faculty/quizzes',      icon: HelpCircle },
    { name: 'Assignments',        to: '/faculty/assignments',  icon: BookMarked },
    { name: 'Marks',              to: '/faculty/marks',        icon: FileSpreadsheet },
    { name: 'Study Materials',    to: '/faculty/materials',    icon: FileUp },
    { name: 'Leave Requests',     to: '/faculty/leave',        icon: CalendarDays },
    { name: 'Timetable',          to: '/faculty/timetable',    icon: Clock },
    { name: 'Announcements',      to: '/faculty/announcements',icon: Megaphone },
    { name: 'Notifications',      to: '/faculty/notifications',icon: Bell },
    { name: 'My Profile',         to: '/faculty/profile',      icon: User },
  ];

  const adminLinks = [
    { name: 'Dashboard',          to: '/admin/dashboard',          icon: LayoutDashboard },
    { name: 'Campus Announcements',to: '/admin/announcements',     icon: Megaphone },
    { name: 'Academic Calendar',  to: '/admin/academic-calendar',  icon: CalendarDays },
    { name: 'Students',           to: '/admin/students',           icon: Users },
    { name: 'Faculty',            to: '/admin/faculty',            icon: UserCheck },
    { name: 'Departments',        to: '/admin/departments',        icon: Building2 },
    { name: 'Subjects',           to: '/admin/subjects',           icon: BookOpen },
    { name: 'Timetable',          to: '/admin/timetable',          icon: Clock },
    { name: 'Exams & Marks',      to: '/admin/exams',              icon: FileText },
    { name: 'Fees',               to: '/admin/fees',               icon: CreditCard },
    { name: 'Placements',         to: '/admin/placements',         icon: Briefcase },
    { name: 'Leave Approvals',    to: '/admin/leave',              icon: CalendarDays },
    { name: 'Documents',          to: '/admin/documents',          icon: Upload },
    { name: 'Grievance Central',  to: '/admin/complaints',         icon: MessageSquare },
    { name: 'Notifications',      to: '/admin/notifications',      icon: Bell },
    { name: 'Attendance Alerts',  to: '/admin/attendance-alerts',  icon: AlertTriangle },
    { name: 'Faculty Performance',to: '/admin/faculty-performance',icon: TrendingUp },
    { name: 'System Settings',    to: '/admin/settings',           icon: Settings },
  ];

  let links = [];
  if (user.role === 'student') links = studentLinks;
  else if (user.role === 'faculty') links = facultyLinks;
  else if (user.role === 'admin') links = adminLinks;

  const roleColors = {
    student: { dot: 'bg-emerald-500', label: 'text-emerald-700', bg: 'bg-emerald-50' },
    faculty:  { dot: 'bg-blue-500', label: 'text-blue-700',  bg: 'bg-blue-50' },
    admin:    { dot: 'bg-blue-600', label: 'text-blue-700',  bg: 'bg-blue-50' },
  };
  const rc = roleColors[user.role] || roleColors.student;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Role badge header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${rc.bg} border border-${rc.label.split('-')[1]}-100`}>
            <div className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${rc.label}`}>
              {user.role}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-700 truncate">{user.name || user.email}</p>
        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    strokeWidth={2}
                  />
                  <span className="truncate">{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors group"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" strokeWidth={2} />
          <span>Sign Out</span>
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-medium">Supabase Cloud · v3.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-slate-200 flex-col h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[82vw] bg-white shadow-2xl z-50 animate-slide-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
