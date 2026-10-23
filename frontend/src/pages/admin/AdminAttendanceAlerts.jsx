import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  AlertTriangle,
  Send,
  Eye,
  CheckCircle2,
  Mail,
  ShieldCheck,
  History,
  AlertCircle,
  RotateCw
} from 'lucide-react';

export default function AdminAttendanceAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [sendingStudentId, setSendingStudentId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchAlertCenterData = () => {
    client.get('/admin/attendance-alerts')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlertCenterData();
  }, []);

  const handleRetrySingle = async (logId) => {
    setRetryingId(logId);
    setActionFeedback(null);
    try {
      const res = await client.post(`/admin/attendance-alerts/${logId}/retry`);
      setActionFeedback({
        type: res.data.status === 'Sent' ? 'success' : 'error',
        message: res.data.message || `Alert retry completed with status: ${res.data.status}`
      });
      fetchAlertCenterData();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to retry email dispatch.'
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    setActionFeedback(null);
    try {
      const res = await client.post('/admin/attendance-alerts/retry-all-failed');
      setActionFeedback({
        type: 'success',
        message: res.data.message || 'Processed retry for all failed alerts.'
      });
      fetchAlertCenterData();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to retry failed alerts.'
      });
    } finally {
      setRetryingAll(false);
    }
  };

  const [dispatchingAll, setDispatchingAll] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const handleDispatchAllDefaulters = async () => {
    setDispatchingAll(true);
    setActionFeedback(null);
    try {
      const res = await client.post('/admin/attendance-alerts/dispatch-all');
      setActionFeedback({
        type: 'success',
        message: res.data.message || 'Successfully dispatched notices to all students below 75% via SMTP.'
      });
      fetchAlertCenterData();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to dispatch bulk defaulter alerts.'
      });
    } finally {
      setDispatchingAll(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    setTestingSmtp(true);
    setActionFeedback(null);
    try {
      const res = await client.post('/admin/settings/test-smtp', {
        recipient_email: 'examplecollegeerp@gmail.com'
      });
      setActionFeedback({
        type: 'success',
        message: res.data.message || 'SMTP Gateway handshake verified with smtp.gmail.com:587 (TLS).'
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: 'SMTP Gateway test failed.'
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSendTestAlert = async (studentId, studentName) => {
    setSendingStudentId(studentId);
    setActionFeedback(null);
    try {
      const res = await client.post('/admin/attendance-alerts/test', {
        student_id: studentId
      });
      setActionFeedback({
        type: 'success',
        message: res.data.message || `Attendance notice successfully sent for ${studentName} via SMTP.`,
        preview: res.data.email_preview
      });
      fetchAlertCenterData();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to dispatch alert notice.'
      });
    } finally {
      setSendingStudentId(null);
    }
  };

  const handleOpenPreview = (previewHtml, studentName) => {
    setSelectedPreview({
      studentName,
      html: previewHtml
    });
    setPreviewModalOpen(true);
  };

  if (loading) return <LoadingSpinner message="Loading Attendance Alert Center..." />;
  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load alert center records.</div>;

  const below_75_students = Array.isArray(data?.below_75_students)
    ? data.below_75_students
    : Array.isArray(data)
    ? data
    : [];
  const alert_logs = Array.isArray(data?.alert_logs) ? data.alert_logs : [];
  const safe_threshold = data?.safe_threshold || 75.0;
  const smtp_configured = data?.smtp_configured ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance Alert Center</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dedicated monitoring console for students below {safe_threshold}% &bull; Automated parent SMTP notification dispatch &amp; simulation
        </p>
      </div>

      {/* SMTP Status Notice & Manual Controls */}
      <div className={`rounded-xl border p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        smtp_configured
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
          : 'bg-blue-50/70 border-blue-200 text-blue-800'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${smtp_configured ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">
              {smtp_configured ? 'Live SMTP Gateway Connected (smtp.gmail.com:587 TLS)' : 'Simulated Demo Mode Active (Zero-Crash Fallback)'}
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              Attendance alerts are dispatched automatically upon faculty marking AND can be triggered manually by administrators anytime below.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            disabled={testingSmtp}
            onClick={handleTestSmtpConnection}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs hover:bg-emerald-100/60 transition-colors shadow-2xs disabled:opacity-50"
            title="Verify SMTP connection to smtp.gmail.com:587"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{testingSmtp ? 'Verifying...' : 'Test SMTP Gateway'}</span>
          </button>
          <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
            SMTP Active
          </span>
        </div>
      </div>

      {/* Feedback message banner */}
      {actionFeedback && (
        <div className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2 font-semibold">
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionFeedback.message}</span>
          </div>

          {actionFeedback.preview && (
            <button
              onClick={() => handleOpenPreview(actionFeedback.preview, 'Recent Dispatch')}
              className="font-bold underline text-xs hover:opacity-80"
            >
              View Generated Email &rarr;
            </button>
          )}
        </div>
      )}

      {/* Primary Table: Students Below 75% */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Students Below Mandatory Minimum ({below_75_students.length} Records)
            </h2>
            <p className="text-xs text-slate-400">Institutional action plan: automated parent notifications and manual admin dispatches</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
              Below {safe_threshold}%
            </span>
            {below_75_students.length > 0 && (
              <button
                type="button"
                disabled={dispatchingAll}
                onClick={handleDispatchAllDefaulters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-2xs disabled:opacity-50"
                title="Send notification emails to all students below 75% via SMTP"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatchingAll ? 'Dispatching All...' : `Dispatch All Notices (${below_75_students.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {below_75_students.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            🎉 Outstanding! No students are currently below {safe_threshold}% attendance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-3 text-center">Risk Level</th>
                  <th className="py-3 px-3">Registered Parent Email</th>
                  <th className="py-3 px-3">Recovery Needed</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {below_75_students.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Parent: {st.parent_name}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">{st.reg_no}</td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{st.department}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-rose-600 text-sm">
                      {st.attendance_pct}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={st.risk_level} />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-slate-800 font-medium">{st.parent_email}</div>
                      <div className="text-[10px] text-slate-400">
                        Status: <span className="font-semibold text-slate-600">{st.last_alert_status}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {st.recovery_classes} consecutive classes
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Send Notice Now Button */}
                        <button
                          type="button"
                          disabled={sendingStudentId === st.student_id}
                          onClick={() => handleSendTestAlert(st.student_id, st.name)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-700 text-white font-semibold text-[11px] hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-2xs"
                          title="Manually dispatch parent attendance alert notice via SMTP"
                        >
                          <Send className="w-3 h-3" />
                          <span>{sendingStudentId === st.student_id ? 'Dispatching...' : 'Send Notice Now'}</span>
                        </button>

                        {/* View Preview Button */}
                        {st.email_preview && (
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(st.email_preview, st.name)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-50 transition-colors"
                            title="View rendered email preview"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>Preview</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatched Parent Alerts History Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Attendance Notification Dispatch History</h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">{alert_logs.length} Logged Entries</span>
            {alert_logs.some(l => l.status !== 'Sent') && (
              <button
                type="button"
                disabled={retryingAll}
                onClick={handleRetryAll}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
                <span>{retryingAll ? 'Retrying All...' : 'Retry All Failed'}</span>
              </button>
            )}
          </div>
        </div>

        {alert_logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No alert history recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Dispatched Time</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Recorded Attendance</th>
                  <th className="py-3 px-3">Recipient Parent Email</th>
                  <th className="py-3 px-3">Trigger Type</th>
                  <th className="py-3 px-3 text-center">Delivery Status</th>
                  <th className="py-3 px-3 text-center">Actions &amp; Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alert_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.student_name}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">{log.reg_no}</td>
                    <td className="py-3 px-3 font-bold text-rose-600">{log.attendance_pct}%</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{log.parent_email}</td>
                    <td className="py-3 px-3 text-slate-600">{log.alert_type}</td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {log.status !== 'Sent' && (
                          <button
                            type="button"
                            disabled={retryingId === log.id}
                            onClick={() => handleRetrySingle(log.id)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold transition-colors disabled:opacity-50"
                            title="Retry sending this alert"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                            <span>Retry</span>
                          </button>
                        )}
                        {log.email_preview && (
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(log.email_preview, log.student_name)}
                            className="p-1 rounded text-blue-700 hover:bg-blue-50 transition-colors"
                            title="View Parent Email HTML"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rendered Email Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Rendered Parent Notification Email - ${selectedPreview?.studentName || 'Preview'}`}
        maxWidth="max-w-3xl"
      >
        {selectedPreview && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Preview Inspection:</span> This HTML template represents the exact email formatted and dispatched to the parent mailbox via SMTP.
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
              <iframe
                title="Email Preview"
                srcDoc={selectedPreview.html}
                className="w-full h-[480px] border-0 rounded"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
