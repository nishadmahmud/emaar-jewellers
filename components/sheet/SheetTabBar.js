'use client';

import { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';

export default function SheetTabBar({ sheets, activeIndex, onSwitch, onAdd, onRename, onDelete }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState('');

  const handleRenameStart = (idx, name) => {
    setEditingIndex(idx);
    setEditName(name);
  };

  const handleRenameSubmit = (idx) => {
    if (!editName.trim()) {
      setEditingIndex(null);
      return;
    }
    onRename?.(idx, editName.trim());
    setEditingIndex(null);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-50 border-t border-neutral-200 overflow-x-auto">
      {sheets.map((sheet, idx) => (
        <div
          key={idx}
          className={`group flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shrink-0 ${
            idx === activeIndex
              ? 'bg-white text-black border border-neutral-200 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={() => onSwitch?.(idx)}
        >
          {editingIndex === idx ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => handleRenameSubmit(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(idx);
                if (e.key === 'Escape') setEditingIndex(null);
              }}
              className="w-20 text-xs border border-neutral-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-black"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleRenameStart(idx, sheet.name);
              }}
            >
              {sheet.name}
            </span>
          )}

          {/* Delete button (only show if more than 1 sheet) */}
          {sheets.length > 1 && idx === activeIndex && editingIndex !== idx && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${sheet.name}"?`)) {
                  onDelete?.(idx);
                }
              }}
              className="p-0.5 rounded text-neutral-400 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      {/* Add sheet button */}
      <button
        onClick={onAdd}
        className="p-1.5 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors shrink-0"
        title="Add sheet"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
