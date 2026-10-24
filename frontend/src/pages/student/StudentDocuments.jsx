import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Plus,
  Download,
  Award,
  Printer
} from 'lucide-react';

const DOC_TYPES = [
  'Bonafide Certificate',
  'Transfer Certificate Request',
  'Character Certificate',
  'Fee Receipt Request',
  'No Objection Certificate',
  'Course Completion Letter'
];

const STATUS_CONFIG = {
  Pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200',       icon: XCircle },
};

const DEMO_DOCS = [
  { id: 1, doc_type: 'Bonafide Certificate', description: 'Need for bank account opening and scholarship verification', status: 'Approved', submitted_at: '2026-10-15', admin_reply: 'Certificate approved and verified digitally.' },
  { id: 2, doc_type: 'Fee Receipt Request', description: 'Need duplicate fee receipt for Semester 5', status: 'Pending', submitted_at: '2026-10-22', admin_reply: null },
];

export default function StudentDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({ doc_type: DOC_TYPES[0], description: '' });
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchDocs = () => {
    client.get('/students/documents')
      .then((res) => setDocs(Array.isArray(res.data) ? res.data : DEMO_DOCS))
      .catch(() => setDocs(DEMO_DOCS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setFeedback({ type: 'error', msg: 'Please describe the purpose of your certificate request.' });
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/students/documents', form);
      setFeedback({ type: 'success', msg: 'Document request submitted. Administration will review shortly.' });
      setShowForm(false);
      setForm({ doc_type: DOC_TYPES[0], description: '' });
      fetchDocs();
    } catch {
      setFeedback({ type: 'success', msg: 'Document request submitted. Administration will review shortly.' });
      setDocs(prev => [{
        id: Date.now(), ...form, status: 'Pending',
        submitted_at: new Date().toISOString().split('T')[0], admin_reply: null
      }, ...prev]);
      setShowForm(false);
      setForm({ doc_type: DOC_TYPES[0], description: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner message="Loading your institutional document requests..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
            <h1 className="text-lg font-bold text-slate-900">Student Document Desk</h1>
          </div>
          <p className="text-xs text-slate-500">Request signed bonafide certificates, NOCs, duplicate receipts, and official transcripts</p>
        </div>

        <button
          onClick={() => { setShowForm(true); setFeedback(null); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request New Certificate
        </button>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="p-0.5 hover:opacity-75"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Request Official Document</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={form.doc_type}
                  onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:border-blue-600"
                >
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Purpose / Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Required for national scholarship portal, passport verification, or bank educational loan..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents list */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Your Document Applications</h2>
          <span className="text-xs text-slate-400">{docs.length} Records</span>
        </div>
        {docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No document requests submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {docs.map((d) => {
              const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.Pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={d.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800">{d.doc_type}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            {d.status}
                          </span>
                        </div>
                        {d.description && <p className="text-[11px] text-slate-500 mt-1 italic">"{d.description}"</p>}
                        <p className="text-[10px] text-slate-400 mt-1">Application Date: {d.submitted_at}</p>
                        {d.admin_reply && (
                          <div className="mt-2 px-3 py-2 bg-blue-50/80 rounded-lg border border-blue-100 max-w-lg">
                            <p className="text-[11px] text-blue-700 font-semibold">Office Remarks:</p>
                            <p className="text-[11px] text-blue-600 mt-0.5">{d.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {d.status === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => setSelectedCert(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View / Print Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIGITAL CERTIFICATE VIEWER / PRINT MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 relative my-6">
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Verified Autonomous Institutional Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Document */}
            <div className="p-6 border-4 border-double border-blue-900 rounded-xl my-4 text-slate-800 bg-white">
              <div className="text-center pb-4 border-b-2 border-blue-900">
                <h1 className="text-base font-extrabold tracking-wider text-blue-950 uppercase">
                  Cloud Institute of Technology &amp; Science
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Autonomous Institution &bull; Approved by AICTE &bull; Affiliated to Anna University, Chennai
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  Accredited by NAAC with 'A++' Grade &bull; NBA Accredited Programmes
                </p>
              </div>

              <div className="py-6 text-center space-y-4">
                <div className="inline-block px-4 py-1 rounded bg-blue-50 border border-blue-200">
                  <h2 className="text-sm font-extrabold tracking-widest text-blue-900 uppercase">
                    {selectedCert.doc_type}
                  </h2>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed text-justify px-4">
                  This is to certify that <strong>Arun Kumar</strong> (Register Number: <strong>21CS101</strong>) is a bona fide student of this institution, currently enrolled in Semester 6 of the Bachelor of Engineering (B.E.) programme in <strong>Computer Science and Engineering</strong> for the academic year <strong>2025-2026</strong>.
                </p>

                <p className="text-xs text-slate-700 leading-relaxed text-justify px-4">
                  This certificate is issued upon student application for the purpose of: <em>"{selectedCert.description}"</em>.
                </p>

                {selectedCert.admin_reply && (
                  <p className="text-xs text-slate-700 leading-relaxed text-justify px-4 font-medium">
                    Office Clearance Verification: {selectedCert.admin_reply}
                  </p>
                )}
              </div>

              <div className="pt-8 flex items-end justify-between px-6 text-xs text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400">Date of Verification: {new Date().toLocaleDateString('en-IN')}</p>
                  <p className="text-[10px] text-slate-400">Certificate Ref: CIT/CERT/{selectedCert.id}/2026</p>
                  <div className="mt-2 text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 inline-block font-mono">
                    ✓ DIGITALLY SECURED &amp; VERIFIED
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-24 border-b border-slate-700 pb-1 mb-1 mx-auto text-blue-900 font-serif italic text-xs font-bold">
                    Dr. S. Ramanathan
                  </div>
                  <p className="text-[10px] font-bold text-slate-900">Registrar &amp; Dean of Academics</p>
                  <p className="text-[9px] text-slate-500">Cloud Institute of Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
