import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[new Date().getDay()];
    if (days.includes(today)) {
      setActiveDay(today);
    }

    client.get('/students/me/timetable')
      .then((res) => setTimetable(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading weekly timetable..." />;
  if (!timetable) return <div className="p-8 text-center text-slate-500">Failed to load timetable.</div>;

  const currentDayClasses = timetable[activeDay] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Academic Timetable</h1>
        <p className="text-xs text-slate-500 mt-0.5">Weekly lecture schedule and class venues</p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {days.map((day) => {
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {day}
              <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {(timetable[day] || []).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Classes Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{activeDay} Lectures</h2>
          <span className="text-xs text-slate-400">{currentDayClasses.length} Scheduled Sessions</span>
        </div>

        {currentDayClasses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No classes scheduled for {activeDay}.
          </div>
        ) : (
          <div className="space-y-3">
            {currentDayClasses.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="flex flex-col items-center justify-center w-28 py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-slate-800 font-mono text-xs shadow-2xs">
                    <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{item.start_time}</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 mt-0.5">{item.end_time}</span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.subject_name}</div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                        {item.subject_code}
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item.faculty_name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:self-center">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Room {item.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
