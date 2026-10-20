import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Settings, Shield, Mail, CheckCircle, Save, Send, AlertCircle } from 'lucide-react';

export default function AdminSettings() {
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [safeThreshold, setSafeThreshold] = useState('75.0');
  const [warningThreshold, setWarningThreshold] = useState('65.0');
  const [collegeName, setCollegeName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [testingSMTP, setTestingSMTP] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    client.get('/admin/settings')
      .then((res) => {
        setSettingsData(res.data);
        setSafeThreshold(res.data.SAFE_THRESHOLD || '75.0');
        setWarningThreshold(res.data.WARNING_THRESHOLD || '65.0');
        setCollegeName(res.data.COLLEGE_NAME || 'Institute of Technology & Advanced Science');
        setAcademicYear(res.data.ACADEMIC_YEAR || '2025-2026');
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put('/admin/settings', {
        SAFE_THRESHOLD: safeThreshold,
        WARNING_THRESHOLD: warningThreshold,
        COLLEGE_NAME: collegeName,
        ACADEMIC_YEAR: academicYear,
      });
      setToast('System settings and threshold values updated successfully!');
      setTimeout(() => setToast(''), 4000);
    } catch (e) {
      alert('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async (e) => {
    e.preventDefault();
    setTestingSMTP(true);
    setTestResult(null);
    try {
      const res = await client.post('/admin/settings/test-smtp', {
        recipient_email: testRecipient || undefined
      });
      setTestResult({
        success: res.data.success,
        status: res.data.status,
        message: res.data.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: 'Error',
        message: err.response?.data?.detail || 'SMTP test execution failed.'
      });
    } finally {
      setTestingSMTP(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading system configuration..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Institutional System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Configure institutional attendance rules, threshold parameters, and notification services</p>
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center space-x-2 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Attendance Thresholds Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
          <Shield className="w-5 h-5 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">Attendance Risk Thresholds &amp; Calculation Rules</h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Mandatory Safe Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={safeThreshold}
                onChange={(e) => setSafeThreshold(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard university minimum (default 75%). Crossing below this triggers automated parent alert.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Warning Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lower bound for warning classification before critical high risk (&lt;65%).
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                College Name Header
              </label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Active Academic Year
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Parameters...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SMTP Email Diagnostics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
          <Mail className="w-5 h-5 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">SMTP Notification Dispatch Status</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-400 block">Configured SMTP Host</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{settingsData?.SMTP_HOST}</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-400 block">SMTP Port</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{settingsData?.SMTP_PORT}</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-400 block">Sender Mailbox</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{settingsData?.SMTP_FROM_EMAIL}</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-400 block">Execution Mode</span>
            <span className="font-bold text-indigo-700 mt-0.5 block">
              {settingsData?.SMTP_HOST?.includes('Not Configured') ? 'Safe Demo Simulation (Full HTML Previews)' : 'Live SMTP Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SMTP Gateway Test */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
          <Send className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Test SMTP Gateway Dispatch</h2>
        </div>

        <form onSubmit={handleTestSMTP} className="space-y-4">
          <p className="text-xs text-slate-500">
            Send an authorized test email through the configured mail gateway to verify delivery parameters, TLS negotiation, and credentials.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Recipient email address (e.g. admin@college.edu)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={testingSMTP}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-indigo-700 text-white font-semibold text-xs hover:bg-indigo-800 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingSMTP ? 'Testing Connection...' : 'Send Test Mail'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`rounded-lg border p-4 text-xs flex items-start space-x-3 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  Status: {testResult.status} {testResult.success ? '(Success)' : '(Failed/Simulation)'}
                </div>
                <div className="mt-1 text-[11px] opacity-90">{testResult.message}</div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
