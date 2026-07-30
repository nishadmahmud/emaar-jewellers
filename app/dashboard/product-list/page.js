'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';

export default function ProductListPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      setLoading(true);
      // Fetch default products
      axios.get(`${API_URL}/product?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setProducts(res.data?.data?.data || []);
      })
      .catch(err => console.error("Failed to fetch products", err))
      .finally(() => setLoading(false));
    }
  }, [token, API_URL]);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto text-black">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Products</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage your inventory and catalog items.</p>
        </div>
        <Link 
          href="/dashboard/add-product" 
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="relative w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-neutral-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
              placeholder="Search products by name or SKU..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">SKU</th>
                <th className="py-4 px-6 text-right">Purchase Price</th>
                <th className="py-4 px-6 text-right">Retail Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                           <Package size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">{product.name}</p>
                          <p className="text-xs text-neutral-500">{product.category_id ? `Category ID: ${product.category_id}` : 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-neutral-600 font-mono">
                      {product.sku || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-neutral-900 text-right">
                      {product.purchase_price ? `AED ${parseFloat(product.purchase_price).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-neutral-900 text-right">
                       {product.retails_price || product.sell_price ? `AED ${parseFloat(product.retails_price || product.sell_price).toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-500">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-3">
                      <Package size={24} className="text-neutral-400" />
                    </div>
                    <p>No products found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
