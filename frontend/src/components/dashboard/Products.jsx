import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Edit, Trash2, Eye, TrendingUp, 
  Sparkles, X, Activity, DollarSign, Award, ChevronDown, Check, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { api } from '../../utils/api';

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Autopilot Premium License', description: 'Lifetime license key for Smart Pilot auto-billing & AI operations.', type: 'Service', price: 14990, tax: 18 },
  { id: 'p2', name: 'API Cloud Subscription', description: 'Monthly subscription for cloud computing resources and API usage.', type: 'Service', price: 6000, tax: 18 },
  { id: 'p3', name: 'Autopilot Hardware Controller', description: 'Physical USB-C workspace telemetry node and status monitor.', type: 'Product', price: 34900, tax: 18 },
  { id: 'p4', name: 'Enterprise Advisory Hours', description: 'Direct consulting hours with a Senior Enterprise Autopilot Architect.', type: 'Service', price: 3500, tax: 18 }
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

export default function Products({ user, onBack }) {
  // Products list
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- CRUD States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', type: 'Product', price: 0, tax: 18 });

  // --- Search & Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // --- Detail / Analytics Overlay State ---
  const [selectedProductAnalytics, setSelectedProductAnalytics] = useState(null);

  // Fetch products, invoices and customers from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const productData = await api.get('/products');
        const invoiceData = await api.get('/invoices');
        const customerData = await api.get('/customers');
        setProducts(productData.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description || '',
          type: p.type || 'Product',
          price: p.price || 0,
          tax: p.tax || 18
        })));
        setInvoices(invoiceData);
        setCustomers(customerData);
      } catch (err) {
        console.error("Failed to load products database data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate stats dynamically for each product
  const productStats = useMemo(() => {
    const stats = {};
    
    // Seed with 0s
    products.forEach(p => {
      stats[p.name] = { unitsSold: 0, revenue: 0, invoices: [] };
    });

    // Scan invoices
    invoices.forEach(inv => {
      if (inv.status === 'Draft') return; // Skip drafts in production analytics
      const items = inv.items || [];
      items.forEach(item => {
        const pName = item.name;
        if (!stats[pName]) {
          stats[pName] = { unitsSold: 0, revenue: 0, invoices: [] };
        }
        
        const qty = Number(item.qty || 1);
        const rate = Number(item.price || 0);
        const itemRevenue = qty * rate;

        stats[pName].unitsSold += qty;
        stats[pName].revenue += itemRevenue;
        stats[pName].invoices.push({
          invoiceId: inv.id,
          customerId: inv.customerId,
          date: inv.date,
          qty: qty,
          rate: rate,
          status: inv.status
        });
      });
    });

    return stats;
  }, [products, invoices]);

  // Aggregate Metrics Grid values
  const generalMetrics = useMemo(() => {
    let totalItems = products.length;
    let topRevenueProduct = 'None';
    let topRevenueVal = 0;
    let topPopularProduct = 'None';
    let topPopularQty = 0;
    let totalCatalogPriceValuation = 0;

    products.forEach(p => {
      totalCatalogPriceValuation += Number(p.price || 0);
      const stat = productStats[p.name] || { unitsSold: 0, revenue: 0 };
      
      if (stat.revenue > topRevenueVal) {
        topRevenueVal = stat.revenue;
        topRevenueProduct = p.name;
      }
      if (stat.unitsSold > topPopularQty) {
        topPopularQty = stat.unitsSold;
        topPopularProduct = p.name;
      }
    });

    return {
      totalItems,
      topRevenueProduct,
      topRevenueVal,
      topPopularProduct,
      topPopularQty,
      avgCatalogPrice: totalItems > 0 ? (totalCatalogPriceValuation / totalItems) : 0
    };
  }, [products, productStats]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = filterType === 'All' || p.type === filterType;
      return (nameMatch || descMatch) && typeMatch;
    });

    // Sorting
    result.sort((a, b) => {
      const statsA = productStats[a.name] || { unitsSold: 0, revenue: 0 };
      const statsB = productStats[b.name] || { unitsSold: 0, revenue: 0 };

      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'price-asc') {
        return a.price - b.price;
      } else if (sortBy === 'price-desc') {
        return b.price - a.price;
      } else if (sortBy === 'sold-desc') {
        return statsB.unitsSold - statsA.unitsSold;
      } else if (sortBy === 'revenue-desc') {
        return statsB.revenue - statsA.revenue;
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, filterType, sortBy, productStats]);

  // --- CRUD Handlers ---
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', type: 'Product', price: 0, tax: 18 });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      type: p.type || 'Product',
      price: p.price || 0,
      tax: p.tax || 18
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingProduct) {
        // Edit
        const updated = await api.put(`/products/${editingProduct.id}`, productForm);
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id 
            ? { ...p, ...updated, id: updated._id } 
            : p
        ));
      } else {
        // Add
        const newProd = {
          name: productForm.name.trim(),
          description: productForm.description.trim() || 'No description provided.',
          type: productForm.type,
          price: Number(productForm.price),
          tax: Number(productForm.tax)
        };
        const created = await api.post('/products', newProd);
        setProducts(prev => [...prev, {
          id: created._id,
          name: created.name,
          description: created.description || '',
          type: created.type || 'Product',
          price: created.price || 0,
          tax: created.created_tax || 18
        }]);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Failed to save catalog item: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the catalog? This will not remove past invoice history but removes it from the catalog library.`)) {
      try {
        await api.delete(`/products/${id}`);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error("Failed to delete product", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
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
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Product Catalog</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Catalog & Autopilot Rates</h2>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Catalog Item</span>
        </button>
      </div>

      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Catalog Items */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Catalog Items</p>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Package size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2">{generalMetrics.totalItems}</h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Total active services & physical products</p>
        </div>

        {/* Top Seller by Revenue */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Top Revenue Generator</p>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-3 truncate" title={generalMetrics.topRevenueProduct}>
            {generalMetrics.topRevenueProduct}
          </h3>
          <p className="text-[9px] text-orange-500 font-extrabold mt-1">
            Total Sales: ₹{generalMetrics.topRevenueVal.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Most Popular by Volume */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Most Popular Item</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award size={15} />
            </div>
          </div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-3 truncate" title={generalMetrics.topPopularProduct}>
            {generalMetrics.topPopularProduct}
          </h3>
          <p className="text-[9px] text-emerald-500 font-extrabold mt-1">
            Volume sold: {generalMetrics.topPopularQty} units
          </p>
        </div>

        {/* Average Item Cost */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Average Price</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2">
            ₹{Math.round(generalMetrics.avgCatalogPrice).toLocaleString('en-IN')}
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Average unit rate across catalog</p>
        </div>

      </div>

      {/* 2. Search, Filters, and Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] overflow-hidden shadow-2xs">
        
        {/* Controls header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-zinc-900 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
          
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13.5} />
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9.5 pr-3.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter buttons */}
            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 text-xs font-bold shadow-3xs">
              {['All', 'Product', 'Service'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === t 
                      ? 'bg-orange-500 text-white' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>

            {/* Sort Selection */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-8 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-300 focus:outline-none focus:border-orange-500 cursor-pointer shadow-3xs"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="sold-desc">Units Sold (High to Low)</option>
                <option value="revenue-desc">Revenue (High to Low)</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-zinc-650 dark:text-zinc-350">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-950/20 text-zinc-400 border-b border-zinc-200/60 dark:border-zinc-900 text-left">
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Item Details</th>
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Type</th>
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Base Price</th>
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Default Tax</th>
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Sold</th>
                <th className="py-3 px-5 font-black uppercase tracking-wider text-[10px]">Total Revenue</th>
                <th className="py-3 px-5 text-right font-black uppercase tracking-wider text-[10px] pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-900/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => {
                  const stat = productStats[p.name] || { unitsSold: 0, revenue: 0 };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-all">
                      {/* Name & Desc */}
                      <td className="py-4 px-5 max-w-xs text-left">
                        <p className="font-black text-zinc-800 dark:text-zinc-100 hover:text-orange-500 cursor-pointer transition-colors" onClick={() => setSelectedProductAnalytics(p)}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 leading-normal font-medium">{p.description}</p>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                          p.type === 'Product' 
                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-200/50' 
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-200/50'
                        }`}>
                          {p.type}
                        </span>
                      </td>

                      {/* Rate */}
                      <td className="py-4 px-5 font-black text-zinc-800 dark:text-zinc-100">
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>

                      {/* Default Tax */}
                      <td className="py-4 px-5 font-bold text-zinc-500">
                        {p.tax}% GST
                      </td>

                      {/* Sold Units count */}
                      <td className="py-4 px-5 font-extrabold text-zinc-800 dark:text-zinc-100">
                        {stat.unitsSold}
                      </td>

                      {/* Total Sales Value */}
                      <td className="py-4 px-5 font-black text-zinc-900 dark:text-zinc-50">
                        ₹{stat.revenue.toLocaleString('en-IN')}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProductAnalytics(p)}
                            title="View Sales Analytics"
                            className="p-1.5 text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={13.5} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product Info"
                            className="p-1.5 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit size={13.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Delete Product Profile"
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
                  <td colSpan="7" className="py-12 text-center text-zinc-400 italic">
                    No products or services match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 3. CRUD Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 mb-4 text-left">
              {editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
              
              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Item Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Autopilot Hardware Controller"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Item Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Item Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. Lifetime license key for auto-billing & AI operations..."
                  rows="2"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Item Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Catalog Type</label>
                  <div className="relative">
                    <select
                      value={productForm.type}
                      onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      className="appearance-none w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Product">Product</option>
                      <option value="Service">Service</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Default GST */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Default GST (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={productForm.tax}
                    onChange={(e) => setProductForm({ ...productForm, tax: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Price / Rate */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Base Rate / Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Submit Buttons */}
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
                    <span>Save Item</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. Sales Analytics slide-over/details overlay */}
      {selectedProductAnalytics && (() => {
        const stats = productStats[selectedProductAnalytics.name] || { unitsSold: 0, revenue: 0, invoices: [] };
        
        // Match customer names
        const getCustomerName = (cId) => {
          const cust = customers.find(c => c.id === cId);
          return cust ? cust.name : 'Unknown Client';
        };

        // Monthly trends simulation
        const monthlyData = [
          { month: 'Jun', sales: stats.unitsSold > 2 ? Math.round(stats.unitsSold * 0.4) : 1, rev: stats.revenue > 10000 ? Math.round(stats.revenue * 0.4) : 6000 },
          { month: 'Jul', sales: stats.unitsSold > 2 ? Math.round(stats.unitsSold * 0.6) : stats.unitsSold || 1, rev: stats.revenue > 10000 ? Math.round(stats.revenue * 0.6) : stats.revenue || 8900 }
        ];

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 h-full w-full max-w-md p-6 flex flex-col justify-between shadow-2xl overflow-y-auto relative">
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="text-left space-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                      selectedProductAnalytics.type === 'Product' 
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-200/50' 
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-200/50'
                    }`}>
                      {selectedProductAnalytics.type}
                    </span>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 pt-1">
                      {selectedProductAnalytics.name}
                    </h3>
                    <p className="text-2xs text-zinc-400 leading-normal font-medium max-w-xs">{selectedProductAnalytics.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProductAnalytics(null)}
                    className="p-1 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-900 rounded-xl p-3.5 text-left">
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Volume Sold</p>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">{stats.unitsSold}</h4>
                    <span className="text-[8px] text-zinc-400 font-bold">units</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-900 rounded-xl p-3.5 text-left">
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Net Sales</p>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">₹{stats.revenue.toLocaleString('en-IN')}</h4>
                    <span className="text-[8px] text-zinc-400 font-bold">excl. tax</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-900 rounded-xl p-3.5 text-left">
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Base Rate</p>
                    <h4 className="text-lg font-black text-orange-500 mt-1">₹{selectedProductAnalytics.price.toLocaleString('en-IN')}</h4>
                    <span className="text-[8px] text-zinc-400 font-bold">{selectedProductAnalytics.tax}% GST</span>
                  </div>
                </div>

                {/* Sales trends visualization */}
                <div className="bg-slate-50/30 dark:bg-zinc-900/10 border border-zinc-200/60 dark:border-zinc-900 rounded-2xl p-4.5 mb-6 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-4">Monthly Revenue Trend</h4>
                  
                  {/* Micro Bar Chart */}
                  <div className="h-28 flex items-end justify-around pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-900 relative">
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-200/60 dark:border-zinc-800/40 pointer-events-none" />
                    
                    {monthlyData.map((m, idx) => {
                      const maxRev = Math.max(...monthlyData.map(x => x.rev)) || 1;
                      const heightPct = (m.rev / maxRev) * 100;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 w-16 group">
                          <div style={{ height: `${Math.max(heightPct, 15)}%` }} className="w-6.5 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-sm relative shadow-sm group-hover:opacity-90 transition-opacity">
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-800 text-white text-[8px] px-1 py-0.5 rounded font-black shadow opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in">
                              ₹{m.rev.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-zinc-400">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Billing Log */}
                <div className="space-y-3 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Recent Customer Purchases</h4>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {stats.invoices.length > 0 ? (
                      stats.invoices.map((inv, idx) => (
                        <div key={idx} className="border border-zinc-200/60 dark:border-zinc-900 p-3 rounded-xl flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="leading-tight">
                            <p className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-150">{getCustomerName(inv.customerId)}</p>
                            <span className="text-[9px] text-zinc-400 font-bold block mt-0.5">{inv.date} • {inv.invoiceId}</span>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-black text-[11px] text-zinc-900 dark:text-zinc-50">₹{(inv.qty * inv.rate).toLocaleString('en-IN')}</p>
                            <span className="text-[9px] text-zinc-400 font-bold">Qty: {inv.qty}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 italic text-[10px] text-center py-4">No billing activity logged for this item yet.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer status */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-900 pt-4 flex items-center text-[10px] text-zinc-400 font-semibold gap-1.5 justify-center mt-6">
                <Sparkles size={12} className="text-orange-500 animate-pulse" />
                <span>Auto-compiled based on {stats.invoices.length} transactions.</span>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
