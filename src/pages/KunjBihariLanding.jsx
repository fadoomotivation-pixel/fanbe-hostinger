import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  MapPin, Train, Building2, Shield, Zap, Droplet, Trees, Car,
  Sparkles, CheckCircle2, IndianRupee, Clock, Star, ArrowDown,
  BadgeCheck, Compass, Layers, Mountain, TrendingUp, Award, Crown,
  Gem, ChevronUp
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Configuration
const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
const LAT = 27.7910;
const LNG = 77.4385;
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${LAT},${LNG}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${LAT},${LNG}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

const CORRIDOR = [
  { name: 'Delhi NCR',  dist: '110 km', side: 'left',  drive: '90 min' },
  { name: 'Badarpur',   dist: '95 km',  side: 'left',  drive: '80 min' },
  { name: 'Palwal',     dist: '60 km',  side: 'left',  drive: '55 min' },
  { name: 'Hodal',      dist: '30 km',  side: 'left',  drive: '30 min' },
  { name: 'KOSI',       dist: '0 km',   side: 'pin',   highlight: true, drive: 'HERE' },
  { name: 'Chhata',     dist: '10 km',  side: 'right', drive: '10 min' },
  { name: 'Akbarpur',   dist: '18 km',  side: 'right', drive: '15 min' },
  { name: 'Vrindavan',  dist: '30 km',  side: 'right', drive: '25 min' },
  { name: 'Mathura',    dist: '24 km',  side: 'right', drive: '20 min' },
];

const STATS = [
  { icon: Train,       big: '5',   unit: 'min', label: 'NH-2 Highway',   accent: '#F59E0B' },
  { icon: MapPin,      big: '5',   unit: 'min', label: 'Kosi Railway',   accent: '#10B981' },
  { icon: Shield,      big: '24',  unit: '×7',  label: 'Gated Security', accent: '#3B82F6' },
  { icon: IndianRupee, big: '0',   unit: '%',   label: 'Interest EMI',   accent: '#8B5CF6' },
];

const LANDMARKS = [
  { emoji: '🛣️', name: 'National Highway (NH-2)', dist: '5 min',  tag: 'Connectivity' },
  { emoji: '🚆', name: 'Kosi Railway Station',     dist: '5 min',  tag: 'Transport' },
  { emoji: '🛕', name: 'Shani Dev Mandir',         dist: '5 min',  tag: 'Spiritual' },
  { emoji: '🛕', name: 'Jagannath Dham',           dist: 'Nearby', tag: 'Spiritual' },
  { emoji: '🛕', name: 'Nand Baba Mandir',         dist: 'Nearby', tag: 'Spiritual' },
  { emoji: '🏭', name: 'Industrial Area',          dist: 'Adjacent', tag: 'Employment' },
  { emoji: '🌳', name: 'Gokul Vatika',             dist: 'Nearby', tag: 'Lifestyle' },
];

const BRANDS = [
  'Maruti Suzuki', 'YAZAKI', 'DAIKIN', 'UFLEX', 'JK Tyre',
  'HAVELLS', 'PARLE', 'Reliance', 'BHARAT FORGE',
];

const PLOTS = [
  { size: 50,  total: 376250,  emi: 5644,  highlight: false },
  { size: 80,  total: 602000,  emi: 9030,  highlight: false },
  { size: 100, total: 752500,  emi: 11287, highlight: true  },
  { size: 150, total: 1128750, emi: 16931, highlight: false },
  { size: 200, total: 1505000, emi: 22575, highlight: false },
  { size: 250, total: 1881250, emi: 28219, highlight: false },
];

const INFRA = [
  { icon: Building2, title: 'Grand Entrance',     desc: 'With dedicated guard room',         color: '#F59E0B' },
  { icon: Car,       title: 'Wide Damar Roads',   desc: 'Blacktop roads inside colony',      color: '#0EA5E9' },
  { icon: Zap,       title: 'Electricity Ready',  desc: 'Full power supply infrastructure',  color: '#FACC15' },
  { icon: Droplet,   title: 'Water Supply',       desc: '24×7 dependable water',             color: '#06B6D4' },
  { icon: Trees,     title: 'Green Environment',  desc: 'Pollution-free, planned greenery',  color: '#22C55E' },
  { icon: Shield,    title: 'Gated Boundary',     desc: 'Closed perimeter, single entry',    color: '#6366F1' },
];

const TRUST = [
  { icon: BadgeCheck,   label: '100% Clear Title' },
  { icon: CheckCircle2, label: 'Immediate Mutation' },
  { icon: Shield,       label: 'No Hidden Charges' },
  { icon: IndianRupee,  label: '0% Interest EMI' },
];

// ────────────────────────────────────────────────────────────────────────────
// Particles — gold ambient drift
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
    })),
    [count]
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {seeds.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
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

// Animated number counter
const Counter = ({ to, suffix = '', duration = 1.6 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

// 3D tilt wrapper (touch-aware)
const Tilt3D = ({ children, intensity = 8, className = '' }) => {
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
      onMouseMove={handle}
      onTouchMove={handle}
      onMouseLeave={reset}
      onTouchEnd={reset}
      style={{
        rotateX: sx, rotateY: sy,
        transformStyle: 'preserve-3d', transformPerspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const KunjBihariLanding = () => {
  // Hero parallax
  const heroRef = useRef(null);
  const { scrollYProgress: heroProg } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroBgY    = useTransform(heroProg, [0, 1], [0, 180]);
  const heroBgScale = useTransform(heroProg, [0, 1], [1.05, 1.25]);
  const heroOpac    = useTransform(heroProg, [0, 0.6, 1], [1, 0.6, 0]);
  const heroTitleY  = useTransform(heroProg, [0, 1], [0, -60]);

  // Sticky NH-2 journey
  const journeyRef = useRef(null);
  const { scrollYProgress: jProg } = useScroll({ target: journeyRef, offset: ['start start', 'end end'] });
  const carY = useTransform(jProg, [0, 1], ['0%', '100%']);

  // Satellite section flyover effect
  const mapRef = useRef(null);
  const { scrollYProgress: mProg } = useScroll({ target: mapRef, offset: ['start end', 'end start'] });
  const mapScale = useTransform(mProg, [0, 0.5, 1], [0.85, 1, 1.05]);
  const mapRotZ  = useTransform(mProg, [0, 1], [-2, 2]);

  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  // Reveal advisor chip after scrolling past hero
  const [showAdvisorChip, setShowAdvisorChip] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowAdvisorChip(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030509] text-white overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      <Helmet>
        <title>Shree Kunj Bihari Enclave — A ₹100 Cr Project | Fanbe Group</title>
        <meta name="description" content="A flagship ₹100 Crore gated development beside NH-2, near Kosi-Mathura. Industrial growth · Spiritual heritage · Highway access." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — A ₹100 Cr Development on NH-2" />
        <meta property="og:description" content="Premium plots beside the National Highway, Kosi-Mathura. By Fanbe Group." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <style>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes pulseRing { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
          @keyframes shine { 0% { transform: translateX(-150%); } 60%, 100% { transform: translateX(150%); } }
          .gold-text {
            background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 35%, #FCD34D 50%, #F59E0B 65%, #FCD34D 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shine 5s ease-in-out infinite;
          }
        `}</style>
      </Helmet>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HERO — cinematic with parallax + particles + animated reveal         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-5 overflow-hidden">
        <motion.div style={{ y: heroBgY, scale: heroBgScale, opacity: heroOpac }} className="absolute inset-0 z-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030509]/30 via-[#030509]/60 to-[#030509]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(245,158,11,0.22),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(139,92,246,0.12),transparent_60%)]" />
        </motion.div>
        <Particles count={40} />

        <motion.div style={{ y: heroTitleY }} className="relative z-10 max-w-md mx-auto">
          {/* ₹100 Cr seal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 backdrop-blur-md mb-6"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase gold-text">A ₹100 Crore Development</span>
            <Crown className="w-4 h-4 text-amber-300" />
            <span
              className="absolute -inset-px rounded-full opacity-60"
              style={{
                background: 'linear-gradient(120deg, transparent 30%, rgba(252,211,77,0.4) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shine 3.5s infinite',
                mixBlendMode: 'overlay',
              }}
            />
          </motion.div>

          {/* Letter-by-letter title */}
          <motion.h1
            className="text-[44px] sm:text-[52px] leading-[0.95] font-black tracking-tighter mb-3"
            initial="hidden" animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
            }}
          >
            {'Shree Kunj Bihari'.split('').map((ch, i) => (
              <motion.span
                key={`a-${i}`}
                className="inline-block gold-text"
                variants={{
                  hidden: { opacity: 0, y: 30, rotateX: -90 },
                  visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', damping: 12 } },
                }}
                style={{ transformOrigin: 'center bottom' }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
            <br/>
            {'Enclave'.split('').map((ch, i) => (
              <motion.span
                key={`b-${i}`}
                className="inline-block bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent"
                variants={{
                  hidden: { opacity: 0, y: 30, rotateX: -90 },
                  visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', damping: 12 } },
                }}
                style={{ transformOrigin: 'center bottom' }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
            className="text-amber-200/90 text-[13px] font-bold tracking-[0.3em] uppercase mb-3"
          >
            कोसी · मथुरा · NH-2
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            className="text-white/70 text-[15px] leading-relaxed mb-10 px-3"
          >
            A flagship ₹100 Crore development beside India's most legendary highway —
            divinity, industry, and infrastructure converge at one address.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 text-amber-400/80 text-[10px] font-bold tracking-[0.3em]"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>SCROLL TO BEGIN THE JOURNEY</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FLOATING STATS (3D flip-in)                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 -mt-16 relative z-30">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto" style={{ perspective: 1000 }}>
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, rotateY: -90, z: -100 }}
              whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.1, type: 'spring', damping: 14 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 backdrop-blur-xl shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
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
      {/* OPPORTUNITY HIGHLIGHT — animated counters                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 pt-24 pb-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">The Numbers</p>
        <h2 className="text-3xl font-black leading-tight mb-8">
          A development at <span className="gold-text">scale</span>
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[
            { v: 100, suffix: 'Cr',  label: 'Project Worth',  prefix: '₹' },
            { v: 22,  suffix: '%',   label: 'NH-2 Growth/yr', prefix: '+' },
            { v: 9,   suffix: '+',   label: 'Plot Sizes',     prefix: '' },
          ].map((n, i) => (
            <motion.div
              key={n.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3 rounded-2xl bg-white/[0.03] border border-amber-500/20"
            >
              <div className="text-2xl font-black gold-text">
                {n.prefix}<Counter to={n.v} />{n.suffix}
              </div>
              <div className="text-[10px] text-white/50 mt-1 font-medium uppercase tracking-wider">{n.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* NH-2 STICKY SCROLLYTELLING JOURNEY                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section ref={journeyRef} className="relative" style={{ height: '220vh' }}>
        <div className="sticky top-0 h-screen flex items-center justify-center px-5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.08),transparent_70%)]" />

          <div className="relative max-w-md w-full">
            <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-2 text-center">The Mathura Corridor</p>
            <h2 className="text-3xl font-black leading-tight mb-4 text-center">
              On the spine of <span className="gold-text">NH-2</span>
            </h2>

            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#070A12] via-[#0A0F1C] to-[#070A12] p-5 overflow-hidden" style={{ height: '60vh' }}>
              {/* Highway */}
              <div className="absolute left-1/2 top-8 bottom-8 w-1 -ml-0.5 bg-gradient-to-b from-amber-400/0 via-amber-400/30 to-amber-400/0" />
              <div className="absolute left-1/2 top-8 bottom-8 w-px -ml-px"
                   style={{ backgroundImage: 'linear-gradient(to bottom, rgba(252,211,77,0.7) 50%, transparent 50%)', backgroundSize: '4px 14px' }} />

              {/* Highway label */}
              <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-black tracking-[0.3em] text-amber-400/80 bg-[#070A12] px-2">
                NH-2
              </div>

              {/* Cars travelling */}
              <motion.div
                style={{ top: carY }}
                className="absolute left-1/2 -translate-x-1/2 z-30"
              >
                <div className="relative">
                  <div className="absolute inset-0 -m-4 rounded-full bg-amber-500/40 blur-lg animate-pulse" />
                  <div className="relative w-4 h-7 rounded-md bg-gradient-to-b from-amber-300 to-amber-600 shadow-lg shadow-amber-500/50" />
                </div>
              </motion.div>

              {/* Corridor cities */}
              <div className="relative h-full flex flex-col justify-around py-4">
                {CORRIDOR.map((c, i) => (
                  <div key={c.name} className="relative grid grid-cols-2 items-center gap-2 h-8">
                    {c.side === 'left' && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-10%' }}
                          transition={{ delay: i * 0.05 }}
                          className="text-right pr-4"
                        >
                          <div className="font-bold text-[12px] text-white">{c.name}</div>
                          <div className="text-[9px] text-white/40 font-medium">{c.dist} · {c.drive}</div>
                        </motion.div>
                        <div />
                      </>
                    )}
                    {c.side === 'right' && (
                      <>
                        <div />
                        <motion.div
                          initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-10%' }}
                          transition={{ delay: i * 0.05 }}
                          className="text-left pl-4"
                        >
                          <div className="font-bold text-[12px] text-white">{c.name}</div>
                          <div className="text-[9px] text-white/40 font-medium">{c.dist} · {c.drive}</div>
                        </motion.div>
                      </>
                    )}
                    {c.side === 'pin' && (
                      <div className="col-span-2 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 -m-6 rounded-full"
                               style={{ animation: 'pulseRing 1.6s infinite ease-out', background: 'radial-gradient(circle, rgba(252,211,77,0.6), transparent 70%)' }} />
                          <div className="absolute inset-0 -m-3 rounded-full"
                               style={{ animation: 'pulseRing 1.6s 0.4s infinite ease-out', background: 'radial-gradient(circle, rgba(252,211,77,0.7), transparent 70%)' }} />
                          <div className="relative px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#030509] text-[10px] font-black tracking-widest shadow-2xl shadow-amber-500/60">
                            ★ KOSI ★
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* milestone dot */}
                    {!c.highlight && (
                      <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/50 border border-amber-400/70" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-[10px] text-white/40 mt-4 font-medium tracking-wider">
              SHREE KUNJ BIHARI ENCLAVE · KOSI, MATHURA
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SATELLITE MAP — cinematic flyover                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section ref={mapRef} className="px-5 pt-12 pb-12 max-w-md mx-auto" style={{ perspective: 1400 }}>
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Live Satellite View</p>
        <h2 className="text-3xl font-black leading-tight mb-2">
          See it from <span className="gold-text">above</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          The land, the highway, the railway — all in one frame.
        </p>

        <motion.div
          style={{ scale: mapScale, rotateZ: mapRotZ, transformStyle: 'preserve-3d' }}
          className="relative rounded-3xl overflow-hidden border border-white/20 bg-[#0A0F1C] shadow-2xl shadow-amber-500/10"
        >
          {/* Type toggle */}
          <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${
                mapType === 'satellite' ? 'bg-amber-400 text-[#030509] shadow-md' : 'text-white/70'
              }`}
            >
              <Mountain className="w-3 h-3" /> SATELLITE
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${
                mapType === 'hybrid' ? 'bg-amber-400 text-[#030509] shadow-md' : 'text-white/70'
              }`}
            >
              <Layers className="w-3 h-3" /> LABELS
            </button>
          </div>

          {/* Coordinates */}
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/30 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">27.79°N 77.44°E</span>
          </div>

          {/* Animated crosshair overlay */}
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
            style={{ border: 0, filter: 'contrast(1.08) saturate(1.15) brightness(1.05)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#030509] via-[#030509]/95 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[11px] font-bold">Kosi Kalan · Mathura</div>
                  <div className="text-[9px] text-white/50 tracking-wide">NH-2 Corridor, Uttar Pradesh</div>
                </div>
              </div>
              <a
                href={MAPS_LINK} target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-amber-400 border border-amber-400/40 rounded-full px-3 py-1.5 hover:bg-amber-400/10 transition"
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-white/40 mt-3 tracking-wider">PINCH TO ZOOM · IMAGERY © GOOGLE</p>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* OPPORTUNITY (4 cards)                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 pt-16 pb-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">The Opportunity</p>
        <h2 className="text-3xl font-black leading-tight mb-5">
          Where divinity meets <span className="gold-text">growth</span>
        </h2>

        <div className="space-y-3" style={{ perspective: 1200 }}>
          {[
            { icon: '🛣️', title: 'Highway-front access',  desc: 'NH-2 expressway in 5 minutes — Delhi reachable in 90 minutes.' },
            { icon: '🏭', title: 'Industrial powerhouse',  desc: 'Plants of Maruti Suzuki, Reliance, Bharat Forge, Havells & 5+ MNCs nearby.' },
            { icon: '🛕', title: 'Spiritual gravity',      desc: 'Mathura, Vrindavan, Govardhan & Shani Dev Mandir — the heart of Braj Bhoomi.' },
            { icon: '📈', title: 'Appreciation corridor',  desc: 'NH-2 land prices have grown ~22% YoY in this belt.' },
          ].map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20, rotateY: -8 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-3xl flex-shrink-0">{b.icon}</div>
              <div>
                <h3 className="font-bold text-[15px] mb-0.5">{b.title}</h3>
                <p className="text-white/60 text-[13px] leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LANDMARKS                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Around You</p>
        <h2 className="text-3xl font-black mb-6">Every landmark, <span className="gold-text">minutes away</span></h2>

        <div className="space-y-2.5">
          {LANDMARKS.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/[0.08]"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                {l.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] truncate">{l.name}</div>
                <div className="text-[10px] text-amber-400/70 uppercase tracking-wider font-semibold">{l.tag}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-amber-400 text-sm">{l.dist}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* INDUSTRIAL BRANDS — infinite marquee                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 overflow-hidden">
        <div className="px-5 max-w-md mx-auto mb-6">
          <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Industrial Neighbors</p>
          <h2 className="text-3xl font-black">
            The brands that <span className="gold-text">moved here first</span>
          </h2>
          <p className="text-white/60 text-[13px] leading-relaxed mt-3">
            When global manufacturers anchor a corridor, land value follows.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#030509] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#030509] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 overflow-hidden" style={{ width: '100%' }}>
            <div className="flex gap-3 shrink-0" style={{ animation: 'marquee 28s linear infinite' }}>
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <div
                  key={i}
                  className="shrink-0 min-w-[120px] h-16 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 flex items-center justify-center px-4"
                >
                  <span className="text-[12px] font-bold text-white/90 text-center">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PRICING — 3D tilted card                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-md mx-auto" style={{ perspective: 1200 }}>
        <Tilt3D intensity={6}>
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
            <span
              className="absolute -inset-px opacity-50 pointer-events-none"
              style={{
                background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shine 4s infinite',
              }}
            />
            <div className="relative p-7 text-[#030509]">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase opacity-70 mb-2">Plots Starting From</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-black opacity-80">₹</span>
                <span className="text-6xl font-black tracking-tight">
                  <Counter to={7525} />
                </span>
              </div>
              <p className="text-sm font-bold opacity-80 mb-5">per square yard</p>

              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { v: 10, label: 'Booking' },
                  { v: 35, label: 'Registry' },
                  { v: 60, label: 'Mo EMI' },
                ].map(x => (
                  <div key={x.label} className="text-center py-3 bg-black/15 rounded-xl">
                    <div className="text-xl font-black"><Counter to={x.v} />{x.label === 'Booking' || x.label === 'Registry' ? '%' : ''}</div>
                    <div className="text-[10px] font-bold uppercase opacity-70">{x.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tilt3D>

        {/* Plot size grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {PLOTS.map((p, i) => (
            <motion.div
              key={p.size}
              initial={{ opacity: 0, y: 20, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`relative p-4 rounded-2xl border ${p.highlight ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/0 border-amber-400/40' : 'bg-white/[0.03] border-white/10'}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {p.highlight && (
                <div className="absolute -top-2 right-3 text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-[#030509] tracking-wider">
                  POPULAR
                </div>
              )}
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Plot</div>
              <div className="text-2xl font-black mb-3">{p.size} <span className="text-[11px] text-white/50 font-medium">sq yd</span></div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[10px] text-white/40">Total</span>
                <span className="text-sm font-bold text-white">₹{(p.total/100000).toFixed(2)}L</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-amber-400/80">EMI</span>
                <span className="text-sm font-bold text-amber-400">₹{p.emi.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-amber-400/60">/mo</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* INFRASTRUCTURE                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Inside the Gates</p>
        <h2 className="text-3xl font-black mb-6">Built like a <span className="gold-text">forever home</span></h2>

        <div className="grid grid-cols-2 gap-3" style={{ perspective: 800 }}>
          {INFRA.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-2xl bg-white/[0.04] border border-white/10"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}25`, border: `1px solid ${f.color}50` }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-white/60 text-[11px] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TRUST BADGES                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3 text-center">Investor Assurance</p>
        <h2 className="text-3xl font-black text-center mb-6">Promises we <span className="gold-text">put in writing</span></h2>

        <div className="grid grid-cols-2 gap-3">
          {TRUST.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: 'spring' }}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-white/[0.02] border border-amber-500/30 text-center"
            >
              <t.icon className="w-7 h-7 mx-auto text-amber-400 mb-2" />
              <div className="font-bold text-sm">{t.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECURITY                                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-md mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-blue-900/30 via-[#0A0F1C] to-[#0A0F1C] p-7">
          <Shield className="w-12 h-12 text-blue-400 mb-4" />
          <h2 className="text-2xl font-black mb-3">A community you can <span className="text-blue-400">leave at the gate</span></h2>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">
            Closed boundary. Single entry. 24×7 trained guards. CCTV at gate and access points.
            Only authorized vehicles inside.
          </p>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            {['24×7 guards', 'CCTV gate', 'Closed boundary', 'Authorized entry only'].map(b => (
              <div key={b} className="flex items-center gap-2 text-white/80">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FINALE — Golden seal                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-24 max-w-md mx-auto text-center relative">
        <Particles count={20} />

        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', damping: 14, duration: 1.4 }}
          className="relative inline-block mb-8"
        >
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-2xl shadow-amber-500/40 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border-2 border-[#030509]/30" />
            <Gem className="w-12 h-12 text-[#030509]" />
          </div>
          <div className="absolute inset-0 -m-6 rounded-full"
               style={{ animation: 'pulseRing 2.5s infinite ease-out', background: 'radial-gradient(circle, rgba(252,211,77,0.4), transparent 70%)' }} />
        </motion.div>

        <h2 className="text-[44px] font-black leading-[0.95] mb-4 relative z-10">
          Your plot.<br/>
          <span className="gold-text">Your legacy.</span>
        </h2>
        <p className="text-white/70 text-[15px] leading-relaxed mb-10 relative z-10">
          Inventory on the front rows of NH-2 is finite.
          Speak to the advisor who shared this page with you
          to lock the plot that fits your goal.
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 backdrop-blur-md relative z-10">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-[13px] font-bold gold-text">
            Continue with your advisor
          </span>
        </div>

        <p className="mt-14 text-[10px] text-white/40 leading-relaxed tracking-wider relative z-10">
          SHREE KUNJ BIHARI ENCLAVE · KOSI KALAN · MATHURA, UP<br/>
          A <span className="gold-text font-bold">Fanbe Group</span> Development
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Floating advisor chip after scroll                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showAdvisorChip && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#030509] text-[12px] font-black tracking-wider shadow-2xl shadow-amber-500/40 active:scale-95 transition"
          >
            <ChevronUp className="w-4 h-4" /> BACK TO TOP
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default KunjBihariLanding;
