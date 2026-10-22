import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Briefcase, Calendar, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function StudentPlacements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/me/placements')
      .then((res) => setPlacements(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error(err);
        setPlacements([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Fetching campus placement opportunities..." />;

  const safePlacements = Array.isArray(placements) ? placements : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Training &amp; Placements</h1>
        <p className="text-xs text-slate-500 mt-0.5">Active on-campus recruitment drives, corporate job profiles, and eligibility criteria</p>
      </div>

      {safePlacements.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600">No active placement drives currently scheduled.</p>
          <p className="text-[11px] text-slate-400 mt-1">Check back soon for upcoming corporate drives.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safePlacements.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{p.company}</h2>
                  <p className="text-xs font-semibold text-blue-700 mt-0.5">{p.role}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.package_lpa} LPA
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Eligibility Criteria:</span>
                  <span className="text-slate-600">{p.eligibility}</span>
                </div>
                <div className="mt-2">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">Role Description:</span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{p.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Deadline: <span className="font-semibold text-slate-700">{new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
              </div>

              <button
                type="button"
                onClick={() => alert(`Application for ${p.company} (${p.role}) logged in Placement Cell portal.`)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs"
              >
                <span>Apply Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  );
}
