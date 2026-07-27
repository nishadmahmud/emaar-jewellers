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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">BUY</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Gram</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Tola</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-neutral-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600 border border-neutral-200">{formatNumber(row.gram)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600 border border-neutral-200">{formatNumber(row.tola)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk, 2)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-500 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">2920</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200"></td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200"></td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">659,505.36</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-orange-600 border border-neutral-200">225.858</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">CHAIN BUY</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Tola</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-neutral-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600 border border-neutral-200">{formatNumber(row.tola)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk, 2)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-500 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-orange-600 border border-neutral-200">1,755.144</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200"></td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">346,735.28</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">197.554</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">FWD BUY</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200 text-right">Rate</th>
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Tola</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 text-right font-mono font-medium text-neutral-700 border border-neutral-200">{formatNumber(row.rate, 1)}</td>
              <td className="px-3 py-1.5 font-medium text-blue-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium text-pink-600 border border-neutral-200">{formatNumber(row.tola)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-red-500 font-medium border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-blue-700 border border-neutral-200">{formatNumber(row.tk, 0)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 border border-neutral-200"></td>
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-pink-600 border border-neutral-200">12,450</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 border border-neutral-200">1,470,464.00</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">3,330.961</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">SELL</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Tola</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-red-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium text-orange-600 border border-neutral-200">{formatNumber(row.tola)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk, 2)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-orange-600 border border-neutral-200">150</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">29,345.455</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">195.636</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">CHAIN SELL</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Tola</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-red-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium text-orange-600 border border-neutral-200">{formatNumber(row.tola)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk, 2)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-500 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-orange-600 border border-neutral-200">1,177.46</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200"></td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">230,703.14</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">195.933</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">TOKEN</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200 text-center">SL</th>
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200">Note</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 text-center font-mono text-neutral-400 border border-neutral-200">{row.sl}</td>
              <td className="px-3 py-1.5 font-medium text-neutral-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-neutral-400 border border-neutral-200">{row.note}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.amount)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">DH BUY</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">DH</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-neutral-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium text-green-700 border border-neutral-200">{formatNumber(row.dh)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-500 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-green-700 border border-neutral-200">22,153.383</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">664,607.15</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">30.000</td>
          </tr>
        </tfoot>
      </table>
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto w-full flex flex-col h-full">
      <div className="bg-neutral-50 text-neutral-800 text-center font-bold text-xs py-2 tracking-wider border-b border-neutral-200">DH SELL</div>
      <table className="w-full h-full text-left border-collapse text-xs flex-1">
        <thead>
          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider h-[1px]">
            <th className="px-3 py-2 border border-neutral-200">Name</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">DH</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Unit</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">TK</th>
            <th className="px-3 py-2 border border-neutral-200 text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/80 transition-colors h-[1px]">
              <td className="px-3 py-1.5 font-medium text-neutral-700 border border-neutral-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium text-red-600 border border-neutral-200">{formatNumber(row.dh)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-600 border border-neutral-200">{formatNumber(row.unit)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-neutral-800 border border-neutral-200">{formatNumber(row.tk)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-neutral-500 border border-neutral-200">{formatNumber(row.avg)}</td>
            </tr>
          ))}
          <tr className="h-full">
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
            <td className="border border-neutral-200"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 border-t-2 border-neutral-300 h-[1px]">
            <td className="px-3 py-2 font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-red-600 border border-neutral-200">13,438.821</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">Total</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">413,684.96</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-neutral-800 border border-neutral-200">30.783</td>
          </tr>
        </tfoot>
      </table>
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
