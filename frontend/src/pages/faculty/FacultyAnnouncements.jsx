import React, { useState } from 'react';
import client from '../../api/client';
import { Megaphone, Send, CheckCircle } from 'lucide-react';

export default function FacultyAnnouncements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Exam Announcement');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await client.post('/faculty/announcements', {
        title,
        message,
        type
      });
      setToast('Academic announcement successfully broadcast to students!');
      setTitle('');
      setMessage('');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Post Course Announcement</h1>
        <p className="text-xs text-slate-500 mt-0.5">Broadcast circulars, lab guidelines, and exam instructions to students</p>
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center space-x-2 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Announcement Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium bg-white"
            >
              <option value="Exam Announcement">Exam Announcement</option>
              <option value="General Announcement">General Academic Announcement</option>
              <option value="Fee Reminder">Fee Notification</option>
              <option value="Placement Announcement">Placement Preparation Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Title / Subject Line
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for CS601 Lab Practical Examination"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Announcement Details
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide complete details, deadlines, room numbers, or requirements for students..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Broadcasting Notice...' : 'Broadcast Announcement'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
