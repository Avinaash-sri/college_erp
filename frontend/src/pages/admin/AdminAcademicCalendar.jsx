import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_TYPES = {
  exam:       { color: 'bg-rose-500',    text: 'text-white', dot: 'bg-rose-500',    label: 'Exam' },
  holiday:    { color: 'bg-amber-400',   text: 'text-white', dot: 'bg-amber-400',   label: 'Holiday' },
  event:      { color: 'bg-blue-500',  text: 'text-white', dot: 'bg-blue-500',  label: 'Event' },
  deadline:   { color: 'bg-orange-500',  text: 'text-white', dot: 'bg-orange-500',  label: 'Deadline' },
  assessment: { color: 'bg-blue-500',  text: 'text-white', dot: 'bg-blue-500',  label: 'Assessment' },
};

export default function AdminAcademicCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Event Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'event',
    description: '',
    department: 'All'
  });

  const fetchEvents = async () => {
    try {
      const res = await client.get('/admin/calendar/events');
      if (Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (e) {
      console.warn('Failed to load real-time calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      alert('Please provide event title and date');
      return;
    }
    setSaving(true);
    try {
      await client.post('/admin/calendar/events', formData);
      setAddModalOpen(false);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'event',
        description: '',
        department: 'All'
      });
      fetchEvents();
    } catch (err) {
      alert('Failed to save academic event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (e, evId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this event from academic calendar?')) return;
    try {
      await client.delete(`/admin/calendar/events/${evId}`);
      fetchEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const eventsOnDate = (dateStr) => events.filter((e) => e.date === dateStr);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : [];

  // Upcoming events
  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (loading) return <LoadingSpinner message="Synchronizing institutional academic calendar..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
            <h1 className="text-lg font-bold text-slate-900">Academic Calendar &amp; Schedule</h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Real-time semester timeline, examination dates, assignment cutoffs, and holidays</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex flex-wrap gap-2">
            {Object.entries(EVENT_TYPES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                {val.label}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Academic Event</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 erp-card p-5">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS.map(d => (
              <span key={d} className="text-[11px] font-semibold text-slate-400 py-1">{d}</span>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              if (!isCurrentMonth) {
                return <div key={i} className="aspect-square opacity-0 pointer-events-none" />;
              }

              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsOnDate(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isWeekend = i % 7 === 0 || i % 7 === 6;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`aspect-square flex flex-col items-center justify-start pt-1.5 gap-0.5 rounded-lg transition-all text-[12px] font-medium
                    ${isSelected ? 'bg-blue-600 text-white shadow-sm' :
                      isToday ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300' :
                      isWeekend ? 'text-slate-400 hover:bg-slate-50' :
                      'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{dayNum}</span>
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 3).map((ev, ei) => (
                      <div
                        key={ei}
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : EVENT_TYPES[ev.type]?.dot || 'bg-slate-400'}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected date events */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No academic events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev, i) => {
                    const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
                    return (
                      <div key={i} className={`flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg ${cfg.color} ${cfg.text} shadow-2xs`}>
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-white/70 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-xs font-bold leading-tight">{ev.title}</p>
                            {ev.description && <p className="text-[11px] opacity-90 mt-0.5">{ev.description}</p>}
                            <span className="inline-block mt-1 px-1.5 py-0.2 bg-black/20 rounded text-[9px] uppercase tracking-wider font-semibold">
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        {typeof ev.id === 'number' && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEvent(e, ev.id)}
                            className="p-1 hover:bg-black/20 rounded text-white/80 hover:text-white transition-colors"
                            title="Delete custom event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events sidebar */}
        <div className="erp-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Upcoming Academic Schedule</span>
              <span className="text-[11px] text-slate-400 font-normal">Next 10 Milestones</span>
            </h2>

            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {upcoming.map((ev, i) => {
                  const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
                  const d = new Date(ev.date + 'T00:00:00');
                  const diffDays = Math.round((d - today) / (1000*60*60*24));
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedDate(ev.date);
                        setViewMonth(d.getMonth());
                        setViewYear(d.getFullYear());
                      }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${cfg.color} ${cfg.text} flex items-center justify-center text-[10px] font-bold`}>
                        {d.getDate()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-800 leading-tight truncate">{ev.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          {diffDays === 0 ? ' · Today' : diffDays === 1 ? ' · Tomorrow' : ` · in ${diffDays} days`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Synchronized with active ERP</span>
            <span className="font-semibold text-blue-600">{events.length} Total Events</span>
          </div>
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Schedule Academic Event / Milestone"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. CIA-3 Continuous Assessment / Technical Symposium"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Event Category *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="exam">Exam</option>
                <option value="assessment">Assessment</option>
                <option value="deadline">Deadline</option>
                <option value="holiday">Holiday</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Description / Venue / Notes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide venue, guidelines, syllabus or holiday notice..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-xs"
            >
              {saving ? 'Saving...' : 'Add to Calendar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
