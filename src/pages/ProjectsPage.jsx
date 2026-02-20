import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, MessageCircle, X, Filter, ChevronDown,
  TrendingUp, Shield, Award, Users, IndianRupee, Calculator, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHelmet from '@/components/SEOHelmet';

// ═══════════════════════════════════════════════════════════════════════════
// Supabase Storage URL for Hero Images
// ═══════════════════════════════════════════════════════════════════════════
const SUPABASE_STORAGE_BASE = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects';

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT DATA - Using Local Logos (same as homepage) + Supabase Hero Images
// ═══════════════════════════════════════════════════════════════════════════
const projects = [
  {
    id: 'shree-kunj-bihari-enclave',
    name: 'Shree Kunj Bihari Enclave',
    nameShort: 'SKBE',
    location: 'Vrindavan, UP',
    region: 'vrindavan',
    pricePerSqYd: 7525,
    priceDisplay: '₹7,525',
    startingPrice: 376250,
    startingDisplay: '₹3.76L',
    bookingPct: 10,
    emi: 5644,
    emiDisplay: '₹5,644',
    emiMonths: 60,
    status: 'bestseller',
    statusLabel: 'Best Seller',
    availability: 'available',
    logoGradient: 'from-amber-500 to-orange-600',
    slug: 'shree-kunj-bihari',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/kunj-bihari-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/shree-kunj-bihari/hero.jpg`,
  },
  {
    id: 'shree-khatu-shyam-ji-enclave',
    name: 'Shri Khatu Shyam Enclave',
    nameShort: 'KKSE',
    location: 'Khatu, Rajasthan',
    region: 'rajasthan',
    pricePerSqYd: 7525,
    priceDisplay: '₹7,525',
    startingPrice: 376250,
    startingDisplay: '₹3.76L',
    bookingPct: 10,
    emi: 5644,
    emiDisplay: '₹5,644',
    emiMonths: 60,
    status: 'limited',
    statusLabel: 'Limited Plots',
    availability: 'available',
    logoGradient: 'from-rose-500 to-pink-600',
    slug: 'khatu-shyam-enclave',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/khatu-shyam-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/khatu-shyam-enclave/hero.jpg`,
  },
  {
    id: 'shree-jagannath-dham',
    name: 'Shree Jagannath Dham',
    nameShort: 'SJD',
    location: 'Mathura, UP',
    region: 'mathura',
    pricePerSqYd: 8025,
    priceDisplay: '₹8,025',
    startingPrice: 401250,
    startingDisplay: '₹4.01L',
    bookingPct: 10,
    emi: 6687,
    emiDisplay: '₹6,687',
    emiMonths: 54,
    status: 'available',
    statusLabel: 'Available',
    availability: 'available',
    logoGradient: 'from-blue-500 to-indigo-600',
    slug: 'jagannath-dham',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/jagannath-dham-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/jagannath-dham/hero.jpg`,
  },
  {
    id: 'brij-vatika',
    name: 'Brij Vatika (E Block)',
    nameShort: 'BVE',
    location: 'Braj Bhoomi, Vrindavan',
    region: 'vrindavan',
    pricePerSqYd: 15525,
    priceDisplay: '₹15,525',
    startingPrice: 776250,
    startingDisplay: '₹7.76L',
    bookingPct: 10,
    emi: 17465,
    emiDisplay: '₹17,465',
    emiMonths: 40,
    status: 'available',
    statusLabel: 'Available',
    availability: 'available',
    logoGradient: 'from-emerald-500 to-teal-600',
    slug: 'brij-vatika',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/brij-vatika-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/brij-vatika/hero.jpg`,
  },
  {
    id: 'shree-gokul-vatika',
    name: 'Shree Gokul Vatika',
    nameShort: 'SGV',
    location: 'Gokul, UP',
    region: 'mathura',
    pricePerSqYd: 10025,
    priceDisplay: '₹10,025',
    startingPrice: 501250,
    startingDisplay: '₹5.01L',
    bookingPct: 10,
    emi: 18796,
    emiDisplay: '₹18,796',
    emiMonths: 24,
    status: 'available',
    statusLabel: 'Available',
    availability: 'available',
    logoGradient: 'from-green-500 to-lime-600',
    slug: 'gokul-vatika',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/gokul-vatika-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/gokul-vatika/hero.jpg`,
  },
  {
    id: 'maa-semri-vatika',
    name: 'Maa Semri Vatika',
    nameShort: 'MSV',
    location: 'Near Mathura, UP',
    region: 'mathura',
    pricePerSqYd: 15525,
    priceDisplay: '₹15,525',
    startingPrice: 931500,
    startingDisplay: '₹9.31L',
    bookingPct: 15,
    emi: 32990,
    emiDisplay: '₹32,990',
    emiMonths: 24,
    status: 'new',
    statusLabel: 'New Launch',
    availability: 'available',
    logoGradient: 'from-purple-500 to-violet-600',
    slug: 'maa-simri-vatika',
    // Local logo (same as homepage) + Supabase hero
    logoUrl: '/logos/maa-simri-vatika-logo.png',
    heroUrl: `${SUPABASE_STORAGE_BASE}/maa-simri-vatika/hero.jpg`,
  },
];

const trustStats = [
  { icon: Users, value: '15,000+', label: 'Happy Families' },
  { icon: Award, value: '25+', label: 'Projects Delivered' },
  { icon: Shield, value: '100%', label: 'Legal Clarity' },
  { icon: TrendingUp, value: '0%', label: 'Interest EMI' },
];

const statusColors = {
  bestseller: 'bg-green-500 text-white',
  limited: 'bg-orange-500 text-white',
  new: 'bg-purple-500 text-white',
  available: 'bg-blue-500 text-white',
};

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT CARD with Hover Detection - Local Logos + Supabase Hero Images
// ═══════════════════════════════════════════════════════════════════════════
const ProjectCard = ({ project, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
    >
      {/* Header with Logo/Hero Image */}
      <div className="relative overflow-hidden min-h-[200px]">
        <AnimatePresence mode="wait">
          {isHovered ? (
            // Show Hero Image on Hover (from Supabase)
            <motion.div
              key="hero"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={project.heroUrl}
                alt={project.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient if hero image fails
                  e.target.parentElement.style.display = 'none';
                }}
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              {/* Hover indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-10"
              >
                <span className="text-xs font-semibold text-[#0F3A5F] flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Click to view details
                </span>
              </motion.div>
            </motion.div>
          ) : (
            // Show Logo on Default State (from /logos/ folder - same as homepage)
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`bg-gradient-to-br ${project.logoGradient} h-full flex flex-col items-center justify-center p-8 relative`}
            >
              <img
                src={project.logoUrl}
                alt={`${project.name} logo`}
                className="w-24 h-24 object-contain drop-shadow-2xl"
                onError={(e) => {
                  // Fallback to project initials if logo fails
                  e.target.style.display = 'none';
                }}
              />
              {/* Fallback text if logo doesn't load */}
              <div className="text-white/90 text-xs font-bold tracking-[0.3em] uppercase mt-3">
                {project.nameShort}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Badge */}
        <span className={`absolute top-3 right-3 ${statusColors[project.status]} text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10`}>
          {project.statusLabel}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-[#0F3A5F] mb-1 leading-tight">{project.name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
          <MapPin className="w-3 h-3" />{project.location}
        </p>

        {/* Pricing Box */}
        <div className="bg-gradient-to-r from-[#0F3A5F]/5 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Rate/sq yd</div>
              <div className="text-xl font-bold text-[#0F3A5F] flex items-baseline">
                <IndianRupee className="w-4 h-4 mr-0.5" />{project.priceDisplay.replace('₹', '')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Starting</div>
              <div className="text-xl font-bold text-[#D4AF37]">{project.startingDisplay}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#D4AF37]/20 flex items-center justify-between">
            <div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wide">EMI/month</div>
              <div className="text-sm font-bold text-[#0F3A5F]">{project.emiDisplay}</div>
            </div>
            <div className="text-[9px] text-gray-400 text-right">
              {project.emiMonths} months<br />0% interest
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#D4AF37]" />
          Book at {project.bookingPct}% · Instant Registry
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link to={`/projects/${project.id}`} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-semibold text-xs transition-all"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />View Details
            </Button>
          </Link>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold text-xs shadow-md hover:shadow-lg transition-all"
            onClick={() => window.open(`https://wa.me/918076146988?text=I want pricing for ${encodeURIComponent(project.name)}`, '_blank')}
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" />Check Pricing
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const ProjectsPage = () => {
  const [filters, setFilters] = useState({
    region: 'all',
    priceRange: 'all',
    emiRange: 'all',
    status: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Scroll detection for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filters.region !== 'all' && p.region !== filters.region) return false;
      if (filters.priceRange === 'under5' && p.startingPrice >= 500000) return false;
      if (filters.priceRange === '5to8' && (p.startingPrice < 500000 || p.startingPrice >= 800000)) return false;
      if (filters.priceRange === 'above8' && p.startingPrice < 800000) return false;
      if (filters.emiRange === 'under10' && p.emi >= 10000) return false;
      if (filters.emiRange === '10to15' && (p.emi < 10000 || p.emi >= 15000)) return false;
      if (filters.emiRange === 'above15' && p.emi < 15000) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  const resetFilters = () => {
    setFilters({ region: 'all', priceRange: 'all', emiRange: 'all', status: 'all' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHelmet
        title="Our Projects | Fanbe Group — Premium Plots in Vrindavan, Mathura & Rajasthan"
        description="Explore 6 premium residential plot projects in Vrindavan, Mathura & Rajasthan. Starting ₹3.76 Lakhs | 0% Interest EMI | Immediate Registry | Trusted by 15,000+ families since 2012 | Book free site visit today"
        keywords={[
          'plots near khatu shyam temple',
          'investment plots braj bhoomi',
          'gated community plots vrindavan',
          'best plots to buy in vrindavan',
          'affordable plots near vrindavan',
          'vrindavan real estate projects',
          'mathura residential plots for sale',
          'plots with instant registry',
          'spiritual plots near temples',
          'plots starting under 5 lakhs'
        ]}
        image="/images/projects-og.jpg"
        type="website"
      />

      {/* ═══ TRUST BAND ═══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-[#0A2744] via-[#0F3A5F] to-[#1a5a8f] text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {trustStats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2"
              >
                <stat.icon className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <span className="font-bold text-lg">{stat.value}</span>
                  <span className="text-xs text-gray-300 ml-1.5">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HEADER + FILTER BAR ══════════════════════════════════════════ */}
      <section className="bg-white border-b sticky top-[68px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0F3A5F]">Premium Residential Plots in Vrindavan & Mathura</h1>
              <p className="text-sm text-gray-500 mt-1">{filteredProjects.length} premium residential projects | Starting ₹3.76L</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                  {/* Region */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Location</label>
                    <select
                      value={filters.region}
                      onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent"
                    >
                      <option value="all">All Locations</option>
                      <option value="vrindavan">Vrindavan</option>
                      <option value="mathura">Mathura / Gokul</option>
                      <option value="rajasthan">Rajasthan</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Starting Price</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent"
                    >
                      <option value="all">Any Price</option>
                      <option value="under5">Under ₹5 Lakhs</option>
                      <option value="5to8">₹5L - ₹8L</option>
                      <option value="above8">Above ₹8 Lakhs</option>
                    </select>
                  </div>

                  {/* EMI Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">EMI Affordability</label>
                    <select
                      value={filters.emiRange}
                      onChange={(e) => setFilters({ ...filters, emiRange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent"
                    >
                      <option value="all">Any EMI</option>
                      <option value="under10">Under ₹10k/mo</option>
                      <option value="10to15">₹10k - ₹15k/mo</option>
                      <option value="above15">Above ₹15k/mo</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Project Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="bestseller">Best Seller</option>
                      <option value="limited">Limited Plots</option>
                      <option value="new">New Launch</option>
                      <option value="available">Available</option>
                    </select>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-[#0F3A5F] hover:text-[#D4AF37] font-medium flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ PROJECT GRID ═════════════════════════════════════════════════ */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {filteredProjects.length > 0 ? (
              <motion.div
                key="projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project, idx) => (
                  <ProjectCard key={project.id} project={project} index={idx} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects match your filters</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search criteria</p>
                <Button onClick={resetFilters} variant="outline">
                  <X className="w-4 h-4 mr-2" />Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ STICKY CTA BAR ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#D4AF37] shadow-2xl"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="hidden md:block">
                  <div className="text-xs text-gray-500">Need help choosing?</div>
                  <div className="font-bold text-[#0F3A5F]">Talk to our experts</div>
                </div>
                <div className="flex gap-2 flex-1 md:flex-none">
                  <Button
                    size="sm"
                    className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#1da851] text-white font-bold"
                    onClick={() => window.open('https://wa.me/918076146988?text=I want to know about your projects', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 md:flex-none border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-bold"
                    onClick={() => window.open('tel:+918076146988')}
                  >
                    <Phone className="w-4 h-4 mr-2" />Call Now
                  </Button>
                  <Button
                    size="sm"
                    className="hidden md:flex bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black font-bold"
                    onClick={() => window.location.href = '/contact'}
                  >
                    Enquire Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;
