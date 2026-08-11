'use client';

import React, { useState } from 'react';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CreatePaymentModal({ isOpen, onClose, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [formData, setFormData] = useState({
    type_name: '',
    icon_letter: '',
    icon_image: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type_name.trim()) {
      toast.error('Payment method name is required.');
      return;
    }
    
    setLoading(true);
    let uploadedImagePath = '';

    try {
      if (imageFile) {
        const fileData = new FormData();
        fileData.append('file_name', imageFile);
        const uploadRes = await axios.post(`${API_URL}/file-upload`, fileData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (uploadRes.data?.path) {
          uploadedImagePath = uploadRes.data.path;
        }
      }

      const nameDH = `${formData.type_name.trim()} (DH)`;
      const payloadDH = {
        ...formData,
        type_name: nameDH,
        ...(uploadedImagePath && { icon_image: uploadedImagePath }),
      };

      const nameBD = `${formData.type_name.trim()} (BD)`;
      const payloadBD = {
        ...formData,
        type_name: nameBD,
        ...(uploadedImagePath && { icon_image: uploadedImagePath }),
      };

      const [resDH, resBD] = await Promise.all([
        axios.post(`${API_URL}/payment-type-save`, payloadDH, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.post(`${API_URL}/payment-type-save`, payloadBD, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if ((resDH.data?.success || resDH.status === 200) && (resBD.data?.success || resBD.status === 200)) {
        // We have to wait a bit so that payment methods are created first before we can grab them
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch the full list to get the actual IDs of the newly created methods
        const listRes = await axios.get(`${API_URL}/payment-type-list?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allMethods = Array.isArray(listRes.data?.data?.data) ? listRes.data.data.data 
                         : Array.isArray(listRes.data?.data) ? listRes.data.data 
                         : Array.isArray(listRes.data) ? listRes.data : [];
        
        // Find the newly created methods by name
        const savedDH = allMethods.find(m => m.type_name === nameDH);
        const savedBD = allMethods.find(m => m.type_name === nameBD);

        const accountPromises = [];
        if (savedDH?.id) {
          accountPromises.push(
            axios.post(`${API_URL}/payment-type-category-save`, {
              payment_category_name: nameDH,
              account_number: '1',
              branch_name: '',
              payment_type_id: savedDH.id
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
        }
        if (savedBD?.id) {
          accountPromises.push(
            axios.post(`${API_URL}/payment-type-category-save`, {
              payment_category_name: nameBD,
              account_number: '1',
              branch_name: '',
              payment_type_id: savedBD.id
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
        }

        // Also create the two Quick Payment Categories
        accountPromises.push(
          axios.post(`${API_URL}/save-expense-type`, {
            expense_name: nameDH,
            transaction_category: 'Quick Payment',
            expense_description: '',
            transaction_type_id: 0
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        accountPromises.push(
          axios.post(`${API_URL}/save-expense-type`, {
            expense_name: nameBD,
            transaction_category: 'Quick Payment',
            expense_description: '',
            transaction_type_id: 0
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        if (accountPromises.length > 0) {
          await Promise.all(accountPromises);
        }

        toast.success('Payment methods, accounts, and quick payment categories created successfully!');
        setFormData({ type_name: '', icon_letter: '', icon_image: '' });
        setImageFile(null);
        setPreview('');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Failed to create one or both payment methods.');
      }
    } catch (err) {
      console.error('Create payment error:', err);
      toast.error(err.response?.data?.message || 'Error creating payment method.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
          <h2 className="text-lg font-bold text-neutral-800">Add Payment Method</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Payment Method Image
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="create-image-upload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("create-image-upload").click()}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload size={16} />
                    Upload Image
                  </button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Method Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.type_name}
                onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                placeholder="e.g., Bkash, DBBL"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                required
              />
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Method Code <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.icon_letter}
                  onChange={(e) => setFormData({ ...formData, icon_letter: e.target.value })}
                  placeholder="B"
                  maxLength={3}
                  className="w-20 text-center font-mono px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  required
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 font-medium">Preview:</span>
                  <div className="w-9 h-9 bg-[#58C17E] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {formData.icon_letter || "?"}
                  </div>
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex items-center justify-end gap-2 shrink-0 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Payment Method'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
