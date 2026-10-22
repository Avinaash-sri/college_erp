import React, { useState, useRef, useEffect } from 'react';
import client from '../../api/client';
import {
  Bot,
  Send,
  User,
  Trash2,
  Sparkles,
  Upload,
  FileText,
  BookOpen,
  HelpCircle,
  CheckSquare,
  ListOrdered,
  Languages,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'erp'

  // ============================================================================
  // TAB 1: ERP ACADEMIC ASSISTANT STATE
  // ============================================================================
  const [erpMessages, setErpMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your **AI ERP Assistant**. You can ask me real-time questions about your attendance, recovery classes, class timetable, upcoming exams, fee balance, or campus placements.\n\nHow can I help you today?",
      suggested_questions: [
        "What is my overall attendance?",
        "Which subjects am I below 75%?",
        "How many classes should I attend to reach 75%?",
        "What is my timetable today?",
        "When is my next exam?",
        "Do I have any pending fees?"
      ]
    }
  ]);
  const [erpInput, setErpInput] = useState('');
  const [erpLoading, setErpLoading] = useState(false);
  const erpMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'erp') {
      erpMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [erpMessages, erpLoading, activeTab]);

  const handleSendErpMessage = async (queryText) => {
    const textToSend = queryText || erpInput;
    if (!textToSend.trim() || erpLoading) return;

    const userMessage = { role: 'user', content: textToSend };
    setErpMessages((prev) => [...prev, userMessage]);
    setErpInput('');
    setErpLoading(true);

    try {
      const res = await client.post('/chat', { message: textToSend });
      const assistantMessage = {
        role: 'assistant',
        content: res.data.reply,
        suggested_questions: res.data.suggested_questions || [],
        engine: res.data.engine || 'ERP Engine',
        model: res.data.model || null
      };
      setErpMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const content = detail
        ? `Error: ${detail}`
        : "Unable to process your query right now. Please check your network connection and try again.";
      setErpMessages((prev) => [
        ...prev,
        { role: 'assistant', content, engine: 'System Notice', model: null }
      ]);
    } finally {
      setErpLoading(false);
    }
  };

  const handleClearErpChat = () => {
    setErpMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What else would you like to know about your academic records?",
        suggested_questions: [
          "What is my overall attendance?",
          "How many classes should I attend to reach 75%?",
          "What is my timetable today?",
          "When is my next exam?"
        ]
      }
    ]);
  };

  // ============================================================================
  // TAB 2: AI STUDENT NOTES ASSISTANT STATE
  // ============================================================================
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Q&A / Actions State
  const [notesActionLoading, setNotesActionLoading] = useState(false);
  const [notesQuery, setNotesQuery] = useState('');
  const [notesHistory, setNotesHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const notesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      setDocsLoading(true);
      const res = await client.get('/students/me/notes');
      setDocuments(res.data || []);
      if (res.data?.length > 0 && !selectedDocId) {
        setSelectedDocId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (activeTab === 'notes') {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notesHistory, notesActionLoading, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post('/students/me/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchDocuments();
      setSelectedDocId(res.data.id);
      // Auto-trigger full summary
      handlePerformAction('summarise_full', res.data.id);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to upload and parse document.';
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and its AI notes context?')) return;
    try {
      await client.delete(`/students/me/notes/${docId}`);
      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      if (selectedDocId === docId) {
        setSelectedDocId(updated.length > 0 ? updated[0].id : null);
      }
      setNotesHistory([]);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Could not delete document.');
    }
  };

  const handlePerformAction = async (actionType, docIdOverride = null, customQuery = null, customTopic = null) => {
    const targetDocId = docIdOverride || selectedDocId;
    if (!targetDocId) {
      alert('Please upload or select a notes document first.');
      return;
    }

    const queryText = customQuery || (actionType === 'qa' ? notesQuery : '');
    const topicText = customTopic || '';

    // Append user query if asking QA
    if (actionType === 'qa' && queryText) {
      setNotesHistory((prev) => [
        ...prev,
        {
          role: 'user',
          content: queryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setNotesQuery('');
    }

    setNotesActionLoading(true);

    try {
      const res = await client.post(`/students/me/notes/${targetDocId}/action`, {
        action: actionType,
        query: queryText,
        topic: topicText
      });

      const responseItem = {
        role: 'assistant',
        action: actionType,
        content: res.data.result || res.data.response,
        sources: res.data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setNotesHistory((prev) => [...prev, responseItem]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to process AI notes action.';
      setNotesHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          action: 'error',
          content: `⚠️ **Notice**: ${detail}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setNotesActionLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Markdown rendering helper
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-slate-900 text-xs mt-3 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="font-bold text-slate-900 text-base mt-3 mb-1.5">{line.slice(2)}</h2>;
      }
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        const label = line.slice(6);
        return (
          <label key={idx} className="flex items-start space-x-2 my-1 text-slate-700 text-xs cursor-pointer">
            <input type="checkbox" defaultChecked={checked} className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
            <span>{label}</span>
          </label>
        );
      }

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line.startsWith('- ') ? 'ml-3 my-0.5 text-slate-700' : 'my-1 text-slate-700'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const selectedDocument = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Top Dual Tabs Header */}
      <div className="bg-white rounded-t-xl border border-slate-200 px-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900">Notes</h1>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 text-blue-500" />
              <span>Grounded Knowledge</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Study-note documents, AI summarization, key concepts, revision points, and interactive Q&A
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Study Notes Summarizer</span>
          </button>

          <button
            onClick={() => setActiveTab('erp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'erp'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>ERP Academic Advisor</span>
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: AI STUDENT NOTES ASSISTANT */}
      {/* ====================================================================== */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col sm:flex-row border-x border-b border-slate-200 bg-white rounded-b-xl overflow-hidden">
          {/* Left Sidebar: Document Management & Upload */}
          <div className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>My Notes Documents</span>
                  <span className="text-[10px] font-normal text-slate-400">PDF, DOCX, TXT</span>
                </h3>

                {/* Upload Trigger */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>{uploading ? 'Extracting Text & Chunking...' : 'Upload Notes Document'}</span>
                </button>

                {uploadError && (
                  <p className="text-[11px] text-rose-600 mt-1.5 leading-tight flex items-start space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* Documents List */}
              <div className="space-y-1.5 max-h-56 sm:max-h-80 overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                    No documents uploaded yet. Upload lecture notes, syllabus or revision slides to begin.
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-start space-x-2 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{doc.filename}</p>
                            <p className="text-[10px] text-slate-400 font-normal">
                              {doc.file_type.toUpperCase()} &bull; {doc.total_chunks} chunks &bull; {(doc.file_size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteDocument(e, doc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            {selectedDocument && (
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Quick AI Prompts
                </span>
                <button
                  onClick={() => handlePerformAction('summarise_full')}
                  disabled={notesActionLoading}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Full Document Summary</span>
                  </span>
                </button>

                <button
                  onClick={() => handlePerformAction('explain_tanglish')}
                  disabled={notesActionLoading}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-[11px] font-medium text-purple-900 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center space-x-1.5">
                    <Languages className="w-3.5 h-3.5 text-purple-600" />
                    <span>Explain in Tanglish</span>
                  </span>
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold">New</span>
                </button>

                <button
                  onClick={() => handlePerformAction('generate_mcqs')}
                  disabled={notesActionLoading}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Generate Practice MCQs</span>
                </button>

                <button
                  onClick={() => handlePerformAction('revision_checklist')}
                  disabled={notesActionLoading}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
                  <span>Exam Revision Checklist</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Main Panel: AI Results & Grounded Chat */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
            {/* Active Document Header / Status */}
            {selectedDocument ? (
              <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-900">Active Document:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                    {selectedDocument.filename}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Grounded in {selectedDocument.total_chunks} extracted sections</span>
                </div>
              </div>
            ) : (
              <div className="p-3 border-b border-slate-200 bg-amber-50/60 text-xs text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Upload a document to unlock grounded AI summarisation, Tanglish explanations, and Q&amp;A.</span>
              </div>
            )}

            {/* Conversation / Results Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {notesHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 max-w-md mx-auto">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">AI Student Notes Workspace Ready</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Select an action from the left sidebar or type a specific question about your lecture notes below.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handlePerformAction('explain_english')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 shadow-2xs font-medium"
                    >
                      Explain in Simple English
                    </button>
                    <button
                      onClick={() => handlePerformAction('key_concepts')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 shadow-2xs font-medium"
                    >
                      Key Revision Concepts
                    </button>
                  </div>
                </div>
              ) : (
                notesHistory.map((item, idx) => {
                  const isUser = item.role === 'user';
                  return (
                    <div key={idx} className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-blue-700 text-white rounded-br-none shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{item.content}</p>
                        ) : (
                          <div>
                            {/* Header / Badges */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span>Action: {item.action?.replace('_', ' ')}</span>
                              </span>

                              <button
                                onClick={() => copyToClipboard(item.content, idx)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                title="Copy response"
                              >
                                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Rendered Markdown */}
                            <div className="prose-xs">{renderMarkdown(item.content)}</div>

                            {/* Page Citations */}
                            {item.sources && item.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                  Referenced Document Sources:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.sources.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 rounded-full text-[10px] bg-white border border-slate-200 text-slate-600"
                                      title={s.preview}
                                    >
                                      Page {s.page}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {notesActionLoading && (
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span>Analyzing notes and generating grounded answer...</span>
                  </div>
                </div>
              )}

              <div ref={notesEndRef} />
            </div>

            {/* Input Bar for Grounded Q&A */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (notesQuery.trim()) {
                  handlePerformAction('qa');
                }
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
            >
              <input
                type="text"
                value={notesQuery}
                onChange={(e) => setNotesQuery(e.target.value)}
                placeholder={
                  selectedDocument
                    ? `Ask anything about '${selectedDocument.filename}'...`
                    : 'Upload or select a document above to ask questions...'
                }
                disabled={!selectedDocument || notesActionLoading}
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
              />

              <button
                type="submit"
                disabled={!selectedDocument || !notesQuery.trim() || notesActionLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center space-x-1.5 text-xs font-semibold shadow-xs"
              >
                <span>Ask Notes</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: ERP ACADEMIC ADVISOR (EXISTING NATURAL LANGUAGE ASSISTANT) */}
      {/* ====================================================================== */}
      {activeTab === 'erp' && (
        <div className="flex-1 flex flex-col border-x border-b border-slate-200 bg-white rounded-b-xl overflow-hidden">
          {/* Header Bar */}
          <div className="p-3 border-b border-slate-200 bg-indigo-50/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-900">ERP Context:</span>
              <span className="text-[11px] text-slate-500">
                Connected to real-time student attendance, timetable, exam and fee records.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearErpChat}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Clear ERP chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {erpMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-700 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div>
                        {renderMarkdown(msg.content)}

                        {/* Suggested questions chips */}
                        {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                <span>Suggested Inquiries</span>
                              </span>
                              {msg.engine && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                  {msg.engine}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggested_questions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={() => handleSendErpMessage(q)}
                                  className="text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/50 px-2.5 py-1 rounded-full transition-all text-left"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {erpLoading && (
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span>Querying college ERP database...</span>
                </div>
              </div>
            )}

            <div ref={erpMessagesEndRef} />
          </div>

          {/* Input Form for ERP Assistant */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendErpMessage();
            }}
            className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
          >
            <input
              type="text"
              value={erpInput}
              onChange={(e) => setErpInput(e.target.value)}
              placeholder="Ask a question about your attendance, recovery, exams, fees, timetable..."
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              disabled={erpLoading}
            />
            <button
              type="submit"
              disabled={erpLoading || !erpInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center space-x-1 text-xs font-semibold shadow-xs"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
