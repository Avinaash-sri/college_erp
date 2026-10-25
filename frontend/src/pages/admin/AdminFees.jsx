import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { CreditCard, Plus, CheckCircle, Edit } from 'lucide-react';

export default function AdminFees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [newPaidAmount, setNewPaidAmount] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    title: 'Semester 6 Tuition Fee',
    total_amount: 65000,
    paid_amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [fRes, stRes] = await Promise.all([
        client.get('/admin/fees'),
        client.get('/admin/students')
      ]);
      const feeList = Array.isArray(fRes.data)
        ? fRes.data
        : (Array.isArray(fRes.data?.records)
        ? fRes.data.records
        : (Array.isArray(fRes.data?.defaulters) ? fRes.data.defaulters : []));
      setFees(feeList);

      const stList = Array.isArray(stRes.data)
        ? stRes.data
        : (Array.isArray(stRes.data?.data) ? stRes.data.data : []);
      setStudents(stList);
      if (stList.length > 0 && !formData.student_id) {
        setFormData(prev => ({ ...prev, student_id: stList[0].id }));
      }
    } catch (e) {
      console.error(e);
      setFees([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFee = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/fees', {
        ...formData,
        student_id: parseInt(formData.student_id),
        total_amount: parseFloat(formData.total_amount),
        paid_amount: parseFloat(formData.paid_amount)
      });
      setAddModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to add fee record');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUpdate = (f) => {
    setSelectedFee(f);
    setNewPaidAmount(f.paid_amount);
    setUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put(`/admin/fees/${selectedFee.id}`, {
        paid_amount: parseFloat(newPaidAmount)
      });
      setUpdateModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to update fee record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading institutional fee accounts..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Fee Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Assign tuition invoices, verify bank receipts, and manage student fee clearance</p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Fee Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Reg No</th>
                <th className="py-3 px-3">Fee Description</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
                <th className="py-3 px-3 text-right">Paid (₹)</th>
                <th className="py-3 px-3 text-right">Pending Balance (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(fees) ? fees : []).map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {f.student_name || f.name || (students.find((s) => s.id === f.student_id)?.name) || 'Student'}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {f.reg_no || f.student_reg_no || (students.find((s) => s.id === f.student_id)?.reg_no) || ''}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{f.title || 'Semester Fee'}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{(f.total_amount ?? 85000).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">₹{(f.paid_amount ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">₹{(f.pending_amount ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={f.status || 'Paid'} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenUpdate(f)}
                      className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-semibold text-blue-700 hover:bg-slate-50"
                    >
                      Update Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fee Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Issue Student Fee Invoice" maxWidth="max-w-md">
        <form onSubmit={handleCreateFee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Student *
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.reg_no})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Fee Description *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Total Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Paid Amount (₹)
              </label>
              <input
                type="number"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Paid Amount Modal */}
      <Modal isOpen={updateModalOpen} onClose={() => setUpdateModalOpen(false)} title="Update Payment Record" maxWidth="max-w-md">
        {selectedFee && (
          <form onSubmit={handleSaveUpdate} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{selectedFee.student_name} ({selectedFee.reg_no})</div>
              <div className="text-slate-500 mt-0.5">{selectedFee.title} &bull; Total: ₹{selectedFee.total_amount.toLocaleString()}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Updated Total Paid Amount (₹) *
              </label>
              <input
                type="number"
                required
                max={selectedFee.total_amount}
                min="0"
                value={newPaidAmount}
                onChange={(e) => setNewPaidAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Remaining balance will be ₹{(selectedFee.total_amount - (parseFloat(newPaidAmount) || 0)).toLocaleString()}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
