import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, 
  CheckSquare, Activity, ChevronRight, ArrowLeft, ArrowUpRight, RefreshCw 
} from 'lucide-react';

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'Priya Sharma', business: 'Sharma Consultancy Services', address: 'Sector 45, Gurgaon, Haryana - 122003', email: 'priya@sharmaconsultancy.in', segment: 'VIP Customer' },
  { id: 'c2', name: 'Amit Verma', business: 'Acrux Enterprises', address: 'Plot 28, Industrial Area, Noida, UP - 201301', email: 'billing@acrux.com', segment: 'VIP Customer' },
  { id: 'c3', name: 'Vikram Singh', business: 'Apex Tech Labs', address: 'Phase 8B, Mohali, Punjab - 160055', email: 'finance@apextech.io', segment: 'New Client' }
];

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

const DEFAULT_TASKS = [
  { id: 1, text: 'Review quarterly tax filing draft', priority: 'high', status: 'To Do', deadline: '5:00 PM' },
  { id: 2, text: 'Deploy checkout auto-reminder logic', priority: 'medium', status: 'In Progress', deadline: 'Tomorrow' },
  { id: 3, text: 'Consolidate Acrux invoices logs', priority: 'high', status: 'Completed', deadline: 'Completed' },
  { id: 4, text: 'Follow up with Vikram Singh', priority: 'low', status: 'To Do', deadline: 'Friday' }
];

export default function Analytics({ onBack }) {
  // --- Load Dynamic State ---
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const invoiceData = await api.get('/invoices');
      const customerData = await api.get('/customers');
      const productData = await api.get('/products');
      const taskData = await api.get('/tasks');
      setInvoices(invoiceData);
      setCustomers(customerData.map(c => ({
        id: c._id || c.id,
        name: c.name,
        business: c.business || '',
        address: c.address || '',
        email: c.email || '',
        segment: c.segment || 'New Client'
      })));
      setProducts(productData);
      setTasks(taskData);
    } catch (err) {
      console.error("Failed to load analytics database data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-poll database every 10 seconds for updates
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // --- Financial Calculations ---
  const financials = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
    const realized = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
    const pending = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + Number(i.grandTotal || 0), 0);
    
    const count = invoices.length;
    const avgInvoice = count > 0 ? Math.round(totalInvoiced / count) : 0;
    const collectionEfficiency = totalInvoiced > 0 ? Math.round((realized / totalInvoiced) * 100) : 0;

    return { totalInvoiced, realized, pending, avgInvoice, collectionEfficiency };
  }, [invoices]);

  // --- Customer Spends Aggregation ---
  const customerSpends = useMemo(() => {
    const spendMap = {};
    
    // Initialize spendMap
    customers.forEach(c => {
      spendMap[c.id] = {
        name: c.name,
        business: c.business,
        segment: c.segment || 'Active Client',
        spent: 0,
        count: 0
      };
    });

    // Populate spent
    invoices.forEach(inv => {
      const cId = inv.customerId;
      if (spendMap[cId]) {
        spendMap[cId].spent += Number(inv.grandTotal || 0);
        spendMap[cId].count += 1;
      }
    });

    return Object.values(spendMap).sort((a, b) => b.spent - a.spent);
  }, [customers, invoices]);

  // --- Monthly Revenue Data ---
  const monthlyRevenue = useMemo(() => {
    const months = {};
    
    invoices.forEach(inv => {
      const dateStr = inv.date || ''; // e.g. "2026-07-01"
      const monthKey = dateStr.slice(0, 7) || 'Other'; // e.g. "2026-07"
      months[monthKey] = (months[monthKey] || 0) + Number(inv.grandTotal || 0);
    });

    // Sort by key and format
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, val]) => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = m ? `${monthNames[Number(m) - 1]} ${year}` : month;
        return { label, revenue: val };
      });
  }, [invoices]);

  // --- Product Revenue Breakdown ---
  const productRevenue = useMemo(() => {
    const salesMap = {};

    invoices.forEach(inv => {
      const lineItems = inv.items || [];
      lineItems.forEach(item => {
        const name = item.name;
        if (!salesMap[name]) {
          salesMap[name] = { name, revenue: 0, qty: 0, type: 'Product' };
          // Look up catalog for type
          const matched = products.find(p => p.name.toLowerCase() === name.toLowerCase());
          if (matched) {
            salesMap[name].type = matched.type;
          }
        }
        salesMap[name].revenue += Number(item.price || 0) * Number(item.qty || 1);
        salesMap[name].qty += Number(item.qty || 1);
      });
    });

    return Object.values(salesMap).sort((a, b) => b.revenue - a.revenue);
  }, [invoices, products]);

  // --- Product vs Service Revenue Split ---
  const categorySplit = useMemo(() => {
    let productVal = 0;
    let serviceVal = 0;

    productRevenue.forEach(p => {
      if (p.type === 'Product') {
        productVal += p.revenue;
      } else {
        serviceVal += p.revenue;
      }
    });

    const total = productVal + serviceVal;
    return {
      productVal,
      serviceVal,
      productPct: total > 0 ? Math.round((productVal / total) * 100) : 50,
      servicePct: total > 0 ? Math.round((serviceVal / total) * 100) : 50
    };
  }, [productRevenue]);

  // --- Tasks checklist compliance ---
  const taskCompliance = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed' || t.done).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, rate };
  }, [tasks]);

  // Max value helper for SVG height
  const maxMonthlyRevenue = useMemo(() => {
    const maxVal = Math.max(...monthlyRevenue.map(d => d.revenue), 1000);
    return maxVal;
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
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
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Business Intel</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Unified Platform Analytics</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/20 cursor-pointer disabled:opacity-50 transition-all"
            title="Refresh database records"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Activity size={12} className="animate-pulse" />
            <span>Real-time Sync Active</span>
          </div>
        </div>
      </div>

      {/* 1. Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Realized Revenue */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Realized Revenue</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2">
            ₹{financials.realized.toLocaleString('en-IN')}
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Cleared paid invoice totals</p>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Outstanding Bills</p>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp size={15} className="rotate-45" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2">
            ₹{financials.pending.toLocaleString('en-IN')}
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Unpaid invoice ledger values</p>
        </div>

        {/* Avg Invoice Size */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Average Deal Size</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BarChart3 size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2">
            ₹{financials.avgInvoice.toLocaleString('en-IN')}
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Average invoice grand total</p>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-900 rounded-[20px] p-4.5 text-left relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Collection Ratio</p>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <ArrowUpRight size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {financials.collectionEfficiency}%
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-1">Total Paid / Total Billed</p>
        </div>

      </div>

      {/* 2. Visual Charts Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 text-left shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Revenue Progression</h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Aggregate invoice sales grouped by month</p>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-60 w-full relative flex items-end justify-between px-2 pt-6 border-b border-zinc-100 dark:border-zinc-900/65">
            {monthlyRevenue.length > 0 ? (
              monthlyRevenue.map((d, idx) => {
                const heightPct = Math.round((d.revenue / maxMonthlyRevenue) * 80) + 10; // min 10% for visibility
                return (
                  <div key={idx} className="h-full flex-1 flex flex-col justify-end items-center group relative px-2 max-w-[120px]">
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-md pointer-events-none z-10">
                      ₹{d.revenue.toLocaleString('en-IN')}
                    </div>

                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:scale-x-105"
                    />

                    {/* Label */}
                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 mt-2 block truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 italic text-[11px]">
                No transaction logs recorded to compile progression
              </div>
            )}
          </div>
        </div>

        {/* Product split Ring Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 text-left shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Catalog Revenue Share</h3>
            <p className="text-[10px] text-zinc-400 font-bold">Revenue splits between Products vs Services</p>
          </div>

          <div className="py-6 flex flex-col items-center space-y-4">
            {/* Donut representation */}
            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-full h-full rotate-270" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100 dark:text-zinc-900"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Services Segment */}
                <path
                  className="text-orange-500"
                  strokeWidth="4"
                  strokeDasharray={`${categorySplit.servicePct}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Products Segment */}
                <path
                  className="text-blue-500"
                  strokeWidth="4"
                  strokeDashoffset={`-${categorySplit.servicePct}`}
                  strokeDasharray={`${categorySplit.productPct}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Services</span>
                <span className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-1">{categorySplit.servicePct}%</span>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="w-full space-y-2 text-xs font-semibold pt-2">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-orange-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">Services Share</span>
                </div>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-50">₹{categorySplit.serviceVal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">Products Share</span>
                </div>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-50">₹{categorySplit.productVal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Spends Leaderboard & Operations Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Client Spend Leaderboard */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 text-left shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Spends Leaderboard</h3>
            <p className="text-[10px] text-zinc-400 font-bold">Top clients by accumulated billing contribution</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {customerSpends.slice(0, 4).map((c, idx) => {
              const maxSpend = Math.max(...customerSpends.map(s => s.spent), 1000);
              const barWidth = Math.round((c.spent / maxSpend) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{c.name}</span>
                    <span className="text-zinc-500 font-bold">₹{c.spent.toLocaleString('en-IN')} spent</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden">
                    <div 
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        idx === 0 ? 'from-orange-500 to-amber-400' :
                        idx === 1 ? 'from-blue-500 to-indigo-400' :
                        'from-purple-500 to-pink-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Autopilot Sync & Task compliance diagnostics */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 text-left shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">System Diagnostics</h3>
            <p className="text-[10px] text-zinc-400 font-bold">Autopilot sync indices and checkmark trackers</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold">
            {/* Task Compliance Box */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/50 p-4 rounded-2xl text-center space-y-2">
              <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                <CheckSquare size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Task compliance</p>
                <h4 className="text-base font-black text-zinc-900 dark:text-zinc-50">{taskCompliance.rate}%</h4>
                <p className="text-[8px] text-zinc-400 font-bold">{taskCompliance.completed}/{taskCompliance.total} done</p>
              </div>
            </div>

            {/* Cloud API Node Diagnostics */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/50 p-4 rounded-2xl text-center space-y-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Activity size={16} className="animate-pulse" />
              </span>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Autopilot Node</p>
                <h4 className="text-base font-black text-emerald-500">ONLINE</h4>
                <p className="text-[8px] text-zinc-400 font-bold">Latency: 12ms</p>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-bold text-zinc-400 leading-normal flex gap-1.5 items-center justify-center border-t border-zinc-100 dark:border-zinc-900 pt-3 text-center">
            <span>Last Sync Refreshed:</span>
            <span className="font-extrabold text-zinc-700 dark:text-zinc-200">Just Now</span>
          </div>
        </div>

      </div>

    </div>
  );
}
