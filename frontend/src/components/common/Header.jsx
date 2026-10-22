import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import { LogOut, Bell, GraduationCap, Menu, X } from 'lucide-react';

export default function Header({ onMenuToggle, mobileMenuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = () => {
    if (!user) return;
    client.get('/notifications/unread-count')
      .then((res) => {
        setUnreadCount(res.data.unread_count || 0);
      })
      .catch(() => {
        // Fallback for demo or non-student
      });
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    const handleNotificationUpdate = () => fetchUnreadCount();
    window.addEventListener('notification-updated', handleNotificationUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Admin</span>;
      case 'faculty':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Faculty</span>;
      case 'student':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Student</span>;
      default:
        return null;
    }
  };

  const getNotificationLink = () => {
    if (user?.role === 'admin') return '/admin/announcements';
    if (user?.role === 'faculty') return '/faculty/announcements';
    return '/student/notifications';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-300/80 bg-[#F0F2F5] px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold shadow-xs">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">CLOUD ERP</h1>
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">INSTITUTE OF TECHNOLOGY & SCIENCE</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notification Bell with Static Icon and Number-Only Pulse Animation */}
        <Link
          to={getNotificationLink()}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors"
          title={unreadCount > 0 ? `${unreadCount} unread notices` : 'College Announcements & Notifications'}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs motion-safe:animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-300 pl-2 sm:pl-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{user?.name}</span>
              {getRoleBadge(user?.role)}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
              {user?.role === 'student' ? `${user?.reg_no || ''} - ${user?.department_name || ''}` : user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
