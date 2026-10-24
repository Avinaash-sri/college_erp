import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  Briefcase,
  Info,
  Trash2,
  X,
  ExternalLink,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Image
} from 'lucide-react';


export default function StudentNotifications() {
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
      const res = await client.get('/notifications/me');
      setNotifs(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Keyboard shortcut: close modal on Escape
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
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 1. OPEN NOTIFICATION & MARK AS READ
  const handleOpenNotification = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.is_read) {
      const prevNotifs = [...notifs];
      // Optimistic update
      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      try {
        await client.put(`/notifications/${notif.id}/read`);
        window.dispatchEvent(new Event('notification-updated'));
      } catch (err) {
        console.error('Failed to mark notification read on open:', err);
        // Rollback on failure
        setNotifs(prevNotifs);
        alert('Failed to update notification read status. Please check your connection.');
      }
    }
  };

  // 2. CLEAR INDIVIDUAL NOTIFICATION
  // Removes from student's active list, persists in DB via is_cleared=True,
  // never reappears on refresh, and NEVER deletes the original announcement.
  const handleClearNotification = async (e, notifId) => {
    e.stopPropagation(); // Prevent opening modal
    const prevNotifs = [...notifs];
    try {
      setActionLoadingId(notifId);
      // Optimistic UI
      setNotifs((prev) => prev.filter((n) => n.id !== notifId));
      if (selectedNotif && selectedNotif.id === notifId) {
        setSelectedNotif(null);
      }
      await client.put(`/notifications/${notifId}/clear`);
      window.dispatchEvent(new Event('notification-updated'));
      showTemporaryFeedback('Notification cleared from your inbox.');
    } catch (err) {
      console.error('Failed to clear notification:', err);
      // Rollback
      setNotifs(prevNotifs);
      alert('Could not clear notification. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. MARK ALL AS READ
  const handleMarkAllAsRead = async () => {
    const prevNotifs = [...notifs];
    try {
      setMarkingAll(true);
      // Optimistic UI
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      await client.put('/notifications/read-all');
      window.dispatchEvent(new Event('notification-updated'));
      showTemporaryFeedback('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setNotifs(prevNotifs);
      alert('Failed to mark all as read. Please try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  // 4. CLOSE DETAIL VIEW
  // Returns to the list view without clearing the notification, preserving read state.
  const handleCloseDetail = () => {
    setSelectedNotif(null);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Attendance Alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'Exam Announcement':
      case 'Exam':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Fee Reminder':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'Placement Announcement':
      case 'Placement':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'Symposium':
      case 'Cultural':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const safeNotifs = Array.isArray(notifs) ? notifs : [];
  const filteredNotifs = filter === 'All' ? safeNotifs : safeNotifs.filter((n) => n.type === filter);
  const unreadCount = safeNotifs.filter((n) => !n.is_read).length;

  if (loading) return <LoadingSpinner message="Loading notifications and college alerts..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Notifications &amp; College Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time circulars, department announcements, symposiums, exams and administrative notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>{markingAll ? 'Updating...' : 'Mark All as Read'}</span>
          </button>
        )}
      </div>

      {/* Temporary Toast / Feedback */}
      {feedbackMsg && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'General', 'Academic', 'Exam', 'Symposium', 'Cultural', 'Placement', 'Attendance Alert', 'Fee Reminder'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === t
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
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
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No notifications found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {filter === 'All'
                ? "You're all caught up! You have no active notifications."
                : `No notifications match the "${filter}" filter.`}
            </p>
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={`rounded-xl border p-4 transition-all duration-150 cursor-pointer flex items-start justify-between gap-4 group ${
                n.is_read
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs text-slate-700'
                  : 'bg-blue-50/30 border-blue-200 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {getTypeIcon(n.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-xs ${n.is_read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'} truncate`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread notification" />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-semibold uppercase tracking-wider text-slate-500">{n.type}</span>
                    <span>&bull;</span>
                    <span>
                      {new Date(n.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>

                  {(n.poster_url || n.file_data || n.announcement?.poster_url || n.announcement?.file_data) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md w-fit">
                      <Image className="w-3 h-3" />
                      <span>Attached Circular / Poster Image</span>
                    </div>
                  )}
                </div>
              </div>


              {/* Action Buttons: Clear & Open */}
              <div className="flex items-center space-x-1 shrink-0">
                {/* Clear Individual Notification */}
                <button
                  onClick={(e) => handleClearNotification(e, n.id)}
                  disabled={actionLoadingId === n.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Clear notification from your inbox"
                  aria-label="Clear notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors hidden sm:block" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. NOTIFICATION DETAIL MODAL */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8 animate-fade-in relative max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  {getTypeIcon(selectedNotif.type)}
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 mb-1">
                    {selectedNotif.type}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedNotif.title}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Received on {new Date(selectedNotif.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Close Button */}
              <button
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close detail modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Notice Poster / Circular Image Attachment */}
              {(selectedNotif.poster_url || selectedNotif.file_data || selectedNotif.announcement?.poster_url || selectedNotif.announcement?.file_data) && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                  <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <Image className="w-3.5 h-3.5" /> Official Circular Attachment / Poster
                    </span>
                    <a
                      href={selectedNotif.poster_url || selectedNotif.file_data || selectedNotif.announcement?.poster_url || selectedNotif.announcement?.file_data}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold underline"
                    >
                      Open Full Size ↗
                    </a>
                  </div>
                  <div className="p-3 flex items-center justify-center bg-slate-900/5">
                    <img
                      src={selectedNotif.poster_url || selectedNotif.file_data || selectedNotif.announcement?.poster_url || selectedNotif.announcement?.file_data}
                      alt={selectedNotif.title}
                      className="max-h-64 w-auto object-contain rounded-lg shadow-xs border border-slate-200/80 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notice Details
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedNotif.announcement?.description || selectedNotif.message}
                </p>
              </div>


              {/* Event Date If Linked */}
              {selectedNotif.announcement?.event_date && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Event Scheduled For: </span>
                    <span>
                      {new Date(selectedNotif.announcement.event_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Registration / Link Button */}
              {(selectedNotif.announcement?.registration_url || selectedNotif.link_url) && (
                <div className="pt-2">
                  <a
                    href={selectedNotif.announcement?.registration_url || selectedNotif.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Open Registration / Event Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={(e) => handleClearNotification(e, selectedNotif.id)}
                disabled={actionLoadingId === selectedNotif.id}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoadingId === selectedNotif.id ? 'Clearing...' : 'Clear Notification'}</span>
              </button>

              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
