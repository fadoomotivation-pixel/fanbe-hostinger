import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, MessageCircle, X, Filter,
  TrendingUp, Shield, Award, Users, IndianRupee,
  Calculator, FileText, Building2, Banknote, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteVisitLeadModal from '@/components/SiteVisitLeadModal';

// ─────────────────────────────────────────────────────────────
// PROJECT DATA  (text-logo cards — no heavy images in listing)
// ─────────────────────────────────────────────────────────────
const projects = [
  {
    id: 'shree-kunj-bihari-enclave',
    slug: 'shree-kunj-bihari-enclave',
    name: 'Shree Kunj Bihari Enclave',
    abbr: 'SKBE',
    icon: '🕍',
    location: 'Vrindavan, UP',
    region: 'vrindavan',
    logoGradient: 'from-amber-500 to-orange-600',
    pricePerSqYd: 7525,
    priceDisplay: '₹7,525',
    startingPrice: 376250,
    startingDisplay: '₹3.76L',
    bookingPct: '10%',
    emi: 5644,
    emiDisplay: '₹5,644',
    emiMonths: 60,
    status: 'bestseller',
    statusLabel: 'Best Seller',
    statusColor: 'bg-green-500',
    highlights: ['Immediate Registry on 10%', 'Gated Community', '0% Interest EMI'],
  },
  {
    id: 'shree-khatu-shyam-ji-enclave',
    slug: 'shree-khatu-shyam-ji-enclave',
    name: 'Shri Khatu Shyam Enclave',
    abbr: 'SKSE',
    icon: '🛕',
    location: 'Khatu, Rajasthan',
    region: 'rajasthan',
    logoGradient: 'from-rose-500 to-pink-700',
    pricePerSqYd: 7525,
    priceDisplay: '₹7,525',
    startingPrice: 376250,
    startingDisplay: '₹3.76L',
    bookingPct: '10%',
    emi: 5644,
    emiDisplay: '₹5,644',
    emiMonths: 60,
    status: 'limited',
    statusLabel: 'Limited Plots',
    statusColor: 'bg-orange-500',
    highlights: ['Near Khatu Shyam Temple', 'Free Pick & Drop', '0% Interest EMI'],
  },
  {
    id: 'shree-jagannath-dham',
    slug: 'shree-jagannath-dham',
    name: 'Shree Jagannath Dham',
    abbr: 'SJD',
    icon: '🏛️',
    location: 'Mathura, UP',
    region: 'mathura',
    logoGradient: 'from-blue-500 to-indigo-700',
    pricePerSqYd: 8025,
    priceDisplay: '₹8,025',
    startingPrice: 401250,
    startingDisplay: '₹4.01L',
    bookingPct: '12.5%',
    emi: 6502,
    emiDisplay: '₹6,502',
    emiMonths: 54,
    status: 'available',
    statusLabel: 'Available',
    statusColor: 'bg-blue-500',
    highlights: ['Approved Layout Plan', 'Immediate Possession', '0% Interest EMI'],
  },
  {
    id: 'brij-vatika',
    slug: 'brij-vatika',
    name: 'Brij Vatika (E Block)',
    abbr: 'BVE',
    icon: '🌳',
    location: 'Braj Bhoomi, Vrindavan',
    region: 'vrindavan',
    logoGradient: 'from-emerald-500 to-teal-700',
    pricePerSqYd: 15525,
    priceDisplay: '₹15,525',
    startingPrice: 776250,
    startingDisplay: '₹7.76L',
    bookingPct: '35%',
    emi: 12615,
    emiDisplay: '₹12,615',
    emiMonths: 40,
    status: 'available',
    statusLabel: 'Available',
    statusColor: 'bg-blue-500',
    highlights: ['Registry on 35%', 'No Brokerage', 'Direct from Developer'],
  },
  {
    id: 'shree-gokul-vatika',
    slug: 'shree-gokul-vatika',
    name: 'Shree Gokul Vatika',
    abbr: 'SGV',
    icon: '🌸',
    location: 'Gokul, UP',
    region: 'mathura',
    logoGradient: 'from-green-500 to-lime-600',
    pricePerSqYd: 10025,
    priceDisplay: '₹10,025',
    startingPrice: 501250,
    startingDisplay: '₹5.01L',
    bookingPct: '35%',
    emi: 13576,
    emiDisplay: '₹13,576',
    emiMonths: 24,
    status: 'available',
    statusLabel: 'Available',
    statusColor: 'bg-blue-500',
    highlights: ['Near Gokul Temple', 'Premium Gated Community', 'High ROI Potential'],
  },
  {
    id: 'maa-semri-vatika',
    slug: 'maa-semri-vatika',
    name: 'Maa Semri Vatika',
    abbr: 'MSV',
    icon: '🏞️',
    location: 'Near Mathura, UP',
    region: 'mathura',
    logoGradient: 'from-purple-500 to-violet-700',
    pricePerSqYd: 15525,
    priceDisplay: '₹15,525',
    startingPrice: 776250,
    startingDisplay: '₹7.76L',
    bookingPct: '35%',
    emi: 21024,
    emiDisplay: '₹21,024',
    emiMonths: 24,
    status: 'new',
    statusLabel: 'New Launch',
    statusColor: 'bg-purple-500',
    highlights: ['High Appreciation Zone', 'Near NH-2', 'Approved Layout'],
  },
];

const trustStats = [
  { icon: Users,      value: '15,000+', label: 'Happy Families' },
  { icon: Award,      value: '25+',     label: 'Projects Delivered' },
  { icon: Shield,     value: '100%',    label: 'Legal Clarity' },
  { icon: TrendingUp, value: '0%',      label: 'Interest EMI' },
];

// ─────────────────────────────────────────────────────────────
const ProjectsListingPage = () => {
  const [filters, setFilters] = useState({ region: 'all', priceRange: 'all', emiRange: 'all', status: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  React.useEffect(() => {
    const onScroll = () => setShowStickyCTA(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = useMemo(() => projects.filter(p => {
    if (filters.region !== 'all' && p.region !== filters.region) return false;
    if (filters.priceRange === 'under5'  && p.startingPrice >= 500000) return false;
    if (filters.priceRange === '5to8'    && (p.startingPrice < 500000 || p.startingPrice >= 800000)) return false;
    if (filters.priceRange === 'above8'  && p.startingPrice < 800000) return false;
    if (filters.emiRange  === 'under10'  && p.emi >= 10000) return false;
    if (filters.emiRange  === '10to15'   && (p.emi < 10000 || p.emi >= 15000)) return false;
    if (filters.emiRange  === 'above15'  && p.emi < 15000) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    return true;
  }), [filters]);

  const activeCount = Object.values(filters).filter(v => v !== 'all').length;
  const resetFilters = () => setFilters({ region: 'all', priceRange: 'all', emiRange: 'all', status: 'all' });

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
              <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2">
                <s.icon className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span className="font-bold">{s.value}</span>
                <span className="text-xs text-gray-300">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEADER + FILTER BAR (sticky) ────────────────────────── */}
      <div className="sticky top-[68px] z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F3A5F]">Our Projects</h1>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} premium residential {filtered.length === 1 ? 'project' : 'projects'}</p>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => setShowFilters(f => !f)}
              className="relative border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white"
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
              {activeCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-extrabold w-4.5 h-4.5 min-w-[1.1rem] min-h-[1.1rem] rounded-full flex items-center justify-center">{activeCount}</span>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-4 bg-gray-50 rounded-xl border">
                  {[
                    { label: 'Location', key: 'region', opts: [['all','All Locations'],['vrindavan','Vrindavan'],['mathura','Mathura / Gokul'],['rajasthan','Rajasthan']] },
                    { label: 'Starting Price', key: 'priceRange', opts: [['all','Any Price'],['under5','Under ₹5L'],['5to8','₹5L – ₹8L'],['above8','Above ₹8L']] },
                    { label: 'EMI Budget', key: 'emiRange', opts: [['all','Any EMI'],['under10','Under ₹10k/mo'],['10to15','₹10k – ₹15k/mo'],['above15','Above ₹15k/mo']] },
                    { label: 'Status', key: 'status', opts: [['all','All Status'],['bestseller','Best Seller'],['limited','Limited Plots'],['new','New Launch'],['available','Available']] },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                      <select
                        value={filters[f.key]}
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

      {/* ── PROJECTS GRID ───────────────────────────────────────── */}
      <section className="py-12 pb-28">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                  >
                    {/* ── Logo / Icon Header ── */}
                    <div className={`relative bg-gradient-to-br ${p.logoGradient} p-8 flex flex-col items-center justify-center min-h-[160px] overflow-hidden`}>
                      {/* Faint circle decoration */}
                      <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/10 rounded-full" />

                      {/* Status Badge */}
                      <span className={`absolute top-3 right-3 ${p.statusColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md z-10`}>
                        {p.statusLabel}
                      </span>

                      {/* Icon */}
                      <div className="text-5xl mb-2 drop-shadow-md group-hover:scale-110 transition-transform duration-300">{p.icon}</div>
                      {/* Abbr */}
                      <div className="text-white/80 text-xs font-black tracking-[0.35em] uppercase">{p.abbr}</div>
                    </div>

                    {/* ── Card Body ── */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-[17px] font-bold text-[#0F3A5F] leading-snug mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />{p.location}
                      </p>

                      {/* ── Pricing Box ── */}
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
                            <div className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">
                              0% Interest
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1">{p.emiMonths} months</div>
                          </div>
                        </div>
                      </div>

                      {/* Booking info */}
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                        <Shield className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                        Book at {p.bookingPct} · Instant Registry on booking
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1 mb-5">
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
                          <Button variant="outline" size="sm" className="w-full border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-semibold text-xs h-10">
                            <FileText className="w-3.5 h-3.5 mr-1.5" />View Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold text-xs h-10 shadow-md"
                          onClick={() => window.open(`https://wa.me/918076146988?text=I want pricing for ${encodeURIComponent(p.name)}`, '_blank')}
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

      {/* ── STICKY CTA BAR (scroll-triggered) ───────────────────── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
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
                  <Button size="sm"
                    className="flex-1 md:w-36 bg-[#25D366] hover:bg-[#1da851] text-white font-bold"
                    onClick={() => window.open('https://wa.me/918076146988?text=I want to know about your projects', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />WhatsApp
                  </Button>
                  <Button size="sm" variant="outline"
                    className="flex-1 md:w-32 border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-bold"
                    onClick={() => window.open('tel:+918076146988')}
                  >
                    <Phone className="w-4 h-4 mr-1.5" />Call Now
                  </Button>
                  <Button size="sm"
                    className="hidden md:flex w-32 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black font-bold"
                    onClick={() => { setSelectedProject(''); setModalOpen(true); }}
                  >
                    Enquire Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteVisitLeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preSelectedProjectSlug={selectedProject}
      />
    </div>
  );
};

export default ProjectsListingPage;
