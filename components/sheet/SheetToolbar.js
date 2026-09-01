'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Download, Upload, Check, Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SheetToolbar({ workbook, saveStatus, onRename, onExport, onImport }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workbook?.name || '');
  const fileInputRef = useRef(null);

  const handleRename = () => {
    if (!name.trim()) return;
    onRename?.(name.trim());
    setIsEditing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please select an Excel or CSV file');
      return;
    }

    onImport?.(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-3 px-1 py-3 flex-wrap">
      {/* Back button */}
      <Link
        href="/dashboard/sheet"
        className="p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
        title="Back to list"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="h-6 w-px bg-neutral-200" />

      {/* Workbook name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setName(workbook?.name || '');
                setIsEditing(false);
              }
            }}
            className="text-base font-semibold text-neutral-800 border border-neutral-300 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-black max-w-xs"
          />
        ) : (
          <button
            onClick={() => {
              setName(workbook?.name || '');
              setIsEditing(true);
            }}
            className="group flex items-center gap-2 text-base font-semibold text-neutral-800 hover:text-black truncate max-w-xs"
          >
            <span className="truncate">{workbook?.name || 'Untitled'}</span>
            <Pencil size={14} className="text-neutral-400 group-hover:text-neutral-600 shrink-0" />
          </button>
        )}

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check size={12} className="text-emerald-500" />
              <span className="text-emerald-600">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleImportClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          title="Import Excel file"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors"
          title="Export to Excel"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
