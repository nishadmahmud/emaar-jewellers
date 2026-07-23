'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, UserPlus, Scale, Receipt, Search, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    itemType: 'Ring',
    purity: '22K',
    goldVori: '1',
    ratePerVori: '115000',
    makingCharge: '2500',
    discount: '0',
    paymentMethod: 'Cash',
    currency: 'TK'
  });

  // Calculate totals
  const goldValue = (parseFloat(formData.goldVori) || 0) * (parseFloat(formData.ratePerVori) || 0);
  const makingChargeTotal = parseFloat(formData.makingCharge) || 0;
  const subtotal = goldValue + makingChargeTotal;
  const vat = subtotal * 0.05; // 5% VAT
  const discountAmount = parseFloat(formData.discount) || 0;
  const grandTotal = subtotal + vat - discountAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success(`Invoice #INV-${Math.floor(Math.random() * 10000)} generated for ${formData.customerName || 'Walk-in Customer'}!`);
      setFormData({
        ...formData,
        customerName: '',
        phone: '',
        goldVori: '1',
        discount: '0'
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
          <h2 className="text-2xl font-medium tracking-wide">Point of Sale</h2>
          <p className="text-sm text-neutral-500 mt-1">Create a new customer invoice and record sale.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-neutral-200 p-2 rounded-lg shadow-sm">
          <div className="text-xs text-neutral-500 font-medium px-2 uppercase tracking-wider">Live Rate:</div>
          <div className="text-sm font-medium bg-neutral-100 px-3 py-1 rounded">22K: ৳115,000 / Vori</div>
          <div className="text-sm font-medium bg-neutral-100 px-3 py-1 rounded">24K: ৳125,000 / Vori</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <UserPlus size={18} />
                <h3 className="font-medium">Customer Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                      placeholder="Search or enter new..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                    placeholder="Walk-in Customer"
                  />
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <Scale size={18} />
                <h3 className="font-medium">Item & Weight</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Item Type</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => setFormData({...formData, itemType: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  >
                    <option>Ring</option>
                    <option>Necklace</option>
                    <option>Bangle</option>
                    <option>Chain</option>
                    <option>Gold Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Purity</label>
                  <select
                    value={formData.purity}
                    onChange={(e) => setFormData({...formData, purity: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  >
                    <option>22K</option>
                    <option>21K</option>
                    <option>18K</option>
                    <option>24K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Weight (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.goldVori}
                    onChange={(e) => setFormData({...formData, goldVori: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Rate per Vori</label>
                  <input
                    type="number"
                    required
                    value={formData.ratePerVori}
                    onChange={(e) => setFormData({...formData, ratePerVori: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Making Charge</label>
                  <input
                    type="number"
                    value={formData.makingCharge}
                    onChange={(e) => setFormData({...formData, makingCharge: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Invoice Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <Receipt size={18} />
                <h3 className="font-medium">Invoice Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Gold Value ({formData.goldVori || 0} Vori)</span>
                <span className="font-medium">{getCurrencySymbol()}{goldValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Making Charge</span>
                <span className="font-medium">{getCurrencySymbol()}{makingChargeTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">VAT (5%)</span>
                <span className="font-medium">{getCurrencySymbol()}{vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Subtotal</span>
                <span className="font-medium">{getCurrencySymbol()}{(subtotal + vat).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Additional Discount</label>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3 py-2 rounded-l-lg text-neutral-500 text-sm">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-r-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Grand Total</span>
                  <span className="text-3xl font-light tracking-tight">{getCurrencySymbol()}{Math.max(0, grandTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'Cash'})}
                  className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-sm transition-colors ${formData.paymentMethod === 'Cash' ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                >
                  <Banknote size={16} /> Cash
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'Card'})}
                  className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-sm transition-colors ${formData.paymentMethod === 'Card' ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                >
                  <CreditCard size={16} /> Card
                </button>
              </div>

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
                form="sell-form"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
