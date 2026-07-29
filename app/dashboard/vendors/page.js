'use client';

import React, { useEffect, useState } from 'react';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>;
import { Search, Loader2, Users, Plus } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-6">
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
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                      </div>
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Users className="h-10 w-10 mb-2 opacity-50" />
                        <p>No vendors found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
