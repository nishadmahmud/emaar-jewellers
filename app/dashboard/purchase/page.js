'use client';

import { useState } from 'react';
import { ArrowDownToLine, Loader2, Store, Scale, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchasePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: 'SKNDR (Dubai)',
    invoiceRef: 'INV-DB-908',
    itemType: 'Gold Bar (99.99%)',
    grossWeight: '50',
    netWeight: '50',
    ratePerVori: '124500',
    refiningCharge: '0',
    currency: 'TK'
  });

  // Calculate totals
  const netWeightNum = parseFloat(formData.netWeight) || 0;
  const rateNum = parseFloat(formData.ratePerVori) || 0;
  const goldValue = netWeightNum * rateNum;
  const refiningTotal = parseFloat(formData.refiningCharge) || 0;
  const grandTotal = goldValue - refiningTotal;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success(`Successfully recorded purchase of ${formData.netWeight} Vori from ${formData.vendorName}!`);
      setFormData({
        ...formData,
        invoiceRef: `INV-DB-${Math.floor(Math.random() * 1000)}`,
        grossWeight: '',
        netWeight: ''
      });
    }, 1000);
  };

  const getCurrencySymbol = () => {
    switch(formData.currency) {
      case 'USD': return '$';
      case 'AED': return 'د.إ';
      default: return '৳';
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-black">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Inbound Purchase</h2>
          <p className="text-sm text-neutral-500 mt-1">Record incoming stock from suppliers and vendors.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-neutral-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
          <Download size={16} /> Import Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Vendor Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <Store size={18} />
                <h3 className="font-medium">Vendor Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Vendor Name</label>
                  <select
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                  >
                    <option>SKNDR (Dubai)</option>
                    <option>ABT.ic</option>
                    <option>BNK22</option>
                    <option>Local Scrap Dealer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Vendor Invoice Ref</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceRef}
                    onChange={(e) => setFormData({...formData, invoiceRef: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Stock Details */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <Scale size={18} />
                <h3 className="font-medium">Stock Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Stock Category</label>
                  <div className="flex gap-2">
                    {['Gold Bar (99.99%)', 'Scrap Gold', 'Ready Ornaments', 'Chain Buy'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, itemType: type})}
                        className={`flex-1 py-2 text-xs font-medium border rounded-lg transition-colors ${formData.itemType === type ? 'border-black bg-black text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Gross Weight (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.grossWeight}
                    onChange={(e) => setFormData({...formData, grossWeight: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Net Pure Weight (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.netWeight}
                    onChange={(e) => setFormData({...formData, netWeight: e.target.value})}
                    className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Rate Per Vori</label>
                  <input
                    type="number"
                    required
                    value={formData.ratePerVori}
                    onChange={(e) => setFormData({...formData, ratePerVori: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Settlement Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <FileText size={18} />
                <h3 className="font-medium">Settlement Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Net Pure Weight</span>
                <span className="font-medium text-emerald-600">{netWeightNum.toFixed(3)} Vori</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Gross Weight</span>
                <span className="font-medium text-neutral-600">{parseFloat(formData.grossWeight || 0).toFixed(3)} Vori</span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-neutral-100">
                <span className="text-neutral-500">Gross Gold Value</span>
                <span className="font-medium">{getCurrencySymbol()}{goldValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Refining / Other Charges (-)</label>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3 py-2 rounded-l-lg text-neutral-500 text-sm">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={formData.refiningCharge}
                    onChange={(e) => setFormData({...formData, refiningCharge: e.target.value})}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-r-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm text-red-600"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Net Payable</span>
                  <span className="text-3xl font-light tracking-tight text-black">{getCurrencySymbol()}{Math.max(0, grandTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="text-right text-xs text-neutral-400 mt-1">Will be credited to vendor account (CDT)</div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100">
              <div className="flex gap-2 mb-4">
                {['TK', 'USD', 'AED'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFormData({...formData, currency: curr})}
                    className={`flex-1 py-1.5 text-xs font-medium border rounded-md transition-colors ${formData.currency === curr ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                form="purchase-form"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowDownToLine className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Add to Inventory"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
