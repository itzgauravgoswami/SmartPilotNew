import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Receipt, Plus, Trash2, Printer, Download, Save, 
  Sparkles, Check, Info, AlertCircle, Mail, RefreshCw 
} from 'lucide-react';
import { api } from '../../utils/api';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'Priya Sharma', business: 'Sharma Consultancy Services', address: 'Sector 45, Gurgaon, Haryana - 122003', email: 'priya@sharmaconsultancy.in' },
  { id: 'c2', name: 'Amit Verma', business: 'Acrux Enterprises', address: 'Plot 28, Industrial Area, Noida, UP - 201301', email: 'billing@acrux.com' },
  { id: 'c3', name: 'Vikram Singh', business: 'Apex Tech Labs', address: 'Phase 8B, Mohali, Punjab - 160055', email: 'finance@apextech.io' }
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Autopilot Premium License', description: 'Lifetime license key for Smart Pilot auto-billing & AI operations.', type: 'Service', price: 14990, tax: 18 },
  { id: 'p2', name: 'API Cloud Subscription', description: 'Monthly subscription for cloud computing resources and API usage.', type: 'Service', price: 6000, tax: 18 },
  { id: 'p3', name: 'Autopilot Hardware Controller', description: 'Physical USB-C workspace telemetry node and status monitor.', type: 'Product', price: 34900, tax: 18 },
  { id: 'p4', name: 'Enterprise Advisory Hours', description: 'Direct consulting hours with a Senior Enterprise Autopilot Architect.', type: 'Service', price: 3500, tax: 18 }
];

export default function InvoiceMaker({ user, onBack }) {
  const location = useLocation();
  const navigate = useNavigate();
  const editInvoice = location.state?.editInvoice;
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  // Pre-load default clients
  const [customers, setCustomers] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const customerData = await api.get('/customers');
        const productData = await api.get('/products');
        const invoiceData = await api.get('/invoices');
        setCustomers(customerData.map(c => ({
          id: c._id,
          name: c.name,
          business: c.business || '',
          address: c.address || '',
          email: c.email || ''
        })));
        setCatalogProducts(productData.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description || '',
          type: p.type || 'Product',
          price: p.price || 0,
          tax: p.tax || 18
        })));

        if (!editInvoice) {
          let nextNum = 1;
          if (invoiceData && invoiceData.length > 0) {
            const numbers = invoiceData.map(inv => {
              const match = inv.invoiceNo ? inv.invoiceNo.match(/\d+/) : null;
              return match ? parseInt(match[0], 10) : 0;
            });
            const maxNum = Math.max(...numbers, 0);
            nextNum = maxNum + 1;
          }
          const paddedNum = String(nextNum).padStart(3, '0');
          setInvoiceNo(`INV-${paddedNum}`);
        }
      } catch (err) {
        console.error("Failed to load customer/product catalog/invoices in InvoiceMaker", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [editInvoice]);

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', business: '', address: '', email: '' });

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || {
    name: 'Customer Name',
    business: 'Client Business Name',
    address: 'Client Billing Address',
    email: 'email@client.com'
  };

  // Invoice parameters
  const [invoiceNo, setInvoiceNo] = useState('INV-001');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 14 days terms
    return today.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('INR (₹)');
  const [status, setStatus] = useState('Draft');

  // Line items state
  const [lineItems, setLineItems] = useState([
    { id: 1, name: '', description: '', qty: 1, price: 0, discount: 0, tax: 0 }
  ]);

  const [paymentInstructions, setPaymentInstructions] = useState('Please scan the UPI QR code to complete the payment instantly.');
  const [notes, setNotes] = useState('Thank you for your business.');
  const [terms, setTerms] = useState('Payment is due within 14 days of invoice date.');

  // Pre-fill payment instructions from user UPI profile
  useEffect(() => {
    if (user?.bankUPI) {
      setPaymentInstructions('Please scan the UPI QR code to complete the payment instantly.');
    } else {
      setPaymentInstructions('Please scan the UPI QR code to complete the payment instantly.');
    }
  }, [user]);

  // Pre-fill editing invoice details if coming from Invoice History
  useEffect(() => {
    if (editInvoice) {
      setEditingInvoiceId(editInvoice._id || editInvoice.id);
      setSelectedCustomerId(editInvoice.customerId);
      setInvoiceNo(editInvoice.invoiceNo || editInvoice.id);
      if (editInvoice.date) {
        setInvoiceDate(editInvoice.date.split('T')[0]);
      }
      if (editInvoice.dueDate) {
        setDueDate(editInvoice.dueDate.split('T')[0]);
      }
      setCurrency(editInvoice.currency || 'INR (₹)');
      setStatus(editInvoice.status || 'Draft');
      setLineItems(editInvoice.items && editInvoice.items.length > 0 ? editInvoice.items.map((item, idx) => ({
        id: idx + 1,
        name: item.name || '',
        description: item.description || '',
        qty: item.qty || 1,
        price: item.price || 0,
        discount: item.discount || 0,
        tax: item.tax || 18
      })) : [{ id: 1, name: '', description: '', qty: 1, price: 0, discount: 0, tax: 0 }]);
      setPaymentInstructions(editInvoice.paymentInstructions || '');
      setNotes(editInvoice.notes || '');
      setTerms(editInvoice.terms || '');
    }
  }, [editInvoice]);

  // Quick add client handler
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    try {
      const client = {
        name: newClient.name,
        business: newClient.business || 'Individual',
        address: newClient.address || 'Address not specified',
        email: newClient.email || 'email@client.com'
      };
      const created = await api.post('/customers', client);
      setCustomers(prev => [...prev, {
        id: created._id,
        name: created.name,
        business: created.business || '',
        address: created.address || '',
        email: created.email || ''
      }]);
      setSelectedCustomerId(created._id);
      setNewClient({ name: '', business: '', address: '', email: '' });
      setShowAddClient(false);
    } catch (err) {
      console.error("Failed to quick add client", err);
    }
  };

  // Line item handlers
  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), name: '', description: '', qty: 1, price: 0, discount: 0, tax: 0 }
    ]);
  };

  const handleRemoveLineItem = (id) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleLineItemChange = (id, field, val) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        let parsed = val;
        if (field === 'qty' || field === 'price' || field === 'discount' || field === 'tax') {
          parsed = val === '' ? '' : parseFloat(val);
        }
        return { ...item, [field]: parsed };
      }
      return item;
    }));
  };

  // Math Calculations
  const calculateRowTotal = (item) => {
    const qty = item.qty || 0;
    const price = item.price || 0;
    const discount = item.discount || 0;
    const tax = item.tax || 0;

    const baseAmount = qty * price;
    const discountedAmount = baseAmount - (baseAmount * (discount / 100));
    const finalAmount = discountedAmount + (discountedAmount * (tax / 100));
    return finalAmount;
  };

  const subtotal = lineItems.reduce((acc, item) => {
    const qty = item.qty || 0;
    const price = item.price || 0;
    return acc + (qty * price);
  }, 0);

  const grandTotal = lineItems.reduce((acc, item) => {
    return acc + calculateRowTotal(item);
  }, 0);

  const totalDiscount = lineItems.reduce((acc, item) => {
    const qty = item.qty || 0;
    const price = item.price || 0;
    const discount = item.discount || 0;
    return acc + ((qty * price) * (discount / 100));
  }, 0);

  const totalTax = lineItems.reduce((acc, item) => {
    const qty = item.qty || 0;
    const price = item.price || 0;
    const discount = item.discount || 0;
    const tax = item.tax || 0;
    const baseAmount = qty * price;
    const discountedAmount = baseAmount - (baseAmount * (discount / 100));
    return acc + (discountedAmount * (tax / 100));
  }, 0);

  const currencySymbol = currency.includes('₹') ? '₹' : currency.includes('$') ? '$' : currency.includes('€') ? '€' : '₹';

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer first.");
      return;
    }

    try {
      setGeneratingPDF(true);
      const invoiceData = {
        customerId: selectedCustomerId,
        invoiceNo: invoiceNo,
        date: invoiceDate,
        dueDate: dueDate,
        currency: currency,
        items: lineItems.map(item => ({
          name: item.name || 'Service or Product',
          description: item.description || '',
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 18,
        })),
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        totalTax: totalTax,
        grandTotal: grandTotal,
        status: status || 'Draft',
        paymentInstructions: paymentInstructions,
        notes: notes,
        terms: terms
      };

      let savedInvoice;
      if (editingInvoiceId) {
        savedInvoice = await api.put(`/invoices/${editingInvoiceId}`, invoiceData);
      } else {
        savedInvoice = await api.post('/invoices', invoiceData);
      }

      navigate('/dashboard/email', {
        state: {
          preSelectCustomerId: savedInvoice.customerId,
          preAttachInvoiceId: savedInvoice._id || savedInvoice.id
        }
      });
    } catch (err) {
      console.error("Failed to auto-save invoice for email redirection", err);
      alert("Failed to auto-save invoice for email dispatch: " + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleDownloadPDF = () => {
    const element = document.querySelector('.invoice-print-area > div');
    if (!element) return;

    setGeneratingPDF(true);

    html2canvas(element, {
      scale: 2.5, // High resolution crispness
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Since the margins are built into the HTML wrapper (p-3), we match the PDF size exactly
      const pdf = new jsPDF('p', 'mm', [210, imgHeight]);

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoiceNo}.pdf`);
      setGeneratingPDF(false);
    }).catch(err => {
      console.error('PDF generation error:', err);
      setGeneratingPDF(false);
      alert('Failed to generate PDF. Please try using the Print button instead.');
    });
  };

  const [savingInvoice, setSavingInvoice] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveInvoice = async () => {
    setSavingInvoice(true);
    setSaveSuccess(false);
    
    // Save invoice details to database
    const invoiceData = {
      customerId: selectedCustomerId || 'c1',
      invoiceNo: invoiceNo,
      date: invoiceDate,
      dueDate: dueDate,
      currency: currency,
      items: lineItems.map(item => ({
        name: item.name || 'Service or Product',
        description: item.description || '',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 18,
      })),
      subtotal: subtotal,
      totalDiscount: totalDiscount,
      totalTax: totalTax,
      grandTotal: grandTotal,
      status: status || 'Draft',
      paymentInstructions: paymentInstructions,
      notes: notes,
      terms: terms
    };
    
    try {
      if (editingInvoiceId) {
        await api.put(`/invoices/${editingInvoiceId}`, invoiceData);
      } else {
        await api.post('/invoices', invoiceData);
      }
      setSavingInvoice(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error("Failed to save invoice to database", err);
      alert(err.message || 'Failed to save invoice.');
      setSavingInvoice(false);
    }
  };

  // Generate UPI QR Code URL
  // Format: upi://pay?pa=address&pn=name&am=amount&cu=INR
  const upiId = user?.bankUPI || 'gauravgoswami@ptyes';
  const upiName = user?.bankAccName || user?.companyName || 'Self Ranker';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${grandTotal.toFixed(2)}&cu=INR`
  )}`;

  const hasBankingDetails = !!(user?.bankName || user?.bankAccName || user?.bankAccNo || user?.bankIFSC || user?.bankUPI);
  const hasPaymentInstructions = !!paymentInstructions;
  const hasLeftColumn = hasBankingDetails || hasPaymentInstructions;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Preparing Invoice Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4 no-print">
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
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Invoices</span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Receipt className="text-orange-500" size={20} />
              <span>{editingInvoiceId ? 'Edit Invoice' : 'Invoice Workspace'}</span>
            </h2>
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT CONTAINER: FORM INPUTS */}
        <div className="xl:col-span-6 space-y-6 no-print text-left">
          
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-[20px] p-5 space-y-5">
            
            {/* Customer select row */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Select Customer *</label>
                <button
                  type="button"
                  onClick={() => setShowAddClient(!showAddClient)}
                  className="text-[10px] font-black text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  + Quick Add Client
                </button>
              </div>

              {showAddClient ? (
                <form onSubmit={handleAddClient} className="p-3 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Client Name *"
                      required
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="Business Name"
                      value={newClient.business}
                      onChange={(e) => setNewClient({ ...newClient, business: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="Billing Address"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-3xs font-extrabold">
                    <button
                      type="button"
                      onClick={() => setShowAddClient(false)}
                      className="px-3 py-1 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-orange-500 text-white rounded-md cursor-pointer hover:bg-orange-600"
                    >
                      Save Client
                    </button>
                  </div>
                </form>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">{c.name} ({c.business})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Dates / Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-855 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  <option value="INR (₹)" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">INR (₹)</option>
                  <option value="USD ($)" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">USD ($)</option>
                  <option value="EUR (€)" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">EUR (€)</option>
                  <option value="GBP (£)" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-855 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="Draft" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Draft</option>
                <option value="Unpaid" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Unpaid</option>
                <option value="Paid" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Paid</option>
              </select>
            </div>

          </div>

          {/* LINE ITEMS */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-[20px] p-5 space-y-4">
            
            <div className="flex justify-between items-center pb-1 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Line Items
              </h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-[10px] font-black text-orange-500 hover:text-orange-650 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Line Item</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-3 relative group">
                  
                  {/* Item header/delete row */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-400"># {idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Main Inputs */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[9px] font-bold text-zinc-550 dark:text-zinc-400 mb-0.5">ITEM NAME *</label>
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const prod = catalogProducts.find(p => p.id === e.target.value);
                            if (prod) {
                              handleLineItemChange(item.id, 'name', prod.name);
                              handleLineItemChange(item.id, 'description', prod.description);
                              handleLineItemChange(item.id, 'price', prod.price);
                              handleLineItemChange(item.id, 'tax', prod.tax);
                            }
                            e.target.value = ""; // reset
                          }}
                          className="text-[9px] font-extrabold text-orange-500 bg-transparent border-none focus:ring-0 cursor-pointer outline-none max-w-[130px]"
                        >
                          <option value="" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Select from catalog...</option>
                          {catalogProducts.map(p => (
                            <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">{p.name} (₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Service or Product name"
                        value={item.name}
                        onChange={(e) => handleLineItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[9px] font-bold text-zinc-555 dark:text-zinc-400 mb-1">QTY *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.qty}
                        onChange={(e) => handleLineItemChange(item.id, 'qty', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">PRICE *</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.price || ''}
                        onChange={(e) => handleLineItemChange(item.id, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">DISCOUNT %</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.discount || ''}
                        onChange={(e) => handleLineItemChange(item.id, 'discount', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">TAX %</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.tax || ''}
                        onChange={(e) => handleLineItemChange(item.id, 'tax', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-bold text-zinc-450 dark:text-zinc-400 mb-1.5">TOTAL</span>
                      <span className="text-2xs font-extrabold text-zinc-800 dark:text-zinc-200">
                        {currencySymbol}{calculateRowTotal(item).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Row Description */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">LINE DESCRIPTION</label>
                    <input
                      type="text"
                      placeholder="Line notes or details..."
                      value={item.description}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-2xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                </div>
              ))}
            </div>

          </div>

          {/* BILLING DEFAULT T&C & NOTES */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-[20px] p-5 space-y-4">
            
            <div>
              <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Payment Details</label>
              <input
                type="text"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Invoice Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full p-3 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows="2"
                className="w-full p-3 bg-slate-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              />
            </div>

          </div>

          {/* TOTALS AND ACTIONS */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-[20px] p-5 space-y-4">
            
            <div className="space-y-2 text-xs font-bold border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Subtotal:</span>
                <span>{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-500">
                <span>Total Discount:</span>
                <span>-{currencySymbol}{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>Total Tax:</span>
                <span>+{currencySymbol}{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 text-sm font-black pt-1.5 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                <span>Invoice Total:</span>
                <span>{currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1 text-xs font-black">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={savingInvoice || saveSuccess}
                className="px-5 py-2.5 bg-white text-zinc-900 hover:bg-slate-100 disabled:bg-zinc-150 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:pointer-events-none border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {savingInvoice ? (
                  <span>Saving...</span>
                ) : saveSuccess ? (
                  <span className="text-emerald-500 flex items-center gap-1"><Check size={13} /> Saved!</span>
                ) : (
                  <>
                    <Save size={13} />
                    <span>{editingInvoiceId ? 'Update Invoice' : 'Save Invoice'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT CONTAINER: LIVE PREVIEW SCREEN */}
        <div className="xl:col-span-6 space-y-4 sticky top-6">
          
          {/* Action Toolbar */}
          <div className="flex justify-between items-center pb-1 no-print text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Live Preview
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800/80 rounded-lg text-3xs font-extrabold text-zinc-750 dark:text-zinc-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Mail size={10} />
                <span>Send Mail</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:bg-zinc-150 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:pointer-events-none border border-zinc-250 dark:border-zinc-800 rounded-lg text-3xs font-black text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 shadow-3xs cursor-pointer"
              >
                {generatingPDF ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3 text-orange-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </span>
                ) : (
                  <>
                    <Download size={10} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PAPER PREVIEW SHEETS */}
          <div className="invoice-print-area bg-[#f4f7fa] dark:bg-zinc-900/40 border border-zinc-250/70 dark:border-zinc-800 rounded-[24px] p-6 sm:p-10 flex justify-center shadow-inner relative overflow-hidden">
            
            {/* The white physical A4 paper page layout */}
            <div className="w-full max-w-[595px] min-h-[680px] bg-white p-3 flex flex-col justify-start text-left text-slate-800 text-[8.5px] leading-relaxed shadow-lg font-sans relative">
              
              {/* Inner Black Bordered Container (Margin/Padding inside the page) */}
              <div 
                style={{ border: '1.5px solid #000000' }}
                className="p-4 flex flex-col justify-start gap-3 w-full flex-1"
              >
                
                {/* 1. Header (Logo / Company Info) */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    {user?.companyLogo && (
                      <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        <img src={user.companyLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <div className="leading-tight">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                        {user?.companyName || 'Self Ranker'}
                      </h4>
                      <p className="text-[7.5px] text-slate-500 max-w-[180px] mt-0.5 leading-normal">
                        {user?.companyAddress || 'New Palam Vihar, Gurugram, Haryana - 122001'}
                      </p>
                      {user?.companyPhone && <p className="text-[7px] text-slate-450 mt-0.5">Ph: {user.companyPhone}</p>}
                    </div>
                  </div>

                  <div className="text-right leading-tight">
                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase tracking-wider">INVOICE</h3>
                    <p className="text-[7.5px] text-slate-550 mt-1 font-semibold">Invoice No: <strong className="text-slate-800 font-extrabold">{invoiceNo}</strong></p>
                    <p className="text-[7.5px] text-slate-550 font-semibold">Date: <span className="text-slate-800 font-extrabold">{invoiceDate}</span></p>
                    <p className="text-[7.5px] text-slate-550 font-semibold">Due Date: <span className="text-slate-800 font-extrabold">{dueDate}</span></p>
                    <span className="inline-block text-[7px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                      Status: {status}
                    </span>
                  </div>
                </div>

                {/* 2. Client Details Section */}
                <div className="grid grid-cols-2 gap-4 py-1.5 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">Billed To:</span>
                    <h5 className="font-extrabold text-slate-900 text-[10px]">{activeCustomer.name}</h5>
                    {activeCustomer.business && <p className="text-slate-550 leading-relaxed font-medium text-[8px]">{activeCustomer.business}</p>}
                    {activeCustomer.address && <p className="text-slate-550 leading-relaxed font-medium max-w-[180px] text-[7.5px]">{activeCustomer.address}</p>}
                  </div>
                  <div className="space-y-0.5 text-right sm:text-left sm:pl-8">
                    {activeCustomer.email && (
                      <>
                        <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">Contact Details:</span>
                        <p className="text-slate-900 font-bold mt-0.5 text-[8.5px]">{activeCustomer.email}</p>
                      </>
                    )}
                    {user?.companyGST && (
                      <p className="text-slate-500 mt-1.5 text-[7.5px] font-semibold">
                        GSTIN: <span className="text-slate-800 font-extrabold">{user.companyGST}</span>
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
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-100 font-medium">
                          <td className="py-2">
                            <span className="font-extrabold text-slate-900 block text-[9px]">{item.name || 'Service or Product'}</span>
                            {item.description && (
                              <span className="text-[7.5px] text-slate-450 block mt-0.5">{item.description}</span>
                            )}
                          </td>
                          <td className="py-2 text-center text-slate-900 font-bold text-[8.5px]">{item.qty || 1}</td>
                          <td className="py-2 text-right text-slate-500 font-semibold text-[8.5px]">{currencySymbol}{(item.price || 0).toFixed(2)}</td>
                          <td className="py-2 text-right text-slate-500 text-[8.5px]">{item.discount || 0}%</td>
                          <td className="py-2 text-right text-slate-500 text-[8.5px]">{item.tax || 0}%</td>
                          <td className="py-2 text-right text-slate-900 font-extrabold text-[8.5px]">
                            {currencySymbol}{calculateRowTotal(item).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              {/* 4. Bottom Block (Totals, Signature, Banking & UPI QR) */}
              <div className="space-y-5">
                {/* Banking details, UPI QR, and Subtotal Block */}
                <div className="grid grid-cols-12 gap-4 border-t border-slate-200 pt-5 items-stretch">
                  
                  {/* Banking Info & Payment Details (col-span-7) */}
                  {hasLeftColumn && (
                    <div className="col-span-7 h-full flex flex-col">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[8.5px] text-left h-full flex flex-col justify-between">
                        <div>
                          <span className="font-black text-slate-900 block mb-2 uppercase tracking-wider text-[9.5px] border-b border-slate-200 pb-1.5">Payment Details</span>
                          
                          <div className="space-y-1 font-semibold text-slate-650 text-[8.5px]">
                            {hasBankingDetails && (
                              <div className="space-y-2.5 pb-1.5 border-b border-slate-200/60 mb-1.5">
                                {user.bankName && <p>Bank: <strong className="text-slate-800">{user.bankName}</strong></p>}
                                {user.bankAccName && <p>A/C Name: <strong className="text-slate-800">{user.bankAccName}</strong></p>}
                                {user.bankAccNo && <p>A/C No: <strong className="text-slate-800">{user.bankAccNo}</strong></p>}
                                {user.bankIFSC && <p>IFSC: <strong className="text-slate-800">{user.bankIFSC}</strong></p>}
                                {user.bankUPI && <p>UPI ID: <strong className="text-slate-800">{user.bankUPI}</strong></p>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {hasPaymentInstructions && (
                          <p className="leading-tight text-[8px] text-slate-500 font-medium italic mt-2">
                            {paymentInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Calculations & UPI QR (col-span-5 or col-span-12) */}
                  <div className={`${hasLeftColumn ? 'col-span-5' : 'col-span-12 flex flex-col items-end'} space-y-4 text-right`}>
                    
                    {/* Subtotal & Total display */}
                    <div className="space-y-1.5 font-bold text-[8.5px] w-full max-w-[180px]">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Subtotal:</span>
                        <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Discount:</span>
                        <span>-{currencySymbol}{totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Tax:</span>
                        <span>+{currencySymbol}{totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 text-xs font-black border-t border-slate-250 pt-1.5">
                        <span>Grand Total:</span>
                        <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    {user?.bankUPI && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="w-[84px] h-[84px] p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-xs">
                          <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-right leading-none pr-1">
                          <span className="text-[6.5px] font-black text-slate-900 tracking-tight block">SCAN TO PAY</span>
                          <span className="text-[5px] font-bold text-slate-400 block mt-0.5">BHIM, GPay, PhonePe, Paytm</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Additional Notes & Signature footer */}
                {(notes || terms || user?.companySignature) && (
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 items-end">
                    <div className="space-y-1.5 leading-relaxed text-left text-[7.5px] text-slate-500 font-medium">
                      {notes && (
                        <div>
                          <strong className="text-slate-800 font-bold block">Additional Notes</strong>
                          <p>{notes}</p>
                        </div>
                      )}
                      {terms && (
                        <div>
                          <strong className="text-slate-800 font-bold block">Terms & Conditions</strong>
                          <p>{terms}</p>
                        </div>
                      )}
                    </div>

                    {/* Authorized Signature */}
                    {user?.companySignature ? (
                      <div className="flex flex-col items-end text-right">
                        <div className="h-10 w-auto mb-1 max-w-[120px] flex items-center justify-center">
                          <img src={user.companySignature} alt="Authorized Signature" className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="w-24 border-t border-slate-200 mt-1" />
                        <span className="text-[7.5px] font-extrabold text-slate-800 mt-1">Authorized Signature</span>
                        <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wider">{user?.companyName || 'Self Ranker'}</span>
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-center text-[7px] text-slate-400 font-extrabold tracking-wide pt-2">
                  Thank you for your business!
                </p>

              </div> {/* Closes space-y-5 */}
            </div> {/* Closes inner black-bordered container */}
          </div> {/* Closes outer white physical page */}

          </div>

        </div>

      </div>

    </div>
  );
}
