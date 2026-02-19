import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MapPin, ArrowRight, Shield, Clock, Star, MessageCircle,
  Phone, CheckCircle, TrendingUp, Home, Banknote, Users, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Project Data with logos & meta ───────────────────────────────────────────
const projects = [
  {
    id: 'shree-kunj-bihari-enclave',
    name: 'Shree Kunj Bihari Enclave',
    nameHi: 'श्री कुंज बिहारी Enclave',
    logo: '/images/projects/shree_kunj_bihari_enclave.png',
    location: 'Vrindavan, Uttar Pradesh',
    region: 'vrindavan',
    tagline: "Premium Plots in Krishna's Holy Land",
    status: 'Best Seller',
    statusColor: 'bg-green-500',
    startingPrice: '₹3,76,250',
    bookingAmt: '₹37,625',
    bookingPct: '10%',
    emi: '₹5,644/mo',
    emiMonths: 60,
    pricePerSqYd: '₹7,525/sq yd',
    plotSizes: ['50', '100', '150', '200', '250'],
    amenities: ['Underground Electricity', 'Street Lights', 'Water Supply', 'Main Gate Security', 'Children Park', 'Temple'],
    highlights: ['Immediate Registry on 10%', 'Gated Community', '0% Interest EMI'],
  },
  {
    id: 'shree-khatu-shyam-ji-enclave',
    name: 'Shri Khatu Shyam Enclave',
    nameHi: 'श्री खाटू श्याम Enclave',
    logo: '/images/projects/khatu_shyam_enclave.png',
    location: 'Khatu, Rajasthan',
    region: 'rajasthan',
    tagline: 'Divine Living Near Sacred Temple',
    status: 'Limited Plots',
    statusColor: 'bg-orange-500',
    startingPrice: '₹3,76,250',
    bookingAmt: '₹37,625',
    bookingPct: '10%',
    emi: '₹5,644/mo',
    emiMonths: 60,
    pricePerSqYd: '₹7,525/sq yd',
    plotSizes: ['50', '100', '150', '200'],
    amenities: ['Paved Roads', 'Street Lighting', 'Water Connection', 'Electricity', 'Landscaped Garden', 'Security Guards'],
    highlights: ['Near Khatu Shyam Temple', 'Free Pick & Drop', '0% Interest EMI'],
  },
  {
    id: 'shree-jagannath-dham',
    name: 'Shree Jagannath Dham',
    nameHi: 'श्री जगन्नाथ धाम',
    logo: '/images/projects/jaganath_dham.png',
    location: 'Mathura, Uttar Pradesh',
    region: 'mathura',
    tagline: 'Sacred Plots for Sacred Living',
    status: 'Available',
    statusColor: 'bg-blue-500',
    startingPrice: '₹4,01,250',
    bookingAmt: '₹50,156',
    bookingPct: '12.5%',
    emi: '₹6,502/mo',
    emiMonths: 54,
    pricePerSqYd: '₹8,025/sq yd',
    plotSizes: ['50', '100', '150', '200', '250'],
    amenities: ['40ft & 60ft Wide Roads', 'Underground Cabling', 'Park & Green Areas', 'Community Center', '24x7 Security'],
    highlights: ['Approved Layout Plan', 'Immediate Possession', '0% Interest EMI'],
  },
  {
    id: 'brij-vatika',
    name: 'Brij Vatika (E Block)',
    nameHi: 'बृज वाटिका (E Block)',
    logo: '/images/projects/brij_vatika.png',
    location: 'Braj Bhoomi, Vrindavan',
    region: 'vrindavan',
    tagline: "Live in Lord Krishna's Sacred Land",
    status: 'Available',
    statusColor: 'bg-blue-500',
    startingPrice: '₹7,76,250',
    bookingAmt: '₹2,71,688',
    bookingPct: '35%',
    emi: '₹12,615/mo',
    emiMonths: 40,
    pricePerSqYd: '₹15,525/sq yd',
    plotSizes: ['50', '100', '150', '200', '250'],
    amenities: ['Concrete Roads', 'Solar Street Lights', 'RO Water Plant', 'Landscaping', 'Children Park', 'Security Cabin'],
    highlights: ['Registry on 35%', 'No Brokerage', 'Direct from Developer'],
  },
  {
    id: 'shree-gokul-vatika',
    name: 'Shree Gokul Vatika',
    nameHi: 'श्री गोकुल वाटिका',
    logo: '/images/projects/gokul_vatika.png',
    location: 'Gokul, Uttar Pradesh',
    region: 'mathura',
    tagline: "Premium Plots in Krishna's Childhood Abode",
    status: 'Available',
    statusColor: 'bg-blue-500',
    startingPrice: '₹5,01,250',
    bookingAmt: '₹1,75,438',
    bookingPct: '35%',
    emi: '₹13,576/mo',
    emiMonths: 24,
    pricePerSqYd: '₹10,025/sq yd',
    plotSizes: ['50', '100', '150', '200', '250'],
    amenities: ['60ft Wide Main Road', 'Interlocking Tile Roads', 'LED Street Lights', 'Meditation Center', 'Jogging Track', 'Gated Entry'],
    highlights: ['Near Gokul Temple', 'Premium Gated Community', 'High ROI Potential'],
  },
  {
    id: 'maa-semri-vatika',
    name: 'Maa Semri Vatika',
    nameHi: 'मां सेमरी वाटिका',
    logo: '/images/projects/semri_vatika.png',
    location: 'Near Mathura, Uttar Pradesh',
    region: 'mathura',
    tagline: 'Premium Plots with High Appreciation',
    status: 'New Launch',
    statusColor: 'bg-purple-500',
    startingPrice: '₹7,76,250',
    bookingAmt: '₹2,71,688',
    bookingPct: '35%',
    emi: '₹21,024/mo',
    emiMonths: 24,
    pricePerSqYd: '₹15,525/sq yd',
    plotSizes: ['50', '100', '125', '150', '200'],
    amenities: ['Paved Internal Roads', 'Street Lighting', 'Water Supply', 'Boundary Wall', 'Main Gate', 'Green Belt'],
    highlights: ['High Appreciation Zone', 'Near NH-2', 'Approved by Authority'],
  },
];

const filters = [
  { key: 'all', label: 'All Projects' },
  { key: 'vrindavan', label: 'Vrindavan' },
  { key: 'mathura', label: 'Mathura / Gokul' },
  { key: 'rajasthan', label: 'Rajasthan' },
];

const trustPoints = [
  { icon: Shield, value: '100%', label: 'Legal Clarity', sub: 'Clear title & registry' },
  { icon: Banknote, value: '0%', label: 'Interest EMI', sub: 'No hidden charges' },
  { icon: Clock, value: 'Instant', label: 'Registry', sub: 'On booking payment' },
  { icon: Users, value: '15,000+', label: 'Happy Families', sub: 'Since 2012' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const ProjectsPage = ({ onBookSiteVisit }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter(p => p.region === activeFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Our Projects | Fanbe Group — Premium Plots in Vrindavan, Mathura & Rajasthan</title>
        <meta name="description" content="Explore 6 premium residential plot projects by Fanbe Group across Vrindavan, Mathura, Gokul and Rajasthan. 0% interest EMI, immediate registry, clear title." />
      </Helmet>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#0A2744] via-[#0F3A5F] to-[#1a5a8f] text-white py-20 md:py-28 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-5 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-sm font-bold tracking-widest mb-6">
              ✨ 25+ PROJECTS DELIVERED
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
              Our <span className="text-[#D4AF37]">Premium</span> Projects
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Sacred locations. Modern infrastructure. 0% interest EMI.
              Own your dream plot starting at just <span className="text-[#D4AF37] font-bold">₹3.76 Lakhs</span>.
            </p>

            {/* Quick stats strip */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-8">
              {[
                { val: '6', lbl: 'Active Projects' },
                { val: '₹3.76L', lbl: 'Starting Price' },
                { val: '0%', lbl: 'Interest EMI' },
                { val: '50 sq yd', lbl: 'Min. Plot Size' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">{s.val}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">{s.lbl}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ────────────────────────────────────────────── */}
      <div className="sticky top-[68px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeFilter === f.key
                    ? 'bg-[#0F3A5F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 pr-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROJECTS GRID ─────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col"
                >
                  {/* Card Header — Logo */}
                  <div className="relative bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-8 flex items-center justify-center min-h-[220px]">
                    {/* Status Badge */}
                    <span className={`absolute top-4 right-4 ${project.statusColor} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10`}>
                      {project.status}
                    </span>
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="max-w-full max-h-[190px] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Name & Location */}
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-[#0F3A5F] leading-tight">{project.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{project.nameHi}</p>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />{project.location}
                    </p>
                    <p className="text-sm text-gray-600 italic mb-4">"{project.tagline}"</p>

                    {/* Pricing Box */}
                    <div className="bg-gradient-to-r from-[#0F3A5F]/5 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Starting</div>
                          <div className="text-sm font-bold text-[#0F3A5F] leading-tight">{project.startingPrice}</div>
                        </div>
                        <div className="border-x border-[#D4AF37]/20">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Booking ({project.bookingPct})</div>
                          <div className="text-sm font-bold text-[#D4AF37] leading-tight">{project.bookingAmt}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">EMI</div>
                          <div className="text-sm font-bold text-[#0F3A5F] leading-tight">{project.emi}</div>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-[#D4AF37]/20 text-center">
                        <span className="text-[10px] text-gray-400">{project.emiMonths}-month plan · 0% interest · {project.pricePerSqYd}</span>
                      </div>
                    </div>

                    {/* Plot Sizes */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.plotSizes.map(s => (
                        <span key={s} className="px-2.5 py-1 bg-[#0F3A5F]/8 border border-[#0F3A5F]/15 text-[#0F3A5F] text-xs rounded-full font-medium">
                          {s} sq yd
                        </span>
                      ))}
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-col gap-1.5 mb-5">
                      {project.highlights.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                          <span className="text-xs text-gray-600">{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {project.amenities.slice(0, 4).map((a, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-full">{a}</span>
                      ))}
                      {project.amenities.length > 4 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-400 text-[10px] rounded-full">+{project.amenities.length - 4} more</span>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3 mt-auto">
                      <Link to={`/projects/${project.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                          View Details <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all w-10 h-10 flex-shrink-0"
                        onClick={() => window.open(`https://wa.me/918076146988?text=I%20am%20interested%20in%20${encodeURIComponent(project.name)}`, '_blank')}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No projects found for this filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-[#0A2744] to-[#0F3A5F] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Invest with <span className="text-[#D4AF37]">Fanbe Group?</span></h2>
            <p className="text-gray-300">Trusted by 15,000+ families since 2012</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustPoints.map((tp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <tp.icon className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{tp.value}</div>
                <div className="font-semibold text-sm">{tp.label}</div>
                <div className="text-xs text-gray-400 mt-1">{tp.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHATSAPP CTA ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F3A5F] mb-4">
              Ready to Own Your Dream Plot?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-8 text-lg">
              Talk to our experts today. Free site visit with pick & drop facility.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-lg px-8 py-6 shadow-xl hover:-translate-y-0.5 transition-all"
                onClick={() => window.open('https://wa.me/918076146988?text=I%20want%20to%20know%20more%20about%20your%20projects', '_blank')}
              >
                <MessageCircle className="mr-2" /> Chat on WhatsApp
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-bold text-lg px-8 py-6 transition-all hover:-translate-y-0.5"
                onClick={() => window.open('tel:+918076146988')}
              >
                <Phone className="mr-2" /> Call Us Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ProjectsPage;
