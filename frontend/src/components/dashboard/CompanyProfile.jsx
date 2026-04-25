import React, { useState } from 'react';
import { api } from '../../utils/api';
import { 
  Building, Phone, Mail, Award, Landmark, 
  User, Check, AlertCircle, RefreshCw, Upload, Image as ImageIcon, FileText, X 
} from 'lucide-react';

export default function CompanyProfile({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    companyName: user.companyName || '',
    companyAddress: user.companyAddress || '',
    companyPhone: user.companyPhone || '',
    companyEmail: user.companyEmail || '',
    companyGST: user.companyGST || '',
    bankName: user.bankName || '',
    bankAccName: user.bankAccName || '',
    bankAccNo: user.bankAccNo || '',
    bankIFSC: user.bankIFSC || '',
    bankUPI: user.bankUPI || '',
    companyLogo: user.companyLogo || '',
    companySignature: user.companySignature || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const data = await api.put('/user/profile', formData);
      onUpdate(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update company profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="text-left">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Building className="text-orange-500" size={22} />
            <span>Company Profile Setup</span>
          </h2>
          <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
            Configure default settings for your invoices and business operations
          </p>
        </div>
      </div>

      {/* Dynamic Live Preview Business Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl text-left">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Card Content */}
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
          
          {/* Left Details */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              {formData.companyLogo ? (
                <img 
                  src={formData.companyLogo} 
                  alt="Company Logo Preview" 
                  className="w-10 h-10 object-contain bg-white rounded-lg p-1 border border-zinc-800" 
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                  <Building size={18} />
                </div>
              )}
              <div>
                <h4 className="font-black text-sm text-zinc-50 leading-tight">
                  {formData.companyName || 'Your Company Name'}
                </h4>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                  GSTIN: {formData.companyGST || 'Not Configured'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80 text-[10px] font-bold text-zinc-400">
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Contact Phone</span>
                <span className="text-zinc-300">{formData.companyPhone || '+91 XXXXX XXXXX'}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Contact Email</span>
                <span className="text-zinc-300">{formData.companyEmail || 'billing@company.com'}</span>
              </div>
            </div>
            
            <div className="space-y-1 text-[10px] font-bold text-zinc-400">
              <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Billing Address</span>
              <p className="text-zinc-300 line-clamp-1">{formData.companyAddress || 'No Address Provided'}</p>
            </div>
          </div>

          {/* Right Banking details */}
          <div className="md:w-64 bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md rounded-2xl p-4.5 flex flex-col justify-between shrink-0 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Default Bank</span>
                  <span className="text-[10px] font-black text-zinc-200 mt-0.5 block">{formData.bankName || 'Not Set'}</span>
                </div>
                <Landmark size={14} className="text-orange-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-400">
                <div>
                  <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Holder Name</span>
                  <span className="text-zinc-300 block truncate">{formData.bankAccName || 'No Name'}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider">Acc Number</span>
                  <span className="text-zinc-300 block truncate">{formData.bankAccNo || 'No Acc'}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl flex justify-between items-center text-[10px] font-black">
              <span className="text-orange-400">UPI ID</span>
              <span className="text-zinc-100">{formData.bankUPI || 'Not Configured'}</span>
            </div>
          </div>

        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-left animate-fade-in">
            <Check size={16} className="shrink-0 animate-bounce" />
            <span>Company Profile details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-red-800 dark:text-red-300 text-xs font-bold text-left animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GENERAL BUSINESS INFORMATION */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4 text-left shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-2 mb-1">
              <Building size={14} />
              <span>Business Identity</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Company Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400"><Building size={13} /></span>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Self Ranker"
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Company Address</label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  placeholder="e.g. New Palam Vihar, Gurugram, Haryana - 122001"
                  rows="3.5"
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Contact Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400"><Phone size={13} /></span>
                    <input
                      type="text"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Contact Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400"><Mail size={13} /></span>
                    <input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleChange}
                      placeholder="e.g. support@selfranker.com"
                      className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">GSTIN / TAX Identification No</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400"><Award size={13} /></span>
                  <input
                    type="text"
                    name="companyGST"
                    value={formData.companyGST}
                    onChange={handleChange}
                    placeholder="e.g. 06AAAAA1111A1Z1"
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT & ASSETS SETUP */}
          <div className="space-y-6">
            
            {/* BANKING CREDENTIALS */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4 text-left shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-2 mb-1">
                <Landmark size={14} />
                <span>Banking Credentials</span>
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g. Canara Bank"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Holder Name</label>
                    <input
                      type="text"
                      name="bankAccName"
                      value={formData.bankAccName}
                      onChange={handleChange}
                      placeholder="e.g. Gaurav Goswami"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Account Number</label>
                    <input
                      type="text"
                      name="bankAccNo"
                      value={formData.bankAccNo}
                      onChange={handleChange}
                      placeholder="e.g. 5056293382942"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">IFSC Code</label>
                    <input
                      type="text"
                      name="bankIFSC"
                      value={formData.bankIFSC}
                      onChange={handleChange}
                      placeholder="e.g. CNRB0002482"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">UPI Address / VPA</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 text-[10px] font-black uppercase">UPI:</span>
                    <input
                      type="text"
                      name="bankUPI"
                      value={formData.bankUPI}
                      onChange={handleChange}
                      placeholder="e.g. gauravgoswami@ptyes"
                      className="w-full pl-11 pr-3.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BRANDING LOGO & DIGITAL SIGNATURE */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4 text-left shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-2 mb-1">
                <ImageIcon size={14} />
                <span>Branding Assets</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* LOGO UPLOAD */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Company Logo</span>
                  <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] relative bg-slate-50/50 dark:bg-zinc-900/10 group">
                    {formData.companyLogo ? (
                      <div className="w-full h-16 flex items-center justify-center relative">
                        <img src={formData.companyLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, companyLogo: '' }))}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-650 text-white rounded-full transition-transform cursor-pointer flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center">
                        <Upload size={18} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        <span className="text-[10px] text-zinc-400 font-black mt-1 group-hover:text-zinc-650 dark:group-hover:text-zinc-200">Select Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'companyLogo')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* SIGNATURE UPLOAD */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase">Auth Signature</span>
                  <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] relative bg-slate-50/50 dark:bg-zinc-900/10 group">
                    {formData.companySignature ? (
                      <div className="w-full h-16 flex items-center justify-center relative">
                        <img src={formData.companySignature} alt="Signature Preview" className="max-h-full max-w-full object-contain bg-white rounded-md p-1" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, companySignature: '' }))}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-650 text-white rounded-full transition-transform cursor-pointer flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center">
                        <FileText size={18} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        <span className="text-[10px] text-zinc-400 font-black mt-1 group-hover:text-zinc-650 dark:group-hover:text-zinc-200">Upload Sign</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'companySignature')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check size={13} />
                <span>Save Company Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
