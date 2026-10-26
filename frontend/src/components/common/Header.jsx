import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import client from '../../api/client';
import {
  Bell,
  GraduationCap,
  Menu,
  X,
  Search,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  BookOpen,
  CalendarCheck,
  HelpCircle,
  BookMarked,
  Clock,
  CalendarDays,
  Upload,
  MessageSquare,
  FileText,
  AlertTriangle,
  Megaphone,
  UserCheck,
  Building2,
  Settings,
  CreditCard,
  Briefcase,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function Header({ onMenuToggle, mobileMenuOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut: Press '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setNotifDropdownOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside listener for notification & search popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lastPoppedIdRef = React.useRef(null);
  const toastTimeoutRef = React.useRef(null);

  // Reset popped toast tracker when active user switches
  useEffect(() => {
    lastPoppedIdRef.current = null;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotif(null);
  }, [user?.id, user?.email]);

  // Fetch unread count & notifications
  const fetchUnreadCount = () => {
    client.get('/notifications/unread-count')
      .then((res) => {
        const count = res.data?.unread_count ?? 0;
        setUnreadCount(count);
      })
      .catch(() => {});
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await client.get('/notifications/me');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);

    const checkAndShowToast = () => {
      fetchUnreadCount();
      if (notifDropdownOpen) fetchNotifications();
      client.get('/notifications/me')
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          const unread = list.filter((n) => !n.is_read && !n.is_cleared);
          if (unread.length > 0) {
            const top = unread[0];
            if (lastPoppedIdRef.current !== top.id) {
              lastPoppedIdRef.current = top.id;
              setToastNotif(top);
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              toastTimeoutRef.current = setTimeout(() => {
                setToastNotif(null);
              }, 2000);
            }
          }
        })
        .catch(() => {});
    };

    // Check toast on mount / user change
    checkAndShowToast();

    window.addEventListener('notification-updated', checkAndShowToast);
    return () => {
      clearInterval(interval);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      window.removeEventListener('notification-updated', checkAndShowToast);
    };
  }, [user, notifDropdownOpen]);

  const handleToggleNotifDropdown = () => {
    if (!notifDropdownOpen) {
      fetchNotifications();
    }
    setNotifDropdownOpen(!notifDropdownOpen);
  };

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await client.put(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await client.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const handleClearNotif = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await client.put(`/notifications/${notifId}/clear`);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      fetchUnreadCount();
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.warn('Failed to clear notification:', err);
    }
  };

  const handleNotifClick = (n) => {
    if (!n) return;
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    setNotifDropdownOpen(false);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotif(null);

    // Direct navigation to notification module of active panel
    if (user?.role === 'student') {
      navigate('/student/notifications');
    } else if (user?.role === 'faculty') {
      navigate('/faculty/notifications');
    } else {
      navigate('/admin/notifications');
    }
  };

  // Google Search Data Items tailored by user role
  const getSearchDatabase = () => {
    const role = user?.role || 'student';

    // 1. Pages for role
    const studentPages = [
      { category: 'Modules & Pages', title: 'Attendance Ledger & Recovery', path: '/student/attendance', keywords: 'attendance present absent cutoff percentage periods', icon: CalendarCheck },
      { category: 'Modules & Pages', title: 'Quizzes & Practice Tests', path: '/student/quizzes', keywords: 'quiz exam test results mcq assessment answers', icon: HelpCircle },
      { category: 'Modules & Pages', title: 'Assignments & Coursework', path: '/student/assignments', keywords: 'assignment submit drive upload homework due date deadline', icon: BookMarked },
      { category: 'Modules & Pages', title: 'Semester Timetable & Schedule', path: '/student/timetable', keywords: 'timetable schedule periods hours classes monday friday', icon: Clock },
      { category: 'Modules & Pages', title: 'GPA & Marks Calculator', path: '/student/gpa', keywords: 'gpa cgpa marks grades credits gpa calculator semester', icon: GraduationCap },
      { category: 'Modules & Pages', title: 'Study Materials & Syllabus Notes', path: '/student/materials', keywords: 'materials notes pdf download study syllabus slides', icon: BookOpen },
      { category: 'Modules & Pages', title: 'Leave & OD Applications', path: '/student/leave', keywords: 'leave od on duty medical permission absence request', icon: CalendarDays },
      { category: 'Modules & Pages', title: 'Documents & Certificates', path: '/student/documents', keywords: 'documents bonafide transfer certificate request download', icon: Upload },
      { category: 'Modules & Pages', title: 'Grievance Redressal (Direct Admin)', path: '/student/complaints', keywords: 'grievance complaint admin issue feedback ticket help', icon: MessageSquare },
      { category: 'Modules & Pages', title: 'Exam Hall Tickets & CIA Marks', path: '/student/exams', keywords: 'exam cia hall ticket marks results internals', icon: FileText },
      { category: 'Modules & Pages', title: 'Tuition Fees & Invoices', path: '/student/fees', keywords: 'fees tuition payment receipt invoice bill due', icon: CreditCard },
      { category: 'Modules & Pages', title: 'Campus Placements & Drives', path: '/student/placements', keywords: 'placement jobs companies interview resume package offer', icon: Briefcase },
      { category: 'Modules & Pages', title: 'Campus Notifications & Alerts', path: '/student/notifications', keywords: 'notifications alerts messages broadcast updates', icon: Bell },
    ];

    const facultyPages = [
      { category: 'Modules & Pages', title: 'Faculty Dashboard Overview', path: '/faculty/dashboard', keywords: 'dashboard faculty classes overview metrics stats', icon: GraduationCap },
      { category: 'Modules & Pages', title: 'Assigned Subjects & Syllabi', path: '/faculty/subjects', keywords: 'subjects courses curriculum units syllabus teaching', icon: BookOpen },
      { category: 'Modules & Pages', title: 'Mark Period Attendance', path: '/faculty/attendance', keywords: 'attendance mark period present absent session save', icon: CalendarCheck },
      { category: 'Modules & Pages', title: 'Students Roster & Profiles', path: '/faculty/students', keywords: 'students list roster profiles register roll number', icon: UserCheck },
      { category: 'Modules & Pages', title: 'Quiz Management & Results', path: '/faculty/quizzes', keywords: 'quiz create test mcq publish review scores', icon: HelpCircle },
      { category: 'Modules & Pages', title: 'Assignment Submissions & Roster', path: '/faculty/assignments', keywords: 'assignments create submissions review download grades reminders', icon: BookMarked },
      { category: 'Modules & Pages', title: 'Marks & Internal Assessments', path: '/faculty/marks', keywords: 'marks enter edit cia internal assessment grades sheet', icon: FileText },
      { category: 'Modules & Pages', title: 'Upload Study Materials & Notes', path: '/faculty/materials', keywords: 'study materials upload pdf share notes courseware', icon: Upload },
      { category: 'Modules & Pages', title: 'Review Student Leave Requests', path: '/faculty/leave', keywords: 'leave requests approve reject student absence', icon: CalendarDays },
      { category: 'Modules & Pages', title: 'Weekly Teaching Timetable', path: '/faculty/timetable', keywords: 'timetable schedule lectures weekly periods classes', icon: Clock },
      { category: 'Modules & Pages', title: 'Department Announcements', path: '/faculty/announcements', keywords: 'announcements notice broadcast department memo', icon: Megaphone },
      { category: 'Modules & Pages', title: 'Faculty Notification Center', path: '/faculty/notifications', keywords: 'notifications alerts circulars inbox bell updates', icon: Bell },
    ];

    const adminPages = [
      { category: 'Modules & Pages', title: 'Admin Command Center', path: '/admin/dashboard', keywords: 'admin dashboard analytics overview erp system metrics', icon: GraduationCap },
      { category: 'Modules & Pages', title: 'Grievance Central (Confidential)', path: '/admin/complaints', keywords: 'complaints grievances student tickets resolve confidentiality', icon: MessageSquare },
      { category: 'Modules & Pages', title: 'Automated Attendance Alerts (<75%)', path: '/admin/attendance-alerts', keywords: 'attendance alerts defaulters smtp auto emails parents notice', icon: AlertTriangle },
      { category: 'Modules & Pages', title: 'Campus Broadcast Announcements', path: '/admin/announcements', keywords: 'announcements broadcast notice banner alert publish', icon: Megaphone },
      { category: 'Modules & Pages', title: 'Academic Calendar & Holidays', path: '/admin/academic-calendar', keywords: 'academic calendar schedule events holidays semester dates', icon: CalendarDays },
      { category: 'Modules & Pages', title: 'Student Directory & Records', path: '/admin/students', keywords: 'students directory enroll admission department records', icon: UserCheck },
      { category: 'Modules & Pages', title: 'Faculty Directory & Designations', path: '/admin/faculty', keywords: 'faculty professors staff teachers directory roster', icon: Building2 },
      { category: 'Modules & Pages', title: 'Departments & Programs', path: '/admin/departments', keywords: 'departments cse ece it civil mechanical programs', icon: Building2 },
      { category: 'Modules & Pages', title: 'Curriculum Subjects & Syllabi', path: '/admin/subjects', keywords: 'subjects courses curriculum credits regulation anna univ', icon: BookOpen },
      { category: 'Modules & Pages', title: 'Master Class Timetables', path: '/admin/timetable', keywords: 'timetable master schedules classrooms periods hours', icon: Clock },
      { category: 'Modules & Pages', title: 'Semester Exams & Publishing', path: '/admin/exams', keywords: 'exams schedule results publishing controller examinations', icon: FileText },
      { category: 'Modules & Pages', title: 'Tuition Fees & Financials', path: '/admin/fees', keywords: 'fees finance payments ledger arrears invoices receipts', icon: CreditCard },
      { category: 'Modules & Pages', title: 'Placements & Corporate Partners', path: '/admin/placements', keywords: 'placements packages companies recruitment offers drives', icon: Briefcase },
      { category: 'Modules & Pages', title: 'Faculty Teaching Performance', path: '/admin/faculty-performance', keywords: 'performance appraisal faculty metrics syllabus completion', icon: TrendingUp },
      { category: 'Modules & Pages', title: 'System Security & Settings', path: '/admin/settings', keywords: 'settings security rls supabase smtp system configuration', icon: Settings },
    ];

    // 2. Academic Course Subjects
    const courses = [
      { category: 'Academic Subjects', title: 'CS601: Cloud Computing Architecture', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'cloud computing aws azure virtualization kubernetes cs601', icon: BookOpen },
      { category: 'Academic Subjects', title: 'CS602: Compiler Design & Automata', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'compiler design parsing lexical syntax analysis cs602', icon: BookOpen },
      { category: 'Academic Subjects', title: 'CS603: Cryptography & Network Security', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'security cryptography rsa des aes cipher ssl cs603', icon: BookOpen },
      { category: 'Academic Subjects', title: 'CS604: Artificial Intelligence & Machine Learning', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'ai ml artificial intelligence neural networks cs604', icon: BookOpen },
      { category: 'Academic Subjects', title: 'CS605: Mobile Application Development', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'mobile app react native android flutter cs605', icon: BookOpen },
      { category: 'Academic Subjects', title: 'IT401: Database Management Systems', path: role === 'student' ? '/student/materials' : (role === 'faculty' ? '/faculty/materials' : '/admin/subjects'), keywords: 'dbms sql normalization transactions acid indexing it401', icon: BookOpen },
    ];

    // 3. Quick Actions
    const quickActions = role === 'student' ? [
      { category: 'Quick Actions', title: 'Submit Course Assignment (File / Drive)', path: '/student/assignments', keywords: 'submit upload drive assignment homework send file', icon: Upload },
      { category: 'Quick Actions', title: 'Review Quiz MCQ Test Solutions', path: '/student/quizzes', keywords: 'quiz review check result test answers mcq score', icon: HelpCircle },
      { category: 'Quick Actions', title: 'Calculate Target Attendance Percentage', path: '/student/attendance', keywords: 'attendance calculate target 75 recovery cutoff safe margin', icon: CalendarCheck },
      { category: 'Quick Actions', title: 'Apply for Medical or On-Duty Leave', path: '/student/leave', keywords: 'apply leave medical od on duty permission request absence', icon: CalendarDays },
      { category: 'Quick Actions', title: 'File Confidential Student Grievance', path: '/student/complaints', keywords: 'file submit grievance complaint ticket issue admin private', icon: MessageSquare },
    ] : role === 'faculty' ? [
      { category: 'Quick Actions', title: 'Mark Period 1 to 5 Attendance', path: '/faculty/attendance', keywords: 'mark attendance period today session save present absent', icon: CalendarCheck },
      { category: 'Quick Actions', title: 'Create New MCQ Academic Quiz', path: '/faculty/quizzes', keywords: 'create new quiz test add mcq questions publish', icon: HelpCircle },
      { category: 'Quick Actions', title: 'Trigger Automated Assignment Reminders', path: '/faculty/assignments', keywords: 'trigger automated reminders email pending students alert', icon: BookMarked },
      { category: 'Quick Actions', title: 'Upload Lecture Notes or Syllabus PDF', path: '/faculty/materials', keywords: 'upload study material notes pdf slides file dropzone', icon: Upload },
    ] : [
      { category: 'Quick Actions', title: 'Inspect Defaulter Students & Send SMTP Alerts', path: '/admin/attendance-alerts', keywords: 'attendance alerts send email smtp defaulters parent notice 75', icon: AlertTriangle },
      { category: 'Quick Actions', title: 'Resolve Student Grievance Complaints', path: '/admin/complaints', keywords: 'resolve complaints tickets grievance response reply status', icon: MessageSquare },
      { category: 'Quick Actions', title: 'Broadcast Campus Announcement', path: '/admin/announcements', keywords: 'broadcast announcement publish banner emergency notice', icon: Megaphone },
    ];

    const allPages = role === 'admin' ? adminPages : (role === 'faculty' ? facultyPages : studentPages);
    return [...allPages, ...quickActions, ...courses];
  };

  // Perform Google-Style live match on input
  const searchDatabase = getSearchDatabase();
  const qClean = searchQuery.trim().toLowerCase();
  const searchResults = !qClean ? [] : searchDatabase.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(qClean);
    const kwMatch = item.keywords.toLowerCase().includes(qClean);
    const catMatch = item.category.toLowerCase().includes(qClean);
    return titleMatch || kwMatch || catMatch;
  }).slice(0, 8); // Top 8 relevant results

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev + 1) % (searchResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev - 1 + searchResults.length) % (searchResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedResultIndex]) {
        handleSelectSearchResult(searchResults[selectedResultIndex]);
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSelectSearchResult = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const roleConfig = {
    admin:   { color: 'bg-blue-600', label: 'Admin' },
    faculty: { color: 'bg-blue-500', label: 'Faculty' },
    student: { color: 'bg-emerald-600', label: 'Student' },
  };
  const rc = roleConfig[user?.role] || roleConfig.student;

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-5 shadow-2xs">
      {/* Left: Menu button + Brand Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-xs group-hover:bg-blue-700 transition-colors">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="leading-none hidden sm:block">
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">CloudERP</p>
            <p className="text-[10px] text-slate-400 font-medium">Academic Portal</p>
          </div>
        </Link>
      </div>

      {/* Center: Google-Style Live Responsive Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-3 sm:mx-6">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedResultIndex(0);
              if (!searchOpen) setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search modules, subjects... (Press /)"
            className="w-full h-9 pl-9 pr-8 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Google-Style Live Results Dropdown */}
        {searchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50/70">
              <span className="font-semibold text-slate-600">
                Matching results ({searchResults.length})
              </span>
              <span className="text-[10px]">Navigate with ↑ ↓, press Enter</span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">No matches found for "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try searching for "attendance", "quiz", "assignment", "leave", or "notes"</p>
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const Icon = item.icon || FileText;
                  const isSelected = idx === selectedResultIndex;
                  return (
                    <button
                      key={item.title + idx}
                      onClick={() => handleSelectSearchResult(item)}
                      onMouseEnter={() => setSelectedResultIndex(idx)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 text-blue-950' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{item.category}</p>
                        </div>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'}`} />
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-2 bg-slate-50/90 border-t border-slate-100 text-center">
              <p className="text-[10.5px] text-slate-500">
                Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9.5px] font-mono text-slate-600 shadow-2xs">/</kbd> anywhere to search
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Working Notification Bell + User Profile */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Interactive Notification Bell Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleToggleNotifDropdown}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              notifDropdownOpen ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[9px] font-bold text-white leading-none shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 mt-2 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifs ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center px-4">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">You're all caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No active notifications or announcements</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-3 ${
                        !n.is_read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        !n.is_read ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-transparent'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`text-xs leading-snug line-clamp-1 ${
                            !n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                          }`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {formatTimestamp(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        {n.priority && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              n.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {n.priority}
                            </span>
                            {n.type && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                &bull; {n.type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Clear Button */}
                      <button
                        onClick={(e) => handleClearNotif(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity rounded cursor-pointer"
                        title="Dismiss notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to={user?.role === 'admin' ? '/admin/notifications' : (user?.role === 'faculty' ? '/faculty/notifications' : '/student/notifications')}
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>View notification center</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className={`h-7 w-7 rounded-full ${rc.color} flex items-center justify-center text-white text-[11px] font-bold uppercase flex-shrink-0 shadow-2xs`}>
            {(user?.name || user?.email || '?')[0]}
          </div>
          <div className="hidden sm:block text-right leading-none">
            <p className="text-[12.5px] font-semibold text-slate-800 truncate max-w-[130px]">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{rc.label}</p>
          </div>
        </div>
      </div>

      {/* Floating Pop Notification Banner (Student, Faculty & Admin live alerts) */}
      {toastNotif && (
        <div
          role="alert"
          onClick={() => handleNotifClick(toastNotif)}
          className="fixed top-16 sm:top-20 right-4 sm:right-6 z-[99999] w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-2xl border border-blue-200 p-4 transition-all duration-200 flex items-start gap-3.5 ring-1 ring-blue-500/20 backdrop-blur-md pointer-events-auto cursor-pointer hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-3xl active:scale-[0.99] animate-in fade-in slide-in-from-top-4"
          title="Touch to open notification module"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {toastNotif.type || 'Alert'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                  setToastNotif(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">{toastNotif.title}</h4>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{toastNotif.message}</p>
          </div>
        </div>
      )}
    </header>
  );
}

