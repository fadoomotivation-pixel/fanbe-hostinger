import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, X, Filter,
  TrendingUp, Shield, Award, Users,
  FileText, Building2, IndianRupee, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteVisitLeadModal from '@/components/SiteVisitLeadModal';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString('en-IN');

function buildPricing(rate, bookingPct, emiMonths, sizes) {
  return sizes.map(size => {
    const total   = size * rate;
    const booking = Math.round(total * bookingPct);
    const rest    = total - booking;
    const emi     = Math.round(rest / emiMonths);
    return { size, rate, total, booking, rest, emi };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Project data with full pricing tables
// ─────────────────────────────────────────────────────────────────────────────
const projects = [
  {
    id: 'shree-kunj-bihari-enclave',
    slug: 'shree-kunj-bihari',  // ← matches projectsData.js
    name: 'Shree Kunj Bihari Enclave',
    displayName: 'Kunj Bihari',
    icon: '🕍',
    location: 'Vrindavan, UP',
    region: 'vrindavan',
    logoGradient: 'from-amber-500 to-orange-600',
    priceDisplay: '₹7,525',
    startingDisplay: '₹3.76L',
    startingPrice: 376250,
    emiDisplay: '₹5,644',
    emi: 5644,
    emiMonths: 60,
    bookingPct: '10%',
    status: 'bestseller', statusLabel: 'Best Seller', statusColor: 'bg-green-500',
    highlights: ['Immediate Registry on 10%', 'Gated Community', '0% Interest EMI'],
    pricing: buildPricing(7525, 0.10, 60, [50, 100, 150, 200, 250, 300]),
  },
  {
    id: 'shree-khatu-shyam-ji-enclave',
    slug: 'khatu-shyam-enclave',  // ← matches projectsData.js
    name: 'Shri Khatu Shyam Enclave',
    displayName: 'Khatu Shyam',
    icon: '🛕',
    location: 'Khatu, Rajasthan',
    region: 'rajasthan',
    logoGradient: 'from-rose-500 to-pink-700',
    priceDisplay: '₹7,525',
    startingDisplay: '₹3.76L',
    startingPrice: 376250,
    emiDisplay: '₹5,644',
    emi: 5644,
    emiMonths: 60,
    bookingPct: '10%',
    status: 'limited', statusLabel: 'Limited Plots', statusColor: 'bg-orange-500',
    highlights: ['Near Khatu Shyam Temple', 'Free Pick & Drop', '0% Interest EMI'],
    pricing: buildPricing(7525, 0.10, 60, [50, 100, 150, 200, 250, 300]),
  },
  {
    id: 'shree-jagannath-dham',
    slug: 'jagannath-dham',  // ← matches projectsData.js
    name: 'Shree Jagannath Dham',
    displayName: 'Jagannath Dham',
    icon: '🏛️',
    location: 'Mathura, UP',
    region: 'mathura',
    logoGradient: 'from-blue-500 to-indigo-700',
    priceDisplay: '₹8,025',
    startingDisplay: '₹4.01L',
    startingPrice: 401250,
    emiDisplay: '₹6,502',
    emi: 6502,
    emiMonths: 54,
    bookingPct: '12.5%',
    status: 'available', statusLabel: 'Available', statusColor: 'bg-blue-500',
    highlights: ['Approved Layout Plan', 'Immediate Possession', '0% Interest EMI'],
    pricing: buildPricing(8025, 0.125, 54, [50, 100, 150, 200, 250]),
  },
  {
    id: 'brij-vatika',
    slug: 'brij-vatika',  // ← matches projectsData.js
    name: 'Brij Vatika (E Block)',
    displayName: 'Brij Vatika',
    icon: '🌳',
    location: 'Braj Bhoomi, Vrindavan',
    region: 'vrindavan',
    logoGradient: 'from-emerald-500 to-teal-700',
    priceDisplay: '₹15,525',
    startingDisplay: '₹7.76L',
    startingPrice: 776250,
    emiDisplay: '₹12,615',
    emi: 12615,
    emiMonths: 40,
    bookingPct: '35%',
    status: 'available', statusLabel: 'Available', statusColor: 'bg-blue-500',
    highlights: ['Registry on 35%', 'No Brokerage', 'Direct from Developer'],
    pricing: buildPricing(15525, 0.35, 40, [50, 100, 150, 200, 250]),
  },
  {
    id: 'shree-gokul-vatika',
    slug: 'gokul-vatika',  // ← matches projectsData.js
    name: 'Shree Gokul Vatika',
    displayName: 'Gokul Vatika',
    icon: '🌸',
    location: 'Gokul, UP',
    region: 'mathura',
    logoGradient: 'from-green-500 to-lime-600',
    priceDisplay: '₹10,025',
    startingDisplay: '₹5.01L',
    startingPrice: 501250,
    emiDisplay: '₹13,576',
    emi: 13576,
    emiMonths: 24,
    bookingPct: '35%',
    status: 'available', statusLabel: 'Available', statusColor: 'bg-blue-500',
    highlights: ['Near Gokul Temple', 'Premium Gated Community', 'High ROI Potential'],
    pricing: buildPricing(10025, 0.35, 24, [50, 100, 150, 200, 250]),
  },
  {
    id: 'maa-semri-vatika',
    slug: 'maa-simri-vatika',  // ← matches projectsData.js (note: simri not semri)
    name: 'Maa Semri Vatika',
    displayName: 'Semri Vatika',
    icon: '🏞️',
    location: 'Near Mathura, UP',
    region: 'mathura',
    logoGradient: 'from-purple-500 to-violet-700',
    priceDisplay: '₹15,525',
    startingDisplay: '₹7.76L',
    startingPrice: 776250,
    emiDisplay: '₹21,024',
    emi: 21024,
    emiMonths: 24,
    bookingPct: '35%',
    status: 'new', statusLabel: 'New Launch', statusColor: 'bg-purple-500',
    highlights: ['High Appreciation Zone', 'Near NH-2', 'Approved Layout'],
    pricing: buildPricing(15525, 0.35, 24, [50, 100, 150, 200, 250]),
  },
];

const trustStats = [
  { icon: Users,      value: '15,000+', label: 'Happy Families'      },
  { icon: Award,      value: '25+',     label: 'Projects Delivered'  },
  { icon: Shield,     value: '100%',    label: 'Legal Clarity'       },
  { icon: TrendingUp, value: '0%',      label: 'Interest EMI'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Breakdown Modal
// ─────────────────────────────────────────────────────────────────────────────
const PricingModal = ({ project, onClose, onEnquire }) => {
  if (!project) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`bg-gradient-to-r ${project.logoGradient} p-5 rounded-t-2xl flex items-center justify-between`}>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-0.5">Pricing Breakdown</p>
              <h2 className="text-white font-extrabold text-xl leading-tight">{project.name}</h2>
              <p className="text-white/80 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{project.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-[#0F3A5F]/10 text-[#0F3A5F] text-xs font-bold px-3 py-1.5 rounded-full">
                <IndianRupee className="w-3 h-3" />Rate: {project.priceDisplay}/sq yd
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                Booking: {project.bookingPct}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                0% Interest · {project.emiMonths} months
              </span>
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 shadow">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0F3A5F] text-white">
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Plot Size</th>
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Rate/Sq Yd</th>
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Total Cost</th>
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider bg-[#D4AF37] text-[#0F3A5F]">Booking Amt</th>
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Rest Amount</th>
                    <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Monthly EMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {project.pricing.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0F3A5F]/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-800">{row.size} Sq. Yd.</td>
                      <td className="px-4 py-3 text-gray-600">₹{fmt(row.rate)}</td>
                      <td className="px-4 py-3 font-bold text-[#0F3A5F]">₹{fmt(row.total)}</td>
                      <td className="px-4 py-3 font-bold text-[#D4AF37] bg-[#D4AF37]/10">₹{fmt(row.booking)}</td>
                      <td className="px-4 py-3 text-gray-600">₹{fmt(row.rest)}</td>
                      <td className="px-4 py-3 font-bold text-[#0F3A5F]">₹{fmt(row.emi)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-3">
              {project.pricing.map((row, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow p-4">
                  <div className="text-center mb-3 pb-3 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-[#0F3A5F]">{row.size} Sq. Yd.</h3>
                    <p className="text-xs text-gray-400">₹{fmt(row.rate)} per sq yd</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Cost</span>
                      <span className="font-bold text-[#0F3A5F]">₹{fmt(row.total)}</span>
                    </div>
                    <div className="flex justify-between bg-[#D4AF37]/10 -mx-4 px-4 py-2 rounded">
                      <span className="text-gray-600 font-medium">Booking ({project.bookingPct})</span>
                      <span className="font-bold text-[#D4AF37]">₹{fmt(row.booking)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rest Amount</span>
                      <span className="font-semibold text-gray-700">₹{fmt(row.rest)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-500">Monthly EMI</span>
                      <span className="font-bold text-[#0F3A5F]">₹{fmt(row.emi)}/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              * Prices are indicative. Registry charges extra as applicable.
            </p>

            {/* Footer CTAs */}
            <div className="flex gap-3 mt-5">
              <Button className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black font-bold shadow-md"
                onClick={onEnquire}>
                Book Site Visit
              </Button>
              <Link to={`/projects/${project.slug}`} className="flex-1">
                <Button variant="outline" className="w-full border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-semibold">
                  <FileText className="w-4 h-4 mr-2" />Full Details
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const ProjectsListingPage = () => {
  const [filters, setFilters]         = useState({ region: 'all', priceRange: 'all', emiRange: 'all', status: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [siteVisitOpen, setSiteVisitOpen] = useState(false);
  const [selectedSlug, setSelectedSlug]   = useState('');
  const [pricingProject, setPricingProject] = useState(null); // for the pricing modal

  React.useEffect(() => {
    const onScroll = () => setShowStickyCTA(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = useMemo(() => projects.filter(p => {
    if (filters.region    !== 'all' && p.region !== filters.region) return false;
    if (filters.priceRange === 'under5'  && p.startingPrice >= 500000) return false;
    if (filters.priceRange === '5to8'    && (p.startingPrice < 500000 || p.startingPrice >= 800000)) return false;
    if (filters.priceRange === 'above8'  && p.startingPrice < 800000) return false;
    if (filters.emiRange   === 'under10' && p.emi >= 10000) return false;
    if (filters.emiRange   === '10to15'  && (p.emi < 10000 || p.emi >= 15000)) return false;
    if (filters.emiRange   === 'above15' && p.emi < 15000) return false;
    if (filters.status    !== 'all' && p.status !== filters.status) return false;
    return true;
  }), [filters]);

  const activeCount  = Object.values(filters).filter(v => v !== 'all').length;
  const resetFilters = () => setFilters({ region: 'all', priceRange: 'all', emiRange: 'all', status: 'all' });

  const openEnquiry = (slug = '') => { setSelectedSlug(slug); setSiteVisitOpen(true); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Helmet>
        <title>Our Projects | Fanbe Group — Premium Plots in Vrindavan, Mathura & Rajasthan</title>
        <meta name="description" content="6 premium residential plot projects. Starting ₹3.76L. 0% interest EMI. Instant registry. 15,000+ happy families." />
      </Helmet>

      {/* ── TRUST BAND ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0A2744] via-[#0F3A5F] to-[#1a5a8f] text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-10">
            {trustStats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="flex items-center gap-2"
              >
                <s.icon className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span className="font-bold">{s.value}</span>
                <span className="text-xs text-gray-300">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEADER + FILTER BAR (sticky) ───────────────────────── */}
      <div className="sticky top-[68px] z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F3A5F]">Our Projects</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} premium residential {filtered.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => setShowFilters(f => !f)}
              className="relative border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white"
            >
              <Filter className="w-4 h-4 mr-1.5" />Filters
              {activeCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-extrabold min-w-[1.1rem] min-h-[1.1rem] rounded-full flex items-center justify-center px-1">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-4 bg-gray-50 rounded-xl border">
                  {[
                    { label: 'Location',      key: 'region',     opts: [['all','All Locations'],['vrindavan','Vrindavan'],['mathura','Mathura / Gokul'],['rajasthan','Rajasthan']] },
                    { label: 'Starting Price',key: 'priceRange', opts: [['all','Any Price'],['under5','Under ₹5L'],['5to8','₹5L – ₹8L'],['above8','Above ₹8L']] },
                    { label: 'EMI Budget',    key: 'emiRange',   opts: [['all','Any EMI'],['under10','Under ₹10k/mo'],['10to15','₹10k – ₹15k/mo'],['above15','Above ₹15k/mo']] },
                    { label: 'Status',        key: 'status',     opts: [['all','All Status'],['bestseller','Best Seller'],['limited','Limited Plots'],['new','New Launch'],['available','Available']] },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                      <select value={filters[f.key]}
                        onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F]"
                      >
                        {f.opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {activeCount > 0 && (
                  <div className="flex justify-end mt-2">
                    <button onClick={resetFilters} className="text-xs text-[#0F3A5F] hover:text-[#D4AF37] font-semibold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── PROJECTS GRID ─────────────────────────────────────── */}
      <section className="py-12 pb-28">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filtered.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                  >
                    {/* Logo Header */}
                    <div className={`relative bg-gradient-to-br ${p.logoGradient} flex flex-col items-center justify-center min-h-[170px] overflow-hidden px-6 py-8`}>
                      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
                      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-black/10 rounded-full pointer-events-none" />
                      <span className={`absolute top-3 right-3 ${p.statusColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow z-10`}>
                        {p.statusLabel}
                      </span>
                      <div className="text-5xl mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">{p.icon}</div>
                      <div className="z-10 text-center">
                        <p className="text-white font-extrabold text-lg leading-tight tracking-wide drop-shadow-md">{p.displayName}</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-[17px] font-bold text-[#0F3A5F] leading-snug mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />{p.location}
                      </p>

                      {/* Pricing Box */}
                      <div className="bg-[#F8F5EC] border border-[#D4AF37]/30 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Rate / sq yd</div>
                            <div className="text-xl font-extrabold text-[#0F3A5F]">{p.priceDisplay}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Starting From</div>
                            <div className="text-xl font-extrabold text-[#B8941E]">{p.startingDisplay}</div>
                          </div>
                        </div>
                        <div className="border-t border-[#D4AF37]/20 pt-3 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide">EMI / month</div>
                            <div className="text-base font-bold text-[#0F3A5F]">{p.emiDisplay}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">0% Interest</div>
                            <div className="text-[9px] text-gray-400 mt-1">{p.emiMonths} months</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                        <Shield className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                        Book at {p.bookingPct} · Instant Registry on booking
                      </p>

                      <div className="space-y-1.5 mb-5">
                        {p.highlights.map((h, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                            <span className="text-xs text-gray-600">{h}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <Link to={`/projects/${p.slug}`}>
                          <Button variant="outline" size="sm"
                            className="w-full border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-semibold text-xs h-10"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />View Details
                          </Button>
                        </Link>

                        {/* ✔ Check Pricing — opens full breakdown modal */}
                        <Button size="sm"
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold text-xs h-10 shadow-md"
                          onClick={() => setPricingProject(p)}
                        >
                          <Calculator className="w-3.5 h-3.5 mr-1.5" />Check Pricing
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No projects match your filters</h3>
                <p className="text-gray-400 mb-6 text-sm">Try adjusting the criteria above</p>
                <Button onClick={resetFilters} variant="outline"><X className="w-4 h-4 mr-2" />Clear Filters</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── STICKY CTA BAR ────────────────────────────────────── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#D4AF37] shadow-2xl"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="hidden md:block flex-1">
                  <p className="text-[11px] text-gray-400 leading-none">Need help choosing?</p>
                  <p className="font-bold text-[#0F3A5F] text-sm">Talk to our experts — Free site visit</p>
                </div>
                <div className="flex gap-2 flex-1 md:flex-none">
                  {/* WhatsApp removed — per user request */}
                  <Button size="sm" variant="outline"
                    className="flex-1 md:w-36 border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-bold"
                    onClick={() => window.open('tel:+918076146988')}
                  >
                    <Phone className="w-4 h-4 mr-1.5" />Call Now
                  </Button>
                  <Button size="sm"
                    className="flex-1 md:w-40 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black font-bold shadow-md"
                    onClick={() => openEnquiry('')}
                  >
                    Book Free Site Visit
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRICING MODAL ───────────────────────────────────── */}
      {pricingProject && (
        <PricingModal
          project={pricingProject}
          onClose={() => setPricingProject(null)}
          onEnquire={() => { setPricingProject(null); openEnquiry(pricingProject.slug); }}
        />
      )}

      {/* ── SITE VISIT LEAD MODAL ─────────────────────────── */}
      <SiteVisitLeadModal
        isOpen={siteVisitOpen}
        onClose={() => setSiteVisitOpen(false)}
        preSelectedProjectSlug={selectedSlug}
      />
    </div>
  );
};

export default ProjectsListingPage;
