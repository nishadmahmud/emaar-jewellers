'use client';

import React, { useEffect, useState } from 'react';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={className}>{children}</div>;
import { Search, Loader2, Users, Plus, Store, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    const fetchVendors = async () => {
      try {
        setLoading(true);
        // The API returns vendors based on keyword. If empty, it returns the list.
        const res = await axios.post(
          `${API_URL}/search-vendor?page=1&limit=50`,
          {
            keyword: search,
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data?.success && res.data?.data?.data) {
          setVendors(res.data.data.data);
        } else {
          setVendors([]);
        }
      } catch (err) {
        toast.error('Failed to load vendors');
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchVendors();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, session?.accessToken]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-black">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Vendors</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your suppliers and vendors.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
            />
          </div>
          
          <Link
            href="/dashboard/vendors/add"
            className="flex shrink-0 items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Add Vendor
          </Link>
        </div>
      </div>

      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardContent>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p>No vendors found.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile View: Responsive Card List (No horizontal scroll) */}
              <div className="block sm:hidden divide-y divide-neutral-100">
                {vendors.map((vendor) => (
                  <Link key={vendor.id} href={`/dashboard/vendors/${vendor.id}?interval=daily`} className="block group">
                    <div className="px-3 py-3 flex items-center justify-between group-hover:bg-neutral-50/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 shrink-0 flex items-center justify-center text-xs font-bold">
                          <Store size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-neutral-900 group-hover:text-amber-600 transition-colors truncate">{vendor.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{vendor.mobile_number || 'No Phone'}</p>
                          {vendor.email && <p className="text-[10px] text-neutral-400 truncate">{vendor.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {vendor.address && (
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium truncate max-w-[100px] inline-block">
                            {vendor.address}
                          </span>
                        )}
                        <span className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded group-hover:bg-blue-100 transition-colors">
                          <Eye size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Address</th>
                      <th className="px-6 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-neutral-50/80 transition-colors cursor-pointer group" onClick={() => window.location.href = `/dashboard/vendors/${vendor.id}?interval=daily`}>
                        <td className="px-6 py-4 font-medium text-neutral-900 group-hover:text-amber-600 transition-colors">
                          {vendor.name}
                        </td>
                        <td className="px-6 py-4 text-neutral-500">
                          {vendor.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-neutral-700">
                          {vendor.mobile_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-neutral-500">
                          {vendor.address || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/dashboard/vendors/${vendor.id}?interval=daily`}>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                              <Eye size={14} /> View
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
