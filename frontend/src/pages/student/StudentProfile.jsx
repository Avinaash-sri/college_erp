import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { User, Mail, Phone, MapPin, Building, GraduationCap, ShieldAlert } from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/me')
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading student profile..." />;
  if (!profile) return <div className="p-8 text-center text-slate-500">Failed to load profile.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Profile &amp; Registration Details</h1>
        <p className="text-xs text-slate-500 mt-0.5">Official student institutional credentials and registered parent contact info</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
              <StatusBadge status={profile.risk_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reg No: <span className="font-mono font-semibold text-slate-800">{profile.reg_no}</span> &bull; {profile.department_name}
            </p>
          </div>
        </div>

        {/* Academic Details */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Enrollment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Department</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">{profile.department_name}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Semester &amp; Section</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">Semester {profile.semester} - Section {profile.section}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Overall Attendance Standing</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-bold text-slate-900">{profile.overall_attendance}%</span>
                <StatusBadge status={profile.risk_status} />
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Student Email</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{profile.email}</span>
            </div>
          </div>
        </div>

        {/* Parent & Emergency Contacts */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Parent Information (Automated Alerts Target)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Parent / Guardian Name</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">{profile.parent_name}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-blue-200/60 bg-blue-50/20">
              <span className="text-[11px] font-semibold text-blue-600 block">Registered Parent Email (SMTP Alerts)</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">{profile.parent_email}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Receives automated alerts if attendance falls below 75%</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Student Contact Phone</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{profile.phone || 'Not recorded'}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Permanent Address</span>
              <span className="text-xs font-medium text-slate-700 mt-0.5 block">{profile.address || 'Bengaluru, Karnataka'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
