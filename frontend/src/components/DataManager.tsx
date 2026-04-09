'use client';

import React, { useState, useEffect } from 'react';
import { Table, Plus, Edit, Trash2, X, Save, RefreshCw, Database } from 'lucide-react';
import { clsx } from 'clsx';

interface DataManagerProps {
  onBack?: () => void;
}

const API_BASE = '/api/crud';
const TABLES = ['articles', 'article_views', 'article_engagement'];

export default function DataManager({ onBack }: DataManagerProps) {
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({});

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
  }, [selectedTable]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create record');
      await fetchData();
      setIsAdding(false);
      setFormData({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update record');
      await fetchData();
      setEditingRow(null);
      setFormData({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedTable}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (row: any) => {
    const { id, ...editableData } = row;
    setEditingRow(row);
    setFormData(editableData);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({});
    setIsAdding(true);
    setEditingRow(null);
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f111a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1a1d2e]">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold">Database Manager</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-[#1a1d2e]/50 border-b border-white/10 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-400">Table:</span>
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-[#0f111a] border border-white/20 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <button 
          onClick={startAdd}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {(isAdding || editingRow) && (
          <div className="mb-8 bg-[#1a1d2e] border border-purple-500/30 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-purple-300">
                {isAdding ? `Add to ${selectedTable}` : `Edit ${selectedTable} #${editingRow.id}`}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingRow(null); }}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={isAdding ? handleCreate : handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getColumns().filter(c => c !== 'id').map(col => (
                <div key={col} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-400 capitalize">{col.replace(/_/g, ' ')}</label>
                  <input 
                    type="text"
                    value={formData[col] || ''}
                    onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                    className="bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    required
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-white/10 pt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingRow(null); }}
                  className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                >
                  <Save className="w-4 h-4" />
                  {isAdding ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Loading data...</p>
          </div>
        ) : (
          <div className="bg-[#1a1d2e] rounded-xl border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f111a] border-b border-white/10">
                    {getColumns().map(col => (
                      <th key={col} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={getColumns().length + 1} className="px-4 py-12 text-center text-gray-500 font-medium">
                        No records found in this table.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                        {getColumns().map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                            {row[col]?.toString() || '-'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEdit(row)}
                              className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(row.id)}
                              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
