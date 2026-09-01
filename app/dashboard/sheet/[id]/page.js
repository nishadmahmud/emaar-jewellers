'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getWorkbook, updateWorkbook, renameWorkbook } from '@/lib/sheetService';
import SpreadsheetEditor from '@/components/sheet/SpreadsheetEditor';
import SheetToolbar from '@/components/sheet/SheetToolbar';
import SheetTabBar from '@/components/sheet/SheetTabBar';

export default function SheetEditorPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [workbook, setWorkbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // Load workbook
  useEffect(() => {
    const load = async () => {
      try {
        const wb = await getWorkbook(id);
        if (!wb) {
          toast.error('Workbook not found');
          router.push('/dashboard/sheet');
          return;
        }
        setWorkbook(wb);
      } catch (err) {
        toast.error('Failed to load workbook');
        router.push('/dashboard/sheet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Handle data changes from the editor (auto-save)
  const handleDataChange = useCallback(
    async (partialData) => {
      if (!workbook) return;
      setSaveStatus('saving');
      try {
        const updated = await updateWorkbook(workbook.id, partialData);
        setWorkbook(updated);
        setSaveStatus('saved');
      } catch (err) {
        toast.error('Failed to save');
        setSaveStatus('saved');
      }
    },
    [workbook]
  );

  // Rename workbook
  const handleRename = async (newName) => {
    if (!workbook) return;
    try {
      const updated = await renameWorkbook(workbook.id, newName);
      setWorkbook(updated);
      toast.success('Workbook renamed');
    } catch (err) {
      toast.error('Failed to rename');
    }
  };

  // Export to Excel
  const handleExport = () => {
    if (!workbook) return;
    try {
      const wb = XLSX.utils.book_new();

      workbook.sheets.forEach((sheet) => {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data || [[]]);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet');
      });

      XLSX.writeFile(wb, `${workbook.name || 'workbook'}.xlsx`);
      toast.success('Exported successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  // Import from Excel
  const handleImport = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });

      const importedSheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Ensure minimum dimensions
        const rows = Math.max(jsonData.length, 50);
        const cols = Math.max(
          jsonData.reduce((max, row) => Math.max(max, row.length), 0),
          26
        );

        const paddedData = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) =>
            jsonData[r]?.[c] !== undefined ? String(jsonData[r][c]) : ''
          )
        );

        return {
          name,
          data: paddedData,
          columns: Array.from({ length: cols }, (_, i) => ({
            title: i < 26 ? String.fromCharCode(65 + i) : `C${i + 1}`,
            width: 120,
          })),
        };
      });

      const updated = await updateWorkbook(workbook.id, { sheets: importedSheets });
      setWorkbook({ ...updated }); // force re-render
      setActiveSheetIndex(0);
      toast.success(`Imported ${importedSheets.length} sheet(s)`);
    } catch (err) {
      toast.error('Import failed — make sure the file is a valid Excel/CSV');
    }
  };

  // Sheet tab actions
  const handleAddSheet = async () => {
    if (!workbook) return;
    const newSheets = [
      ...workbook.sheets,
      {
        name: `Sheet${workbook.sheets.length + 1}`,
        data: Array.from({ length: 50 }, () => Array(26).fill('')),
        columns: Array.from({ length: 26 }, (_, i) => ({
          title: String.fromCharCode(65 + i),
          width: 120,
        })),
      },
    ];
    const updated = await updateWorkbook(workbook.id, { sheets: newSheets });
    setWorkbook(updated);
    setActiveSheetIndex(newSheets.length - 1);
  };

  const handleRenameSheet = async (idx, newName) => {
    if (!workbook) return;
    const newSheets = workbook.sheets.map((s, i) =>
      i === idx ? { ...s, name: newName } : s
    );
    const updated = await updateWorkbook(workbook.id, { sheets: newSheets });
    setWorkbook(updated);
  };

  const handleDeleteSheet = async (idx) => {
    if (!workbook || workbook.sheets.length <= 1) return;
    const newSheets = workbook.sheets.filter((_, i) => i !== idx);
    const updated = await updateWorkbook(workbook.id, { sheets: newSheets });
    setWorkbook(updated);
    if (activeSheetIndex >= newSheets.length) {
      setActiveSheetIndex(newSheets.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!workbook) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <SheetToolbar
        workbook={workbook}
        saveStatus={saveStatus}
        onRename={handleRename}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Spreadsheet */}
      <SpreadsheetEditor
        workbook={workbook}
        activeSheetIndex={activeSheetIndex}
        onDataChange={handleDataChange}
      />

      {/* Sheet tabs */}
      <SheetTabBar
        sheets={workbook.sheets}
        activeIndex={activeSheetIndex}
        onSwitch={setActiveSheetIndex}
        onAdd={handleAddSheet}
        onRename={handleRenameSheet}
        onDelete={handleDeleteSheet}
      />
    </div>
  );
}
