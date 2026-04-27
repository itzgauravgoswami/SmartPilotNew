import React, { useState } from 'react';
import { AlertCircle, Monitor, Smartphone, X } from 'lucide-react';

export default function DeviceLimitDialog({
  isOpen,
  plan,
  maxDevices,
  activeSessions = [],
  onContinue,
  onCancel,
}) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSessionId) {
      onContinue(selectedSessionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-zinc-900/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 text-left animate-scale-up z-10 text-zinc-300">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-950/30 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-100">Device Limit Reached</h3>
            <p className="text-2xs text-orange-400 font-semibold uppercase tracking-wider mt-0.5">{plan} Plan ({maxDevices} Devices Max)</p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
          Your account is currently active on the maximum allowed number of devices. To log in on this device, select an active session below to terminate.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {activeSessions.map((session) => (
              <label
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
                  selectedSessionId === session.id
                    ? 'border-orange-500 bg-orange-950/20 text-zinc-100'
                    : 'border-zinc-850 bg-zinc-900/40 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-zinc-500">
                    {session.deviceType === 'mobile' ? (
                      <Smartphone size={16} />
                    ) : (
                      <Monitor size={16} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-200">{session.deviceName || 'Unknown Device'}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">IP: {session.ipAddress} • Active: {session.lastActive}</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="evictSession"
                  value={session.id}
                  checked={selectedSessionId === session.id}
                  onChange={() => setSelectedSessionId(session.id)}
                  className="accent-orange-500 cursor-pointer w-4 h-4"
                />
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-3 border-t border-zinc-800/80 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSessionId}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-650 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              Disconnect & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
