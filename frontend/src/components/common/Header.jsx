import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Bell, User, GraduationCap } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold shadow-xs">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">CLOUD ERP</h1>
          <p className="text-[11px] font-medium text-slate-400">INSTITUTE OF TECHNOLOGY & SCIENCE</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user?.role === 'student' && (
          <Link
            to="/student/notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
          </Link>
        )}

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
              {getRoleBadge(user?.role)}
            </div>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'student' ? `${user?.reg_no || ''} - ${user?.department_name || ''}` : user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
