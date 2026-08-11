'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Search, Plus, Loader2, Users, Save, X, Phone, User, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

function normalizeBdMobileInput(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("880")) return d.slice(-11);
  if (d.length >= 11 && d.startsWith("0")) return d.slice(0, 11);
  if (d.length >= 11) return d.slice(-11);
  return d;
}

const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={className}>{children}</div>;

function ClientsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [customersData, setCustomersData] = useState([]);
  const [vendorsData, setVendorsData] = useState([]);

  // Add Client Modal State
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', email: '', mobile_number: '', address: ''
  });
  const [savingClient, setSavingClient] = useState(false);

  const fetchClients = useCallback(async (searchQuery = "") => {
    if (!token) return;
    setLoading(true);
    try {
      let custRes, vendRes;
      if (searchQuery.trim()) {
        [custRes, vendRes] = await Promise.all([
          axios.post(`${API_URL}/search-customer?page=1&limit=500`, { keyword: searchQuery }, { headers: { Authorization: `Bearer ${token}` } }),
          axios.post(`${API_URL}/search-vendor?page=1&limit=500`, { keyword: searchQuery }, { headers: { Authorization: `Bearer ${token}` } })
        ]);
      } else {
        [custRes, vendRes] = await Promise.all([
          axios.get(`${API_URL}/customer-lists?page=1&limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/vendor-lists?page=1&limit=500`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
      }
      
      setCustomersData(custRes.data?.data?.data || []);
      setVendorsData(vendRes.data?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch clients", err);
      toast.error("Failed to fetch client list.");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients(keyword);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [keyword, fetchClients]);

  const unifiedClients = useMemo(() => {
    const map = new Map();

    const processEntity = (entity, type) => {
      const name = (entity.name || "").trim();
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { 
            name: name,
            mobile_number: entity.mobile_number || entity.phone || "",
            email: entity.email || "",
            address: entity.address || "",
            types: [type],
            customer_id: type === 'Customer' ? entity.id : null,
            vendor_id: type === 'Vendor' ? entity.id : null,
            sell_due: type === 'Customer' ? Number(entity.total_due_amount || 0) : 0,
            purchase_due: type === 'Vendor' ? Number(entity.total_due_amount || 0) : 0,
        });
      } else {
        const existing = map.get(key);
        if (!existing.types.includes(type)) {
            existing.types.push(type);
        }
        if (type === 'Customer') {
            existing.customer_id = entity.id;
            existing.sell_due = Number(entity.total_due_amount || 0);
        }
        if (type === 'Vendor') {
            existing.vendor_id = entity.id;
            existing.purchase_due = Number(entity.total_due_amount || 0);
        }
      }
    };

    if (Array.isArray(customersData)) customersData.forEach(c => processEntity(c, 'Customer'));
    if (Array.isArray(vendorsData)) vendorsData.forEach(v => processEntity(v, 'Vendor'));

    let combined = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    if (filter === 'sell-due') {
        combined = combined.filter(c => c.sell_due > 0);
    } else if (filter === 'purchase-due') {
        combined = combined.filter(c => c.purchase_due > 0);
    }
    
    return combined;
  }, [customersData, vendorsData, filter]);

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    if (!newClient.name || !newClient.mobile_number) {
        return toast.error("Name and Mobile Number are required");
    }

    setSavingClient(true);
    
    try {
        const customerPayload = {
            name: newClient.name,
            email: newClient.email,
            mobile_number: newClient.mobile_number,
            address: newClient.address,
            is_member: 0
        };

        const vendorFormData = new FormData();
        vendorFormData.append('name', newClient.name);
        vendorFormData.append('email', newClient.email);
        vendorFormData.append('mobile_number', newClient.mobile_number);
        vendorFormData.append('address', newClient.address);

        const nameDH = `${newClient.name} (DH)`;
        const nameBD = `${newClient.name} (BD)`;
        const iconLetter = newClient.name.charAt(0).toUpperCase();

        const payloadDH = new FormData();
        payloadDH.append('type_name', nameDH);
        payloadDH.append('icon_letter', iconLetter);

        const payloadBD = new FormData();
        payloadBD.append('type_name', nameBD);
        payloadBD.append('icon_letter', iconLetter);

        const [,, resDH, resBD] = await Promise.all([
            axios.post(`${API_URL}/save-customer`, customerPayload, { headers: { Authorization: `Bearer ${token}` } }),
            axios.post(`${API_URL}/save-vendor`, vendorFormData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }),
            axios.post(`${API_URL}/payment-type-save`, payloadDH, { headers: { Authorization: `Bearer ${token}` } }),
            axios.post(`${API_URL}/payment-type-save`, payloadBD, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if ((resDH.data?.success || resDH.status === 200) && (resBD.data?.success || resBD.status === 200)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const listRes = await axios.get(`${API_URL}/payment-type-list?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const allMethods = Array.isArray(listRes.data?.data?.data) ? listRes.data.data.data 
                             : Array.isArray(listRes.data?.data) ? listRes.data.data 
                             : Array.isArray(listRes.data) ? listRes.data : [];
            
            const savedDH = allMethods.find(m => m.type_name === nameDH);
            const savedBD = allMethods.find(m => m.type_name === nameBD);

            const followUpPromises = [];

            if (savedDH?.id) {
                followUpPromises.push(
                    axios.post(`${API_URL}/payment-type-category-save`, {
                        payment_category_name: nameDH,
                        account_number: '1',
                        branch_name: '',
                        payment_type_id: savedDH.id
                    }, { headers: { Authorization: `Bearer ${token}` } })
                );
            }

            if (savedBD?.id) {
                followUpPromises.push(
                    axios.post(`${API_URL}/payment-type-category-save`, {
                        payment_category_name: nameBD,
                        account_number: '1',
                        branch_name: '',
                        payment_type_id: savedBD.id
                    }, { headers: { Authorization: `Bearer ${token}` } })
                );
            }

            followUpPromises.push(
                axios.post(`${API_URL}/save-expense-type`, {
                    expense_name: nameDH,
                    transaction_category: 'Quick Payment',
                    expense_description: '',
                    transaction_type_id: 0
                }, { headers: { Authorization: `Bearer ${token}` } }),
                axios.post(`${API_URL}/save-expense-type`, {
                    expense_name: nameBD,
                    transaction_category: 'Quick Payment',
                    expense_description: '',
                    transaction_type_id: 0
                }, { headers: { Authorization: `Bearer ${token}` } })
            );

            if (followUpPromises.length > 0) {
                await Promise.all(followUpPromises);
            }
        }

        toast.success("Client, Payment Methods, Accounts, and Categories all created successfully!");
        setShowAddClient(false);
        setNewClient({ name: '', email: '', mobile_number: '', address: '' });
        fetchClients(keyword); 
    } catch (err) {
        toast.error("Failed to save client");
        console.error(err);
    } finally {
        setSavingClient(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto text-black pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {filter === 'sell-due' ? 'Clients with Sell Due' : filter === 'purchase-due' ? 'Clients with Purchase Due' : 'Clients'}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {filter === 'sell-due' ? 'Showing clients who currently owe you money.' : filter === 'purchase-due' ? 'Showing clients whom you currently owe money.' : 'Unified view of all Customers and Vendors.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Name, Phone..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>
        </div>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm">Loading clients...</p>
            </div>
          ) : unifiedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No clients found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Address</th>
                    <th className="px-6 py-4 font-medium text-right text-rose-600">Sell Due</th>
                    <th className="px-6 py-4 font-medium text-right text-emerald-600">Purchase Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {unifiedClients.map((client, idx) => {
                    const searchParams = new URLSearchParams();
                    if (client.customer_id) searchParams.append('customerId', client.customer_id);
                    if (client.vendor_id) searchParams.append('vendorId', client.vendor_id);
                    const href = `/dashboard/clients/${encodeURIComponent(client.name)}?${searchParams.toString()}`;

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => router.push(href)}
                        className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 font-medium text-neutral-900 group-hover:text-black">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 text-neutral-700">
                          {client.mobile_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-neutral-500">
                          {client.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 max-w-[200px] truncate">
                          {client.address || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                          {client.sell_due > 0 ? client.sell_due.toLocaleString('en-US') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          {client.purchase_due > 0 ? client.purchase_due.toLocaleString('en-US') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingClient && setShowAddClient(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Add New Client</h3>
                <p className="text-xs text-neutral-500 mt-1">This will create both a Customer and a Vendor profile.</p>
              </div>
              <button 
                onClick={() => setShowAddClient(false)}
                disabled={savingClient}
                className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClient} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      required
                      autoFocus
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      required
                      placeholder="e.g. 01XXXXXXXXX"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                      value={newClient.mobile_number}
                      onChange={(e) => setNewClient({...newClient, mobile_number: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="client@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-neutral-400" />
                    <textarea
                      rows={3}
                      placeholder="Enter client's address"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                      value={newClient.address}
                      onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 flex gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  disabled={savingClient}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="flex-[2] flex items-center justify-center gap-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-70"
                >
                  {savingClient ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {savingClient ? 'Saving Client...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-neutral-400" /></div>}>
      <ClientsContent />
    </Suspense>
  );
}
