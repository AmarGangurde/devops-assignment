'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, Database } from 'lucide-react';
import { sendChatMessage, ChatMessage, QueryResult } from '../lib/api';
import MessageBubble from './MessageBubble';
import QueryHistory from './QueryHistory';

const EXAMPLE_QUERIES = [
  'Show top trending topics in last 30 days',
  'Compare article engagement by topic',
  'Plot daily views trend for the past week',
  'Which articles have the highest read time?',
  'Show total views per month this year',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const loadingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      loading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    // Build history for context
    const history = messages
      .filter(m => !m.loading && !m.error)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await sendChatMessage(userMessage, history);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response.message,
        result: response.result,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
      setQueryHistory(prev => [userMessage, ...prev.filter(q => q !== userMessage)].slice(0, 20));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        error: err.message || 'Something went wrong. Please try again.',
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--accent)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>SupaChat</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conversational Analytics</div>
          </div>
        </div>

        {/* Example queries */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Try asking...
          </div>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', marginBottom: '4px',
                background: 'transparent', border: '1px solid transparent',
                borderRadius: '8px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = 'var(--bg-hover)';
                (e.target as HTMLElement).style.borderColor = 'var(--border)';
                (e.target as HTMLElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = 'transparent';
                (e.target as HTMLElement).style.borderColor = 'transparent';
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Query history */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <QueryHistory queries={queryHistory} onSelect={sendMessage} />
        </div>

        {/* DB indicator */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: 'var(--text-muted)', fontSize: '11px',
        }}>
          <Database size={14} />
          <span>PostgreSQL Connected</span>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', marginLeft: 'auto' }} />
        </div>
      </aside>

      {/* Main chat area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px',
                background: 'var(--accent-dim)',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--accent)',
              }}>
                <Sparkles size={28} color="var(--accent)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Ask anything about your data
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px' }}>
                  Query your blog analytics database in plain English. Get results as charts, tables, or summaries.
                </p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            display: 'flex', gap: '12px', alignItems: 'flex-end',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '12px 16px',
            transition: 'border-color 0.2s',
          }}
            onFocus={() => {}}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your analytics... (Press Enter to send)"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', color: 'var(--text-primary)', fontSize: '14px',
                lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto',
                fontFamily: 'inherit',
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-hover)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', flexShrink: 0,
              }}
            >
              {loading
                ? <Loader2 size={16} color="var(--text-muted)" className="animate-spin" />
                : <Send size={16} color={input.trim() ? '#fff' : 'var(--text-muted)'} />
              }
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            SupaChat converts your natural language to SQL and visualizes results. Shift+Enter for new line.
          </div>
        </div>
      </main>
    </div>
  );
}
