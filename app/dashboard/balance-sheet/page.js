'use client';

import { FileText, Download, Calendar } from 'lucide-react';
import { useMemo } from 'react';

const mockData = [
  { name: 'ABT', qty: null, unit: 0.891, cdt: null, dbt: 0, exp: null, balance: null },
  { name: 'ABT.ic', qty: 6900, unit: 0.89, cdt: 7752.809, dbt: null, exp: null, balance: null },
  { name: 'AKT', qty: null, unit: null, cdt: 890.15, dbt: null, exp: null, balance: null },
  { name: 'ADV', qty: null, unit: null, cdt: 50.5, dbt: null, exp: null, balance: null },
  { name: 'ALV', qty: null, unit: null, cdt: 3539.37, dbt: null, exp: null, balance: null },
  { name: 'ANS22', qty: null, unit: null, cdt: null, dbt: 424015.77, exp: null, balance: null },
  { name: 'AZM', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null, isShaded: true },
  { name: 'Apu22', qty: null, unit: null, cdt: 3000.39, dbt: null, exp: null, balance: null, isShaded: true },
  { name: 'APU', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null },
  { name: 'ARIF', qty: null, unit: null, cdt: null, dbt: 3382.51, exp: null, balance: null },
  { name: 'BNK', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null },
  { name: 'BNK22', qty: null, unit: null, cdt: 236235.929, dbt: null, exp: null, balance: null },
  { name: 'BJN22', qty: null, unit: null, cdt: null, dbt: 526232.83, exp: 15.3, balance: 20.3 },
  { name: 'NJ', qty: null, unit: null, cdt: 8747, dbt: null, exp: null, balance: null, highlight: 'bg-orange-100' },
  { name: 'BAPPY', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null },
  { name: 'BKBD', qty: null, unit: null, cdt: null, dbt: 105762.75, exp: null, balance: null },
  { name: 'BBS22', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null, isShaded: true },
  { name: 'BTN', qty: null, unit: null, cdt: null, dbt: null, exp: 80, balance: null },
  { name: 'BKB22', qty: null, unit: null, cdt: null, dbt: null, exp: null, balance: null, isShaded: true },
  { name: 'CTK', qty: null, unit: null, cdt: null, dbt: 1000, exp: null, balance: null },
  { name: 'Ctk22', qty: null, unit: null, cdt: null, dbt: 68761.414, exp: 15.3, balance: 20.3 },
];

export default function BalanceSheetPage() {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '';
    if (num === 0) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
  };

  const totals = useMemo(() => {
    return mockData.reduce(
      (acc, row) => ({
        cdt: acc.cdt + (row.cdt || 0),
        dbt: acc.dbt + (row.dbt || 0),
        exp: acc.exp + (row.exp || 0),
        balance: acc.balance + (row.balance || 0),
      }),
      { cdt: 0, dbt: 0, exp: 0, balance: 0 }
    );
  }, []);

  return (
    <div className="max-w-7xl mx-auto text-black">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Balance Sheet</h2>
          <p className="text-sm text-neutral-500 mt-1">Cashbook Details Report.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 text-sm font-medium px-4 py-2 rounded-lg shadow-sm text-neutral-700">
            <Calendar size={16} /> 30/4/2026
          </div>
          <button className="flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-7 bg-neutral-100 border-b border-neutral-200 text-sm font-semibold uppercase tracking-wider text-neutral-600">
          <div className="px-6 py-4 border-r border-neutral-200">Name</div>
          <div className="px-6 py-4 border-r border-neutral-200 text-right">Qty</div>
          <div className="px-6 py-4 border-r border-neutral-200 text-right">Unit</div>
          <div className="px-6 py-4 border-r border-neutral-200 text-right text-blue-700">CDT</div>
          <div className="px-6 py-4 border-r border-neutral-200 text-right text-red-700">DBT</div>
          <div className="px-6 py-4 border-r border-neutral-200 text-right text-blue-700">EXP</div>
          <div className="px-6 py-4 text-right text-blue-700">Balance</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-neutral-100 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {mockData.map((row, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-7 text-sm hover:bg-neutral-50 transition-colors ${
                row.highlight ? row.highlight : row.isShaded ? 'bg-neutral-50/50' : 'bg-white'
              }`}
            >
              <div className="px-6 py-3 border-r border-neutral-200 font-medium text-neutral-800 flex items-center">
                {row.name}
              </div>
              <div className="px-6 py-3 border-r border-neutral-200 font-mono text-right flex items-center justify-end text-neutral-700">
                {formatNumber(row.qty)}
              </div>
              <div className="px-6 py-3 border-r border-neutral-200 font-mono text-right flex items-center justify-end text-neutral-700">
                {formatNumber(row.unit)}
              </div>
              <div className="px-6 py-3 border-r border-neutral-200 font-mono text-right flex items-center justify-end text-blue-600 font-medium">
                {formatNumber(row.cdt)}
              </div>
              <div className="px-6 py-3 border-r border-neutral-200 font-mono text-right flex items-center justify-end text-red-600 font-medium">
                {row.dbt === 0 ? '0' : formatNumber(row.dbt)}
              </div>
              <div className="px-6 py-3 border-r border-neutral-200 font-mono text-right flex items-center justify-end text-neutral-800 font-medium">
                {formatNumber(row.exp)}
              </div>
              <div className="px-6 py-3 font-mono text-right flex items-center justify-end text-neutral-800 font-medium">
                {formatNumber(row.balance)}
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Summary */}
        <div className="grid grid-cols-7 bg-neutral-900 border-t-2 border-neutral-900 text-sm font-semibold text-white">
          <div className="px-6 py-4 border-r border-neutral-700 col-span-3 text-right tracking-wider uppercase">
            Total
          </div>
          <div className="px-6 py-4 border-r border-neutral-700 text-right font-mono text-blue-300">
            {formatNumber(totals.cdt)}
          </div>
          <div className="px-6 py-4 border-r border-neutral-700 text-right font-mono text-red-400">
            {formatNumber(totals.dbt)}
          </div>
          <div className="px-6 py-4 border-r border-neutral-700 text-right font-mono text-white">
            {formatNumber(totals.exp)}
          </div>
          <div className="px-6 py-4 text-right font-mono text-white">
            {formatNumber(totals.balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
