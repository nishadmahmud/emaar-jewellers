'use client';

import { useState } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Gem, Wallet, Store } from 'lucide-react';

const formatNumber = (num, decimals = 3) => {
  if (num === null || num === undefined) return '';
  if (num === 0) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

// --- BUY SECTION ---
const BuyTable = () => {
  const data = [
    { name: 'ST', gram: 2920, tola: 225.858, unit: null, tk: 659505.36, avg: null },
    { name: 'ST', gram: null, tola: 204.284, unit: 0.000, tk: null, avg: null },
    { name: '', gram: null, tola: null, unit: 0, tk: null, avg: null },
    { name: '', gram: null, tola: null, unit: 0, tk: null, avg: null },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-blue-600 text-white text-center font-bold text-xs py-2 tracking-wider">BUY</div>
      <div className="grid grid-cols-6 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">Gram</div>
        <div className="px-3 py-2 text-right">Tola</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-6 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-neutral-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-orange-600">{formatNumber(row.gram)}</div>
            <div className="px-3 py-1.5 text-right font-medium text-orange-600">{formatNumber(row.tola)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk, 2)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-500">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">2920</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800"></div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800"></div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">659,505.36</div>
        <div className="px-3 py-2 text-right font-bold text-orange-600">225.858</div>
      </div>
    </div>
  );
};

const ChainBuyTable = () => {
  const data = [
    { name: 'Stock', tola: 385.244, unit: 197.726, tk: 76172.755, avg: null },
    { name: 'BNK', tola: null, unit: null, tk: 0.000, avg: null },
    { name: 'Chandi', tola: null, unit: null, tk: 0.000, avg: null },
    { name: 'ANS', tola: null, unit: null, tk: 0.000, avg: null },
    { name: 'Ans22', tola: 170, unit: 197.864, tk: 33636.818, avg: null },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-blue-600 text-white text-center font-bold text-xs py-2 tracking-wider">CHAIN BUY</div>
      <div className="grid grid-cols-5 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">Tola</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-neutral-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-orange-600">{formatNumber(row.tola)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk, 2)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-500">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-orange-600">1,755.144</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800"></div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">346,735.28</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">197.554</div>
      </div>
    </div>
  );
};

const FwdBuyTable = () => {
  const data = [
    { rate: 1446, name: 'ANS', tola: null, unit: null, tk: 0, avg: null },
    { rate: 1451, name: 'Ans', tola: 170, unit: 5358, tk: 910860, avg: 33 },
    { rate: 1448, name: 'Ans', tola: 2060, unit: 5198, tk: 10707860, avg: 6 },
    { rate: 1423.5, name: 'Ans', tola: 640, unit: 5155, tk: 3299200, avg: null },
    { rate: 34, name: 'Smn', tola: null, unit: 152.4, tk: 0, avg: 860 },
    { rate: 651, name: 'CNY', tola: 1000, unit: 2213, tk: 2213000, avg: null },
    { rate: 1590, name: 'SKNDR', tola: 200, unit: 5093, tk: 1018600, avg: 20 },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-blue-600 text-white text-center font-bold text-xs py-2 tracking-wider">FWD BUY</div>
      <div className="grid grid-cols-6 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2 text-right">Rate</div>
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">Tola</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-6 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 text-right font-medium text-neutral-700">{formatNumber(row.rate, 1)}</div>
            <div className="px-3 py-1.5 font-medium text-blue-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-pink-600">{formatNumber(row.tola)}</div>
            <div className="px-3 py-1.5 text-right text-red-500 font-medium">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-blue-700">{formatNumber(row.tk, 0)}</div>
            <div className="px-3 py-1.5 text-right text-orange-600">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2"></div>
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-pink-600">12,450</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-blue-700">1,470,464.00</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">3,330.961</div>
      </div>
    </div>
  );
};

// --- SELL SECTION ---
const SellTable = () => {
  const data = [
    { name: 'BJN', tola: null, unit: null, tk: 0 },
    { name: 'Adv', tola: null, unit: null, tk: 0 },
    { name: 'LUX', tola: null, unit: null, tk: 0 },
    { name: 'NSN', tola: null, unit: null, tk: 0 },
    { name: 'XIO', tola: null, unit: null, tk: 0 },
    { name: 'CTK', tola: null, unit: null, tk: 0 },
    { name: 'Ctk22', tola: 1465, unit: 199.773, tk: 9988.636 },
    { name: 'Kis22', tola: 1419.5, unit: 193.568, tk: 19356.818 },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-red-600 text-white text-center font-bold text-xs py-2 tracking-wider">SELL</div>
      <div className="grid grid-cols-4 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">Tola</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-red-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-orange-600">{formatNumber(row.tola)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk, 2)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-orange-600">150</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">29,345.455</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">195.636</div>
      </div>
    </div>
  );
};

const ChainSellTable = () => {
  const data = [
    { name: 'Srd', tola: null, unit: null, tk: 0, avg: null },
    { name: 'HJN', tola: null, unit: null, tk: 0, avg: null },
    { name: 'KIS', tola: null, unit: null, tk: 0, avg: null },
    { name: 'LTN', tola: null, unit: null, tk: 0, avg: null },
    { name: 'Kis22', tola: 1419.5, unit: 302.308, tk: 58517.21, avg: 193.568 },
    { name: 'Ltn22', tola: 1420, unit: 209.119, tk: 40493.043, avg: 193.636 },
    { name: 'Bnk22', tola: 1450, unit: 666.033, tk: 131692.89, avg: 197.727 },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-red-600 text-white text-center font-bold text-xs py-2 tracking-wider">CHAIN SELL</div>
      <div className="grid grid-cols-5 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">Tola</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-red-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-orange-600">{formatNumber(row.tola)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk, 2)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-500">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-orange-600">1,177.46</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800"></div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">230,703.14</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">195.933</div>
      </div>
    </div>
  );
};

const TokenTable = () => {
  const data = [
    { sl: 1, name: 'EMR', note: '', amount: 65.056 },
    { sl: 2, name: 'Bkb', note: '', amount: null },
    { sl: 3, name: 'EMR', note: '', amount: 64.21 },
    { sl: 4, name: 'EMR', note: '', amount: 65.157 },
    { sl: 5, name: 'EMR', note: '', amount: 67.067 },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-neutral-800 text-white text-center font-bold text-xs py-2 tracking-wider">TOKEN</div>
      <div className="grid grid-cols-4 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2 text-center">SL</div>
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2">Note</div>
        <div className="px-3 py-2 text-right">Amount</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 text-center text-neutral-400">{row.sl}</div>
            <div className="px-3 py-1.5 font-medium text-neutral-700">{row.name}</div>
            <div className="px-3 py-1.5 text-neutral-400">{row.note}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DH SECTION ---
const DhBuyTable = () => {
  const data = [
    { name: 'ST', dh: 5662, unit: 30.001, tk: 169865.662, avg: null },
    { name: 'Smk', dh: null, unit: null, tk: 0, avg: null },
    { name: 'Syd', dh: null, unit: null, tk: 0, avg: null },
    { name: 'BJN22', dh: 7509.95, unit: 30, tk: 225298.50, avg: null },
    { name: 'Kis22', dh: 2372, unit: 30, tk: 71160, avg: null },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-green-600 text-white text-center font-bold text-xs py-2 tracking-wider">DH BUY</div>
      <div className="grid grid-cols-5 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">DH</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-neutral-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-green-700">{formatNumber(row.dh)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-500">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-green-700">22,153.383</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">664,607.15</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">30.000</div>
      </div>
    </div>
  );
};

const DhSellTable = () => {
  const data = [
    { name: 'EMR', dh: null, unit: null, tk: 0, avg: null },
    { name: 'Bnk', dh: null, unit: null, tk: 0, avg: null },
    { name: 'Ans22', dh: 10000, unit: 30.0, tk: 300000, avg: null },
    { name: 'CNY', dh: 2000, unit: 34, tk: 68000, avg: null },
    { name: 'Nmn', dh: 579.388, unit: 34.35, tk: 19901.97, avg: null },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden w-full flex flex-col h-full">
      <div className="bg-red-600 text-white text-center font-bold text-xs py-2 tracking-wider">DH SELL</div>
      <div className="grid grid-cols-5 bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2 text-right">DH</div>
        <div className="px-3 py-2 text-right">Unit</div>
        <div className="px-3 py-2 text-right">TK</div>
        <div className="px-3 py-2 text-right">Avg</div>
      </div>
      <div className="flex-1">
        {data.map((row, i) => (
          <div key={i} className="grid grid-cols-5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-xs items-center min-h-[36px]">
            <div className="px-3 py-1.5 font-medium text-neutral-700">{row.name}</div>
            <div className="px-3 py-1.5 text-right font-medium text-red-600">{formatNumber(row.dh)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-600">{formatNumber(row.unit)}</div>
            <div className="px-3 py-1.5 text-right font-semibold text-neutral-800">{formatNumber(row.tk)}</div>
            <div className="px-3 py-1.5 text-right text-neutral-500">{formatNumber(row.avg)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 bg-neutral-50 border-t border-neutral-200 text-xs items-center min-h-[40px]">
        <div className="px-3 py-2 font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-red-600">13,438.821</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">Total</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">413,684.96</div>
        <div className="px-3 py-2 text-right font-bold text-neutral-800">30.783</div>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState('2026-05-01');

  return (
    <div className="space-y-6 text-black">
      {/* Header Area */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">Your business performance at a glance.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-date" className="text-sm font-medium text-neutral-600">Select Date:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-neutral-500" />
            </div>
            <input
              id="dashboard-date"
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-black focus:border-black outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Top 2 Big Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
        {/* Total Account Balance */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm flex justify-between relative overflow-hidden">
          <div className="z-10 relative">
            <h3 className="text-neutral-400 text-sm mb-2">Total Account Balance</h3>
            <p className="text-3xl font-bold text-black flex items-center gap-1">৳ 14,70,464.00</p>
            <p className="text-xs text-neutral-400 mt-2">Includes forward buys and pending credits</p>
          </div>
          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
            <Wallet size={140} strokeWidth={1.5} />
          </div>
        </div>

        {/* Total Gold Stock */}
        <div className="bg-black text-white p-6 rounded-xl shadow-sm flex justify-between relative overflow-hidden">
          <div className="z-10 relative">
            <h3 className="text-neutral-400 text-sm mb-2">Total Gold Stock</h3>
            <p className="text-3xl font-bold flex items-baseline gap-2">577.684 <span className="text-lg font-normal text-neutral-400">Tola</span></p>
            <p className="text-xs text-neutral-400 mt-2">Total Unit: 3,497.684 | Chain Buy: 1,755.144</p>
          </div>
          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Gem size={140} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* 4 Small Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="p-1.5 bg-neutral-100 rounded-lg text-black">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-black text-white rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-xl font-medium text-black">1,248</p>
            <h3 className="text-neutral-400 text-xs mt-0.5">Total Customers</h3>
          </div>
        </div>
        
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="p-1.5 bg-neutral-100 rounded-lg text-black">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-black text-white rounded-full">+8.2%</span>
          </div>
          <div>
            <p className="text-xl font-medium text-black">৳ 36,41,436.86</p>
            <h3 className="text-neutral-400 text-xs mt-0.5">Total Sell (CDT)</h3>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="p-1.5 bg-neutral-100 rounded-lg text-black">
              <TrendingDown size={16} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-neutral-100 text-neutral-500 rounded-full">-2.4%</span>
          </div>
          <div>
            <p className="text-xl font-medium text-black">৳ 10,57,62.75</p>
            <h3 className="text-neutral-400 text-xs mt-0.5">Total Purchase (DBT)</h3>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="p-1.5 bg-neutral-100 rounded-lg text-black">
              <Store size={16} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-black text-white rounded-full">+1</span>
          </div>
          <div>
            <p className="text-xl font-medium text-black">42</p>
            <h3 className="text-neutral-400 text-xs mt-0.5">Total Vendors</h3>
          </div>
        </div>
      </div>

      {/* Main Multi-Table Grid Layout */}
      <div className="space-y-8">
        
        {/* ROW 1: PURCHASES */}
        <div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Purchases</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6 items-start">
            <BuyTable />
            <ChainBuyTable />
            <FwdBuyTable />
          </div>
        </div>

        {/* ROW 2: SALES */}
        <div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Sales & Tokens</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6 items-start">
            <SellTable />
            <ChainSellTable />
            <div className="space-y-4 xl:space-y-6">
               <TokenTable />
            </div>
          </div>
        </div>

        {/* ROW 3: DH TRANSACTIONS */}
        <div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">DH Transactions</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6 items-start">
            <DhBuyTable />
            <DhSellTable />
          </div>
        </div>
        
      </div>
    </div>
  );
}
