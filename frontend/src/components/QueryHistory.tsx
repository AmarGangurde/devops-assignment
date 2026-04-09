'use client';
import { History, Clock } from 'lucide-react';

interface Props {
  queries: string[];
  onSelect: (q: string) => void;
}

export default function QueryHistory({ queries, onSelect }: Props) {
  if (queries.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <History size={20} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your recent queries will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px 6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        History
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {queries.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              width: '100%', textAlign: 'left',
              padding: '7px 8px', marginBottom: '2px',
              background: 'transparent', border: '1px solid transparent',
              borderRadius: '7px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '12px',
              transition: 'all 0.15s', lineHeight: '1.4',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            <Clock size={12} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {q}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
