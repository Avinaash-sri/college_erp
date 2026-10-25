import React, { useState, useRef, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  HelpCircle,
  GraduationCap
} from 'lucide-react';

export default function FloatingAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Chat State scoped to ERP records and academic assistance
  const [messages, setMessages] = useState(() => {
    const role = user?.role || 'student';
    if (role === 'faculty') {
      return [
        {
          role: 'assistant',
          content: "Hello Professor! I am your **Faculty AI Assistant**. Ask me about your teaching timetable, students at risk, assignment submissions, or internal marks.",
          suggested_questions: [
            'What classes do I have today?',
            'How many students are at risk in CSE?',
            'Show assignment submission status',
            'When is the next CIA exam?'
          ]
        }
      ];
    }
    if (role === 'admin') {
      return [
        {
          role: 'assistant',
          content: "Hello Administrator! I am your **Institutional AI Governance Assistant**. Ask me about total enrollment, attendance compliance, SMTP alerts, or exam schedules.",
          suggested_questions: [
            'How many total students are enrolled?',
            'Attendance health across college',
            'Is SMTP email service active?',
            'List scheduled exams'
          ]
        }
      ];
    }
    return [
      {
        role: 'assistant',
        content: "Hello! I am your **AI ERP Student Assistant**. Ask me about your real-time attendance, today's timetable, internal exam schedules, course concepts, or college procedures.",
        suggested_questions: [
          'What is my overall attendance?',
          'What classes do I have today?',
          'When is my next examination?',
          'Do I have any pending fees?'
        ]
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Enforce logged-in visibility at component level
  if (!user) return null;

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await client.post('/chat', { message: textToSend });
      const assistantMessage = {
        role: 'assistant',
        content: res.data.reply,
        suggested_questions: res.data.suggested_questions || []
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'The college AI service is currently unavailable. Please verify your network connection or try again shortly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 select-none">
      {/* Floating Trigger Button: 75% idle opacity, subtle hover lift & soft shadow transition, motion-safe */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="opacity-75 hover:opacity-100 focus:opacity-100 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl hover:scale-105 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none h-12 w-12 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 cursor-pointer group"
          aria-label="Open Student AI Assistant"
          title="Student AI ERP Assistant (Academic Doubts & College Enquiries)"
        >
          <Bot className="h-6 w-6 group-hover:scale-105 transition-transform motion-reduce:transform-none" />
          <span className="sr-only">Open Student AI Assistant</span>
        </button>
      )}

      {/* Responsive Floating Chat Panel (constrained to viewport) */}
      {isOpen && (
        <div
          className={`w-[calc(100vw-1.5rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[480px] max-h-[calc(100dvh-4.5rem)]'
          }`}
          role="dialog"
          aria-label="Student AI ERP Assistant"
        >
          {/* Header */}
          <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-800 flex items-center justify-center text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">Student AI Assistant</h3>
                <span className="text-[10px] text-blue-200 font-normal">College Enquiries &bull; Academic Doubts</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
                title="Close"
                aria-label="Close Chat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Body when not minimized */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/40">
              {/* Messages Container */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-700 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>

                    {/* Suggested Questions Chips */}
                    {m.suggested_questions && m.suggested_questions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.suggested_questions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full px-2 py-0.5 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
                    <span>Consulting ERP intelligence...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about attendance, exam dates, subjects..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
