import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { 
  FileText, Mail, ArrowLeft, Search, 
  ArrowUpDown, Calendar, DollarSign, CheckCircle2, AlertCircle, RefreshCw, Eye, X, Printer, Download, Trash2, Edit
} from 'lucide-react';

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'Priya Sharma', business: 'Sharma Consultancy Services', address: 'Sector 45, Gurgaon, Haryana - 122003', email: 'priya@sharmaconsultancy.in', segment: 'VIP Customer' },
  { id: 'c2', name: 'Amit Verma', business: 'Acrux Enterprises', address: 'Plot 28, Industrial Area, Noida, UP - 201301', email: 'billing@acrux.com', segment: 'VIP Customer' },
  { id: 'c3', name: 'Vikram Singh', business: 'Apex Tech Labs', address: 'Phase 8B, Mohali, Punjab - 160055', email: 'finance@apextech.io', segment: 'New Client' }
];

const DEFAULT_MOCK_INVOICES = [
  { id: 'INV-100231', customerId: 'c1', date: '2026-07-01', dueDate: '2026-07-15', subtotal: 14990, totalDiscount: 0, totalTax: 0, grandTotal: 14990, status: 'Paid', createdAt: '2026-07-01T10:00:00Z', items: [{ name: 'Autopilot Premium License', qty: 1, price: 14990, tax: 18 }] },
  { id: 'INV-102941', customerId: 'c1', date: '2026-07-05', dueDate: '2026-07-19', subtotal: 8500, totalDiscount: 500, totalTax: 900, grandTotal: 8900, status: 'Paid', createdAt: '2026-07-05T14:30:00Z', items: [{ name: 'API Cloud Subscription', qty: 1, price: 6000, tax: 18 }, { name: 'Enterprise Advisory Hours', qty: 1, price: 2500, tax: 18 }] },
  { id: 'INV-203940', customerId: 'c2', date: '2026-06-20', dueDate: '2026-07-04', subtotal: 49900, totalDiscount: 0, totalTax: 0, grandTotal: 49900, status: 'Paid', createdAt: '2026-06-20T09:00:00Z', items: [{ name: 'Autopilot Hardware Controller', qty: 1, price: 34900, tax: 18 }, { name: 'Autopilot Premium License', qty: 1, price: 15000, tax: 18 }] },
  { id: 'INV-298371', customerId: 'c2', date: '2026-07-08', dueDate: '2026-07-22', subtotal: 24500, totalDiscount: 0, totalTax: 4410, grandTotal: 28910, status: 'Unpaid', createdAt: '2026-07-08T11:15:00Z', items: [{ name: 'Enterprise Advisory Hours', qty: 7, price: 3500, tax: 18 }] },
  { id: 'INV-394801', customerId: 'c2', date: '2026-07-11', dueDate: '2026-07-25', subtotal: 12000, totalDiscount: 1000, totalTax: 0, grandTotal: 11000, status: 'Draft', createdAt: '2026-07-11T16:20:00Z', items: [{ name: 'API Cloud Subscription', qty: 2, price: 6000, tax: 18 }] },
  { id: 'INV-309485', customerId: 'c3', date: '2026-07-02', dueDate: '2026-07-16', subtotal: 34900, totalDiscount: 0, totalTax: 0, grandTotal: 34900, status: 'Unpaid', createdAt: '2026-07-02T13:00:00Z', items: [{ name: 'Autopilot Hardware Controller', qty: 1, price: 34900, tax: 18 }] }
];
export default function InvoiceHistory({ onBack, user }) {
  const navigate = useNavigate();

  // --- Load Local States ---
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch customers and invoices from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const customerData = await api.get('/customers');
        const invoiceData = await api.get('/invoices');
        setCustomers(customerData.map(c => ({
          ...c,
          id: c._id || c.id
        })));
        setInvoices(invoiceData.map(inv => ({
          ...inv,
          id: inv._id || inv.id
        })));
      } catch (err) {
        console.error("Failed to load invoice history database data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Search & Sorting States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pdfPreviewInvoice, setPdfPreviewInvoice] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const companyProfile = useMemo(() => {
    return {
      name: user.companyName || 'Self Ranker',
      gstin: user.companyGST || 'GST0029JS9099',
      phone: user.companyPhone || '9958437192',
      email: user.companyEmail || 'billing@smartpilot.io',
      address: user.companyAddress || 'New Palam Vihar, Gurugram',
      upi: user.bankUPI || 'gauravgoswami@ptyes',
      bankName: user.bankName || 'Canara Bank',
      bankAccName: user.bankAccName || 'Gaurav Goswami',
      bankAccNo: user.bankAccNo || '50579380250',
      bankIFSC: user.bankIFSC || 'CNRB0005056',
      logo: user.companyLogo || null,
      signature: user.companySignature || null
    };
  }, [user]);

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      const updated = await api.put(`/invoices/${id}`, { status: nextStatus });
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: updated.status } : inv));
    } catch (err) {
      console.error("Failed to update invoice status", err);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice from the database?")) {
      try {
        await api.delete(`/invoices/${id}`);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } catch (err) {
        console.error("Failed to delete invoice", err);
      }
    }
  };

  const handleEditInvoice = (inv) => {
    navigate('/dashboard/invoices', {
      state: {
        editInvoice: inv
      }
    });
  };

  // Map customer ID to customer name helper
  const customerNameMap = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      map[c.id || c._id] = c.name;
    });
    return map;
  }, [customers]);

  // --- Filtered and Sorted Invoices ---
  const processedInvoices = useMemo(() => {
    let result = [...invoices];

    // 1. Status Filter
    if (filterStatus !== 'all') {
      result = result.filter(inv => inv.status === filterStatus);
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(inv => {
        const clientName = (customerNameMap[inv.customerId] || '').toLowerCase();
        const invoiceId = inv.id.toLowerCase();
        const invoiceNo = (inv.invoiceNo || '').toLowerCase();
        return clientName.includes(query) || invoiceId.includes(query) || invoiceNo.includes(query);
      });
    }

    // 3. Sorting Criteria
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'id-asc':
          return (a.invoiceNo || a.id).localeCompare(b.invoiceNo || b.id);
        case 'id-desc':
          return (b.invoiceNo || b.id).localeCompare(a.invoiceNo || a.id);
        case 'amount-high':
          return Number(b.grandTotal) - Number(a.grandTotal);
        case 'amount-low':
          return Number(a.grandTotal) - Number(b.grandTotal);
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [invoices, filterStatus, searchQuery, sortBy, customerNameMap]);

  // --- Redirect to Email with attachment ---
  const handleSendInvoiceEmail = (inv) => {
    navigate('/dashboard/email', {
      state: {
        preSelectCustomerId: inv.customerId,
        preAttachInvoiceId: inv.id
      }
    });
  };

  // --- Download Invoice as PDF (html2canvas-pro + jsPDF, same as InvoiceMaker) ---
  const handleDownloadPDF = (inv) => {
    const element = document.getElementById(`invoice-pdf-render-${inv.id}`);
    if (!element) {
      alert('Error: Invoice element not found. Please keep the PDF preview open and try again.');
      return;
    }

    setPdfLoading(true);

    // Clone the invoice at full 595px width, positioned off-screen but VISIBLE
    // (visibility:hidden would cause html2canvas to produce a blank canvas)
    const clone = element.cloneNode(true);
    clone.style.zoom = '1';
    clone.style.width = '595px';
    clone.style.minHeight = '680px';
    clone.style.position = 'fixed';
    clone.style.top = '0px';
    clone.style.left = '-9999px';   // off-screen but not hidden
    clone.style.background = '#ffffff';
    document.body.appendChild(clone);

    // Give browser a frame to lay out the clone before capturing
    setTimeout(() => {
      html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      }).then(canvas => {
        document.body.removeChild(clone);
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', [210, imgHeight]);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        pdf.save(`invoice_${inv.id}.pdf`);
        setPdfLoading(false);
      }).catch(err => {
        if (document.body.contains(clone)) document.body.removeChild(clone);
        console.error('PDF generation error:', err);
        alert('Failed to generate PDF. Please try again.');
        setPdfLoading(false);
      });
    }, 80);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Receivable Ledger</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Invoice History</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
          <FileText size={12} className="animate-pulse" />
          <span>Sync Status: {invoices.length} invoices indexed</span>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Search Input */}
        <div className="md:col-span-5 relative text-left">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search by Invoice ID or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-450 focus:outline-none focus:border-orange-500 shadow-3xs"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="md:col-span-3 flex items-center gap-2 text-left">
          <ArrowUpDown size={14} className="text-zinc-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 cursor-pointer shadow-3xs"
          >
            <option value="newest" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Newest Date First</option>
            <option value="oldest" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Oldest Date First</option>
            <option value="id-asc" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Invoice ID (A-Z)</option>
            <option value="id-desc" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Invoice ID (Z-A)</option>
            <option value="amount-high" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Grand Total (High to Low)</option>
            <option value="amount-low" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">Grand Total (Low to High)</option>
          </select>
        </div>

        {/* Status Filtering Tabs */}
        <div className="md:col-span-4 flex bg-slate-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-zinc-850 gap-0.5">
          {['all', 'Paid', 'Unpaid', 'Draft'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-white dark:bg-zinc-800 text-orange-500 dark:text-orange-400 shadow-3xs border border-zinc-200/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[24px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-950/20 border-b border-zinc-150/40 dark:border-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                <th className="px-5 py-4">Invoice ID</th>
                <th className="px-5 py-4">Customer Client</th>
                <th className="px-5 py-4">Issue Date</th>
                <th className="px-5 py-4">Due Date</th>
                <th className="px-5 py-4 text-right">Grand Total</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150/40 dark:divide-zinc-900/80">
              {processedInvoices.length > 0 ? (
                processedInvoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/35 transition-colors"
                  >
                    {/* Invoice ID */}
                    <td className="px-5 py-3.5 font-extrabold text-zinc-850 dark:text-zinc-200">
                      {inv.invoiceNo || inv.id}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                      {customerNameMap[inv.customerId] || 'Custom Customer'}
                    </td>

                    {/* Issue Date */}
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-zinc-400" />
                        {new Date(inv.date).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-zinc-400" />
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="px-5 py-3.5 text-right font-black text-zinc-900 dark:text-zinc-100">
                      ₹{Number(inv.grandTotal).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200/50' :
                        inv.status === 'Unpaid' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-200/50' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-250/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    {/* Action Cells */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2 py-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-205 dark:hover:bg-zinc-800 border border-[#e8ecf4] dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                          title={`Preview ${inv.invoiceNo || inv.id}`}
                        >
                          <Eye size={11} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setPdfPreviewInvoice(inv)}
                          className="px-2 py-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-205 dark:hover:bg-zinc-800 border border-[#e8ecf4] dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                          title={`Preview PDF for ${inv.invoiceNo || inv.id}`}
                        >
                          <Printer size={11} />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleEditInvoice(inv)}
                          className="px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                          title={`Edit ${inv.invoiceNo || inv.id}`}
                        >
                          <Edit size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleSendInvoiceEmail(inv)}
                          className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500 hover:text-white border border-orange-500/20 text-orange-500 dark:text-orange-400 rounded-xl transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                          title={`Send ${inv.invoiceNo || inv.id} via email`}
                        >
                          <Mail size={11} />
                          <span>Send Mail</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(inv.id, inv.status)}
                          className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-600 rounded-xl transition-all flex items-center gap-1 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                          title="Toggle Status"
                        >
                          <span>{inv.status === 'Paid' ? 'Unpay' : 'Pay'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center p-1.5 cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-zinc-400 dark:text-zinc-550 italic">
                    No matching invoices found in history records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>      {/* Detailed Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 relative text-left space-y-6 text-xs text-zinc-850 dark:text-zinc-300">
            
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-zinc-150 dark:border-zinc-900 pb-4">
              <div>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">B2B Transaction Voucher</span>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                  Invoice Details: {selectedInvoice.invoiceNo || selectedInvoice.id}
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                selectedInvoice.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50' :
                selectedInvoice.status === 'Unpaid' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-200/50' :
                'bg-zinc-100 dark:bg-zinc-800 text-zinc-550 border-zinc-200 dark:border-zinc-700'
              }`}>
                {selectedInvoice.status}
              </span>
            </div>

            {/* Issuer / Client details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Seller Details</h4>
                <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{companyProfile.name}</p>
                <p className="text-zinc-500">GSTIN: {companyProfile.gstin}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{companyProfile.address}</p>
                <p className="text-zinc-600 dark:text-zinc-400">Email: {companyProfile.email}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Bill To</h4>
                {(() => {
                  const client = customers.find(c => c.id === selectedInvoice.customerId);
                  if (client) {
                    return (
                      <>
                        <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{client.name}</p>
                        <p className="text-zinc-500">{client.business}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">{client.address}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">Email: {client.email}</p>
                      </>
                    );
                  }
                  return <p className="text-zinc-400">Custom B2B Client</p>;
                })()}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden">
              <div className="max-h-[180px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-950/40 text-[9px] font-black uppercase text-zinc-450 border-b border-zinc-200 dark:border-zinc-900 sticky top-0">
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Tax (GST)</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                    {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="text-zinc-700 dark:text-zinc-300">
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 text-right font-bold">{item.qty}</td>
                        <td className="p-3 text-right font-bold">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold">{item.tax || 18}%</td>
                        <td className="p-3 text-right font-black text-zinc-900 dark:text-zinc-100">
                          ₹{((item.qty * item.price) * (1 + (item.tax || 18) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary details */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-900">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-450 uppercase">Payment Info</p>
                <p className="text-zinc-600 dark:text-zinc-400">UPI ID: <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{companyProfile.upi}</span></p>
                <p className="text-zinc-600 dark:text-zinc-400">Issue Date: <span className="font-semibold">{new Date(selectedInvoice.date).toLocaleDateString()}</span></p>
              </div>

              <div className="w-full md:w-64 space-y-2 text-right">
                <div className="flex justify-between text-zinc-500 font-semibold">
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedInvoice.subtotal).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedInvoice.totalDiscount) > 0 && (
                  <div className="flex justify-between text-zinc-550 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedInvoice.totalDiscount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500 font-semibold">
                  <span>Estimated Tax:</span>
                  <span>₹{Number(selectedInvoice.totalTax).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-900 dark:text-zinc-50 font-black text-sm border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-orange-500 font-black">₹{Number(selectedInvoice.grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl font-bold cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setPdfPreviewInvoice(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 text-zinc-800 dark:text-zinc-200 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl font-black cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={12} />
                <span>Show PDF</span>
              </button>
              <button
                onClick={() => {
                  handleSendInvoiceEmail(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Mail size={12} />
                <span>Send Mail</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {pdfPreviewInvoice && (() => {
        const inv = pdfPreviewInvoice;
        const client = customers.find(c => c.id === inv.customerId) || {
          name: 'Customer Name', business: 'Client Business Name',
          address: 'Client Billing Address', email: 'email@client.com'
        };
        const upiId = companyProfile.upi || 'gauravgoswami@ptyes';
        const upiName = companyProfile.bankAccName || companyProfile.name || 'Self Ranker';
        const grandTotal = Number(inv.grandTotal) || 0;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${grandTotal.toFixed(2)}&cu=INR`
        )}`;
        const hasBanking = !!(companyProfile.bankName || companyProfile.bankAccName || companyProfile.bankAccNo || companyProfile.bankIFSC || companyProfile.upi);

        return (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="w-full max-w-lg max-h-[90vh] flex flex-col my-4">
              
              {/* Top Toolbar */}
              <div className="bg-zinc-900 text-white px-5 py-2.5 rounded-t-3xl flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-orange-500" />
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-200">Invoice PDF Preview</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleDownloadPDF(inv)}
                    disabled={pdfLoading}
                    className={`px-3.5 py-1 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                      pdfLoading
                        ? 'bg-orange-400 cursor-not-allowed opacity-80'
                        : 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-orange-500/20'
                    }`}
                  >
                    {pdfLoading ? (
                      <>
                        <svg className="animate-spin" width={10} height={10} viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download size={10} />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPdfPreviewInvoice(null)}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Close Preview"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Scrollable Paper Area */}
              <div className="overflow-y-auto overflow-x-hidden bg-[#f4f7fa] rounded-b-3xl p-4 flex flex-col items-center">
                {/* A4 page zoomed to fit the panel width */}
                <div
                  id={`invoice-pdf-render-${inv.id}`}
                  className="w-[595px] min-h-[680px] bg-white p-3 flex flex-col justify-start text-left text-slate-800 text-[8.5px] leading-relaxed shadow-lg font-sans mx-auto"
                  style={{ zoom: 0.628 }}
                >
                  {/* Inner Black Bordered Container */}
                  <div style={{ border: '1.5px solid #000000' }} className="p-4 flex flex-col justify-start gap-3 w-full flex-1">

                    {/* 1. Header */}
                    <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        {(user?.companyLogo || companyProfile.logo) && (
                          <div className="w-12 h-12 flex items-center justify-center shrink-0">
                            <img src={user?.companyLogo || companyProfile.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <div className="leading-tight">
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                            {companyProfile.name}
                          </h4>
                          <p className="text-[7.5px] text-slate-500 max-w-[180px] mt-0.5 leading-normal">
                            {companyProfile.address}
                          </p>
                          {companyProfile.phone && (
                            <p className="text-[7px] text-slate-450 mt-0.5">Ph: {companyProfile.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right leading-tight">
                        <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider">INVOICE</h3>
                        <p className="text-[7.5px] text-slate-550 mt-1 font-semibold">
                          Invoice No: <strong className="text-slate-800 font-extrabold">{inv.id}</strong>
                        </p>
                        <p className="text-[7.5px] text-slate-550 font-semibold">
                          Date: <span className="text-slate-800 font-extrabold">{new Date(inv.date).toLocaleDateString()}</span>
                        </p>
                        {inv.dueDate && (
                          <p className="text-[7.5px] text-slate-550 font-semibold">
                            Due Date: <span className="text-slate-800 font-extrabold">{new Date(inv.dueDate).toLocaleDateString()}</span>
                          </p>
                        )}
                        <span className="inline-block text-[7px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                          Status: {inv.status}
                        </span>
                      </div>
                    </div>

                    {/* 2. Client Details */}
                    <div className="grid grid-cols-2 gap-4 py-1.5 border-b border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">Billed To:</span>
                        <h5 className="font-extrabold text-slate-900 text-[10px]">{client.name}</h5>
                        {client.business && <p className="text-slate-550 leading-relaxed font-medium text-[8px]">{client.business}</p>}
                        {client.address && <p className="text-slate-550 leading-relaxed font-medium max-w-[180px] text-[7.5px]">{client.address}</p>}
                      </div>
                      <div className="space-y-0.5 sm:pl-8">
                        {client.email && (
                          <>
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">Contact Details:</span>
                            <p className="text-slate-900 font-bold mt-0.5 text-[8.5px]">{client.email}</p>
                          </>
                        )}
                        {companyProfile.gstin && (
                          <p className="text-slate-500 mt-1.5 text-[7.5px] font-semibold">
                            GSTIN: <span className="text-slate-800 font-extrabold">{companyProfile.gstin}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 3. Items Table */}
                    <div className="py-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-[7.5px] font-black text-slate-400 uppercase tracking-widest pb-2">
                            <th className="py-1.5 w-2/5">Item</th>
                            <th className="py-1.5 text-center w-1/12">Qty</th>
                            <th className="py-1.5 text-right w-1/6">Rate</th>
                            <th className="py-1.5 text-right w-1/12">Disc%</th>
                            <th className="py-1.5 text-right w-1/12">Tax%</th>
                            <th className="py-1.5 text-right w-1/5">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.items && inv.items.map((item, idx) => {
                            const qty = item.qty || 1;
                            const price = item.price || 0;
                            const discount = item.discount || 0;
                            const tax = item.tax || 18;
                            const base = qty * price;
                            const discounted = base - (base * discount / 100);
                            const total = discounted + (discounted * tax / 100);
                            return (
                              <tr key={idx} className="border-b border-slate-100 font-medium">
                                <td className="py-2">
                                  <span className="font-extrabold text-slate-900 block text-[9px]">{item.name || 'Service or Product'}</span>
                                  {item.description && (
                                    <span className="text-[7.5px] text-slate-450 block mt-0.5">{item.description}</span>
                                  )}
                                </td>
                                <td className="py-2 text-center text-slate-900 font-bold text-[8.5px]">{qty}</td>
                                <td className="py-2 text-right text-slate-500 font-semibold text-[8.5px]">₹{price.toFixed(2)}</td>
                                <td className="py-2 text-right text-slate-500 text-[8.5px]">{discount}%</td>
                                <td className="py-2 text-right text-slate-500 text-[8.5px]">{tax}%</td>
                                <td className="py-2 text-right text-slate-900 font-extrabold text-[8.5px]">
                                  ₹{total.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 4. Bottom: Banking + Totals + QR */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-12 gap-4 border-t border-slate-200 pt-5 items-stretch">

                        {/* Banking Info */}
                        {hasBanking && (
                          <div className="col-span-7 h-full flex flex-col">
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[8.5px] text-left h-full flex flex-col justify-between">
                              <div>
                                <span className="font-black text-slate-900 block mb-2 uppercase tracking-wider text-[9.5px] border-b border-slate-200 pb-1.5">
                                  Payment Details
                                </span>
                                <div className="space-y-1 font-semibold text-slate-650 text-[8.5px]">
                                  <div className="space-y-2.5 pb-1.5 border-b border-slate-200/60 mb-1.5">
                                    {companyProfile.bankName && <p>Bank: <strong className="text-slate-800">{companyProfile.bankName}</strong></p>}
                                    {companyProfile.bankAccName && <p>A/C Name: <strong className="text-slate-800">{companyProfile.bankAccName}</strong></p>}
                                    {companyProfile.bankAccNo && <p>A/C No: <strong className="text-slate-800">{companyProfile.bankAccNo}</strong></p>}
                                    {companyProfile.bankIFSC && <p>IFSC: <strong className="text-slate-800">{companyProfile.bankIFSC}</strong></p>}
                                    {companyProfile.upi && <p>UPI ID: <strong className="text-slate-800">{companyProfile.upi}</strong></p>}
                                  </div>
                                </div>
                              </div>
                              <p className="leading-tight text-[8px] text-slate-500 font-medium italic mt-2">
                                Please scan the UPI QR code to complete the payment instantly.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Totals + QR */}
                        <div className={`${hasBanking ? 'col-span-5' : 'col-span-12 flex flex-col items-end'} space-y-4 text-right`}>
                          <div className="space-y-1.5 font-bold text-[8.5px] w-full max-w-[180px]">
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Subtotal:</span>
                              <span>₹{Number(inv.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-600">
                              <span>Discount:</span>
                              <span>-₹{Number(inv.totalDiscount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Tax:</span>
                              <span>+₹{Number(inv.totalTax).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-900 text-xs font-black border-t border-slate-250 pt-1.5">
                              <span>Grand Total:</span>
                              <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* QR Code */}
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="w-[84px] h-[84px] p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-xs">
                              <img src={qrUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-right leading-none pr-1">
                              <span className="text-[6.5px] font-black text-slate-900 tracking-tight block">SCAN TO PAY</span>
                              <span className="text-[5px] font-bold text-slate-400 block mt-0.5">BHIM, GPay, PhonePe, Paytm</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes, Terms & Signature */}
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 items-end">
                        <div className="space-y-1.5 leading-relaxed text-left text-[7.5px] text-slate-500 font-medium">
                          <div>
                            <strong className="text-slate-800 font-bold block">Additional Notes</strong>
                            <p>Thank you for your business.</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 font-bold block">Terms &amp; Conditions</strong>
                            <p>Payment is due within 14 days of invoice date.</p>
                          </div>
                        </div>

                        {(user?.companySignature || companyProfile.signature) ? (
                          <div className="flex flex-col items-end text-right">
                            <div className="h-10 w-auto mb-1 max-w-[120px] flex items-center justify-center">
                              <img src={user?.companySignature || companyProfile.signature} alt="Authorized Signature" className="max-h-full max-w-full object-contain" />
                            </div>
                            <span className="w-24 border-t border-slate-200 mt-1" />
                            <span className="text-[7.5px] font-extrabold text-slate-800 mt-1">Authorized Signature</span>
                            <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wider">{companyProfile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end text-right">
                            <span className="w-24 border-t border-slate-200 mt-1" />
                            <span className="text-[7.5px] font-extrabold text-slate-800 mt-1">Authorized Signature</span>
                            <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wider">{companyProfile.name}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-center text-[7px] text-slate-400 font-extrabold tracking-wide pt-2">
                        Thank you for your business!
                      </p>
                    </div>

                   </div>
                 </div>

               </div>   {/* closes scrollable paper area */}
             </div>
           </div>
        );
      })()}
    </div>
  );
}
