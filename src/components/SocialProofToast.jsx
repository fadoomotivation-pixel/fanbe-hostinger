// ============================================================
//  SocialProofToast.jsx  —  CRO Social Proof Notifications
//  Fanbe Developers | Real Estate Plot Bookings
//  Usage: Import & drop <SocialProofToast /> in App.jsx
// ============================================================

import { useEffect, useRef, useState } from 'react';

// ── All 30 Booking Notifications ──────────────────────────────
const NOTIFICATIONS = [
  // ── 50 sq yd Buyers (Entry/Budget Segment) ────────────────
  { name: 'Naman Verma',   city: 'Noida',         size: '50 sq yd',  project: 'Sector 79, Faridabad',       price: '₹4,20,000' },
  { name: 'Simran Kaur',   city: 'Chandigarh',    size: '50 sq yd',  project: 'Airport Road Township',      price: '₹3,85,000' },
  { name: 'Sneha Gupta',   city: 'Delhi',         size: '50 sq yd',  project: 'L Zone, Dwarka',             price: '₹6,75,000' },
  { name: 'Meena Devi',    city: 'Lucknow',       size: '50 sq yd',  project: 'Sultanpur Road Colony',      price: '₹3,60,000' },
  { name: 'Pratik Jain',   city: 'Bhopal',        size: '50 sq yd',  project: 'Kolar Road Enclave',         price: '₹3,40,000' },

  // ── 60 sq yd Buyers (Entry/Budget Segment) ────────────────
  { name: 'Tarun Sharma',  city: 'Jaipur',        size: '60 sq yd',  project: 'Tonk Road Extension',        price: '₹5,10,000' },
  { name: 'Rahul Mishra',  city: 'Allahabad',     size: '60 sq yd',  project: 'GT Road Residency',          price: '₹4,50,000' },
  { name: 'Kiran Patel',   city: 'Surat',         size: '60 sq yd',  project: 'Dumas Road Greens',          price: '₹5,80,000' },
  { name: 'Ajay Sharma',   city: 'Gurgaon',       size: '60 sq yd',  project: 'Sohna Road Township',        price: '₹7,20,000' },
  { name: 'Lalita Singh',  city: 'Varanasi',      size: '60 sq yd',  project: 'Ring Road Colony',           price: '₹3,95,000' },

  // ── 100–150 sq yd Buyers (Mid Segment) ───────────────────
  { name: 'Vikram Singh',  city: 'Mumbai',        size: '100 sq yd', project: 'Panvel Green Estates',       price: '₹15,20,000' },
  { name: 'Sanjay Gupta',  city: 'Lucknow',       size: '100 sq yd', project: 'Gomti Nagar Extension',      price: '₹9,75,000'  },
  { name: 'Rekha Iyer',    city: 'Bangalore',     size: '100 sq yd', project: 'Electronic City Phase II',   price: '₹8,40,000'  },
  { name: 'Suresh Pillai', city: 'Kochi',         size: '100 sq yd', project: 'Smart City Phase I',         price: '₹14,50,000' },
  { name: 'Ravi Teja',     city: 'Hyderabad',     size: '100 sq yd', project: 'Kokapet Residency',          price: '₹18,20,000' },
  { name: 'Deepak Patel',  city: 'Ahmedabad',     size: '100 sq yd', project: 'SG Highway Residency',       price: '₹12,80,000' },
  { name: 'Priya Sharma',  city: 'Bangalore',     size: '150 sq yd', project: 'Devanahalli Greenfields',    price: '₹18,75,000' },
  { name: 'Sunita Reddy',  city: 'Pune',          size: '150 sq yd', project: 'Hinjewadi Valley',           price: '₹19,50,000' },
  { name: 'Kavitha Nair',  city: 'Chennai',       size: '150 sq yd', project: 'OMR Silver County',          price: '₹17,60,000' },
  { name: 'Anita Joshi',   city: 'Pune',          size: '150 sq yd', project: 'Kharadi Enclave',            price: '₹21,00,000' },
  { name: 'Nikhil Sharma', city: 'Mumbai',        size: '150 sq yd', project: 'Navi Mumbai Greenfields',    price: '₹23,40,000' },
  { name: 'Divya Menon',   city: 'Bangalore',     size: '150 sq yd', project: 'Sarjapur Road Greens',       price: '₹22,75,000' },

  // ── 200–300 sq yd Buyers (Premium + NRI) ─────────────────
  { name: 'Rajesh Kumar',  city: 'Delhi',         size: '200 sq yd', project: 'Sector 150, Noida',          price: '₹24,50,000' },
  { name: 'Amit Verma',    city: 'Hyderabad',     size: '200 sq yd', project: 'Shamshabad Township',        price: '₹22,00,000' },
  { name: 'Rohit Agarwal', city: 'Delhi',         size: '200 sq yd', project: 'Greater Faridabad Township', price: '₹27,00,000' },
  { name: 'Pooja Chauhan', city: 'Jaipur',        size: '200 sq yd', project: 'Mansarovar Extension',       price: '₹16,80,000' },
  { name: 'Ashok Yadav',   city: 'Noida',         size: '200 sq yd', project: 'Sector 143 Boulevard',       price: '₹25,60,000' },
  { name: 'Arjun Mehta',   city: 'USA (NRI)',     size: '200 sq yd', project: 'Whitefield Greens, Bangalore', price: '₹31,50,000' },
  { name: 'Mohammed Ali',  city: 'Dubai (NRI)',   size: '300 sq yd', project: 'Sector 21, Dwarka',          price: '₹38,00,000' },
  { name: 'Manpreet Kaur', city: 'Canada (NRI)',  size: '300 sq yd', project: 'Aerocity Mohali',            price: '₹29,50,000' },
];

// ── Config ───────────────────────────────────────────────────
const CFG = {
  initialDelay:    6000,   // ms before first toast (5–7 sec is ideal)
  displayDuration: 6500,   // ms toast stays visible
  minInterval:     15000,  // shortest gap between toasts
  maxInterval:     40000,  // longest  gap between toasts
  calculatorUrl:   '/investment-calculator', // ← UPDATE to your page
};

// ── Utilities ─────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Component ─────────────────────────────────────────────────
export default function SocialProofToast() {
  const [toast, setToast]     = useState(null);   // current data
  const [visible, setVisible] = useState(false);  // entry animation
  const [hiding, setHiding]   = useState(false);  // exit  animation
  const poolRef    = useRef(shuffle(NOTIFICATIONS));
  const idxRef     = useRef(0);
  const timerRef   = useRef(null);

  // Advance to next notification in the shuffled pool
  const nextData = () => {
    if (idxRef.current >= poolRef.current.length) {
      poolRef.current = shuffle(NOTIFICATIONS);
      idxRef.current  = 0;
    }
    return poolRef.current[idxRef.current++];
  };

  // Dismiss with exit animation
  const dismiss = () => {
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      setHiding(false);
      setToast(null);
    }, 450);
  };

  // Schedule loop
  const scheduleNext = () => {
    const delay = rand(CFG.minInterval, CFG.maxInterval);
    timerRef.current = setTimeout(() => {
      setToast(nextData());
    }, delay);
  };

  // When new data arrives → trigger entry animation → auto-dismiss
  useEffect(() => {
    if (!toast) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    );
    const autoDismiss = setTimeout(() => {
      dismiss();
      scheduleNext();
    }, CFG.displayDuration);
    return () => clearTimeout(autoDismiss);
  }, [toast]);

  // Boot on mount
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setToast(nextData());
    }, CFG.initialDelay);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!toast) return null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .sp-toast {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 99999;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #1a56db;
          border-radius: 12px;
          padding: 14px 36px 14px 16px;
          width: 330px;
          box-shadow: 0 8px 28px rgba(0,0,0,.13);
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          opacity: 0;
          transform: translateX(-115%);
          transition:
            transform 0.45s cubic-bezier(0.34,1.56,0.64,1),
            opacity   0.45s ease,
            box-shadow 0.2s ease;
        }
        .sp-toast.sp-visible { opacity:1; transform:translateX(0); }
        .sp-toast.sp-hide    { opacity:0; transform:translateX(-115%); }
        .sp-toast:hover      { box-shadow:0 10px 32px rgba(26,86,219,.22); transform:translateX(5px); }
        .sp-icon  { font-size:22px; flex-shrink:0; padding-top:2px; line-height:1; }
        .sp-badge {
          display:inline-flex; align-items:center; gap:5px;
          font-size:10px; font-weight:700; color:#16a34a;
          text-transform:uppercase; letter-spacing:.6px; margin-bottom:5px;
        }
        .sp-badge::before {
          content:''; display:inline-block;
          width:7px; height:7px; background:#16a34a;
          border-radius:50%; animation:sp-pulse 1.6s ease-in-out infinite;
        }
        .sp-message {
          font-size:13px; font-weight:500; color:#111827;
          line-height:1.5; margin:0 0 6px;
        }
        .sp-message strong { color:#1a56db; }
        .sp-cta {
          font-size:11px; font-weight:600; color:#6b7280;
          display:flex; align-items:center; gap:4px;
        }
        .sp-cta::after { content:'→'; }
        .sp-close {
          position:absolute; top:10px; right:12px;
          font-size:13px; color:#9ca3af; cursor:pointer;
          padding:3px 5px; border-radius:4px; line-height:1;
          border:none; background:none;
        }
        .sp-close:hover { color:#374151; background:#f3f4f6; }
        @keyframes sp-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(1.5); }
        }
        @media (max-width:480px) {
          .sp-toast { left:10px; right:10px; width:auto; max-width:340px; }
        }
      `}</style>

      <a
        href={CFG.calculatorUrl}
        className={`sp-toast ${
          hiding ? 'sp-hide' : visible ? 'sp-visible' : ''
        }`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="sp-icon">📍</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sp-badge">✔ Verified Booking</div>
          <p className="sp-message">
            <strong>{toast.name}</strong> from {toast.city} just booked a{' '}
            <strong>{toast.size}</strong> plot at {toast.project} for{' '}
            <strong>{toast.price}</strong>.
          </p>
          <div className="sp-cta">Calculate your ROI</div>
        </div>
        <button
          className="sp-close"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
            scheduleNext();
          }}
        >
          ✕
        </button>
      </a>
    </>
  );
}
