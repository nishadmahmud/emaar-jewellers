'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';

export default function SpreadsheetEditor({ workbook, activeSheetIndex = 0, onDataChange }) {
  const containerRef = useRef(null);
  const jspreadsheetRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  // Formula bar state
  const [selectedCell, setSelectedCell] = useState('');
  const [formulaValue, setFormulaValue] = useState('');
  const [isTypingFormula, setIsTypingFormula] = useState(false);

  // Debounced save
  const debouncedSave = useCallback(
    (instance) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!jspreadsheetRef.current || !workbook) return;

        const updatedSheets = workbook.sheets.map((sheet, idx) => {
          if (idx === activeSheetIndex && jspreadsheetRef.current?.[0]) {
            return {
              ...sheet,
              data: jspreadsheetRef.current[0].getData(),
            };
          }
          return sheet;
        });

        onDataChange?.({ sheets: updatedSheets });
      }, 800);
    },
    [workbook, activeSheetIndex, onDataChange]
  );

  useEffect(() => {
    if (!containerRef.current || !workbook?.sheets?.[activeSheetIndex]) return;

    let isCancelled = false;
    let jssInstance = null;

    const initSpreadsheet = async () => {
      // Dynamically import to avoid SSR issues
      const jsuites = (await import('jsuites')).default || await import('jsuites');
      window.jSuites = jsuites;
      
      const jssModule = await import('jspreadsheet-ce');
      const jspreadsheet = jssModule.default || jssModule;

      if (isCancelled) return;

      // Clean up previous instance
      if (jspreadsheetRef.current?.[0]?.destroy) {
        try { jspreadsheetRef.current[0].destroy(); } catch (e) {}
        jspreadsheetRef.current = null;
      }

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const sheet = workbook.sheets[activeSheetIndex];

      jssInstance = jspreadsheet(containerRef.current, {
        worksheets: [{
          data: sheet.data && sheet.data.length > 0 ? sheet.data : [[]],
          columns: sheet.columns || undefined,
          minDimensions: [26, 50],
          defaultColWidth: 120,
        }],
        allowInsertRow: true,
        allowInsertColumn: true,
        allowDeleteRow: true,
        allowDeleteColumn: true,
        allowRenameColumn: true,
        columnSorting: true,
        columnDrag: true,
        columnResize: true,
        rowResize: true,
        rowDrag: true,
        search: true,
        contextMenu: true,
        copyCompatibility: true,
        parseFormulas: true,
        autoIncrement: true,
        about: false,
        toolbar: true,
        onselection: (instance, x1, y1) => {
          if (!isTypingFormula) {
            let colName = '';
            let tempX = x1;
            while (tempX >= 0) {
              colName = String.fromCharCode(65 + (tempX % 26)) + colName;
              tempX = Math.floor(tempX / 26) - 1;
            }
            setSelectedCell(`${colName}${parseInt(y1) + 1}`);
            try {
              // Get raw data from the options
              const raw = instance.options.data[y1][x1];
              setFormulaValue(raw !== undefined && raw !== null ? String(raw) : '');
            } catch (e) {
              setFormulaValue('');
            }
          }
        },
        onchange: (instance, cell, x, y, value) => {
          debouncedSave(instance);
          if (selectedCell) {
            let colName = '';
            let tempX = x;
            while (tempX >= 0) {
              colName = String.fromCharCode(65 + (tempX % 26)) + colName;
              tempX = Math.floor(tempX / 26) - 1;
            }
            if (`${colName}${parseInt(y) + 1}` === selectedCell && !isTypingFormula) {
              setFormulaValue(value !== undefined && value !== null ? String(value) : '');
            }
          }
        },
        oninsertrow: () => debouncedSave(jssInstance),
        oninsertcolumn: () => debouncedSave(jssInstance),
        ondeleterow: () => debouncedSave(jssInstance),
        ondeletecolumn: () => debouncedSave(jssInstance),
        onmoverow: () => debouncedSave(jssInstance),
        onmovecolumn: () => debouncedSave(jssInstance),
        onsort: () => debouncedSave(jssInstance),
      });

      jspreadsheetRef.current = jssInstance;
      setIsReady(true);
    };

    initSpreadsheet();

    return () => {
      isCancelled = true;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (jspreadsheetRef.current?.[0]?.destroy) {
        try { jspreadsheetRef.current[0].destroy(); } catch (e) {}
        jspreadsheetRef.current = null;
      }
    };
  }, [workbook?.id, activeSheetIndex]); // Re-init only on workbook or sheet change

  /**
   * Expose a way for parent to get current data (e.g. for export).
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.__jss = jspreadsheetRef;
    }
  }, [isReady]);

  const handleFormulaChange = (e) => {
    const val = e.target.value;
    setFormulaValue(val);
    setIsTypingFormula(true);
    
    if (selectedCell && jspreadsheetRef.current?.[0]) {
      // Update the cell value dynamically
      jspreadsheetRef.current[0].setValue(selectedCell, val);
    }
  };

  const handleFormulaBlur = () => {
    setIsTypingFormula(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-neutral-200">
      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
        <div className="flex items-center justify-center w-10 px-2 py-1 text-xs font-medium text-neutral-500 bg-white border border-neutral-200 rounded shrink-0">
          {selectedCell || '-'}
        </div>
        <div className="font-serif italic text-neutral-400 font-bold px-1 select-none flex items-center justify-center shrink-0">
          fx
        </div>
        <input
          type="text"
          value={formulaValue}
          onChange={handleFormulaChange}
          onBlur={handleFormulaBlur}
          disabled={!selectedCell}
          className="flex-1 px-2 py-1 text-sm bg-white border border-neutral-200 rounded outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-400 font-mono"
          placeholder={selectedCell ? 'Enter value or formula...' : 'Select a cell first'}
        />
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <div
          ref={containerRef}
          className="jss-container"
        />
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css?family=Material+Icons');
        
        .jss-container .jss {
          width: 100% !important;
        }
        .jss-container .jss_content {
          max-height: calc(100vh - 240px) !important;
        }
        .jss-container .jss thead td {
          background-color: #f5f5f5 !important;
          color: #525252 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-color: #e5e5e5 !important;
        }
        .jss-container .jss tbody td {
          font-size: 13px !important;
          border-color: #e5e5e5 !important;
          color: #171717 !important;
        }
        .jss-container .jss td.highlight {
          background-color: #f0fdf4 !important;
        }
        .jss-container .jss .jss_toolbar {
          background-color: #fafafa !important;
          border-color: #e5e5e5 !important;
        }
      `}</style>
    </div>
  );
}
