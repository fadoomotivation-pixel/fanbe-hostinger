import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  MapPin, Train, Building2, Shield, Zap, Droplet, Trees, Car,
  Sparkles, CheckCircle2, IndianRupee, Clock, Star, ArrowDown,
  BadgeCheck, Compass, Layers, Mountain, TrendingUp, Award, Gem,
  ChevronUp, ArrowUpRight, FileCheck, Activity
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
// Place-name search — Google finds the actual location instead of us
// guessing coordinates that don't match the real plot.
const PLACE_QUERY = encodeURIComponent('Shree Kunj Bihari Enclave, Kosi Kalan, Mathura');
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

const CORRIDOR = [
  { name: 'Delhi NCR',  km: '110 km', drive: '90 min', side: 'left'  },
  { name: 'Palwal',     km: '60 km',  drive: '55 min', side: 'left'  },
  { name: 'Hodal',      km: '30 km',  drive: '30 min', side: 'left'  },
  { name: 'KOSI',       km: '0 km',   drive: 'HERE',   side: 'pin',   highlight: true },
  { name: 'Chhata',     km: '10 km',  drive: '10 min', side: 'right' },
  { name: 'Vrindavan',  km: '30 km',  drive: '25 min', side: 'right' },
  { name: 'Mathura',    km: '24 km',  drive: '20 min', side: 'right' },
];

const STATS = [
  { icon: Train,       big: '5',   unit: 'min', label: 'NH-2 Highway',   accent: '#F59E0B' },
  { icon: MapPin,      big: '5',   unit: 'min', label: 'Kosi Railway',   accent: '#10B981' },
  { icon: Shield,      big: '24',  unit: '×7',  label: 'Gated Security', accent: '#3B82F6' },
  { icon: IndianRupee, big: '0',   unit: '%',   label: 'Interest EMI',   accent: '#8B5CF6' },
];

const LANDMARKS = [
  { emoji: '🛣️',  name: 'National Highway (NH-2)',  dist: '5 min',  tag: 'Connectivity' },
  { emoji: '🚆',  name: 'Kosi Railway Station',      dist: '5 min',  tag: 'Transport' },
  { emoji: '🛕',  name: 'Shani Dev Mandir',          dist: '5 min',  tag: 'Spiritual' },
  { emoji: '🕉️',  name: 'Durwasha Rishi Ashram',     dist: 'Nearby', tag: 'Heritage' },
  { emoji: '🛕',  name: 'Jagannath Dham',            dist: 'Nearby', tag: 'Spiritual' },
  { emoji: '🛕',  name: 'Nand Baba Mandir',          dist: 'Nearby', tag: 'Spiritual' },
  { emoji: '🏭',  name: 'Industrial Area',           dist: 'Adjacent', tag: 'Employment' },
  { emoji: '🌳',  name: 'Gokul Vatika',              dist: 'Nearby', tag: 'Lifestyle' },
];

const CONNECTIVITY = [
  { place: 'Mathura',    time: '20 min', km: '24 km' },
  { place: 'Vrindavan',  time: '25 min', km: '30 km' },
  { place: 'Govardhan',  time: '40 min', km: '45 km' },
  { place: 'Palwal',     time: '55 min', km: '60 km' },
  { place: 'Delhi NCR',  time: '90 min', km: '110 km' },
  { place: 'Agra',       time: '90 min', km: '70 km' },
];

// Industry brands with Clearbit logo URLs (publicly accessible)
const BRANDS = [
  { name: 'Maruti Suzuki', domain: 'marutisuzuki.com',   accent: '#E60012' },
  { name: 'Reliance',      domain: 'ril.com',            accent: '#003366' },
  { name: 'DAIKIN',        domain: 'daikin.com',         accent: '#E50012' },
  { name: 'HAVELLS',       domain: 'havells.com',        accent: '#C8102E' },
  { name: 'JK Tyre',       domain: 'jktyre.com',         accent: '#E32726' },
  { name: 'Bharat Forge',  domain: 'bharatforge.com',    accent: '#0D4F8B' },
  { name: 'PARLE',         domain: 'parleproducts.com',  accent: '#FCB900' },
  { name: 'YAZAKI',        domain: 'yazaki-group.com',   accent: '#0F913F' },
  { name: 'UFLEX',         domain: 'uflexltd.com',       accent: '#EE7800' },
];

const INFRA = [
  { icon: Building2, title: 'Grand Entrance',     desc: 'Dedicated guard room' },
  { icon: Car,       title: 'Wide Damar Roads',   desc: 'Blacktop, planned' },
  { icon: Zap,       title: 'Electricity Ready',  desc: 'Full power supply' },
  { icon: Droplet,   title: 'Water Supply',       desc: '24×7 dependable' },
  { icon: Trees,     title: 'Green Belt',         desc: 'Pollution-free zones' },
  { icon: Shield,    title: 'Gated Boundary',     desc: 'Closed perimeter' },
];

const TRUST = [
  { icon: FileCheck,    label: 'Immediate Registry' },
  { icon: CheckCircle2, label: 'Mutation in Hand' },
  { icon: Shield,       label: 'No Hidden Charges' },
  { icon: IndianRupee,  label: '0% Interest EMI' },
];

const PLOTS = [
  { size:  50, total:  376250, emi: 5644  },
  { size:  80, total:  602000, emi: 9030  },
  { size: 100, total:  752500, emi: 11287, popular: true },
  { size: 150, total: 1128750, emi: 16931 },
  { size: 250, total: 1881250, emi: 28219 },
];

const APPRECIATION = [
  { stat: '22%',  label: 'YoY land-price growth on this NH-2 belt',   icon: TrendingUp },
  { stat: '35%',  label: 'YoY tourism rise in Braj Bhoomi (Mathura)', icon: Activity },
  { stat: '5+',   label: 'Active MNC manufacturing plants nearby',    icon: Building2 },
  { stat: 'NH-2', label: 'Delhi-Agra national corridor frontage',     icon: Compass },
];

// ────────────────────────────────────────────────────────────────────────────
const Particles = ({ count = 30 }) => {
  const seeds = React.useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 8 + Math.random() * 14,
      s: 1 + Math.random() * 3,
      o: 0.15 + Math.random() * 0.45,
      delay: Math.random() * 8,
      id: i,
    })), [count]
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {seeds.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s,
            background: 'radial-gradient(circle, rgba(252,211,77,0.9), rgba(252,211,77,0) 70%)',
            opacity: p.o,
          }}
          animate={{ y: [0, -40, 0], opacity: [p.o, p.o * 1.5, p.o] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const Tilt3D = ({ children, intensity = 6, className = '' }) => {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 220, damping: 18 });
  const sy = useSpring(ry, { stiffness: 220, damping: 18 });
  const handle = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches?.[0]?.clientX ?? e.clientX) - r.left) / r.width;
    const y = ((e.touches?.[0]?.clientY ?? e.clientY) - r.top) / r.height;
    ry.set((x - 0.5) * intensity * 2);
    rx.set((0.5 - y) * intensity * 2);
  };
  const reset = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div
      className={className}
      onMouseMove={handle} onTouchMove={handle}
      onMouseLeave={reset} onTouchEnd={reset}
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', transformPerspective: 1000 }}
    >
      {children}
    </motion.div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-amber-400 text-[11px] font-bold tracking-[0.3em] uppercase mb-3">{children}</p>
);

// Cinematic divider between sections — luxury-brochure detail
const Divider = ({ idx, total = 6 }) => (
  <div className="px-5 py-8 max-w-md mx-auto flex items-center gap-3 opacity-60">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
    <span className="text-[10px] font-bold tracking-[0.3em] text-amber-400">
      {String(idx).padStart(2,'0')} / {String(total).padStart(2,'0')}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
  </div>
);

// ────────────────────────────────────────────────────────────────────────────

const KunjBihariLanding = () => {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProg } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroBgY     = useTransform(heroProg, [0, 1], [0, 160]);
  const heroBgScale = useTransform(heroProg, [0, 1], [1.05, 1.2]);
  const heroOpac    = useTransform(heroProg, [0, 0.7, 1], [1, 0.6, 0]);
  const heroTitleY  = useTransform(heroProg, [0, 1], [0, -40]);

  // Page-level scroll progress drives the top progress rail + section beacons
  const { scrollYProgress: pageProg } = useScroll();
  const pageProgPct = useSpring(pageProg, { stiffness: 80, damping: 22, mass: 0.5 });

  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      setShowTopBtn(window.scrollY > 600);
      // section beacons follow scroll percentage of the document
      const sections = document.querySelectorAll('[data-section]');
      let i = 0;
      sections.forEach((el, k) => {
        const t = el.getBoundingClientRect().top;
        if (t < window.innerHeight * 0.4) i = k;
      });
      setActiveIdx(i);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030509] text-white overflow-x-hidden">
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Premium gated plots beside NH-2 near Kosi-Mathura. Immediate registry, industrial corridor, spiritual heritage. By Fanbe Group." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Plots near Mathura NH-2" />
        <meta property="og:description" content="Premium gated plots beside the National Highway, Kosi-Mathura." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <style>{`
          @keyframes pulseRing { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
          .gold-text {
            background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #FCD34D 100%);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}</style>
      </Helmet>

      {/* Top gold scroll-progress rail — luxury micro-detail */}
      <motion.div
        style={{ scaleX: pageProgPct, transformOrigin: '0% 50%' }}
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] pointer-events-none"
      />

      {/* Right-edge section beacons — investors feel the page is a journey */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 hidden sm:flex flex-col gap-3 pointer-events-none">
        {['Location','Connectivity','Infrastructure','Industry','Security','Appreciation'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 transition-all duration-500"
               style={{ opacity: activeIdx === i + 1 ? 1 : 0.35 }}>
            <span className="text-[9px] font-bold tracking-widest text-amber-300 uppercase whitespace-nowrap">
              {activeIdx === i + 1 ? s : ''}
            </span>
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${activeIdx === i + 1 ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] scale-150' : 'bg-white/30'}`} />
          </div>
        ))}
      </div>

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-5 overflow-hidden">
        <motion.div style={{ y: heroBgY, scale: heroBgScale, opacity: heroOpac }} className="absolute inset-0 z-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030509]/30 via-[#030509]/65 to-[#030509]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(245,158,11,0.22),transparent_55%)]" />
        </motion.div>
        <Particles count={36} />

        <motion.div style={{ y: heroTitleY }} className="relative z-10 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase gold-text">A Fanbe Group Project</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-[44px] sm:text-[52px] leading-[0.95] font-black tracking-tighter mb-3"
          >
            <span className="block gold-text">Shree Kunj Bihari</span>
            <span className="block bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">Enclave</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
            className="text-amber-200/90 text-[13px] font-bold tracking-[0.3em] uppercase mb-4"
          >
            कोसी · मथुरा · NH-2
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="text-white/70 text-[15px] leading-relaxed mb-10 px-3"
          >
            Premium gated plots beside India's most legendary highway —
            divinity, industry, and infrastructure meet at one address.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 text-amber-400/80 text-[10px] font-bold tracking-[0.3em]"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>EXPLORE THE LOCATION</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="px-5 -mt-12 relative z-30">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto" style={{ perspective: 1000 }}>
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 backdrop-blur-xl"
            >
              <s.icon className="w-5 h-5 mb-2" style={{ color: s.accent }} />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black" style={{ color: s.accent }}>{s.big}</span>
                <span className="text-sm font-bold text-white/80">{s.unit}</span>
              </div>
              <div className="text-[11px] text-white/60 font-medium mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ① LOCATION                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section data-section="1" className="px-5 pt-24 pb-10 max-w-md mx-auto">
        <SectionLabel>① Location</SectionLabel>
        <h2 className="text-3xl font-black leading-tight mb-2">
          The exact <span className="gold-text">spot</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          Kosi Kalan, Mathura — beside NH-2, walking distance to Shanidev Temple and Durwasha Rishi Ashram.
        </p>

        {/* Satellite map */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0A0F1C] shadow-2xl shadow-amber-500/10">
          <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${mapType === 'satellite' ? 'bg-amber-400 text-[#030509]' : 'text-white/70'}`}
            >
              <Mountain className="w-3 h-3" /> SATELLITE
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${mapType === 'hybrid' ? 'bg-amber-400 text-[#030509]' : 'text-white/70'}`}
            >
              <Layers className="w-3 h-3" /> LABELS
            </button>
          </div>
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/30 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">KOSI · NH-2</span>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border border-amber-400/60" style={{ animation: 'pulseRing 2s infinite ease-out' }} />
              <div className="absolute inset-0 m-3 rounded-full border border-amber-400/80" style={{ animation: 'pulseRing 2s 0.6s infinite ease-out' }} />
              <div className="absolute inset-0 m-7 rounded-full bg-amber-400 shadow-lg shadow-amber-500/80" />
            </div>
          </div>

          <iframe
            key={mapType}
            src={mapSrc}
            title="Shree Kunj Bihari Enclave Location"
            className="w-full aspect-square block"
            style={{ border: 0, filter: 'contrast(1.05) saturate(1.1) brightness(1.05)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#030509] via-[#030509]/95 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[11px] font-bold">Kosi Kalan · Mathura</div>
                  <div className="text-[9px] text-white/50">NH-2 Corridor, Uttar Pradesh</div>
                </div>
              </div>
              <a
                href={MAPS_LINK} target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-amber-400 border border-amber-400/40 rounded-full px-3 py-1.5"
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        </div>

        {/* Landmarks */}
        <div className="mt-6 space-y-2.5">
          {LANDMARKS.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">{l.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] truncate">{l.name}</div>
                <div className="text-[10px] text-amber-400/70 uppercase tracking-wider font-semibold">{l.tag}</div>
              </div>
              <div className="font-black text-amber-400 text-sm">{l.dist}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ② CONNECTIVITY                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Divider idx={1} />

      <section data-section="2" className="px-5 pt-16 pb-10 max-w-md mx-auto">
        <SectionLabel>② Connectivity</SectionLabel>
        <h2 className="text-3xl font-black leading-tight mb-2">
          On the spine of <span className="gold-text">NH-2</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          The Delhi-Agra national corridor runs past your front gate.
        </p>

        {/* Compact NH-2 corridor */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#070A12] to-[#080B14] p-5 overflow-hidden mb-5">
          <div className="absolute left-1/2 top-8 bottom-6 w-1 -ml-0.5 bg-gradient-to-b from-amber-400/0 via-amber-400/30 to-amber-400/0" />
          <div className="absolute left-1/2 top-8 bottom-6 w-px -ml-px"
               style={{ backgroundImage: 'linear-gradient(to bottom, rgba(252,211,77,0.7) 50%, transparent 50%)', backgroundSize: '4px 14px' }} />
          <div className="absolute left-1/2 top-1.5 -translate-x-1/2 text-[9px] font-black tracking-[0.3em] text-amber-400/80 bg-[#080B14] px-2">NH-2</div>

          <div className="relative flex flex-col gap-3">
            {CORRIDOR.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="relative grid grid-cols-2 items-center gap-2 h-10"
              >
                {c.side === 'left' && (
                  <>
                    <div className="text-right pr-4">
                      <div className="font-bold text-[12px]">{c.name}</div>
                      <div className="text-[9px] text-white/40">{c.km} · {c.drive}</div>
                    </div>
                    <div />
                    <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/50 border border-amber-400/70" />
                  </>
                )}
                {c.side === 'right' && (
                  <>
                    <div />
                    <div className="text-left pl-4">
                      <div className="font-bold text-[12px]">{c.name}</div>
                      <div className="text-[9px] text-white/40">{c.km} · {c.drive}</div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/50 border border-amber-400/70" />
                  </>
                )}
                {c.side === 'pin' && (
                  <div className="col-span-2 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 -m-3 rounded-full"
                           style={{ animation: 'pulseRing 1.6s infinite ease-out', background: 'radial-gradient(circle, rgba(252,211,77,0.7), transparent 70%)' }} />
                      <div className="relative px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#030509] text-[10px] font-black tracking-widest shadow-lg shadow-amber-500/50">
                        ★ KOSI · YOU ARE HERE ★
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Connectivity table */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/5 to-transparent p-1">
          <div className="rounded-[1.4rem] bg-[#0A0F1C]/60 backdrop-blur p-4">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 px-2">Drive Times</p>
            {CONNECTIVITY.map((c, i) => (
              <div key={c.place} className={`flex items-center justify-between py-2.5 px-2 ${i < CONNECTIVITY.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-3.5 h-3.5 text-amber-400/70" />
                  <span className="font-semibold text-[14px]">{c.place}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-white text-sm">{c.time}</div>
                  <div className="text-[10px] text-white/40">{c.km}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ③ INFRASTRUCTURE                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Divider idx={2} />

      <section data-section="3" className="px-5 pt-16 pb-10 max-w-md mx-auto">
        <SectionLabel>③ Infrastructure</SectionLabel>
        <h2 className="text-3xl font-black leading-tight mb-2">
          Built like a <span className="gold-text">forever home</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          Engineered amenities inside a gated boundary.
        </p>

        <div className="grid grid-cols-2 gap-3" style={{ perspective: 800 }}>
          {INFRA.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-2xl bg-white/[0.04] border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-500/15 border border-amber-500/30">
                <f.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-sm mb-0.5">{f.title}</h3>
              <p className="text-white/60 text-[11px] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ④ INDUSTRY — with real logos                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Divider idx={3} />

      <section data-section="4" className="pt-16 pb-10">
        <div className="px-5 max-w-md mx-auto mb-6">
          <SectionLabel>④ Industry</SectionLabel>
          <h2 className="text-3xl font-black leading-tight mb-2">
            Anchored by <span className="gold-text">global manufacturers</span>
          </h2>
          <p className="text-white/60 text-[14px] leading-relaxed">
            When companies of this scale build their plants in a corridor, land prices follow.
          </p>
        </div>

        {/* Logo grid */}
        <div className="px-5 max-w-md mx-auto grid grid-cols-3 gap-2.5 mb-6">
          {BRANDS.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="aspect-square rounded-2xl bg-white border border-white/10 flex flex-col items-center justify-center p-2 gap-1 shadow-lg"
            >
              <img
                src={`https://logo.clearbit.com/${b.domain}`}
                alt={b.name}
                className="max-h-9 max-w-full object-contain"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-[9px] font-bold text-gray-800 text-center leading-tight">{b.name}</span>
            </motion.div>
          ))}
        </div>

        <p className="px-5 max-w-md mx-auto text-center text-[11px] text-white/50 mt-4">
          Plants of <span className="text-amber-400 font-bold">{BRANDS.length}+</span> global manufacturers within the corridor
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ⑤ SECURITY                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Divider idx={4} />

      <section data-section="5" className="px-5 pt-16 pb-10 max-w-md mx-auto">
        <SectionLabel>⑤ Security</SectionLabel>
        <h2 className="text-3xl font-black leading-tight mb-6">
          A community you can <span className="text-blue-400">leave at the gate</span>
        </h2>

        <div className="relative rounded-[2rem] overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-900/30 via-[#0A0F1C] to-[#0A0F1C] p-6">
          <Shield className="w-10 h-10 text-blue-400 mb-3" />
          <p className="text-white/75 text-[14px] leading-relaxed mb-5">
            Closed boundary. Single entry. 24×7 trained guards. CCTV at gate and access points. Only authorized vehicles inside.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              '24×7 trained guards',
              'CCTV at every gate',
              'Closed boundary wall',
              'Authorized entry only',
            ].map(b => (
              <div key={b} className="flex items-center gap-2 text-[12px] text-white/85">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ⑥ APPRECIATION                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Divider idx={5} />

      <section data-section="6" className="px-5 pt-16 pb-10 max-w-md mx-auto">
        <SectionLabel>⑥ Appreciation</SectionLabel>
        <h2 className="text-3xl font-black leading-tight mb-2">
          Why prices <span className="gold-text">keep climbing here</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          Four forces are pulling this corridor up at the same time.
        </p>

        <div className="space-y-3 mb-8">
          {APPRECIATION.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <a.icon className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-black gold-text leading-none mb-1">{a.stat}</div>
                <div className="text-[12px] text-white/70 leading-snug">{a.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing — top-down */}
        <Tilt3D intensity={5}>
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
            <div className="relative p-6 text-[#030509]">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase opacity-70 mb-2">Now at corridor entry price</p>

              {/* Strike-through old price */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold opacity-50 line-through decoration-2">₹9,725</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/20 text-[#030509] tracking-wider">LIMITED INVENTORY</span>
              </div>

              {/* Animated discount price */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xs font-black opacity-80">₹</span>
                <span className="text-6xl font-black tracking-tight tabular-nums">
                  7,525
                </span>
              </div>
              <p className="text-sm font-bold opacity-80 mb-5">per square yard · launch pricing</p>

              {/* Entry plot */}
              <div className="p-3 rounded-2xl bg-black/15 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">Smallest plot · 50 sq yd</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black tracking-tight">₹3.76L</span>
                  <span className="text-[11px] font-bold opacity-70">total</span>
                  <span className="ml-auto text-[11px] font-bold">EMI ₹5,644/mo</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { v: 10, label: 'Booking',  sfx: '%' },
                  { v: 35, label: 'Registry', sfx: '%' },
                  { v: 60, label: 'Mo EMI',   sfx: '' },
                ].map(x => (
                  <div key={x.label} className="text-center py-3 bg-black/15 rounded-xl">
                    <div className="text-xl font-black">{x.v}{x.sfx}</div>
                    <div className="text-[10px] font-bold uppercase opacity-70">{x.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] font-bold opacity-70">0% Interest · Immediate Registry with 35% payment</p>
            </div>
          </div>
        </Tilt3D>

        {/* Plot ladder — TOP DOWN (largest first) */}
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-6 mb-3">All plot sizes</p>
        <div className="rounded-3xl border border-white/10 bg-[#0A0F1C]/60 overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2.5 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
            <span>Plot</span>
            <span className="text-right">Total</span>
            <span className="text-right">EMI/mo</span>
          </div>
          {PLOTS.map((p, i) => (
            <motion.div
              key={p.size}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`grid grid-cols-3 px-4 py-3 items-center border-t border-white/5 ${p.popular ? 'bg-amber-500/10' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[13px]">{p.size} sq yd</span>
                {p.popular && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-[#030509]">POPULAR</span>}
              </div>
              <div className="text-right font-bold text-[13px]">₹{(p.total/100000).toFixed(2)}L</div>
              <div className="text-right font-bold text-[13px] text-amber-400">₹{p.emi.toLocaleString('en-IN')}</div>
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {TRUST.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-white/[0.02] border border-amber-500/30 text-center"
            >
              <t.icon className="w-6 h-6 mx-auto text-amber-400 mb-2" />
              <div className="font-bold text-[12px] leading-tight">{t.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════ FINALE ════════ */}
      <section className="px-5 py-20 max-w-md mx-auto text-center relative">
        <Particles count={18} />

        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', damping: 14, duration: 1.4 }}
          className="relative inline-block mb-6"
        >
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-2xl shadow-amber-500/40 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border-2 border-[#030509]/30" />
            <Gem className="w-10 h-10 text-[#030509]" />
          </div>
          <div className="absolute inset-0 -m-5 rounded-full"
               style={{ animation: 'pulseRing 2.5s infinite ease-out', background: 'radial-gradient(circle, rgba(252,211,77,0.4), transparent 70%)' }} />
        </motion.div>

        <h2 className="text-[40px] font-black leading-[0.95] mb-3 relative z-10">
          Your plot.<br/>
          <span className="gold-text">Your legacy.</span>
        </h2>
        <p className="text-white/70 text-[15px] leading-relaxed mb-8 relative z-10">
          Inventory on the front rows of NH-2 is finite.
          Speak to the advisor who shared this page with you.
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 backdrop-blur-md relative z-10">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-[13px] font-bold gold-text">Continue with your advisor</span>
        </div>

        <p className="mt-12 text-[10px] text-white/40 leading-relaxed tracking-wider relative z-10">
          SHREE KUNJ BIHARI ENCLAVE · KOSI KALAN · MATHURA, UP<br/>
          A <span className="gold-text font-bold">Fanbe Group</span> Development
        </p>
      </section>

      {/* Back to top */}
      {showTopBtn && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#030509] shadow-2xl shadow-amber-500/50 active:scale-95 transition flex items-center justify-center"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

export default KunjBihariLanding;
