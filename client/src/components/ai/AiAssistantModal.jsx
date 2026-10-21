import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Bot, Send, Sparkles, User, BookOpen, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function AiAssistantModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${user ? user.name.split(' ')[0] : 'there'}! I am your Smart Library AI Assistant. How can I help you today? You can ask about recommended textbooks, live shelf availability, library rules, or crowd occupancy.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Recommend IT Semester 4 textbooks',
    'Where is Database System Concepts located?',
    'What are the library rules and fine rates?',
    'How crowded is the library right now?'
  ];

  async function handleSend(queryText) {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', text: textToSend.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend.trim(),
        history: newMessages.slice(-6)
      });

      if (res.success && res.reply) {
        setMessages([...newMessages, { role: 'assistant', text: res.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', text: 'I received your query but was unable to process it. Please try again.' }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: 'Sorry, the AI Assistant is temporarily unreachable. Please check your internet connection.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Smart Library AI Assistant" maxWidth="max-w-2xl">
      <div className="flex flex-col h-[520px]">
        {/* Grounding guarantee badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-900 text-xs mb-3">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Grounded Library Intelligence:</strong> Live catalog availability & shelf locations are queried in real-time from the institutional database.
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white shadow-sm'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/70'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                <span>Checking library catalog and syllabus records...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="pt-2">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200/80 transition-colors font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-sky-500 focus-within:bg-white transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about books, shelf locations, syllabus recommendations..."
              className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
