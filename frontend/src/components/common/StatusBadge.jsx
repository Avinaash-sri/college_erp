import React from 'react';

export default function StatusBadge({ status, type = 'attendance' }) {
  if (!status) return null;
  const s = String(status).toUpperCase();

  // Attendance Statuses
  if (s === 'SAFE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
        Safe (&ge;75%)
      </span>
    );
  }
  if (s === 'WARNING') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full"></span>
        Warning (65-74.9%)
      </span>
    );
  }
  if (s === 'HIGH RISK' || s === 'RISK' || s === 'CRITICAL') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-rose-500 rounded-full"></span>
        High Risk (&lt;65%)
      </span>
    );
  }

  // Attendance Present/Absent
  if (s === 'PRESENT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
        Present
      </span>
    );
  }
  if (s === 'ABSENT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
        Absent
      </span>
    );
  }

  // Fees Statuses
  if (s === 'PAID') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        Paid
      </span>
    );
  }
  if (s === 'PARTIALLY PAID') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Partially Paid
      </span>
    );
  }
  if (s === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        Pending
      </span>
    );
  }

  // Email / Alert Statuses
  if (s === 'SENT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        Delivered (SMTP)
      </span>
    );
  }
  if (s === 'SIMULATED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        Simulated (Demo Mode)
      </span>
    );
  }
  if (s === 'FAILED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {status}
    </span>
  );
}
