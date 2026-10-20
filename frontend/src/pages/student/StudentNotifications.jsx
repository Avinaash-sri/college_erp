import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Bell, CheckCheck, AlertTriangle, FileText, CreditCard, Briefcase, Info } from 'lucide-react';

export default function StudentNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    client.get('/students/me/notifications')
      .then((res) => setNotifs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await client.put(`/students/me/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await client.put('/students/me/notifications/read-all');
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Attendance Alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'Exam Announcement':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Fee Reminder':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'Placement Announcement':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredNotifs = filter === 'All' ? notifs : notifs.filter((n) => n.type === filter);

  if (loading) return <LoadingSpinner message="Loading notifications and alerts..." />;

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications &amp; College Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notices requiring attention` : 'All notices have been read'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {['All', 'Attendance Alert', 'Exam Announcement', 'Fee Reminder', 'Placement Announcement', 'General Announcement'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === t
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No notifications found under the "{filter}" filter.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4.5 transition-colors flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white border-slate-200/80 text-slate-700'
                  : 'bg-blue-50/20 border-blue-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getTypeIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread notification" />
                    )}
                  </div>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                    {n.type} &bull; {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap self-start p-1"
                  title="Mark as read"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
