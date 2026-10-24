import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileUp, Download, BookOpen, Search, Filter, Eye, X, CheckCircle, FileText, User, Calendar } from 'lucide-react';

const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊',
  xls: '📊', xlsx: '📊', zip: '🗜', txt: '📃', mp4: '🎬', default: '📎'
};

const getFileIcon = (filename, type) => {
  const ext = (filename || type || '').split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
};

// Demo materials fallback
const DEMO_MATERIALS = [
  { id: 1, title: 'Data Structures - Lecture Notes Unit 1', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', file_name: 'CS601_Unit1_Lecture_Notes.pdf', file_type: 'pdf', file_size: '2.4 MB', uploaded_at: '2026-10-20', description: 'Arrays, Linked Lists, Stacks, Queues, and asymptotic analysis fundamentals.' },
  { id: 2, title: 'DBMS - ER Diagram Practice Problems', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', file_name: 'CS603_ER_Diagrams.pdf', file_type: 'pdf', file_size: '1.8 MB', uploaded_at: '2026-10-18', description: 'Practice problems for ER diagrams, multi-valued attributes, and BCNF normalization.' },
  { id: 3, title: 'AI & Machine Learning - Supervised Models PPT', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', file_name: 'CS602_Supervised_Learning.pptx', file_type: 'pptx', file_size: '5.1 MB', uploaded_at: '2026-10-15', description: 'Linear regression, cost functions, gradient descent, and polynomial curve fitting.' },
  { id: 4, title: 'Cloud Computing - Docker & Kubernetes Guide', subject_name: 'Cloud Computing & DevOps Laboratory', faculty_name: 'Dr. Kavitha Raman', file_name: 'CS604_Containers_Guide.pdf', file_type: 'pdf', file_size: '3.2 MB', uploaded_at: '2026-10-12', description: 'Complete reference for writing Dockerfiles and setting up Pods and Services.' }
];

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [previewModal, setPreviewModal] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const fetchMaterials = () => {
    client.get('/students/study-materials')
      .then((res) => setMaterials(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_MATERIALS))
      .catch(() => setMaterials(DEMO_MATERIALS))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const subjects = ['All', ...new Set(materials.map(m => m.subject_name).filter(Boolean))];

  const filtered = materials.filter(m => {
    const sTerm = search.toLowerCase();
    const matchSearch = !search ||
      (m.title && m.title.toLowerCase().includes(sTerm)) ||
      (m.subject_name && m.subject_name.toLowerCase().includes(sTerm)) ||
      (m.faculty_name && m.faculty_name.toLowerCase().includes(sTerm)) ||
      (m.description && m.description.toLowerCase().includes(sTerm));
    const matchSubject = filterSubject === 'All' || m.subject_name === filterSubject;
    return matchSearch && matchSubject;
  });

  const handleDownload = (m) => {
    const filename = m.file_name || `${(m.title || 'Study_Material').replace(/[^a-zA-Z0-9_-]/g, '_')}.${m.file_type || 'pdf'}`;

    if (m.file_data) {
      // Download exact Base64 Data URL uploaded by faculty
      const a = document.createElement('a');
      a.href = m.file_data;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (m.file_url && m.file_url.startsWith('http')) {
      window.open(m.file_url, '_blank');
    } else {
      // Create rich study notes file for immediate local download
      const textContent = [
        '========================================================================',
        'CLOUD INSTITUTE OF TECHNOLOGY & SCIENCE - ACADEMIC STUDY RESOURCE',
        '========================================================================',
        '',
        `DOCUMENT TITLE : ${m.title}`,
        `COURSE SUBJECT : ${m.subject_name || 'Core Engineering Subject'}`,
        `FACULTY MEMBER : ${m.faculty_name || 'Department Faculty'}`,
        `DATE UPLOADED  : ${m.uploaded_at || new Date().toISOString().split('T')[0]}`,
        `FILE REFERENCE : ${filename}`,
        '',
        '------------------------------------------------------------------------',
        'SYLLABUS COVERAGE & LECTURE SUMMARY:',
        '------------------------------------------------------------------------',
        m.description || 'Core syllabus notes and reference revision guide for university continuous assessment & examinations.',
        '',
        '------------------------------------------------------------------------',
        'REVISION GUIDELINES:',
        '• Thoroughly solve the worked examples in each unit.',
        '• Review internal assessment questions and lab assignments.',
        '• Consult your course faculty during designated office hours for queries.',
        '',
        '========================================================================',
        'Office of Academic Affairs • College ERP Portal',
        '========================================================================'
      ].join('\n');

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setDownloadSuccess(`Downloaded "${filename}" successfully.`);
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  if (loading) return <LoadingSpinner message="Loading study materials..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="erp-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
          <h1 className="text-lg font-bold text-slate-900">Study Materials &amp; Lecture Resources</h1>
        </div>
        <p className="text-xs text-slate-500">Official notes, slide decks, and examination syllabus material shared by your faculty</p>
      </div>

      {downloadSuccess && (
        <div className="erp-card p-3 bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by topic, unit, subject, or faculty name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          >
            {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="erp-card p-12 text-center">
          <FileUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No study materials matching criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting "All Subjects" or searching for a different keyword</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="erp-card p-4 hover:border-blue-200 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {getFileIcon(m.file_name, m.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2" title={m.title}>
                      {m.title}
                    </p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5 truncate">
                      {m.subject_name}
                    </p>
                  </div>
                </div>

                {m.description && (
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    {m.description}
                  </p>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {m.faculty_name || 'Faculty Member'}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {m.uploaded_at}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setPreviewModal(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => handleDownload(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-lg flex-shrink-0">
                  {getFileIcon(previewModal.file_name, previewModal.file_type)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewModal.title}</h3>
                  <p className="text-[11px] text-blue-600 font-semibold">{previewModal.subject_name}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Uploaded By</span>
                  <span className="font-semibold text-slate-800">{previewModal.faculty_name || 'Faculty Member'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Upload Date</span>
                  <span className="font-semibold text-slate-800">{previewModal.uploaded_at}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">File Format</span>
                  <span className="font-semibold text-slate-800 font-mono uppercase">{previewModal.file_type || 'PDF'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Approximate Size</span>
                  <span className="font-semibold text-slate-800">{previewModal.file_size || '2.1 MB'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">Content Summary &amp; Syllabus Coverage</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-xl p-3.5 min-h-[90px]">
                  {previewModal.description || 'No detailed syllabus notes attached with this document. Please download the document file for complete contents.'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewModal);
                    setPreviewModal(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Showing {filtered.length} of {materials.length} available study materials
      </p>
    </div>
  );
}
