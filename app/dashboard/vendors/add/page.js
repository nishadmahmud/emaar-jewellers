'use client';

import React, { useState } from 'react';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>;
import { ArrowLeft, Loader2, Save, UserPlus, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function AddVendorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_number: '',
    address: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = session?.accessToken;
    if (!token) return toast.error('You are not authenticated');

    if (!formData.name || !formData.mobile_number) {
      return toast.error('Name and Mobile Number are required');
    }

    try {
      setLoading(true);
      // Constructing FormData as the original app uses FormData for save-vendor
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });

      const res = await axios.post(`${API_URL}/save-vendor`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Vendor added successfully');
        router.push('/dashboard/vendors');
      } else {
        toast.error(res.data?.message || 'Failed to add vendor');
      }
    } catch (error) {
      toast.error('An error occurred while adding the vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/vendors"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 hover:text-black"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Add New Vendor</h1>
          <p className="text-sm text-neutral-500 mt-1">Register a new vendor in the system.</p>
        </div>
      </div>

      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter vendor name"
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="e.g. 01XXXXXXXXX"
                  className="block w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vendor@example.com"
                  className="block w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Set password for vendor portal"
                    className="block w-full pr-10 pl-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-neutral-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter vendor's full address"
                  rows={3}
                  className="block w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow resize-none"
                />
              </div>

            </div>

            <div className="pt-6 border-t border-neutral-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Vendor
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
