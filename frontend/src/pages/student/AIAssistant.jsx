import React, { useState, useRef, useEffect } from 'react';
import client from '../../api/client';
import { Bot, Send, User, Trash2, Sparkles, AlertCircle } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        suggested_questions: res.data.suggested_questions || [],
        engine: res.data.engine || 'ERP Engine',
        model: res.data.model || null
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const content = detail
        ? `Error: ${detail}`
        : "Unable to connect to the ERP backend server. Please verify the backend is running on http://127.0.0.1:8000 and try again.";
      const errorMessage = {
        role: 'assistant',
        content: content,
        engine: 'System Notice',
        model: null
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
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

  const formatContent = (content) => {
    // Very clean rendering of basic markdown: bold, lists, italics, newlines
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      // Bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line.startsWith('- ') ? 'ml-3 my-0.5' : 'my-1'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 bg-white p-4 rounded-t-xl border">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-slate-900">AI ERP Academic Assistant</h1>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Live ERP Context
              </span>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>Gemini Powered</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent RAG question answering grounded with your real-time student record</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-white border-x border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                isUser
                  ? 'bg-blue-700 text-white rounded-br-none shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-none shadow-2xs'
              }`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    {formatContent(msg.content)}

                    {/* Suggested questions chips attached to assistant reply */}
                    {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>Suggested Inquiries</span>
                          </span>
                          {msg.engine && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              msg.engine.includes('Gemini')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {msg.engine} {msg.model ? `(${msg.model})` : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggested_questions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              className="text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/50 px-2.5 py-1 rounded-full transition-all text-left"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!msg.suggested_questions || msg.suggested_questions.length === 0) && msg.engine && (
                      <div className="mt-2 text-right">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          msg.engine.includes('Gemini')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {msg.engine} {msg.model ? `(${msg.model})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span>Querying college ERP database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white p-3 rounded-b-xl border border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your attendance, recovery, exams, fees, timetable..."
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center space-x-1 text-xs font-semibold shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
