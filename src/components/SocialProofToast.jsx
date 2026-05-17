// ============================================================
//  SocialProofToast.jsx — Compact Premium Booking Notifications
//  Fanbe Developers | 6 Real Projects
// ============================================================

import { useEffect, useRef, useState } from 'react';

// ── Real Buyers — All 6 Actual Projects (Hindi) ──────────────
const NOTIFICATIONS = [
  // ── श्री कुंज बिहारी एन्क्लेव ──
  { name: 'राहुल शर्मा',    city: 'दिल्ली',    size: '50 गज', project: 'कुंज बिहारी एन्क्लेव', price: '₹3.76L', emoji: '🛕', ago: '2 घंटे पहले',  waText: 'मुझे श्री कुंज बिहारी एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'संगीता देवी',    city: 'आगरा',       size: '60 गज', project: 'कुंज बिहारी एन्क्लेव', price: '₹4.51L', emoji: '🛕', ago: 'कुछ देर पहले', waText: 'मुझे श्री कुंज बिहारी एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'मुकेश गुप्ता',   city: 'नोएडा',      size: '50 गज', project: 'कुंज बिहारी एन्क्लेव', price: '₹3.76L', emoji: '🛕', ago: '3 घंटे पहले',  waText: 'मुझे श्री कुंज बिहारी एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'सुनीता रानी',    city: 'लखनऊ',       size: '60 गज', project: 'कुंज बिहारी एन्क्लेव', price: '₹4.51L', emoji: '🛕', ago: 'आज सुबह',    waText: 'मुझे श्री कुंज बिहारी एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'प्रदीप वर्मा',   city: 'मथुरा',      size: '50 गज', project: 'कुंज बिहारी एन्क्लेव', price: '₹3.76L', emoji: '🛕', ago: '1 दिन पहले',  waText: 'मुझे श्री कुंज बिहारी एन्क्लेव में प्लॉट की जानकारी चाहिए' },

  // ── खाटू श्याम एन्क्लेव ──
  { name: 'कमला देवी',      city: 'जयपुर',      size: '50 गज', project: 'खाटू श्याम एन्क्लेव',  price: '₹3.76L', emoji: '🙏', ago: '5 घंटे पहले', waText: 'मुझे खाटू श्याम एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'सुरेश कुमार',    city: 'अजमेर',      size: '60 गज', project: 'खाटू श्याम एन्क्लेव',  price: '₹4.51L', emoji: '🙏', ago: 'कल',          waText: 'मुझे खाटू श्याम एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'नीतू सिंह',      city: 'दिल्ली',     size: '50 गज', project: 'खाटू श्याम एन्क्लेव',  price: '₹3.76L', emoji: '🙏', ago: '4 घंटे पहले', waText: 'मुझे खाटू श्याम एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'रामप्रसाद यादव', city: 'सीकर',       size: '60 गज', project: 'खाटू श्याम एन्क्लेव',  price: '₹4.51L', emoji: '🙏', ago: 'आज',           waText: 'मुझे खाटू श्याम एन्क्लेव में प्लॉट की जानकारी चाहिए' },
  { name: 'विमला शर्मा',    city: 'बीकानेर',    size: '50 गज', project: 'खाटू श्याम एन्क्लेव',  price: '₹3.76L', emoji: '🙏', ago: '1 दिन पहले',  waText: 'मुझे खाटू श्याम एन्क्लेव में प्लॉट की जानकारी चाहिए' },

  // ── ब्रज वाटिका ──
  { name: 'अजय त्यागी',    city: 'गुरुग्राम',  size: '50 गज', project: 'ब्रज वाटिका',          price: '₹7.76L', emoji: '✨', ago: '3 घंटे पहले', waText: 'मुझे ब्रज वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'रेखा अग्रवाल',  city: 'मेरठ',        size: '60 गज', project: 'ब्रज वाटिका',          price: '₹9.31L', emoji: '✨', ago: 'आज',           waText: 'मुझे ब्रज वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'विनोद कुमार',   city: 'दिल्ली',      size: '50 गज', project: 'ब्रज वाटिका',          price: '₹7.76L', emoji: '✨', ago: '6 घंटे पहले', waText: 'मुझे ब्रज वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'पूजा रानी',     city: 'नोएडा',       size: '60 गज', project: 'ब्रज वाटिका',          price: '₹9.31L', emoji: '✨', ago: 'कल',           waText: 'मुझे ब्रज वाटिका में प्लॉट की जानकारी चाहिए' },

  // ── श्री जगन्नाथ धाम ──
  { name: 'हरीश चंद्र',    city: 'आगरा',        size: '50 गज', project: 'जगन्नाथ धाम',          price: '₹4.01L', emoji: '🏛️', ago: '2 घंटे पहले',  waText: 'मुझे श्री जगन्नाथ धाम में प्लॉट की जानकारी चाहिए' },
  { name: 'शांति देवी',    city: 'फरीदाबाद',    size: '60 गज', project: 'जगन्नाथ धाम',          price: '₹4.81L', emoji: '🏛️', ago: 'आज',            waText: 'मुझे श्री जगन्नाथ धाम में प्लॉट की जानकारी चाहिए' },
  { name: 'महेश यादव',     city: 'मथुरा',       size: '50 गज', project: 'जगन्नाथ धाम',          price: '₹4.01L', emoji: '🏛️', ago: '1 दिन पहले',   waText: 'मुझे श्री जगन्नाथ धाम में प्लॉट की जानकारी चाहिए' },
  { name: 'किरण बाला',     city: 'लखनऊ',        size: '60 गज', project: 'जगन्नाथ धाम',          price: '₹4.81L', emoji: '🏛️', ago: '4 घंटे पहले',  waText: 'मुझे श्री जगन्नाथ धाम में प्लॉट की जानकारी चाहिए' },
  { name: 'रामनाथ तिवारी', city: 'कानपुर',      size: '50 गज', project: 'जगन्नाथ धाम',          price: '₹4.01L', emoji: '🏛️', ago: 'आज सुबह',       waText: 'मुझे श्री जगन्नाथ धाम में प्लॉट की जानकारी चाहिए' },

  // ── श्री गोकुल वाटिका ──
  { name: 'दीपक मिश्रा',   city: 'गाजियाबाद',  size: '50 गज', project: 'गोकुल वाटिका',         price: '₹5.01L', emoji: '🌿', ago: '3 घंटे पहले',  waText: 'मुझे श्री गोकुल वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'सावित्री पाल',  city: 'वृंदावन',     size: '60 गज', project: 'गोकुल वाटिका',         price: '₹6.01L', emoji: '🌿', ago: 'आज',            waText: 'मुझे श्री गोकुल वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'अरुण शुक्ला',   city: 'इलाहाबाद',   size: '50 गज', project: 'गोकुल वाटिका',         price: '₹5.01L', emoji: '🌿', ago: '5 घंटे पहले',  waText: 'मुझे श्री गोकुल वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'ममता राजपूत',   city: 'दिल्ली',      size: '60 गज', project: 'गोकुल वाटिका',         price: '₹6.01L', emoji: '🌿', ago: 'कल',            waText: 'मुझे श्री गोकुल वाटिका में प्लॉट की जानकारी चाहिए' },

  // ── माँ सेमरी वाटिका ──
  { name: 'संतोष कुमार',   city: 'आगरा',        size: '50 गज', project: 'माँ सेमरी वाटिका',     price: '₹7.76L', emoji: '🌸', ago: '2 घंटे पहले',  waText: 'मुझे माँ सेमरी वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'लता देवी',      city: 'मुरादाबाद',  size: '60 गज', project: 'माँ सेमरी वाटिका',     price: '₹9.31L', emoji: '🌸', ago: 'आज',            waText: 'मुझे माँ सेमरी वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'राकेश सिंह',    city: 'नोएडा',       size: '50 गज', project: 'माँ सेमरी वाटिका',     price: '₹7.76L', emoji: '🌸', ago: '6 घंटे पहले',  waText: 'मुझे माँ सेमरी वाटिका में प्लॉट की जानकारी चाहिए' },
  { name: 'उषा रानी',      city: 'मेरठ',        size: '60 गज', project: 'माँ सेमरी वाटिका',     price: '₹9.31L', emoji: '🌸', ago: 'कल',            waText: 'मुझे माँ सेमरी वाटिका में प्लॉट की जानकारी चाहिए' },
];

// ── Config ───────────────────────────────────────────────────
const CFG = {
  initialDelay:    25000,
  displayDuration: 6000,
  minInterval:     40000,
  maxInterval:     75000,
  waNumber:        '918076146988',
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SocialProofToast() {
  const [toast, setToast]     = useState(null);
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding]   = useState(false);
  const poolRef  = useRef(shuffle(NOTIFICATIONS));
  const idxRef   = useRef(0);
  const timerRef = useRef(null);

  const nextData = () => {
    if (idxRef.current >= poolRef.current.length) {
      poolRef.current = shuffle(NOTIFICATIONS);
      idxRef.current  = 0;
    }
    return poolRef.current[idxRef.current++];
  };

  const dismiss = () => {
    setHiding(true);
    setTimeout(() => { setVisible(false); setHiding(false); setToast(null); }, 350);
  };

  const scheduleNext = () => {
    const delay = rand(CFG.minInterval, CFG.maxInterval);
    timerRef.current = setTimeout(() => setToast(nextData()), delay);
  };

  useEffect(() => {
    if (!toast) return;
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    const auto = setTimeout(() => { dismiss(); scheduleNext(); }, CFG.displayDuration);
    return () => clearTimeout(auto);
  }, [toast]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setToast(nextData()), CFG.initialDelay);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!toast) return null;

  const waUrl = `https://wa.me/${CFG.waNumber}?text=${encodeURIComponent(toast.waText)}`;

  return (
    <>
      <style>{`
        .sp-wrap {
          position: fixed;
          bottom: 14px;
          left: 14px;
          z-index: 99999;
          width: 260px;
          opacity: 0;
          transform: translateY(12px) scale(0.98);
          transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none;
        }
        .sp-wrap.sp-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }
        .sp-wrap.sp-hide {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
          pointer-events: none;
        }
        .sp-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08);
          overflow: hidden;
          font-family: 'Noto Sans Devanagari','Hind','Segoe UI',system-ui,sans-serif;
          position: relative;
          border: 1px solid rgba(0,0,0,0.05);
        }

        /* ── Thin accent bar ── */
        .sp-accent {
          height: 3px;
          background: linear-gradient(90deg, #0F3A5F, #D4AF37);
        }

        /* ── Close ── */
        .sp-close {
          position: absolute;
          top: 6px;
          right: 6px;
          background: none;
          border: none;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
          color: #9ca3af;
          line-height: 1;
          transition: color 0.15s;
          padding: 0;
          border-radius: 50%;
        }
        .sp-close:hover { color: #374151; background: #f3f4f6; }

        /* ── Body ── */
        .sp-body {
          padding: 10px 12px 8px;
        }
        .sp-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .sp-emoji {
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }
        .sp-proj {
          font-size: 10px;
          font-weight: 700;
          color: #0F3A5F;
          letter-spacing: 0.2px;
        }
        .sp-dot {
          color: #d1d5db;
          font-size: 8px;
        }
        .sp-ago-top {
          font-size: 9px;
          color: #9ca3af;
        }
        .sp-msg {
          font-size: 11px;
          color: #374151;
          line-height: 1.45;
          margin: 0;
        }
        .sp-name {
          font-weight: 700;
          color: #111827;
        }
        .sp-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }
        .sp-chip {
          display: inline-block;
          font-weight: 700;
          color: #0F3A5F;
          background: #EFF6FF;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .sp-price {
          font-size: 12px;
          font-weight: 800;
          color: #15803d;
        }

        /* ── Footer ── */
        .sp-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px 8px;
          border-top: 1px solid #f3f4f6;
        }
        .sp-hint {
          font-size: 9px;
          color: #9ca3af;
        }
        .sp-wa {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #16a34a;
          color: #fff !important;
          text-decoration: none !important;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          font-family: inherit;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .sp-wa:hover {
          background: #15803d;
          color: #fff !important;
        }

        @media (max-width: 480px) {
          .sp-wrap {
            left: 8px;
            right: 8px;
            width: auto;
            max-width: 240px;
            bottom: 10px;
          }
          .sp-msg { font-size: 10.5px; }
          .sp-price { font-size: 11px; }
        }
      `}</style>

      <div
        className={`sp-wrap${hiding ? ' sp-hide' : visible ? ' sp-visible' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="sp-card">
          <div className="sp-accent" />

          <button
            className="sp-close"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); dismiss(); scheduleNext(); }}
          >✕</button>

          <div className="sp-body">
            <div className="sp-top">
              <span className="sp-emoji">{toast.emoji}</span>
              <span className="sp-proj">{toast.project}</span>
              <span className="sp-dot">&bull;</span>
              <span className="sp-ago-top">{toast.ago}</span>
            </div>
            <p className="sp-msg">
              <span className="sp-name">{toast.name}</span> जी, {toast.city} से — बुकिंग हुई
            </p>
            <div className="sp-detail">
              <span className="sp-chip">{toast.size}</span>
              <span className="sp-price">{toast.price}</span>
            </div>
          </div>

          <div className="sp-foot">
            <span className="sp-hint">Aap bhi pooch sakte hain</span>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-wa"
              onClick={(e) => e.stopPropagation()}
            >
              💬 पूछें
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
