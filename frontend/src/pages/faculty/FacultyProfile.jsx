import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { User, Mail, Phone, Building, Briefcase } from 'lucide-react';

export default function FacultyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/faculty/me')
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading faculty profile..." />;
  if (!profile) return <div className="p-8 text-center text-slate-500">Failed to load profile.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Faculty Member Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Academic appointment, institutional credentials, and assigned department</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Emp ID: <span className="font-mono font-semibold text-slate-800">{profile.emp_id}</span> &bull; {profile.designation}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Assigned Department</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">{profile.department_name}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Academic Designation</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">{profile.designation}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Institutional Email</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{profile.email}</span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Official Phone</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{profile.phone || '+91 98765 43210'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
