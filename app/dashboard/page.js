'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Gem, Wallet, Store, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import useSWR from 'swr';

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
    { name: '-', gram: null, tola: null, unit: 0, tk: null, avg: null },
    { name: '-', gram: null, tola: null, unit: 0, tk: null, avg: null },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">BUY</h3>
          <p className="text-sm text-neutral-500">Latest buy transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Gram</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Tola</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.gram)}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.tola)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk, 2)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">2,920</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900"></td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900"></td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">659,505.36</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">225.858</td>
            </tr>
          </tfoot>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">CHAIN BUY</h3>
          <p className="text-sm text-neutral-500">Latest chain buy transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Tola</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.tola)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk, 2)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">1,755.144</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900"></td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">346,735.28</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">197.554</td>
            </tr>
          </tfoot>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">FWD BUY</h3>
          <p className="text-sm text-neutral-500">Latest forward buy transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Rate</th>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Tola</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.rate, 1)}</td>
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.tola)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk, 0)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 border-b border-neutral-100"></td>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">12,450</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">1,470,464.00</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">3,330.961</td>
            </tr>
          </tfoot>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">SELL</h3>
          <p className="text-sm text-neutral-500">Latest sell transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Tola</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.tola)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk, 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">150</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">29,345.455</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">195.636</td>
            </tr>
          </tfoot>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">CHAIN SELL</h3>
          <p className="text-sm text-neutral-500">Latest chain sell transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Tola</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.tola)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk, 2)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">1,177.46</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900"></td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">230,703.14</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">195.933</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const TokenTable = () => {
  const data = [
    { sl: 1, name: 'EMR', note: '-', amount: 65.056 },
    { sl: 2, name: 'Bkb', note: '-', amount: null },
    { sl: 3, name: 'EMR', note: '-', amount: 64.21 },
    { sl: 4, name: 'EMR', note: '-', amount: 65.157 },
    { sl: 5, name: 'EMR', note: '-', amount: 67.067 },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">TOKEN</h3>
          <p className="text-sm text-neutral-500">Latest token distributions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 text-center font-bold">SL</th>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Note</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 text-center text-neutral-500">{row.sl}</td>
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-neutral-500">{row.note}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">DH BUY</h3>
          <p className="text-sm text-neutral-500">Latest DH buy transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">DH</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.dh)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">22,153.383</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">664,607.15</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">30.000</td>
            </tr>
          </tfoot>
        </table>
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">DH SELL</h3>
          <p className="text-sm text-neutral-500">Latest DH sell transactions</p>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold">
            <tr>
              <th className="py-4 px-6 border-b border-neutral-100 font-bold">Name</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">DH</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Unit</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">TK</th>
              <th className="py-4 px-6 border-b border-neutral-100 text-right font-bold">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-neutral-900">{row.name}</td>
                <td className="py-4 px-6 text-right font-medium text-neutral-700">{formatNumber(row.dh)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.unit)}</td>
                <td className="py-4 px-6 text-right font-bold text-neutral-900">{formatNumber(row.tk)}</td>
                <td className="py-4 px-6 text-right text-neutral-500">{formatNumber(row.avg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50/50">
            <tr>
              <td className="py-4 px-6 font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">13,438.821</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">Total</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">413,684.96</td>
              <td className="py-4 px-6 text-right font-bold text-neutral-900">30.783</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(res => res.data);

  const { data: dashboardData, isLoading: loading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API}/web-dashboard?interval=daily` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

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

      {loading ? (
        <div className="w-full flex items-center justify-center h-32 border border-neutral-200 rounded-xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
          {/* Card 1: Total Account Balance */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Account Balance</h3>
              <div>
                <p className="text-2xl font-bold text-black flex items-center gap-1">৳ {formatNumber(dashboardData?.balance || 0, 2)}</p>
                {dashboardData?.balance_percentage && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{dashboardData.balance_percentage} {dashboardData.balance_report}</p>
                )}
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <Wallet size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 2: Total Stock Value */}
          <div className="bg-black border border-black p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Stock Value</h3>
              <div>
                <p className="text-2xl font-bold text-white flex items-center gap-1">৳ {formatNumber(dashboardData?.total_accessories_stock_value || 0, 2)}</p>
                <p className="text-xs text-neutral-400 mt-1 font-medium">From Accessories Stock</p>
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
              <Gem size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 3: Total Sell */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Sell (CDT)</h3>
              <div>
                <p className="text-2xl font-bold text-black flex items-center gap-1">৳ {formatNumber(dashboardData?.sales || 0, 2)}</p>
                {dashboardData?.sales_change && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{dashboardData.sales_change} {dashboardData.sales_report}</p>
                )}
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <TrendingUp size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 4: Total Purchase */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Purchase (DBT)</h3>
              <div>
                <p className="text-2xl font-bold text-black flex items-center gap-1">৳ {formatNumber(dashboardData?.purchase || 0, 2)}</p>
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <TrendingDown size={110} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      )}

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
