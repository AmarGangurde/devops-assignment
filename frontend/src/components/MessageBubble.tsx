'use client';
import { ChatMessage } from '../lib/api';
import { User, Bot, AlertTriangle, Loader2, Code2 } from 'lucide-react';
import { useState } from 'react';
import ResultsTable from './ResultsTable';
import ChartPanel from './ChartPanel';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      className="animate-fadeIn"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '12px',
        marginBottom: '20px',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
        background: isUser ? 'var(--accent)' : 'var(--bg-card)',
        border: '1px solid ' + (isUser ? 'var(--accent)' : 'var(--border)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="var(--accent)" />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '85%', flex: 1 }}>
        {/* Loading state */}
        {message.loading && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--text-secondary)', fontSize: '14px',
          }}>
            <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span>Analyzing your query...</span>
          </div>
        )}

        {/* Error state */}
        {message.error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <AlertTriangle size={16} color="var(--error)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '4px', fontSize: '13px' }}>Error</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{message.error}</div>
            </div>
          </div>
        )}

        {/* Normal message */}
        {!message.loading && !message.error && (
          <div>
            {/* Text bubble */}
            {message.content && (
              <div style={{
                background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                border: isUser ? 'none' : '1px solid var(--border)',
                borderRadius: '12px', padding: '12px 16px',
                color: isUser ? '#fff' : 'var(--text-primary)',
                fontSize: '14px', lineHeight: '1.6',
                marginBottom: message.result ? '12px' : '0',
              }}>
                {message.content}
              </div>
            )}

            {/* Result: chart or table */}
            {message.result && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', overflow: 'hidden',
              }}>
                {/* Result header */}
                <div style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {message.result.rowCount} row{message.result.rowCount !== 1 ? 's' : ''} returned
                  </div>
                  {message.result.sql && (
                    <button
                      onClick={() => setShowSql(!showSql)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: '6px', padding: '3px 8px',
                        cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Code2 size={11} />
                      {showSql ? 'Hide SQL' : 'View SQL'}
                    </button>
                  )}
                </div>

                {/* SQL preview */}
                {showSql && message.result.sql && (
                  <div style={{ padding: '12px 16px', background: '#0d1117', borderBottom: '1px solid var(--border)' }}>
                    <pre style={{
                      color: '#7dd3fc', fontSize: '12px', overflowX: 'auto',
                      fontFamily: 'monospace', lineHeight: '1.5', margin: 0,
                    }}>
                      {message.result.sql}
                    </pre>
                  </div>
                )}

                {/* Chart or table rendering */}
                <div style={{ padding: '16px' }}>
                  {(message.result.type === 'chart') && (
                    <ChartPanel result={message.result} />
                  )}
                  {(message.result.type === 'table' || (message.result.type === 'chart' && message.result.rawRows)) && (
                    <div style={{ marginTop: message.result.type === 'chart' ? '16px' : '0' }}>
                      {message.result.type === 'chart' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Raw Data
                        </div>
                      )}
                      <ResultsTable
                        columns={message.result.columns || []}
                        rows={message.result.type === 'table' ? message.result.data : message.result.rawRows || []}
                      />
                    </div>
                  )}
                  {message.result.type === 'text' && message.result.data && (
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', padding: '8px' }}>
                      {String(message.result.data.value)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        {!message.loading && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textAlign: isUser ? 'right' : 'left' }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
