import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Megaphone,
  Plus,
  Calendar,
  ExternalLink,
  Users,
  Eye,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  Sparkles,
  Archive
} from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Announcement',
    poster_url: '',
    event_date: '',
    registration_url: '',
    audience_type: 'all', // 'all', 'department', 'semester', 'section'
    target_department_id: '',
    target_semester: 6,
    target_section: 'All',
    status: 'published'
  });

  const categories = [
    'General Announcement',
    'Cultural Event',
    'Symposium',
    'Holiday',
    'Placement Drive',
    'Exam Schedule'
  ];

  const fetchAnnouncements = async () => {
    try {
      const res = await client.get('/admin/announcements', {
        params: {
          category: filterCategory,
          status_filter: filterStatus
        }
      });
      setAnnouncements(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await client.get('/admin/departments');
      setDepartments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchDepartments();
  }, [filterCategory, filterStatus]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill out the announcement title and description');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        target_department_id: formData.target_department_id ? parseInt(formData.target_department_id) : null,
        target_semester: formData.target_semester ? parseInt(formData.target_semester) : null,
        target_section: formData.target_section === 'All' ? null : formData.target_section,
        event_date: formData.event_date ? formData.event_date : null,
        registration_url: formData.registration_url.trim() || null,
        poster_url: formData.poster_url.trim() || null
      };

      await client.post('/admin/announcements', payload);
      alert('Announcement published! Individual notifications have been generated for the target audience.');
      setCreateModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to publish announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? Associated notifications will also be cleared.')) return;
    try {
      await client.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (e) {
      alert('Failed to delete announcement');
    }
  };

  const handleArchiveAnnouncement = async (id) => {
    try {
      await client.put(`/admin/announcements/${id}`, { status: 'archived' });
      fetchAnnouncements();
    } catch (e) {
      alert('Failed to archive announcement');
    }
  };

  if (loading) return <LoadingSpinner message="Loading institutional announcements..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campus Announcements &amp; Circulars</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish college-wide or department-targeted notices, cultural fests, symposiums, exam schedules, and placement circulars
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              category: 'General Announcement',
              poster_url: '',
              event_date: '',
              registration_url: '',
              audience_type: 'all',
              target_department_id: '',
              target_semester: 6,
              target_section: 'All',
              status: 'published'
            });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterCategory === c
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No announcements found matching the selected filter.
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-start md:justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {a.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      a.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Audience: {a.audience_type === 'all' ? 'All College' : `${a.audience_type} targeted`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.description}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2">
                  {a.event_date && (
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Event Date: {new Date(a.event_date).toLocaleDateString()}</span>
                    </span>
                  )}
                  {a.registration_url && (
                    <a
                      href={a.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 font-semibold text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Registration Link</span>
                    </a>
                  )}
                  <span className="text-[11px] text-slate-400">
                    Published: {new Date(a.published_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Poster thumbnail if present */}
              {a.poster_url && (
                <div className="w-full md:w-44 flex-shrink-0">
                  <img
                    src={a.poster_url}
                    alt={a.title}
                    className="w-full h-28 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 self-start">
                {a.status === 'published' && (
                  <button
                    onClick={() => handleArchiveAnnouncement(a.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs flex items-center space-x-1"
                    title="Archive Announcement"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 text-xs flex items-center space-x-1"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Publish Administrative Announcement"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. INVENTO 2026: Annual Inter-Collegiate Technical Symposium"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Audience Scope *
              </label>
              <select
                value={formData.audience_type}
                onChange={(e) => setFormData({ ...formData, audience_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="all">Entire College (All Students &amp; Faculty)</option>
                <option value="department">Specific Department Only</option>
                <option value="semester">Specific Academic Year / Semester</option>
                <option value="section">Specific Section Only</option>
              </select>
            </div>
          </div>

          {/* Department / Semester Scope Fields if not all */}
          {formData.audience_type !== 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Department</label>
                <select
                  value={formData.target_department_id}
                  onChange={(e) => setFormData({ ...formData, target_department_id: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Semester</label>
                <select
                  value={formData.target_semester}
                  onChange={(e) => setFormData({ ...formData, target_semester: parseInt(e.target.value) })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Section</label>
                <select
                  value={formData.target_section}
                  onChange={(e) => setFormData({ ...formData, target_section: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="All">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Announcement Message Body *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide complete details, schedule, venue, guidelines, or exam instructions..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Optional Event Date
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Optional Registration URL
              </label>
              <input
                type="url"
                value={formData.registration_url}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                placeholder="https://event.college.edu/register"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Optional Poster Image URL
            </label>
            <input
              type="url"
              value={formData.poster_url}
              onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-2xs"
            >
              {saving ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
