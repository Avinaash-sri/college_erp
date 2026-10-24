import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Megaphone,
  Clock,
  UserCheck,
  CheckCircle2,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await client.get('/faculty/notifications');
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setNotifs(data);
    } catch (err) {
      console.error('Failed to load faculty notifications:', err);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Keyboard shortcut to close detail modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedNotif) {
        setSelectedNotif(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotif]);

  const showTemporaryFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Open & Mark as Read
  const handleOpenNotification = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.is_read) {
      const prevNotifs = [...notifs];
      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      try {
        await client.put(`/notifications/${notif.id}/read`);
        window.dispatchEvent(new Event('notification-updated'));
      } catch (err) {
        console.error('Failed to mark read:', err);
        setNotifs(prevNotifs);
      }
    }
  };

  // Clear Individual Notification
  const handleClearNotification = async (e, notifId) => {
    e.stopPropagation();
    const prevNotifs = [...notifs];
    try {
      setActionLoadingId(notifId);
      setNotifs((prev) => prev.filter((n) => n.id !== notifId));
      if (selectedNotif && selectedNotif.id === notifId) {
        setSelectedNotif(null);
      }
      await client.put(`/notifications/${notifId}/clear`);
      window.dispatchEvent(new Event('notification-updated'));
      showTemporaryFeedback('Notification removed from your active inbox.');
    } catch (err) {
      console.error('Failed to clear notification:', err);
      setNotifs(prevNotifs);
      alert('Could not clear notification. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark All as Read
  const handleMarkAllAsRead = async () => {
    const prevNotifs = [...notifs];
    try {
      setMarkingAll(true);
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      await client.put('/notifications/read-all');
      window.dispatchEvent(new Event('notification-updated'));
      showTemporaryFeedback('All active notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setNotifs(prevNotifs);
      alert('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  // Category Icon Resolver
  const getCategoryIcon = (type, priority) => {
    const t = (type || '').toLowerCase();
    if (priority === 'High' || priority === 'Urgent') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    if (t.includes('timetable') || t.includes('schedule')) {
      return <Clock className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('leave') || t.includes('attendance')) {
      return <UserCheck className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('announcement') || t.includes('circular')) {
      return <Megaphone className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('exam') || t.includes('mark') || t.includes('academic')) {
      return <FileText className="w-4 h-4 text-amber-600" />;
    }
    return <Sparkles className="w-4 h-4 text-blue-600" />;
  };

  // Filter logic
  const filteredNotifs = notifs.filter((n) => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Circulars') return (n.type || '').toLowerCase().includes('announcement') || (n.type || '').toLowerCase().includes('circular');
    if (filter === 'Academic') return (n.type || '').toLowerCase().includes('exam') || (n.type || '').toLowerCase().includes('timetable') || (n.type || '').toLowerCase().includes('schedule');
    if (filter === 'Leaves') return (n.type || '').toLowerCase().includes('leave');
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="erp-card p-6 border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50/40 via-white to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Notification Center</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official circulars, administrative alerts, departmental directives, and leave updates for faculty.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/faculty/announcements"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Announcements</span>
            </Link>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{markingAll ? 'Updating...' : 'Mark all read'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Temporary Feedback Notification Banner */}
        {feedbackMsg && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-xs text-blue-900 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Unread', 'Circulars', 'Academic', 'Leaves'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && ` (${unreadCount})`}
            {tab === 'All' && ` (${notifs.length})`}
          </button>
        ))}
      </div>

      {/* Main List Area */}
      {loading ? (
        <LoadingSpinner message="Loading your faculty notifications..." />
      ) : filteredNotifs.length === 0 ? (
        <div className="erp-card py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Your inbox is clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === 'Unread'
              ? 'You have reviewed all current notifications. New circulars will arrive here.'
              : 'No notifications match the selected category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={`erp-card p-4 transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 group ${
                n.is_read
                  ? 'bg-white hover:bg-slate-50/80 border-slate-200'
                  : 'bg-blue-50/20 border-blue-200 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {getCategoryIcon(n.type, n.priority)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        n.priority === 'High' || n.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {n.priority || 'Normal'}
                    </span>

                    {n.type && (
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        &bull; {n.type}
                      </span>
                    )}

                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread notification" />
                    )}
                  </div>

                  <h3
                    className={`text-xs tracking-tight ${
                      !n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                    }`}
                  >
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    {n.attachment_url && (
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <ImageIcon className="w-3 h-3" />
                        Attachment attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0 pt-1">
                <button
                  onClick={(e) => handleClearNotification(e, n.id)}
                  disabled={actionLoadingId === n.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Modal Dialog */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  {getCategoryIcon(selectedNotif.type, selectedNotif.priority)}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedNotif.priority === 'High' || selectedNotif.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedNotif.priority || 'Normal'} Priority
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {selectedNotif.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line py-1">
              {selectedNotif.message}
            </div>

            {/* Attachment preview if image or file */}
            {selectedNotif.attachment_url && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Circular Attachment
                  </span>
                  <a
                    href={selectedNotif.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-bold underline"
                  >
                    Open in new tab
                  </a>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
                  <img
                    src={selectedNotif.attachment_url}
                    alt="Attachment"
                    className="w-full max-h-56 object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Received: {new Date(selectedNotif.created_at || Date.now()).toLocaleString()}
              </span>

              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
