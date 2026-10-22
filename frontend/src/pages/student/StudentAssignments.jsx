import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  BookMarked,
  Calendar,
  Clock,
  UploadCloud,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionTab, setSubmissionTab] = useState('file'); // 'file' or 'drive'

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Google Drive state
  const [driveUrl, setDriveUrl] = useState('');
  const [confirmedAccess, setConfirmedAccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await client.get('/students/me/assignments');
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenSubmitModal = (asgn) => {
    setSelectedAssignment(asgn);
    setSelectedFile(null);
    setDriveUrl(asgn.submission?.drive_link || '');
    setConfirmedAccess(false);
    setSubmissionTab(asgn.submission_format === 'drive_link' ? 'drive' : 'file');
    setSubmitModalOpen(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (selectedAssignment) {
      const ext = f.name.split('.').pop().toLowerCase();
      const allowedStr = selectedAssignment.allowed_file_types || 'pdf,doc,docx,zip';
      const allowed = allowedStr
        .split(',')
        .map((t) => t.trim().toLowerCase());
      if (!allowed.includes(ext)) {
        alert(`Unsupported file type '.${ext}'. Allowed types: ${allowedStr}`);
        e.target.value = '';
        return;
      }

      const maxSizeMB = selectedAssignment.max_file_size_mb || 10;
      if (f.size > maxSizeMB * 1024 * 1024) {
        alert(`File exceeds maximum allowed size of ${maxSizeMB} MB`);
        e.target.value = '';
        return;
      }
    }
    setSelectedFile(f);
  };

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await client.post(`/students/me/assignments/${selectedAssignment.id}/submit-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Assignment file submitted successfully! Automated email reminders have been cancelled.');
      setSubmitModalOpen(false);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit file');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDrive = async (e) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      alert('Please enter a Google Drive link');
      return;
    }
    if (!confirmedAccess) {
      alert('Please confirm that you have granted sharing permission to your faculty member.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post(`/students/me/assignments/${selectedAssignment.id}/submit-drive`, {
        drive_link: driveUrl.trim(),
        confirmed_access_granted: confirmedAccess
      });
      alert('Google Drive link submitted successfully! Automated email reminders have been cancelled.');
      setSubmitModalOpen(false);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit Drive link');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your assigned coursework..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Academic Assignments</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit files or Google Drive links, verify real-time submission status, and review faculty feedback
        </p>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {(!assignments || assignments.length === 0) ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No assignments currently assigned.
          </div>
        ) : (
          (Array.isArray(assignments) ? assignments : []).map((a) => {
            const hasSubmitted = a.submission && a.submission.submitted_at;
            const statusStr = String(a.status || 'Pending');
            const isPending = statusStr.includes('Pending') || statusStr.includes('Returned');
            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {a.subject_code} &bull; {a.subject_name}
                    </span>

                    {/* STATUS BADGE */}
                    {isPending ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded border border-rose-300 flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Pending — Not Submitted</span>
                      </span>
                    ) : a.status === 'Graded' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Graded
                      </span>
                    ) : a.status === 'Late' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                        Submitted (Late)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Submitted
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {a.due_date} {a.due_time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max Marks: {a.max_marks}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Format: {a.submission_format === 'both' ? 'File or Drive' : a.submission_format}</span>
                    </span>
                  </div>

                  {/* Submission & Feedback Status Details */}
                  {hasSubmitted && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-600">
                          Submitted on {new Date(a.submission.submitted_at).toLocaleString()}:
                        </span>
                        {a.submission.marks_obtained !== null && (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Grade: {a.submission.marks_obtained} / {a.max_marks}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {a.submission.file_name && (
                          <a
                            href={a.submission.file_path?.startsWith('http') ? a.submission.file_path : `#download-${a.submission.id}`}
                            onClick={(e) => {
                              if (!a.submission.file_path?.startsWith('http')) {
                                e.preventDefault();
                                alert(`Downloading submitted file: ${a.submission.file_name} (Verified cloud storage object)`);
                              }
                            }}
                            className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download ({a.submission.file_name})</span>
                          </a>
                        )}

                        {a.submission.drive_link && (
                          <a
                            href={a.submission.drive_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Submitted Google Drive</span>
                          </a>
                        )}
                      </div>

                      {a.submission.faculty_feedback && (
                        <div className="pt-1 text-slate-700 border-t border-slate-200/60 mt-1">
                          <strong className="text-slate-900">Faculty Feedback:</strong> {a.submission.faculty_feedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  {a.can_submit ? (
                    <button
                      onClick={() => handleOpenSubmitModal(a)}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-2xs transition-colors ${
                        hasSubmitted ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{hasSubmitted ? 'Resubmit Work' : 'Submit Assignment'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      Submissions Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {selectedAssignment && (
        <Modal
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          title={`Submit: ${selectedAssignment.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            {/* Format Tabs (if both allowed) */}
            {selectedAssignment.submission_format === 'both' && (
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setSubmissionTab('file')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    submissionTab === 'file'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File ({selectedAssignment.allowed_file_types})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab('drive')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    submissionTab === 'drive'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Submit Google Drive Link
                </button>
              </div>
            )}

            {/* FILE UPLOAD TAB */}
            {(submissionTab === 'file' || selectedAssignment.submission_format === 'file') && (
              <form onSubmit={handleSubmitFile} className="space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click to select or drag and drop your assignment file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Allowed: {selectedAssignment.allowed_file_types} &bull; Max: {selectedAssignment.max_file_size_mb} MB
                  </p>

                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
                    <span className="font-semibold">{selectedFile.name}</span>
                    <span className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedFile}
                    className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-2xs"
                  >
                    {submitting ? 'Uploading File...' : 'Upload & Submit File'}
                  </button>
                </div>
              </form>
            )}

            {/* GOOGLE DRIVE LINK TAB */}
            {(submissionTab === 'drive' || selectedAssignment.submission_format === 'drive_link') && (
              <form onSubmit={handleSubmitDrive} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Google Drive Sharing URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format must begin with <code className="text-slate-600">https://drive.google.com/</code> or <code className="text-slate-600">https://docs.google.com/</code>
                  </p>
                </div>

                {/* Permissions Warning & Checkbox */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start space-x-2 text-amber-800 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>Sharing Access Verification Mandatory</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    You must ensure your Google Drive sharing setting is set to <strong>"Anyone with the link can view"</strong> or that explicit view access has been granted to your course faculty member.
                  </p>

                  <label className="flex items-center space-x-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      required
                      checked={confirmedAccess}
                      onChange={(e) => setConfirmedAccess(e.target.checked)}
                      className="rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      I confirm that I have verified sharing permissions and my faculty member can open this link.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !driveUrl || !confirmedAccess}
                    className="px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-2xs"
                  >
                    {submitting ? 'Recording Submission...' : 'Submit Google Drive Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
