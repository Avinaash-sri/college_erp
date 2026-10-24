import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  X
} from 'lucide-react';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [takingModalOpen, setTakingModalOpen] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: "A" }
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Results modal state
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchQuizzes = async () => {
    try {
      const res = await client.get('/students/me/quizzes');
      setQuizzes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Timer countdown while taking quiz
  useEffect(() => {
    if (!takingModalOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [takingModalOpen, timeLeft]);

  const handleStartQuiz = async (quizId) => {
    try {
      // 1. Fetch questions
      const qRes = await client.get(`/students/me/quizzes/${quizId}`);
      // 2. Start attempt record on backend
      await client.post(`/students/me/quizzes/${quizId}/start`);

      setActiveQuiz(qRes.data);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setTimeLeft(qRes.data.duration_minutes * 60);
      setTakingModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to access quiz');
    }
  };

  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your answers automatically.');
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, choice]) => ({
        question_id: parseInt(qId),
        selected_answer: choice
      }));

      await client.post(`/students/me/quizzes/${activeQuiz.id}/submit`, {
        answers: answersPayload
      });

      setTakingModalOpen(false);
      setActiveQuiz(null);
      fetchQuizzes();
      alert('Quiz submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResults = async (quizId) => {
    setLoadingResults(true);
    setResultsModalOpen(true);
    try {
      const res = await client.get(`/students/me/quizzes/${quizId}/results`);
      setResultsData(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Results not yet released');
      setResultsModalOpen(false);
    } finally {
      setLoadingResults(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading assigned quizzes..." />;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Academic Quizzes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access course assessments, attempt scheduled tests, and review performance upon results release
        </p>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No quizzes currently assigned to your account.
          </div>
        ) : (
          quizzes.map((q) => {
            const isSubmitted = q.attempt_status === 'Submitted';
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {q.subject_code} &bull; {q.subject_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSubmitted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.is_expired
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isSubmitted ? 'Attempt Submitted' : q.is_expired ? 'Deadline Passed' : 'Pending Attempt'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                  {q.description && <p className="text-xs text-slate-600">{q.description}</p>}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{q.duration_minutes} Mins Duration</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(q.deadline).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max Marks: {q.total_marks}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  {isSubmitted ? (
                    q.results_published ? (
                      <button
                        onClick={() => handleViewResults(q.id)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>View Results &amp; Score ({q.score !== null ? `${q.score}/${q.total_marks}` : ''})</span>
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        Submitted &bull; Awaiting Result Release
                      </span>
                    )
                  ) : q.can_attempt ? (
                    <button
                      onClick={() => handleStartQuiz(q.id)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Quiz Now</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      Attempt Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUIZ TAKING MODAL */}
      {activeQuiz && (
        <Modal
          isOpen={takingModalOpen}
          onClose={() => {
            if (window.confirm('Do you want to exit? Your answers will not be submitted until you click Submit.')) {
              setTakingModalOpen(false);
            }
          }}
          title={`${activeQuiz.title} (${activeQuiz.subject_code || ''})`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Top Timer & Progress Bar */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Question {currentQIndex + 1} of {(activeQuiz.questions || []).length}
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  ({Object.keys(selectedAnswers).length} answered)
                </span>
              </div>

              <div
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold ${
                  timeLeft < 300 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-white text-blue-700 border border-blue-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time Remaining: {formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* Current Question Body */}
            {activeQuiz.questions?.[currentQIndex] && (
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                    Q{currentQIndex + 1}. {activeQuiz.questions[currentQIndex].question_text}
                  </h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                    {activeQuiz.questions[currentQIndex].marks} Marks
                  </span>
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  {(activeQuiz.questions[currentQIndex]?.options || []).map((opt) => {
                    const isSelected = selectedAnswers[activeQuiz.questions[currentQIndex].id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectAnswer(activeQuiz.questions[currentQIndex].id, opt.id)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 font-semibold text-blue-900 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Quick Jump Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(activeQuiz.questions || []).map((q, idx) => {
                const isAnswered = !!selectedAnswers[q.id];
                const isCurrent = idx === currentQIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'ring-2 ring-blue-700 bg-blue-700 text-white'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {currentQIndex < (activeQuiz.questions || []).length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-2xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz Now'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* QUIZ RESULTS MODAL */}
      <Modal
        isOpen={resultsModalOpen}
        onClose={() => setResultsModalOpen(false)}
        title={resultsData ? `Results: ${resultsData.title}` : 'Quiz Results'}
        maxWidth="max-w-3xl"
      >
        {loadingResults ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your evaluation breakdown...</div>
        ) : resultsData ? (
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Official Result</p>
                <h3 className="text-2xl font-black text-emerald-900 mt-0.5">
                  {resultsData.score} <span className="text-sm font-semibold text-emerald-700">/ {resultsData.total_marks} Marks</span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-900">{resultsData.percentage}%</span>
                <p className="text-[11px] text-emerald-700">Percentage Score</p>
              </div>
            </div>

            {/* Question Breakdown */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question-by-Question Evaluation &amp; Solutions
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {((resultsData?.breakdown || resultsData?.questions || []).filter(q => q.is_correct)).length} / {(resultsData?.breakdown || resultsData?.questions || []).length} Correct
                </span>
              </div>

              {(resultsData?.breakdown || resultsData?.questions || []).map((item, idx) => (
                <div
                  key={item.id || item.question_id || idx}
                  className={`border rounded-xl p-4 space-y-3 transition ${
                    item.is_correct
                      ? 'border-emerald-200 bg-emerald-50/25'
                      : 'border-rose-200/80 bg-rose-50/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        item.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {item.question_text}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                        item.is_correct
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {item.marks_awarded ?? (item.is_correct ? item.marks : 0)} / {item.marks} Marks
                    </span>
                  </div>

                  {/* MCQ Options List */}
                  {item.options && item.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {item.options.map((opt) => {
                        const isSelected = item.selected_answer === opt.id;
                        const isCorrectOpt = item.correct_answer === opt.id;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        let badge = null;

                        if (isSelected && isCorrectOpt) {
                          optClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold ring-1 ring-emerald-200';
                          badge = <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">Your Answer (Correct)</span>;
                        } else if (isSelected && !isCorrectOpt) {
                          optClass = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold ring-1 ring-rose-200';
                          badge = <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">Your Answer (Incorrect)</span>;
                        } else if (isCorrectOpt) {
                          optClass = 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-semibold';
                          badge = <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">Correct Solution</span>;
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${optClass}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                isCorrectOpt ? 'bg-emerald-200 text-emerald-900' : isSelected ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {opt.id}
                              </span>
                              <span className="truncate">{opt.text}</span>
                            </div>
                            {badge}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.explanation && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 mt-2 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Concept Explanation: </strong>
                        <span>{item.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-right pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setResultsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Close Results
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
