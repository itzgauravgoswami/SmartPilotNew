import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { 
  Mail, Send, Sparkles, Search, Eye, Trash2, Calendar, 
  FileText, Check, AlertCircle, RefreshCw, Paperclip, X, ArrowLeft 
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

export default function Email({ user, onBack }) {
  const navigate = useNavigate();
  // --- Load Clients & Invoices & Email logs ---
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sentLog, setSentLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const customerData = await api.get('/customers');
        const invoiceData = await api.get('/invoices');
        const emailData = await api.get('/emails');
        setCustomers(customerData.map(c => ({
          id: c._id,
          name: c.name,
          business: c.business || '',
          address: c.address || '',
          email: c.email || ''
        })));
        setInvoices(invoiceData.map(inv => ({
          ...inv,
          id: inv._id // Map _id to id
        })));
        setSentLog(emailData.map(e => ({
          id: e._id,
          recipientName: e.recipientName,
          email: e.email,
          subject: e.subject,
          body: e.body,
          attachedInvoice: e.attachedInvoice,
          date: e.date,
          status: e.status
        })));
      } catch (err) {
        console.error("Failed to load email page data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Calculate campaign count in last 24h ---
  const sentCount24h = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return sentLog.filter(e => new Date(e.date).getTime() >= oneDayAgo).length;
  }, [sentLog]);

  // --- Form States ---
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachedInvoiceId, setAttachedInvoiceId] = useState('');
  
  // Filter invoices belonging to the selected client
  const clientInvoices = useMemo(() => {
    if (!selectedCustomerId) return invoices;
    return invoices.filter(inv => inv.customerId === selectedCustomerId);
  }, [invoices, selectedCustomerId]);
  
  // --- AI Draft Assistant States ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  
  // --- SMTP Sending Simulation States ---
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();

  // Sync incoming state from navigation (e.g. from Invoice History redirect)
  useEffect(() => {
    if (location.state) {
      const { preSelectCustomerId, preAttachInvoiceId } = location.state;
      if (preSelectCustomerId) {
        setSelectedCustomerId(preSelectCustomerId);
        const client = customers.find(c => c.id === preSelectCustomerId);
        if (client) {
          setToEmail(client.email || '');
        }
      }
      if (preAttachInvoiceId) {
        setAttachedInvoiceId(preAttachInvoiceId);
      }
    }
  }, [location.state, customers]);

  // --- Detailed View Modal ---
  const [selectedMailLog, setSelectedMailLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Sync Recipient Email when Customer changes ---
  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAttachedInvoiceId(''); // Reset attached invoice when client changes
    const client = customers.find(c => c.id === customerId);
    if (client) {
      setToEmail(client.email || '');
    } else {
      setToEmail('');
    }
  };

  // --- Generate Draft with AI ---
  const handleGenerateAIDraft = async () => {
    if (!aiPrompt.trim()) return;

    setGeneratingDraft(true);
    setError('');

    // Fetch context
    const selectedClient = customers.find(c => c.id === selectedCustomerId) || {};
    const selectedInvoice = invoices.find(i => i.id === attachedInvoiceId) || {};

    const promptMessage = `
You are the Smart Pilot CRM Email Writer. Draft a professional B2B email based on this instruction: "${aiPrompt}".
Context details:
- Client Name: ${selectedClient.name || 'Valued Client'}
- Client Business: ${selectedClient.business || 'Individual'}
${attachedInvoiceId ? `- Attached Invoice Number: ${selectedInvoice.invoiceNo || selectedInvoice.id}\n- Due Date: ${selectedInvoice.dueDate}\n- Invoice Total: ₹${selectedInvoice.grandTotal}` : ''}

Output the draft formatted EXACTLY like this:
Subject: [Draft Subject]
Body:
[Draft Body]
`;

    try {
      const data = await api.post('/ai/chat', { message: promptMessage });
      const text = data.response || '';

      // Parse Subject and Body
      const subjectMatch = text.match(/Subject:\s*(.*)/i);
      const bodyMatch = text.match(/Body:\s*([\s\S]*)/i);

      let draftSubject = subjectMatch ? subjectMatch[1].trim() : `Message from Smart Pilot`;
      let draftBody = bodyMatch ? bodyMatch[1].trim() : text.trim();

      const actualName = user?.name || 'Gaurav Goswami';
      const actualCompany = user?.companyName || 'Smart Pilot';

      const cleanPlaceholders = (val) => {
        return val
          .replace(/\[Your Name\/Your Company Name\]/gi, `${actualName} / ${actualCompany}`)
          .replace(/\[Your Name \/ Your Company Name\]/gi, `${actualName} / ${actualCompany}`)
          .replace(/\[Your Name\]/gi, actualName)
          .replace(/\[Your Company Name\]/gi, actualCompany)
          .replace(/\[Company Name\]/gi, actualCompany)
          .replace(/\[Your Title\]/gi, 'Owner')
          .replace(/\[Your Phone Number\]/gi, user?.companyPhone || '')
          .replace(/\[Your Contact Information\]/gi, user?.companyEmail || user?.email || '');
      };

      setSubject(cleanPlaceholders(draftSubject));
      setBody(cleanPlaceholders(draftBody));
      setAiPrompt('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate AI draft. Please ensure Gemini API is online.');
      // Local fallback
      const fallbackSubject = attachedInvoiceId 
        ? `Overdue Payment Reminder: Invoice ${selectedInvoice.invoiceNo || attachedInvoiceId}` 
        : `Update regarding Smart Pilot services`;
      const fallbackBody = `Dear ${selectedClient.name || 'Client'},\n\nI hope this email finds you well.\n\nThis is a payment update regarding invoice ${selectedInvoice.invoiceNo || attachedInvoiceId || 'pending'}. The total outstanding balance is ₹${(selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}.\n\nPlease let us know when we can expect the clearance.\n\nBest regards,\nSmart Pilot Autopilot Node`;
      
      setSubject(fallbackSubject);
      setBody(fallbackBody);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // --- Send Email ---
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in To, Subject, and Body fields.');
      return;
    }

    if (user?.plan === 'Starter' && sentCount24h >= 10) {
      setError('Free plan AI email limit reached (maximum 10 AI emails per 24 hours). Please upgrade to Premium for unlimited emails.');
      return;
    }

    setSending(true);
    setError('');

    const selectedClient = customers.find(c => c.id === selectedCustomerId) || {};
    const selectedInvoice = invoices.find(i => i.id === attachedInvoiceId);

    let pdfData = null;
    let pdfName = null;

    if (attachedInvoiceId && !selectedInvoice) {
      setError('Error: Selected invoice details could not be found in local state. Please re-select the invoice.');
      setSending(false);
      return;
    }

    if (attachedInvoiceId && selectedInvoice) {
      const element = document.getElementById('email-invoice-pdf-render');
      if (!element) {
        setError('Error: Invoice render element not found. Please try re-selecting the invoice to refresh the page.');
        setSending(false);
        return;
      }

      let clone = null;
      try {
        clone = element.cloneNode(true);
        clone.style.zoom = '1';
        clone.style.position = 'fixed';
        clone.style.top = '0px';
        clone.style.left = '-9999px';
        clone.style.background = '#ffffff';
        document.body.appendChild(clone);

        // Give browser a frame to lay out the clone before capturing
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(clone, {
          scale: 2.0, // Standard scale for stable output
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', [210, imgHeight]);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        const pdfOutput = pdf.output('datauristring');
        pdfData = pdfOutput.split(';base64,')[1];
        pdfName = `${selectedInvoice.invoiceNo || selectedInvoice.id}.pdf`;

        if (!pdfData || pdfData.length < 100) {
          throw new Error('PDF compilation produced empty data stream.');
        }
      } catch (pdfErr) {
        console.error("Failed to generate PDF attachment:", pdfErr);
        setError('Failed to compile PDF invoice: ' + pdfErr.message);
        setSending(false);
        return;
      } finally {
        if (clone && document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
      }
    }

    const mailData = {
      recipientName: selectedClient.name || 'Custom Contact',
      email: toEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
      attachedInvoice: attachedInvoiceId || 'None',
      pdfData,
      pdfName
    };

    try {
      const created = await api.post('/emails', mailData);
      setSentLog(prev => [{
        id: created._id,
        recipientName: created.recipientName,
        email: created.email,
        subject: created.subject,
        body: created.body,
        attachedInvoice: created.attachedInvoice,
        date: created.date,
        status: created.status
      }, ...prev]);
      setSuccess(true);
      
      // Reset form
      setSelectedCustomerId('');
      setToEmail('');
      setSubject('');
      setBody('');
      setAttachedInvoiceId('');

      setTimeout(() => setSuccess(false), 3000);
      setSending(false);
    } catch (err) {
      console.error("Failed to send/store email", err);
      setError(err.message || 'Failed to send email. Please check your SMTP settings.');
      setSending(false);
    }
  };

  // --- Delete Sent Log ---
  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this sent email record?')) {
      try {
        await api.delete(`/emails/${id}`);
        setSentLog(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error("Failed to delete email log", err);
      }
    }
  };

  // --- Filtered Sent Logs ---
  const filteredSentLogs = useMemo(() => {
    return sentLog.filter(s => {
      const query = searchQuery.toLowerCase();
      return s.recipientName.toLowerCase().includes(query) || 
             s.email.toLowerCase().includes(query) ||
             s.subject.toLowerCase().includes(query);
    });
  }, [sentLog, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Compose Center...</p>
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
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">CRM Campaigner</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">AI Email Composer</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
          <Sparkles size={12} className="animate-pulse" />
          <span>Gemini Campaign Active</span>
        </div>
      </div>

      {user?.plan === 'Starter' && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              <span>Starter Plan Limitations</span>
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-orange-200/90 font-semibold leading-normal">
              You are currently on the Free plan, which limits campaign AI emails to 10 per 24 hours. You have utilized <strong className="text-orange-500 font-black">{sentCount24h} of 10</strong> available campaign dispatches. Upgrade to Premium for unlimited campaign emails.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings', { state: { activeTab: 'billing' } })}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Email Composer Form */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[24px] p-5 space-y-4 shadow-2xs">
          
          <h3 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2.5 text-left">
            <Mail size={14} />
            <span>Draft Message</span>
          </h3>

          <form onSubmit={handleSendEmail} className="space-y-4 text-left font-semibold text-xs">
            
            {/* Status updates */}
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                <Check size={14} className="shrink-0" />
                <span>Email dispatched and delivered successfully!</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-800 dark:text-red-300 text-[11px] font-black">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Senders dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Select Client</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">{c.name} ({c.business || 'Individual'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">To (Recipient Email) *</label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="e.g. client@business.com"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Attachment selector */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Attach Invoice File</label>
                {attachedInvoiceId && (
                  <span className="text-[9px] font-black text-emerald-500 flex items-center gap-0.5">
                    <Check size={10} /> Attached
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400"><Paperclip size={13} /></span>
                <select
                  value={attachedInvoiceId}
                  onChange={(e) => setAttachedInvoiceId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">-- No Attachment --</option>
                  {clientInvoices.map(inv => (
                    <option key={inv.id} value={inv.id} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">{inv.invoiceNo || inv.id} - ₹{inv.grandTotal.toLocaleString('en-IN')} ({inv.status})</option>
                  ))}
                </select>
              </div>

              {/* Visual Attachment Verification Card */}
              {attachedInvoiceId && (() => {
                const inv = invoices.find(i => i.id === attachedInvoiceId);
                if (!inv) return null;
                return (
                  <div className="mt-2.5 p-3 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/30 rounded-xl flex items-center justify-between animate-fade-in text-[10px]">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-orange-500 animate-pulse" />
                      <div className="text-left leading-tight">
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block">{inv.invoiceNo || inv.id}</span>
                        <span className="block text-[8px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Total: ₹{inv.grandTotal.toLocaleString('en-IN')} · Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-black uppercase bg-orange-500 text-white px-2 py-0.5 rounded-full tracking-wider shadow-sm">PDF Ready</span>
                  </div>
                );
              })()}
            </div>

            {/* AI Prompting section */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-[#e8ecf4] dark:border-zinc-900 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider">
                <Sparkles size={13} className="animate-pulse" />
                <span>Autopilot AI Draft Assistant</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold leading-normal">
                Tell Gemini what to draft (e.g. "Draft a gentle payment reminder for past due balance" or "Write a thank you note for client renewal").
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write a payment reminder..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAIDraft}
                  disabled={generatingDraft || !aiPrompt.trim()}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] tracking-wider uppercase transition-all shadow-md shadow-orange-500/25 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {generatingDraft ? (
                    <>
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Invoice Payment Update - INV-12345"
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Email Body *</label>
              <textarea
                required
                rows="7"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear client, ..."
                className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 resize-none font-sans"
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {sending ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Dispatched SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Send Campaign</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Right Pane: Campaign logs history */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 space-y-4 shadow-2xs text-left">
          
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Campaign History</h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">SMTP Server transmission logs</p>
          </div>

          {/* Search Logs */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Log List */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredSentLogs.length > 0 ? (
              filteredSentLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedMailLog(log)}
                  className="bg-slate-50/50 dark:bg-zinc-900/35 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-900 rounded-2xl p-4.5 transition-all cursor-pointer flex justify-between items-start text-xs font-semibold relative border-t-2 border-t-orange-500/10 group"
                >
                  <div className="space-y-2 flex-1 min-w-0 pr-3">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="text-zinc-800 dark:text-zinc-200 font-extrabold truncate">{log.recipientName}</h4>
                      <span className="text-[8px] font-black text-zinc-400 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-900 px-2 py-0.5 rounded-full uppercase">
                        {log.attachedInvoice !== 'None' ? `Attached: ${invoices.find(i => i.id === log.attachedInvoice)?.invoiceNo || log.attachedInvoice}` : 'No Attach'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[10px] text-zinc-700 dark:text-zinc-300 truncate font-extrabold">{log.subject}</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-400 line-clamp-1">{log.body}</p>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400">
                      <Calendar size={10} />
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-black uppercase flex items-center gap-0.5"><Check size={8} strokeWidth={3} /> {log.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 self-center">
                    <button
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-950 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 italic text-[11px]">
                <span>No sent mails recorded in SMTP log</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* sent Mail Preview Modal */}
      {selectedMailLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative text-left space-y-4">
            
            <button
              onClick={() => setSelectedMailLog(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Sent campaign details</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight truncate">
                {selectedMailLog.subject}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850/50 text-[10px] font-bold text-zinc-400">
              <div>
                <span className="block text-[8px] font-black text-zinc-550 dark:text-zinc-500 uppercase">To:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{selectedMailLog.recipientName}</span>
                <span className="block text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5 font-medium">{selectedMailLog.email}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-zinc-550 dark:text-zinc-500 uppercase">Sent Details:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{new Date(selectedMailLog.date).toLocaleString()}</span>
                <span className="block text-emerald-500 text-[9px] mt-0.5 uppercase font-black">{selectedMailLog.status}</span>
              </div>
            </div>

            {selectedMailLog.attachedInvoice !== 'None' && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                <FileText size={14} />
                <span>Invoice attachment: {invoices.find(i => i.id === selectedMailLog.attachedInvoice)?.invoiceNo || selectedMailLog.attachedInvoice}</span>
              </div>
            )}

            <div className="space-y-1">
              <span className="block text-[8px] font-black text-zinc-500 uppercase">Body Content</span>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-900 rounded-2xl text-[11px] leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200 overflow-y-auto max-h-48 whitespace-pre-wrap font-sans">
                {selectedMailLog.body}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedMailLog(null)}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden Invoice PDF Render Container */}
      {attachedInvoiceId && (() => {
        const inv = invoices.find(i => i.id === attachedInvoiceId);
        if (!inv) return null;
        
        const client = customers.find(c => c.id === inv.customerId) || {
          name: 'Customer Name', business: 'Client Business Name',
          address: 'Client Billing Address', email: 'email@client.com'
        };
        const companyProfile = {
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
        const upiId = companyProfile.upi || 'gauravgoswami@ptyes';
        const upiName = companyProfile.bankAccName || companyProfile.name || 'Self Ranker';
        const grandTotal = Number(inv.grandTotal) || 0;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${grandTotal.toFixed(2)}&cu=INR`
        )}`;
        const hasBanking = !!(companyProfile.bankName || companyProfile.bankAccName || companyProfile.bankAccNo || companyProfile.bankIFSC || companyProfile.upi);

        return (
          <div className="absolute top-0 left-[-9999px]" style={{ width: '595px', minHeight: '842px' }}>
            <div
              id="email-invoice-pdf-render"
              className="w-[595px] min-h-[842px] bg-white p-3 flex flex-col justify-start text-left text-slate-800 text-[8.5px] leading-relaxed shadow-lg font-sans mx-auto"
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
                      Invoice No: <strong className="text-slate-800 font-extrabold">{inv.invoiceNo || inv.id}</strong>
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
                        <p>{inv.notes || 'Thank you for your business.'}</p>
                      </div>
                      <div>
                        <strong className="text-slate-800 font-bold block">Terms &amp; Conditions</strong>
                        <p>{inv.terms || 'Payment is due within 14 days of invoice date.'}</p>
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
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
