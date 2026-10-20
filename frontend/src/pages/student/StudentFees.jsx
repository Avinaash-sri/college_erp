import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import { CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function StudentFees() {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/students/me/fees')
      .then((res) => setFeeData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Retrieving institutional fee records..." />;
  if (!feeData) return <div className="p-8 text-center text-slate-500">Failed to load fee information.</div>;

  const { summary, records } = feeData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Fee Ledger &amp; Payments</h1>
        <p className="text-xs text-slate-500 mt-0.5">Semester tuition, laboratory, and examination fee ledger</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Assessed Fees"
          value={`₹${summary.total.toLocaleString()}`}
          subtitle="Academic Year 2025-26"
          icon={CreditCard}
        />
        <StatCard
          title="Paid Amount"
          value={`₹${summary.paid.toLocaleString()}`}
          subtitle="Verified by Finance Office"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending Dues"
          value={`₹${summary.pending.toLocaleString()}`}
          subtitle={summary.pending === 0 ? 'No outstanding balance' : 'Pay before due date'}
          icon={AlertCircle}
          badge={<StatusBadge status={summary.status} />}
        />
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Institutional Fee Heads</h2>
          <span className="text-xs text-slate-400">{records.length} Recorded Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Fee Description</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Pending Balance</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-slate-900">{rec.title}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800">
                    ₹{rec.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                    ₹{rec.paid_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-rose-700 font-bold">
                    ₹{rec.pending_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">
                    {new Date(rec.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <StatusBadge status={rec.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
