// src/components/WhatsAppLeadModal.jsx
// The "fast grab" itself: two fields, one tap, then straight into WhatsApp.
//
// Speed is the feature. The visitor already decided to chat — anything that
// makes them wait loses both the lead AND the chat. So:
//   • Phone is focused the moment the sheet opens (numeric keypad on mobile).
//   • Name is the only other field, and it is optional.
//   • Submitting opens WhatsApp on that same gesture; the CRM write happens
//     in the background and is never awaited.
//
// There is deliberately no way through this sheet to WhatsApp without a
// number. Closing it (X, backdrop, Escape) cancels and stays on the page —
// it must never double as a bypass, or the number becomes optional in
// practice and the whole capture is pointless.
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ShieldCheck, X, Loader2 } from 'lucide-react';
import { toTenDigits, isValidIndianMobile } from '@/lib/whatsappLeadCapture';

const WhatsAppLeadModal = ({ isOpen, onClose, onSubmit, project }) => {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const phoneRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setBusy(false);
    // Small delay so the entry animation doesn't fight the keyboard on mobile.
    const t = setTimeout(() => phoneRef.current?.focus(), 220);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Escape cancels — it closes the sheet and stays put. It does not hand the
  // visitor on to WhatsApp; nothing here does without a number.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (busy) return;

    if (!isValidIndianMobile(phone)) {
      setError('कृपया 10 अंकों का सही मोबाइल नंबर डालें');
      phoneRef.current?.focus();
      return;
    }
    setBusy(true);
    // Synchronous by contract — onSubmit opens WhatsApp inside this gesture.
    onSubmit({ name: name.trim(), phone: toTenDigits(phone) });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-grab-title"
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition"
            >
              <X size={20} />
            </button>

            <div className="bg-[#25D366] px-6 pt-7 pb-6 text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle size={26} fill="white" className="text-white" />
                </div>
                <div>
                  <h2 id="wa-grab-title" className="text-xl font-extrabold leading-tight">
                    WhatsApp पर बात करें
                  </h2>
                  <p className="text-white/90 text-sm">
                    {project
                      ? `${project} — रेट लिस्ट व प्लॉट डिटेल तुरंत`
                      : 'रेट लिस्ट व प्लॉट डिटेल तुरंत भेजेंगे'}
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-6 pt-5 space-y-4"
              // Clears the iOS home indicator when the sheet is docked to the bottom.
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <div className="space-y-1.5">
                <label htmlFor="wa-phone" className="text-sm font-semibold text-gray-800">
                  मोबाइल नंबर <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch rounded-xl border-2 border-gray-200 focus-within:border-[#25D366] transition-colors overflow-hidden">
                  <span className="px-3 flex items-center bg-gray-50 text-gray-600 font-semibold border-r border-gray-200 select-none">
                    +91
                  </span>
                  <input
                    id="wa-phone"
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (error) setError('');
                    }}
                    className="flex-1 min-w-0 h-12 px-3 text-lg tracking-wide outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="wa-name" className="text-sm font-semibold text-gray-800">
                  आपका नाम <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="wa-name"
                  type="text"
                  autoComplete="name"
                  placeholder="जैसे: राहुल शर्मा"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border-2 border-gray-200 focus:border-[#25D366] outline-none transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm font-medium" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] disabled:opacity-70 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 transition-all"
              >
                {busy ? (
                  <><Loader2 size={20} className="animate-spin" /> खुल रहा है…</>
                ) : (
                  <><MessageCircle size={22} fill="white" /> चैट शुरू करें</>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck size={13} className="text-green-600 shrink-0" />
                <span>आपका नंबर सुरक्षित है — सिर्फ प्रॉपर्टी की जानकारी के लिए</span>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppLeadModal;
