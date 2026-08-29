// src/components/WhatsAppLeadModal.jsx
// The lead form that stands in for every WhatsApp CTA on the site.
//
// The visitor never gets sent to WhatsApp. They leave a number here and the
// sales team reaches out — so this sheet is the end of the journey, not a
// waypoint, and it has to say so plainly and then confirm that it worked.
//
//   • Phone is focused the moment the sheet opens (numeric keypad on mobile).
//   • Name is the only other field, and it is optional.
//   • Submitting shows a confirmation; the CRM write and the notification
//     email go out in the background and are never awaited.
//
// Closing (X, backdrop, Escape) cancels and stays on the page. Nothing here
// leads anywhere except through the form.
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { toTenDigits, isValidIndianMobile } from '@/lib/whatsappLeadCapture';

const WhatsAppLeadModal = ({ isOpen, onClose, onSubmit, project, knownVisitor }) => {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent]   = useState(false);
  const phoneRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSent(false);
    // Someone who has already given their details should not retype them.
    setName(knownVisitor?.name || '');
    setPhone(knownVisitor?.phone || '');
    // Small delay so the entry animation doesn't fight the keyboard on mobile.
    const t = setTimeout(() => phoneRef.current?.focus(), 220);
    return () => clearTimeout(t);
  }, [isOpen, knownVisitor]);

  // Escape cancels — closes the sheet and stays put.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Close on its own once they have read the confirmation.
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [sent, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sent) return;

    if (!isValidIndianMobile(phone)) {
      setError('कृपया 10 अंकों का सही मोबाइल नंबर डालें');
      phoneRef.current?.focus();
      return;
    }
    onSubmit({ name: name.trim(), phone: toTenDigits(phone) });
    setSent(true);
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
                    {sent ? 'धन्यवाद!' : 'रेट लिस्ट व डिटेल पाएं'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {sent
                      ? 'आपकी जानकारी हमें मिल गई है'
                      : project
                        ? `${project} — नंबर दें, हमारी टीम WhatsApp पर भेजेगी`
                        : 'नंबर दें, हमारी टीम WhatsApp पर भेजेगी'}
                  </p>
                </div>
              </div>
            </div>

            {sent ? (
              <div
                className="px-6 pt-7 flex flex-col items-center text-center space-y-3"
                style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
                role="status"
              >
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    हमारी टीम जल्द संपर्क करेगी
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs">
                    रेट लिस्ट, प्लॉट डिटेल और पेमेंट प्लान आपके WhatsApp नंबर पर भेज दिए जाएंगे।
                  </p>
                </div>
              </div>
            ) : (
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
                className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 transition-all"
              >
                <MessageCircle size={22} fill="white" /> जानकारी भेजें
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck size={13} className="text-green-600 shrink-0" />
                <span>आपका नंबर सुरक्षित है — सिर्फ प्रॉपर्टी की जानकारी के लिए</span>
              </div>
            </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppLeadModal;
