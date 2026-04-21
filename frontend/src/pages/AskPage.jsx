import { useState, useRef, useEffect, useCallback } from 'react';

const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary: '#1B3A6B',
  accent:  '#00A99D',
  safe:    '#10B981',
  caution: '#F59E0B',
  critical:'#EF4444',
};

// ─────────────────────────────────────────────────────────────
// System prompt — Australian nursing context
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Roshana, a knowledgeable nursing study assistant for Australian nursing students and registered nurses. You specialise in pharmacology, medication administration, clinical procedures, and nursing practice in the Australian healthcare context.

IMPORTANT RULES:
1. Always use Australian drug names (e.g. frusemide not furosemide, paracetamol not acetaminophen, adrenaline not epinephrine)
2. Reference Australian guidelines, TGA, AHPRA, and Australian hospital practice where relevant
3. Always end any medication or clinical advice with: "⚠️ Always verify with your facility's current protocols and a senior clinician before acting."
4. Keep answers concise and practical — you are helping a nursing student on placement
5. Use clear structure: short paragraphs, bullet points where helpful
6. For drug questions always cover: what it is, why it's given, key nursing considerations, and what to monitor
7. If asked about something outside nursing/clinical scope, politely redirect to nursing-relevant context
8. Never diagnose or give advice that replaces medical consultation
9. Format numbers clearly: doses in standard units, frequencies spelled out
10. Be warm, encouraging, and supportive — nursing is hard work`;

// ─────────────────────────────────────────────────────────────
// Suggested starter questions
// ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { emoji: '💊', text: 'What do I need to check before giving frusemide?' },
  { emoji: '💉', text: 'Explain insulin types and their onset/peak/duration' },
  { emoji: '🩸', text: 'When should I hold warfarin and what is the antidote?' },
  { emoji: '🫀', text: 'What are the signs of digoxin toxicity?' },
  { emoji: '😮‍💨', text: 'At what respiratory rate should I withhold opioids?' },
  { emoji: '🔴', text: 'What are the MET call criteria in Australian hospitals?' },
  { emoji: '🩺', text: 'How do I calculate IV drip rate for a 1L bag over 8 hours?' },
  { emoji: '💡', text: 'What does the -lol suffix tell me about a drug?' },
];

// ─────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser  = message.role === 'user';
  const isError = message.error === true;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mt-0.5"
          style={{ background: isError ? '#EF444420' : `${C.accent}20` }}
        >
          {isError ? '⚠️' : '🩺'}
        </div>
      )}
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3"
        style={{
          background: isUser ? C.primary : isError ? '#FEF2F2' : '#FFFFFF',
          border: isUser ? 'none' : isError ? `1px solid ${C.critical}30` : '1px solid #E5E7EB',
          borderBottomRightRadius: isUser ? '4px' : '16px',
          borderBottomLeftRadius:  isUser ? '16px' : '4px',
        }}
      >
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: FONTS.body,
            color: isUser ? '#FFFFFF' : isError ? C.critical : '#1F2937',
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TypingIndicator
// ─────────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-2.5">
    <div
      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
      style={{ background: `${C.accent}20` }}
    >
      🩺
    </div>
    <div
      className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderBottomLeftRadius: '4px' }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: C.accent,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// AskPage — default export
// Uses /api/ask serverless proxy — no API key needed from users
// ─────────────────────────────────────────────────────────────
const AskPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const messagesEndRef           = useRef(null);
  const inputRef                 = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const apiMessages = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, system: SYSTEM_PROMPT }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'No response received.';

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}. Please try again in a moment.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleClear = () => { setMessages([]); setInput(''); };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h1 className="text-base font-bold text-[#1B3A6B] leading-tight" style={{ fontFamily: FONTS.heading }}>
                Ask Roshana
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.safe }} />
                <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
                  AI assistant · Australian nursing context
                </p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: '#F3F4F6', color: '#6B7280', fontFamily: FONTS.body, minHeight: '32px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            {/* Welcome bubble */}
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `${C.accent}20` }}>
                🩺
              </div>
              <div
                className="rounded-2xl px-4 py-3 max-w-[85%]"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderBottomLeftRadius: '4px' }}
              >
                <p className="text-sm leading-relaxed" style={{ fontFamily: FONTS.body, color: '#1F2937' }}>
                  Hi! I'm Roshana — your AI nursing assistant. Ask me anything about medications, drug classes, clinical procedures, or nursing considerations. I'm tailored for Australian nursing practice. 👋
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs text-gray-400 mb-2 px-1" style={{ fontFamily: FONTS.body }}>
                Try asking…
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    data-testid={`suggestion-${i}`}
                    onClick={() => sendMessage(s.text)}
                    className="w-full flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                    style={{ border: '1px solid #E5E7EB', minHeight: '44px' }}
                  >
                    <span className="text-base flex-shrink-0">{s.emoji}</span>
                    <p className="text-xs text-gray-600 leading-snug" style={{ fontFamily: FONTS.body }}>
                      {s.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="flex-shrink-0 px-4 py-1.5 border-t border-gray-100" style={{ background: '#FFFBEB' }}>
        <p className="text-center text-xs text-amber-700" style={{ fontFamily: FONTS.body }}>
          ⚠️ Educational use only — always verify with facility protocols
        </p>
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            data-testid="ask-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about any drug or clinical question…"
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] resize-none"
            style={{ fontFamily: FONTS.body, minHeight: '48px', maxHeight: '120px', lineHeight: '1.4' }}
            disabled={loading}
          />
          <button
            data-testid="ask-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{ background: input.trim() && !loading ? C.accent : '#E5E7EB', minHeight: '48px' }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent" style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg className="w-5 h-5" style={{ color: input.trim() ? '#FFFFFF' : '#9CA3AF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default AskPage;
