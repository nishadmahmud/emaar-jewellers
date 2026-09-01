'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { listWorkbooks } from '@/lib/sheetService';
import WorkbookList from '@/components/sheet/WorkbookList';

export default function SheetListPage() {
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWorkbooks = async () => {
    try {
      const list = await listWorkbooks();
      setWorkbooks(list);
    } catch (err) {
      console.error('Failed to load workbooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkbooks();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Spreadsheets</h1>
            <p className="text-sm text-neutral-500">
              Create and manage your workbooks
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : (
        <WorkbookList workbooks={workbooks} onRefresh={loadWorkbooks} />
      )}
    </div>
  );
}
