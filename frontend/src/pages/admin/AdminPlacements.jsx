import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

export default function AdminPlacements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    package_lpa: 12.0,
    eligibility: 'B.Tech CSE / IT with CGPA >= 7.5',
    deadline: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchPlacements = () => {
    client.get('/admin/placements')
      .then((res) => setPlacements(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this placement drive opportunity?')) return;
    try {
      await client.delete(`/admin/placements/${id}`);
      fetchPlacements();
    } catch (e) {
      alert('Failed to delete placement');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/placements', {
        ...formData,
        package_lpa: parseFloat(formData.package_lpa)
      });
      setModalOpen(false);
      fetchPlacements();
    } catch (e) {
      alert('Failed to post placement drive');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading placement drives..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Training &amp; Placement Drives</h1>
          <p className="text-xs text-slate-500 mt-0.5">Publish corporate recruitment drives, salary packages, and eligibility criteria</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Placement Opportunity</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placements.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{p.company}</h3>
                  <p className="text-xs font-semibold text-blue-700">{p.role}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {p.package_lpa} LPA
                  </span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-700"
                    title="Delete drive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs space-y-1.5 text-slate-600">
                <p><strong>Eligibility:</strong> {p.eligibility}</p>
                <p className="line-clamp-2"><strong>Description:</strong> {p.description}</p>
                <p className="text-[11px] text-slate-400 font-medium">Deadline: {new Date(p.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Post Placement Opportunity" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Cisco Systems"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Job Role Title *
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Software Development Engineer"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Package (LPA) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.package_lpa}
                onChange={(e) => setFormData({ ...formData, package_lpa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Eligibility Requirements *
            </label>
            <input
              type="text"
              required
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Posting...' : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
