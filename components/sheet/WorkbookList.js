'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileSpreadsheet, Trash2, Pencil, MoreVertical, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createWorkbook, deleteWorkbook, renameWorkbook } from '@/lib/sheetService';

export default function WorkbookList({ workbooks, onRefresh }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const wb = await createWorkbook('Untitled Workbook');
      onRefresh?.();
      router.push(`/dashboard/sheet/${wb.id}`);
    } catch (err) {
      toast.error('Failed to create workbook');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteWorkbook(id);
      toast.success('Workbook deleted');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to delete workbook');
    }
  };

  const handleRenameStart = (id, name) => {
    setEditingId(id);
    setEditName(name);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = async (id) => {
    if (!editName.trim()) return;
    try {
      await renameWorkbook(id, editName.trim());
      toast.success('Workbook renamed');
      setEditingId(null);
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to rename workbook');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!workbooks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-1">No spreadsheets yet</h3>
        <p className="text-sm text-neutral-500 mb-6">Create your first workbook to get started</p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? 'Creating...' : 'New Workbook'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* New workbook card */}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="group border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all cursor-pointer min-h-[160px] disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center transition-colors">
            <Plus size={24} className="text-neutral-500" />
          </div>
          <span className="text-sm font-medium text-neutral-600">
            {creating ? 'Creating...' : 'New Workbook'}
          </span>
        </button>

        {/* Workbook cards */}
        {workbooks.map((wb) => (
          <div
            key={wb.id}
            className="relative group bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer min-h-[160px] flex flex-col"
            onClick={() => {
              if (editingId !== wb.id) router.push(`/dashboard/sheet/${wb.id}`);
            }}
          >
            {/* Menu button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === wb.id ? null : wb.id);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical size={16} />
              </button>

              {/* Dropdown menu */}
              {menuOpenId === wb.id && (
                <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10 w-36">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameStart(wb.id, wb.name);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      handleDelete(wb.id, wb.name);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <FileSpreadsheet size={20} className="text-emerald-600" />
            </div>

            {/* Name */}
            {editingId === wb.id ? (
              <input
                autoFocus
                value={editName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRenameSubmit(wb.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(wb.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="text-sm font-semibold text-neutral-800 border border-neutral-300 rounded px-2 py-1 mb-auto outline-none focus:ring-2 focus:ring-black"
              />
            ) : (
              <h3 className="text-sm font-semibold text-neutral-800 mb-auto truncate pr-6">
                {wb.name}
              </h3>
            )}

            {/* Meta */}
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
              <span>{wb.sheetCount} {wb.sheetCount === 1 ? 'sheet' : 'sheets'}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDate(wb.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
