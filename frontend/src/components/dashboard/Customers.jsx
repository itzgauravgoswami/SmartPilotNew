import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  ArrowLeft, Search, Plus, Trash2, Edit, Check, Sparkles, 
  TrendingUp, DollarSign, Calendar, Users, Briefcase, Mail, 
  Activity, Eye, AlertCircle, X, ChevronDown, RefreshCw
} from 'lucide-react';

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'Priya Sharma', business: 'Sharma Consultancy Services', address: 'Sector 45, Gurgaon, Haryana - 122003', email: 'priya@sharmaconsultancy.in', segment: 'Active Client' },
  { id: 'c2', name: 'Amit Verma', business: 'Acrux Enterprises', address: 'Plot 28, Industrial Area, Noida, UP - 201301', email: 'billing@acrux.com', segment: 'VIP Customer' },
  { id: 'c3', name: 'Vikram Singh', business: 'Apex Tech Labs', address: 'Phase 8B, Mohali, Punjab - 160055', email: 'finance@apextech.io', segment: 'New Client' }
];

const DEFAULT_MOCK_INVOICES = [
  { 
    id: 'INV-100231', 
    customerId: 'c1', 
    date: '2026-07-01', 
    dueDate: '2026-07-15', 
    subtotal: 14990, 
    totalDiscount: 0, 
    totalTax: 0, 
    grandTotal: 14990, 
    status: 'Paid', 
    createdAt: '2026-07-01T10:00:00Z',
    items: [{ name: 'Autopilot Premium License', qty: 1, price: 14990, tax: 18 }]
  },
  { 
    id: 'INV-102941', 
    customerId: 'c1', 
    date: '2026-07-05', 
    dueDate: '2026-07-19', 
    subtotal: 8500, 
    totalDiscount: 500, 
    totalTax: 900, 
    grandTotal: 8900, 
    status: 'Paid', 
    createdAt: '2026-07-05T14:30:00Z',
    items: [{ name: 'API Cloud Subscription', qty: 1, price: 6000, tax: 18 }, { name: 'Enterprise Advisory Hours', qty: 1, price: 2500, tax: 18 }]
  },
  { 
    id: 'INV-203940', 
    customerId: 'c2', 
    date: '2026-06-20', 
    dueDate: '2026-07-04', 
    subtotal: 49900, 
    totalDiscount: 0, 
    totalTax: 0, 
    grandTotal: 49900, 
    status: 'Paid', 
    createdAt: '2026-06-20T09:00:00Z',
    items: [{ name: 'Autopilot Hardware Controller', qty: 1, price: 34900, tax: 18 }, { name: 'Autopilot Premium License', qty: 1, price: 15000, tax: 18 }]
  },
  { 
    id: 'INV-298371', 
    customerId: 'c2', 
    date: '2026-07-08', 
    dueDate: '2026-07-22', 
    subtotal: 24500, 
    totalDiscount: 0, 
    totalTax: 4410, 
    grandTotal: 28910, 
    status: 'Unpaid', 
    createdAt: '2026-07-08T11:15:00Z',
    items: [{ name: 'Enterprise Advisory Hours', qty: 7, price: 3500, tax: 18 }]
  },
  { 
    id: 'INV-394801', 
    customerId: 'c2', 
    date: '2026-07-11', 
    dueDate: '2026-07-25', 
    subtotal: 12000, 
    totalDiscount: 1000, 
    totalTax: 0, 
    grandTotal: 11000, 
    status: 'Draft', 
    createdAt: '2026-07-11T16:20:00Z',
    items: [{ name: 'API Cloud Subscription', qty: 2, price: 6000, tax: 18 }]
  },
  { 
    id: 'INV-309485', 
    customerId: 'c3', 
    date: '2026-07-02', 
    dueDate: '2026-07-16', 
    subtotal: 34900, 
    totalDiscount: 0, 
    totalTax: 0, 
    grandTotal: 34900, 
    status: 'Unpaid', 
    createdAt: '2026-07-02T13:00:00Z',
    items: [{ name: 'Autopilot Hardware Controller', qty: 1, price: 34900, tax: 18 }]
  }
];

export default function Customers({ user, onBack }) {
  // --- States ---
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch customers and invoices from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const customerData = await api.get('/customers');
        const invoiceData = await api.get('/invoices');
        setCustomers(customerData.map(c => ({
          id: c._id,
          name: c.name,
          business: c.business || '',
          address: c.address || '',
          email: c.email || '',
          segment: c.segment || 'New Client'
        })));
        setInvoices(invoiceData);
      } catch (err) {
        console.error("Failed to load customers database data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Modal / Editor Control
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // null when adding, customer object when editing
  const [customerForm, setCustomerForm] = useState({ name: '', business: '', email: '', address: '', segment: 'New Client' });
  
  // Detail Modal Control
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc, name-desc, invoiced-desc, count-desc

  // --- Dynamic Stats calculation ---
  const stats = React.useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'Draft') {
        totalInvoiced += inv.grandTotal;
        if (inv.status === 'Paid') {
          totalPaid += inv.grandTotal;
        } else {
          totalPending += inv.grandTotal;
        }
      }
    });

    return {
      totalCustomers: customers.length,
      totalInvoiced,
      totalPaid,
      totalPending
    };
  }, [customers, invoices]);

  // Calculate statistics per customer
  const customerStats = React.useMemo(() => {
    const map = {};
    
    // Initialize map
    customers.forEach(c => {
      map[c.id] = {
        invoiced: 0,
        count: 0,
        lastInvoiceDate: '-'
      };
    });

    // Populate from invoices
    invoices.forEach(inv => {
      const cId = inv.customerId;
      if (map[cId]) {
        map[cId].invoiced += inv.grandTotal;
        map[cId].count += 1;
        
        // Track latest invoice date
        if (map[cId].lastInvoiceDate === '-' || new Date(inv.date) > new Date(map[cId].lastInvoiceDate)) {
          map[cId].lastInvoiceDate = inv.date;
        }
      }
    });

    return map;
  }, [customers, invoices]);

  // --- Search, Filtering & Sorting ---
  const filteredCustomers = React.useMemo(() => {
    let result = customers.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.business.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });

    // Sort
    result.sort((a, b) => {
      const statsA = customerStats[a.id] || { invoiced: 0, count: 0 };
      const statsB = customerStats[b.id] || { invoiced: 0, count: 0 };

      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'invoiced-desc') {
        return statsB.invoiced - statsA.invoiced;
      } else if (sortBy === 'count-desc') {
        return statsB.count - statsA.count;
      }
      return 0;
    });

    return result;
  }, [customers, searchQuery, sortBy, customerStats]);

  // --- CRUD Handlers ---
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: '', business: '', email: '', address: '', segment: 'New Client' });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      business: customer.business || '',
      email: customer.email || '',
      address: customer.address || '',
      segment: customer.segment || getSegmentTag(customer)
    });
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingCustomer) {
        // Edit
        const updated = await api.put(`/customers/${editingCustomer.id}`, customerForm);
        setCustomers(prev => prev.map(c => 
          c.id === editingCustomer.id 
            ? { ...c, ...updated, id: updated._id } 
            : c
        ));
      } else {
        // Add
        const newCust = {
          ...customerForm,
          business: customerForm.business.trim() || 'Individual',
          address: customerForm.address.trim() || 'Address not specified',
          email: customerForm.email.trim() || 'email@client.com'
        };
        const created = await api.post('/customers', newCust);
        setCustomers(prev => [...prev, {
          id: created._id,
          name: created.name,
          business: created.business || '',
          address: created.address || '',
          email: created.email || '',
          segment: created.segment || 'New Client'
        }]);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save customer", err);
      alert("Failed to save customer: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? All client information will be removed from your dashboard.`)) {
      try {
        await api.delete(`/customers/${id}`);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error("Failed to delete customer", err);
      }
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get customer segment/status
  const getSegmentTag = (customer) => {
    if (customer.segment) return customer.segment;
    
    const statsObj = customerStats[customer.id] || { invoiced: 0, count: 0 };
    if (statsObj.invoiced > 50000) return 'VIP Customer';
    if (statsObj.count > 2) return 'Active Client';
    return 'New Client';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Relationship Manager</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Client Portfolio</h2>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Clients</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">{stats.totalCustomers}</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 mt-2 flex items-center gap-0.5">
            <TrendingUp size={10} className="text-emerald-500" />
            <span className="text-emerald-500 font-extrabold">+1 new</span> this month
          </p>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Invoiced</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">₹{stats.totalInvoiced.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 mt-2">
            Sum of all created invoices
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Received Payments</p>
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-1">₹{stats.totalPaid.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 mt-2">
            Completed transactions
          </p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Outstanding Balance</p>
              <h3 className="text-lg font-black text-rose-500 mt-1">₹{stats.totalPending.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 mt-2">
            Unpaid and pending bills
          </p>
        </div>
      </div>

      {/* 3. Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 p-4 rounded-[20px] shadow-3xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Sort By:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="name-asc">Client Name (A-Z)</option>
              <option value="name-desc">Client Name (Z-A)</option>
              <option value="invoiced-desc">Total Invoiced (High - Low)</option>
              <option value="count-desc">Invoices Count (High - Low)</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Customer List Section */}
      <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[24px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900/60 text-zinc-400 font-black uppercase tracking-widest text-[9px] border-b border-[#e8ecf4] dark:border-zinc-800">
                <th className="py-4.5 px-5">Client Info</th>
                <th className="py-4.5 px-5">Segment</th>
                <th className="py-4.5 px-5">Total Spent</th>
                <th className="py-4.5 px-5">Invoices Count</th>
                <th className="py-4.5 px-5">Last Transaction</th>
                <th className="py-4.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8ecf4] dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => {
                  const stat = customerStats[customer.id] || { invoiced: 0, count: 0, lastInvoiceDate: '-' };
                  const segment = getSegmentTag(customer);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-all">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-2xs flex items-center justify-center shadow-sm">
                            {getInitials(customer.name)}
                          </div>
                          <div className="text-left leading-tight">
                            <p className="font-black text-zinc-900 dark:text-zinc-50 text-sm hover:text-orange-500 transition-colors cursor-pointer" onClick={() => setSelectedCustomerDetails(customer)}>
                              {customer.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{customer.business}</p>
                          </div>
                        </div>
                      </td>

                      {/* Segment tag */}
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          segment === 'VIP Customer' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-200/50' :
                          segment === 'Active Client' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-500 border border-orange-200/50' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {segment}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-5 font-black text-zinc-900 dark:text-zinc-50">
                        ₹{stat.invoiced.toLocaleString('en-IN')}
                      </td>

                      {/* Invoices Count */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold">{stat.count}</span>
                          <span className="text-[10px] text-zinc-400">bills</span>
                        </div>
                      </td>

                      {/* Last transaction date */}
                      <td className="py-4 px-5 font-medium text-zinc-500 dark:text-zinc-400">
                        {stat.lastInvoiceDate !== '-' ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-zinc-400" />
                            <span>{stat.lastInvoiceDate}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">No activity yet</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomerDetails(customer)}
                            title="View customer billing stats"
                            className="p-1.5 text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={13.5} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            title="Edit customer details"
                            className="p-1.5 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit size={13.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                            title="Delete customer profile"
                            className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-400 italic">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={28} className="text-zinc-350" />
                      <p className="text-sm font-semibold">No clients matching "{searchQuery}"</p>
                      <p className="text-[10px] text-zinc-500">Create a new customer profile using the button above.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT CUSTOMER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
            >
              <X size={15} />
            </button>

            {/* Modal Header */}
            <div className="mb-4.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wide">
                  {editingCustomer ? 'Modify Client Profile' : 'New Customer Profile'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Define business & contact parameters</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Client Name *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="e.g. Priyanth Kumar"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Business Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Business Name / Company</label>
                <input
                  type="text"
                  value={customerForm.business}
                  onChange={(e) => setCustomerForm({ ...customerForm, business: e.target.value })}
                  placeholder="e.g. Acrux Enterprises (Optional)"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="e.g. billing@company.com"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Client Status / Segment */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Client Status / Segment</label>
                <div className="relative">
                  <select
                    value={customerForm.segment}
                    onChange={(e) => setCustomerForm({ ...customerForm, segment: e.target.value })}
                    className="appearance-none w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="New Client">New Client</option>
                    <option value="Active Client">Active Client</option>
                    <option value="VIP Customer">VIP Customer</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Billing Address</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="e.g. Block C, Connaught Place, New Delhi..."
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER DETAILS & INVOICES MODAL --- */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCustomerDetails(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
            >
              <X size={15} />
            </button>

            {/* Modal Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                {getInitials(selectedCustomerDetails.name)}
              </div>
              <div className="text-left">
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                  {selectedCustomerDetails.name}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{selectedCustomerDetails.business}</p>
              </div>
            </div>

            {/* Content Tabs (Stats & Billing Record) */}
            <div className="space-y-5">
              {/* Contact parameters summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-zinc-900/40 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Email Address</p>
                  <p className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Mail size={12} className="text-zinc-400" />
                    <span>{selectedCustomerDetails.email}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Billing Address</p>
                  <p className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 leading-tight">
                    <Briefcase size={12} className="text-zinc-400 shrink-0" />
                    <span>{selectedCustomerDetails.address}</span>
                  </p>
                </div>
              </div>

              {/* Billing History list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Invoice History</h4>
                
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {invoices.filter(inv => inv.customerId === selectedCustomerDetails.id).length > 0 ? (
                    invoices
                      .filter(inv => inv.customerId === selectedCustomerDetails.id)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(inv => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/50 rounded-xl text-xs font-bold"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-black text-orange-500">{inv.id}</span>
                            <span className="text-zinc-400 font-medium">Issued: {inv.date}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-zinc-900 dark:text-zinc-50 font-black">
                              ₹{inv.grandTotal.toLocaleString('en-IN')}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200/50' :
                              inv.status === 'Unpaid' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-200/50' :
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-6 text-center text-zinc-400 italic text-xs font-semibold">
                      No invoices issued for this client yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#e8ecf4] dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedCustomerDetails(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
