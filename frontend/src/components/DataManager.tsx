'use client';

import React, { useState, useEffect, useMemo, CSSProperties } from 'react';
import {
  Table as TableIcon,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  RefreshCw,
  Database,
  Search,
  ArrowLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DataManagerProps {
  onBack?: () => void;
}

const API_BASE = '/api/crud';
const TABLES = [
  { id: 'articles', label: 'Articles', icon: '📝' },
  { id: 'article_views', label: 'Views', icon: '👁️' },
  { id: 'article_engagement', label: 'Engagement', icon: '📊' }
];

/* ── Design tokens ── */
const C = {
  bg: '#07080f',
  sidebar: 'rgba(10,11,20,0.95)',
  card: 'rgba(15,17,30,0.7)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  accent: '#6366f1',
  accentDim: 'rgba(99,102,241,0.15)',
  accentBorder: 'rgba(99,102,241,0.3)',
  purple: '#a855f7',
  text: '#e2e4f0',
  muted: '#6b7090',
  faint: '#3a3d58',
  success: '#22c55e',
  error: '#f43f5e',
  rowHover: 'rgba(255,255,255,0.025)',
  headerRow: 'rgba(10,11,20,0.98)',
};

const s: any = {
  /* Root */
  root: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden',
    position: 'relative',
  },
  glow1: {
    position: 'fixed', top: '-15%', left: '-10%',
    width: '45%', height: '45%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  glow2: {
    position: 'fixed', bottom: '-15%', right: '-10%',
    width: '45%', height: '45%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  /* Sidebar */
  sidebar: {
    width: 270,
    minWidth: 270,
    display: 'flex',
    flexDirection: 'column',
    background: C.sidebar,
    borderRight: `1px solid ${C.border}`,
    backdropFilter: 'blur(24px)',
    zIndex: 20,
    overflow: 'hidden',
  },
  sidebarTop: { padding: '32px 24px 20px' },
  brand: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 32,
  },
  brandIcon: {
    padding: 10,
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: 14,
    boxShadow: '0 0 24px rgba(99,102,241,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 18, fontWeight: 800,
    background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.4))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  tableLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
    color: 'rgba(99,102,241,0.55)', textTransform: 'uppercase',
    padding: '0 8px', marginBottom: 12,
  },
  navItem: (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '11px 14px', borderRadius: 14,
    border: active ? `1px solid ${C.accentBorder}` : '1px solid transparent',
    background: active ? C.accentDim : 'transparent',
    color: active ? '#818cf8' : C.muted,
    cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: 14,
    marginBottom: 4,
    outline: 'none',
  }),
  navItemLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  sidebarBottom: {
    marginTop: 'auto', padding: '20px 24px',
    borderTop: `1px solid ${C.border}`,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1px solid transparent', background: 'transparent',
    color: C.muted, cursor: 'pointer', transition: 'all 0.2s',
    fontWeight: 700, fontSize: 13, outline: 'none',
  },
  /* Main */
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', zIndex: 10, minWidth: 0,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 36px',
    borderBottom: `1px solid ${C.border}`,
    background: 'rgba(7,8,15,0.6)', backdropFilter: 'blur(12px)',
    flexShrink: 0,
    flexWrap: 'wrap', gap: 16,
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 4 },
  headerTitleRow: { display: 'flex', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' },
  badge: {
    padding: '3px 12px', borderRadius: 999,
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
    fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase',
  },
  headerSub: { fontSize: 13, color: C.muted, fontWeight: 400 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative' },
  searchIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: C.muted,
  },
  searchInput: {
    background: 'rgba(15,17,30,0.8)', border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '10px 16px 10px 42px',
    fontSize: 13, color: C.text, outline: 'none',
    width: 280, fontWeight: 500,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  iconBtn: {
    padding: 10, background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`, borderRadius: 12,
    color: C.muted, cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontWeight: 800, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
    boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
  },
  /* Stats */
  statsBar: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16, padding: '20px 36px', flexShrink: 0,
  },
  statCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 16, backdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s',
  },
  statIcon: (color: string): CSSProperties => ({
    padding: 8, borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }),
  statLabel: {
    fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.14em',
  },
  statValue: { fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2, wordBreak: 'break-all' },
  /* Table area */
  tableArea: {
    flex: 1, padding: '0 36px 36px', minHeight: 0, display: 'flex', flexDirection: 'column',
  },
  tableCard: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)', overflow: 'hidden', position: 'relative',
  },
  tableCardGrad: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  tableScroll: {
    flex: 1, overflow: 'auto', minHeight: 0,
  },
  table: {
    width: '100%', borderCollapse: 'collapse', minWidth: 700,
  },
  thead: { position: 'sticky', top: 0, zIndex: 10 },
  th: {
    padding: '16px 24px',
    background: C.headerRow,
    borderBottom: `1px solid ${C.border}`,
    fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.18em',
    whiteSpace: 'nowrap', textAlign: 'left',
  },
  thRight: {
    padding: '16px 24px',
    background: C.headerRow,
    borderBottom: `1px solid ${C.border}`,
    fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.18em',
    whiteSpace: 'nowrap', textAlign: 'right',
  },
  td: {
    padding: '14px 24px',
    fontSize: 13, fontWeight: 500, color: C.text,
    borderBottom: `1px solid rgba(255,255,255,0.04)`,
    maxWidth: 260, overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tdDate: { color: 'rgba(129,140,248,0.8)' },
  tdActions: { padding: '14px 24px', textAlign: 'right', borderBottom: `1px solid rgba(255,255,255,0.04)` },
  actionsWrap: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  editBtn: {
    padding: '7px 9px', borderRadius: 10,
    background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.2)`,
    color: '#818cf8', cursor: 'pointer', transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', outline: 'none',
  },
  deleteBtn: {
    padding: '7px 9px', borderRadius: 10,
    background: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.2)`,
    color: '#f43f5e', cursor: 'pointer', transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', outline: 'none',
  },
  /* Empty / Loading */
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '80px 40px', gap: 20,
  },
  emptyIconWrap: {
    padding: 24, background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`, borderRadius: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#ccc', textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  spinner: {
    width: 48, height: 48,
    border: '3px solid rgba(99,102,241,0.15)',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    boxShadow: '0 0 24px rgba(99,102,241,0.15)',
  },
  /* Modal */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, overflowY: 'auto',
    animation: 'fadeIn 0.25s ease-out',
  },
  modal: {
    background: '#0f111a', border: `1px solid ${C.border}`,
    borderRadius: 28, width: '100%', maxWidth: 520,
    boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
    overflow: 'hidden', position: 'relative',
    animation: 'fadeInUp 0.25s ease-out',
  },
  modalGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200,
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '28px 32px 22px',
    borderBottom: `1px solid ${C.border}`,
  },
  modalTitle: { fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' },
  modalSub: {
    fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 6,
  },
  closeBtn: {
    padding: 9, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
    border: `1px solid transparent`, color: C.muted,
    cursor: 'pointer', transition: 'all 0.18s', outline: 'none',
    display: 'flex', alignItems: 'center',
  },
  modalBody: { padding: '28px 32px 32px' },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    display: 'block', fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8,
  },
  fieldInput: {
    width: '100%', background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${C.border}`, borderRadius: 12,
    padding: '12px 16px', color: C.text, fontSize: 13, fontWeight: 500,
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', gap: 12, marginTop: 28 },
  cancelBtn: {
    flex: 1, padding: '12px 20px', borderRadius: 14,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
    color: C.muted, cursor: 'pointer', fontWeight: 700, fontSize: 13,
    transition: 'all 0.18s', outline: 'none',
  },
  submitBtn: {
    flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '12px 20px', borderRadius: 14,
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontWeight: 800, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.18s',
    boxShadow: '0 8px 24px rgba(99,102,241,0.25)', outline: 'none',
  },
  /* Toasts */
  toastWrap: {
    position: 'fixed', bottom: 32, right: 32, zIndex: 200,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  },
  toastError: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(20,8,12,0.9)', border: `1px solid rgba(244,63,94,0.35)`,
    backdropFilter: 'blur(16px)', padding: '14px 20px', borderRadius: 18,
    color: '#fca5a5', fontSize: 13, fontWeight: 600,
    boxShadow: '0 16px 40px rgba(244,63,94,0.2)',
    animation: 'slideUp 0.35s cubic-bezier(.34,1.56,.64,1)',
    maxWidth: 360,
  },
  toastSuccess: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(8,20,12,0.9)', border: `1px solid rgba(34,197,94,0.35)`,
    backdropFilter: 'blur(16px)', padding: '14px 20px', borderRadius: 18,
    color: '#86efac', fontSize: 13, fontWeight: 600,
    boxShadow: '0 16px 40px rgba(34,197,94,0.15)',
    animation: 'slideUp 0.35s cubic-bezier(.34,1.56,.64,1)',
    maxWidth: 360,
  },
  toastIconError: {
    padding: 7, background: C.error, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  toastIconSuccess: {
    padding: 7, background: C.success, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  toastMeta: { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.6, marginBottom: 2 },
};

export default function DataManager({ onBack }: DataManagerProps) {
  const [selectedTable, setSelectedTable] = useState(TABLES[0].id);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchQuery('');
  }, [selectedTable]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(null); setError(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create record');
      await fetchData(); setIsAdding(false); setFormData({});
      setSuccess('Record created successfully!');
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}/${editingRow.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update record');
      await fetchData(); setEditingRow(null); setFormData({});
      setSuccess('Record updated successfully!');
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this record?')) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      await fetchData(); setSuccess('Record deleted!');
    } catch (err: any) { setError(err.message); }
  };

  const startEdit = (row: any) => {
    const { id, ...rest } = row;
    setEditingRow(row); setFormData(rest); setIsAdding(false);
  };

  const startAdd = () => { setFormData({}); setIsAdding(true); setEditingRow(null); };

  const getColumns = () => data.length === 0 ? [] : Object.keys(data[0]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
  }, [data, searchQuery]);

  const isDate = (col: string) => col.includes('at') || col.includes('viewed');

  const fmtDate = (val: any) => {
    try { return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return val; }
  };

  const stats = [
    { label: 'Total Records', value: data.length, icon: Database, color: '#818cf8' },
    { label: 'Search Results', value: filteredData.length, icon: Filter, color: '#c084fc' },
    { label: 'Current Table', value: TABLES.find(t => t.id === selectedTable)?.label ?? selectedTable, icon: TableIcon, color: '#f472b6' },
    { label: 'Status', value: isLoading ? 'Loading…' : 'Healthy', icon: CheckCircle2, color: '#4ade80' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .dm-nav-item:hover { background: rgba(255,255,255,0.04) !important; color: #c4c6e0 !important; }
        .dm-back:hover { background: rgba(255,255,255,0.04) !important; color: #c4c6e0 !important; }
        .dm-search:focus { border-color: rgba(99,102,241,0.45) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important; }
        .dm-icon-btn:hover { background: rgba(255,255,255,0.08) !important; color: #c4c6e0 !important; }
        .dm-add-btn:hover { box-shadow: 0 12px 32px rgba(99,102,241,0.4) !important; opacity: 0.92; }
        .dm-edit-btn:hover { background: rgba(99,102,241,0.22) !important; }
        .dm-delete-btn:hover { background: rgba(244,63,94,0.2) !important; }
        .dm-row:hover td { background: rgba(255,255,255,0.025) !important; }
        .dm-field-input:focus { border-color: rgba(99,102,241,0.45) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
        .dm-cancel-btn:hover { background: rgba(255,255,255,0.08) !important; color: #c4c6e0 !important; }
        .dm-stat-card:hover { border-color: rgba(255,255,255,0.12) !important; }
        .dm-scrollable::-webkit-scrollbar { width: 6px; height: 6px; }
        .dm-scrollable::-webkit-scrollbar-track { background: transparent; }
        .dm-scrollable::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 8px; }
        .dm-scrollable::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.35); }
      `}</style>

      <div style={s.root}>
        <div style={s.glow1} />
        <div style={s.glow2} />

        {/* ── Sidebar ── */}
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <div style={s.brand}>
              <div style={s.brandIcon}>
                <Database size={20} color="#fff" />
              </div>
              <span style={s.brandTitle}>SupaData</span>
            </div>

            <p style={s.tableLabel}>Database Tables</p>
            <nav>
              {TABLES.map(t => (
                <button
                  key={t.id}
                  className="dm-nav-item"
                  style={s.navItem(selectedTable === t.id)}
                  onClick={() => setSelectedTable(t.id)}
                >
                  <div style={s.navItemLeft}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                  {selectedTable === t.id && <ChevronRight size={15} />}
                </button>
              ))}
            </nav>
          </div>

          <div style={s.sidebarBottom}>
            <button className="dm-back" style={s.backBtn} onClick={onBack}>
              <ArrowLeft size={15} />
              Back to Console
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={s.main}>
          {/* Header */}
          <header style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.headerTitleRow}>
                <h1 style={s.headerTitle}>{TABLES.find(t => t.id === selectedTable)?.label}</h1>
                <span style={s.badge}>{data.length} Records</span>
              </div>
              <p style={s.headerSub}>Manage and monitor your database entries with ease.</p>
            </div>

            <div style={s.headerRight}>
              <div style={s.searchWrap}>
                <Search size={15} style={s.searchIcon as any} />
                <input
                  type="text"
                  className="dm-search"
                  placeholder="Search anything…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={s.searchInput}
                />
              </div>

              <button
                className="dm-icon-btn"
                style={s.iconBtn}
                onClick={fetchData}
                title="Refresh"
              >
                <RefreshCw size={17} style={isLoading ? { animation: 'spin 0.8s linear infinite' } : {}} />
              </button>

              <button className="dm-add-btn" style={s.addBtn} onClick={startAdd}>
                <Plus size={16} />
                New Entry
              </button>
            </div>
          </header>

          {/* Stats bar */}
          <div style={s.statsBar}>
            {stats.map((st, i) => (
              <div key={i} className="dm-stat-card" style={s.statCard}>
                <div style={s.statIcon(st.color)}>
                  <st.icon size={16} color={st.color} />
                </div>
                <div>
                  <p style={s.statLabel}>{st.label}</p>
                  <p style={s.statValue}>{st.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table area */}
          <div style={s.tableArea}>
            <div style={s.tableCard}>
              <div style={s.tableCardGrad} />

              {isLoading && data.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.spinner} />
                  <p style={{ ...s.emptySub, marginTop: 16 }}>Synchronizing data…</p>
                </div>
              ) : (
                <div className="dm-scrollable" style={s.tableScroll}>
                  <table style={s.table}>
                    <thead style={s.thead}>
                      <tr>
                        {getColumns().map(col => (
                          <th key={col} style={s.th}>{col.replace(/_/g, ' ')}</th>
                        ))}
                        <th style={s.thRight}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={getColumns().length + 1}>
                            <div style={s.empty}>
                              <div style={s.emptyIconWrap}>
                                <Search size={36} color={C.faint} />
                              </div>
                              <p style={s.emptyTitle}>No matches found</p>
                              <p style={s.emptySub}>Try adjusting your search or filters.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData.map(row => (
                          <tr
                            key={row.id}
                            className="dm-row"
                            onMouseEnter={() => setHoveredRow(row.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            {getColumns().map(col => (
                              <td key={col} style={isDate(col) ? { ...s.td, ...s.tdDate } : s.td} title={String(row[col] ?? '')}>
                                {isDate(col) ? fmtDate(row[col]) : (row[col]?.toString() || '—')}
                              </td>
                            ))}
                            <td style={s.tdActions}>
                              <div style={{
                                ...s.actionsWrap,
                                opacity: hoveredRow === row.id ? 1 : 0,
                                transition: 'opacity 0.2s',
                              }}>
                                <button
                                  className="dm-edit-btn"
                                  style={s.editBtn}
                                  onClick={() => startEdit(row)}
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="dm-delete-btn"
                                  style={s.deleteBtn}
                                  onClick={() => handleDelete(row.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── Modal ── */}
        {(isAdding || editingRow) && (
          <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setIsAdding(false); setEditingRow(null); } }}>
            <div style={s.modal}>
              <div style={s.modalGlow} />

              <div style={s.modalHeader}>
                <div>
                  <h3 style={s.modalTitle}>{isAdding ? 'New Record' : 'Edit Record'}</h3>
                  <p style={s.modalSub}>
                    {selectedTable} / {editingRow ? `ID-${editingRow.id}` : 'CREATE_NEW'}
                  </p>
                </div>
                <button
                  className="dm-icon-btn"
                  style={s.closeBtn}
                  onClick={() => { setIsAdding(false); setEditingRow(null); }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={isAdding ? handleCreate : handleUpdate} style={s.modalBody}>
                {getColumns().filter(c => c !== 'id').map(col => (
                  <div key={col} style={s.fieldGroup}>
                    <label style={s.fieldLabel}>{col.replace(/_/g, ' ')}</label>
                    <input
                      type="text"
                      className="dm-field-input"
                      style={s.fieldInput}
                      value={formData[col] || ''}
                      onChange={e => setFormData({ ...formData, [col]: e.target.value })}
                      placeholder={`Enter ${col.replace(/_/g, ' ')}…`}
                      required
                    />
                  </div>
                ))}

                <div style={s.modalActions}>
                  <button
                    type="button"
                    className="dm-cancel-btn"
                    style={s.cancelBtn}
                    onClick={() => { setIsAdding(false); setEditingRow(null); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={s.submitBtn}>
                    <Save size={15} />
                    {isAdding ? 'Create Record' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Toasts ── */}
        <div style={s.toastWrap}>
          {error && (
            <div style={s.toastError}>
              <div style={s.toastIconError}><AlertCircle size={16} color="#fff" /></div>
              <div>
                <p style={s.toastMeta}>Error</p>
                {error}
              </div>
            </div>
          )}
          {success && (
            <div style={s.toastSuccess}>
              <div style={s.toastIconSuccess}><CheckCircle2 size={16} color="#fff" /></div>
              <div>
                <p style={s.toastMeta}>Success</p>
                {success}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
