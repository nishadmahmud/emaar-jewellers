'use client';

import { useState, useEffect } from 'react';
import { PackagePlus, Loader2, Save, Tag, Hash, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AddProductPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    serial: '',
    purchase_price: '',
    retails_price: ''
  });
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryData, setCategoryData] = useState({ name: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/category?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data?.data?.data) {
          setCategories(res.data.data.data);
        } else if (res.data?.data) {
          setCategories(res.data.data); // fallback if no pagination wrapper
        }
      })
      .catch(err => console.error("Failed to fetch categories", err));
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    
    setLoading(true);
    
    const payload = {
      ...formData,
      product_type: 'standard',
      is_ecommerce: 1,
      minimum_stock: 1,
      have_variant: 0,
      have_product_variant: 0,
      is_specification: 0,
      is_variable_weight: 0,
      stock_restrictions: true,
      quantity: 1,
      barcode: formData.serial,
    };

    axios.post(`${API_URL}/save-product`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      toast.success("Product added successfully!");
      setFormData({
        name: '',
        category_id: '',
        serial: '',
        purchase_price: '',
        retails_price: ''
      });
      router.push('/dashboard/product-list');
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to add product");
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!token) return;
    
    setSavingCategory(true);
    const fd = new FormData();
    fd.append('name', categoryData.name);
    fd.append('description', categoryData.description);
    fd.append('is_featured', 0);
    fd.append('status', 1);

    axios.post(`${API_URL}/save-category`, fd, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      toast.success("Category added successfully!");
      setShowCategoryModal(false);
      setCategoryData({ name: '', description: '' });
      // Refresh categories list
      return axios.get(`${API_URL}/category?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    })
    .then(res => {
      if (res?.data?.data?.data) {
        setCategories(res.data.data.data);
      } else if (res?.data?.data) {
        setCategories(res.data.data);
      }
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to add category");
    })
    .finally(() => setSavingCategory(false));
  };

  return (
    <>
    <div className="max-w-4xl mx-auto text-black">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Add New Product</h2>
          <p className="text-sm text-neutral-500 mt-1">Create a new item in your inventory catalog.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
          <PackagePlus size={18} className="text-neutral-700" />
          <h3 className="font-medium text-neutral-800">Product Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Product Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag size={14} className="text-neutral-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="e.g. 22K Gold Bangle"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</label>
                <button type="button" onClick={() => setShowCategoryModal(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                  + Add New
                </button>
              </div>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Serial / SKU</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash size={14} className="text-neutral-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.serial}
                  onChange={(e) => setFormData({...formData, serial: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="e.g. BNG-22K-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Purchase Price</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={14} className="text-neutral-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Retail Price</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={14} className="text-neutral-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.retails_price}
                  onChange={(e) => setFormData({...formData, retails_price: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

          </div>
          
          <div className="pt-6 border-t border-neutral-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
      
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-neutral-800 mb-4 tracking-wide">Add New Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={categoryData.name}
                  onChange={e => setCategoryData({...categoryData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. Bangles"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description (Optional)</label>
                <textarea
                  value={categoryData.description}
                  onChange={e => setCategoryData({...categoryData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  rows={3}
                  placeholder="Brief category description..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 flex items-center"
                >
                  {savingCategory ? <Loader2 size={16} className="animate-spin mr-2" /> : null} 
                  {savingCategory ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
