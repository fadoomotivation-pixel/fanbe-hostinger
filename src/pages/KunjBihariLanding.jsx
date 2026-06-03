import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  MapPin, Train, Building2, Shield, Zap, Droplet, Trees, Car,
  Calendar, ChevronRight, Sparkles, TrendingUp, Award, CheckCircle2,
  IndianRupee, Clock, Star, ArrowDown, BadgeCheck, Compass, Layers,
  Mountain
} from 'lucide-react';

const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';

// Approx coordinates near Kosi Kalan, Mathura — Shree Kunj Bihari Enclave
const LAT = 27.7910;
const LNG = 77.4385;
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${LAT},${LNG}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${LAT},${LNG}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

// NH-2 corridor — places in order with approximate distance from Kosi
const CORRIDOR = [
  { name: 'Delhi',     dist: '+110 km', side: 'left'  },
  { name: 'Badarpur',  dist: '+95 km',  side: 'left'  },
  { name: 'Palwal',    dist: '+60 km',  side: 'left'  },
  { name: 'Hodal',     dist: '+30 km',  side: 'left'  },
  { name: 'KOSI',      dist: 'YOU ARE HERE',     side: 'pin', highlight: true },
  { name: 'Chhata',    dist: '+10 km',  side: 'right' },
  { name: 'Akbarpur',  dist: '+18 km',  side: 'right' },
  { name: 'Vrindavan', dist: '+30 km',  side: 'right' },
  { name: 'Mathura',   dist: '+24 km',  side: 'right' },
];

const STATS = [
  { icon: Train,       big: '5',  unit: 'min', label: 'NH-2 Highway',  accent: '#F59E0B' },
  { icon: MapPin,      big: '5',  unit: 'min', label: 'Kosi Railway',  accent: '#10B981' },
  { icon: Shield,      big: '24', unit: '×7',  label: 'Gated Security', accent: '#3B82F6' },
  { icon: IndianRupee, big: '0',  unit: '%',   label: 'Interest EMI',  accent: '#8B5CF6' },
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

const CONNECTIVITY = [
  { place: 'Mathura',    time: '20 min', km: '24 km' },
  { place: 'Vrindavan',  time: '25 min', km: '30 km' },
  { place: 'Govardhan',  time: '40 min', km: '45 km' },
  { place: 'Palwal',     time: '40 min', km: '50 km' },
  { place: 'Delhi NCR',  time: '90 min', km: '110 km' },
  { place: 'Agra',       time: '90 min', km: '70 km' },
];

const BRANDS = [
  'Maruti Suzuki', 'YAZAKI', 'DAIKIN', 'UFLEX', 'JK Tyre',
  'HAVELLS', 'PARLE', 'Reliance Industries', 'BHARAT FORGE',
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

const Section = ({ id, children, className = '' }) => (
  <section id={id} className={`relative ${className}`}>{children}</section>
);

const KunjBihariLanding = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY    = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpac = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.6, 0]);

  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  return (
    <div className="min-h-screen bg-[#05070D] text-white overflow-x-hidden">
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Premium Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Premium gated plots beside NH-2, near Kosi-Mathura. Industrial belt + spiritual heritage + highway access. Clear title, immediate mutation." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Plots near Mathura NH-2" />
        <meta property="og:description" content="5 min from NH-2 highway · Gated colony · Clear title plots near Mathura" />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Helmet>

      {/* ════════ HERO (parallax) ════════ */}
      <Section id="hero" className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-5 pt-8 pb-20 overflow-hidden">
        <motion.div ref={heroRef} style={{ y: heroY, opacity: heroOpac }} className="absolute inset-0 z-0">
          <img src={HERO} alt="Shree Kunj Bihari Enclave" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070D]/30 via-[#05070D]/60 to-[#05070D]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.15),transparent_50%)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-300">A Fanbe Group Project</span>
          </div>

          <h1 className="text-[44px] leading-[1.02] font-black tracking-tight mb-3 bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
            Shree Kunj Bihari<br/>Enclave
          </h1>
          <p className="text-amber-200/90 text-sm font-medium tracking-wider mb-2">कोसी · मथुरा · NH-2 कॉरिडोर</p>
          <p className="text-white/70 text-[15px] leading-relaxed mb-8 px-3">
            Premium gated plots beside the National Highway — divine surroundings, industrial growth, zero-interest payment plans.
          </p>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 text-amber-400/70 text-xs font-medium tracking-wider"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>EXPLORE THE LOCATION</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>
      </Section>

      {/* ════════ QUICK STATS ════════ */}
      <Section className="px-5 -mt-12 relative z-20">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl"
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
      </Section>

      {/* ════════ NH-2 CORRIDOR (custom SVG-style) ════════ */}
      <Section className="px-5 pt-20 pb-10 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">The Mathura Corridor</p>
        <h2 className="text-3xl font-black leading-tight mb-2">
          On the spine of <span className="text-amber-400">NH-2</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-8">
          The highway that ties Delhi to Agra runs past your front gate.
        </p>

        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0A0F1C] via-[#0A0F1C] to-[#080B14] p-5 overflow-hidden">
          {/* highway gradient line */}
          <div className="absolute left-[50%] top-12 bottom-12 w-[3px] -ml-[1.5px] bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />
          {/* dashed highway marker line */}
          <div className="absolute left-[50%] top-12 bottom-12 w-[1px] -ml-[0.5px]"
               style={{ backgroundImage: 'linear-gradient(to bottom, rgba(252,211,77,0.6) 50%, transparent 50%)', backgroundSize: '4px 12px' }} />
          <div className="absolute left-1/2 top-3 -ml-[18px] text-[9px] font-black tracking-[0.25em] text-amber-400/70 bg-[#0A0F1C] px-2">NH-2</div>

          <div className="relative space-y-2">
            {CORRIDOR.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="grid grid-cols-2 gap-3 items-center h-10"
              >
                {c.side === 'left' && (
                  <>
                    <div className="text-right pr-3">
                      <div className="font-bold text-[13px]">{c.name}</div>
                      <div className="text-[10px] text-white/40 font-medium">{c.dist}</div>
                    </div>
                    <div />
                  </>
                )}
                {c.side === 'pin' && (
                  <>
                    <div />
                    <div />
                  </>
                )}
                {c.side === 'right' && (
                  <>
                    <div />
                    <div className="text-left pl-3">
                      <div className="font-bold text-[13px]">{c.name}</div>
                      <div className="text-[10px] text-white/40 font-medium">{c.dist}</div>
                    </div>
                  </>
                )}

                {/* pin in center */}
                {c.highlight ? (
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[2px]">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="absolute inset-0 -m-3 rounded-full bg-amber-500/30 blur-md" />
                      <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#05070D] text-[10px] font-black tracking-widest shadow-lg shadow-amber-500/40">
                        ★ KOSI ★
                      </div>
                      <div className="text-center mt-1 text-[9px] font-black text-amber-400 tracking-wider">
                        SHREE KUNJ BIHARI ENCLAVE
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/40 border border-amber-400/60"
                    style={{ top: `${64 + i * 48}px` }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════ SATELLITE MAP (Google Earth feel) ════════ */}
      <Section className="px-5 pt-12 pb-10 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Live Satellite View</p>
        <h2 className="text-3xl font-black leading-tight mb-2">
          See it from <span className="text-amber-400">above</span>
        </h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          The land, the highway, the railway, the temples — all in one frame.
        </p>

        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0A0F1C]">
          {/* Map type toggle */}
          <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${
                mapType === 'satellite' ? 'bg-amber-400 text-[#05070D]' : 'text-white/70'
              }`}
            >
              <Mountain className="w-3 h-3" /> SATELLITE
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${
                mapType === 'hybrid' ? 'bg-amber-400 text-[#05070D]' : 'text-white/70'
              }`}
            >
              <Layers className="w-3 h-3" /> LABELS
            </button>
          </div>

          {/* Coordinates badge */}
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">27.79°N 77.44°E</span>
          </div>

          <iframe
            key={mapType}
            src={mapSrc}
            title="Shree Kunj Bihari Enclave Location"
            className="w-full aspect-square block"
            style={{ border: 0, filter: 'contrast(1.05) saturate(1.05)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#05070D] via-[#05070D]/90 to-transparent">
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
        </div>

        <p className="text-center text-[11px] text-white/40 mt-3">
          Pinch to zoom · Satellite imagery © Google
        </p>
      </Section>

      {/* ════════ THE OPPORTUNITY ════════ */}
      <Section className="px-5 pt-16 pb-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">The Opportunity</p>
        <h2 className="text-3xl font-black leading-tight mb-5">
          Where divinity meets <span className="text-amber-400">growth</span>
        </h2>

        <div className="space-y-3">
          {[
            { icon: '🛣️', title: 'Highway-front access', desc: 'NH-2 expressway in 5 minutes — Delhi reachable in 90 minutes.' },
            { icon: '🏭', title: 'Industrial powerhouse', desc: 'Plants of Maruti Suzuki, Reliance, Bharat Forge, Havells & 5+ MNCs nearby.' },
            { icon: '🛕', title: 'Spiritual gravity', desc: 'Mathura, Vrindavan, Govardhan & Shani Dev Mandir — Braj Bhoomi heritage.' },
            { icon: '📈', title: 'Appreciation corridor', desc: 'NH-2 land prices have grown ~22% YoY in this belt.' },
          ].map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10"
            >
              <div className="text-3xl flex-shrink-0">{b.icon}</div>
              <div>
                <h3 className="font-bold text-[15px] mb-0.5">{b.title}</h3>
                <p className="text-white/60 text-[13px] leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ LANDMARKS ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Around You</p>
        <h2 className="text-3xl font-black mb-6">Every landmark, <span className="text-amber-400">minutes away</span></h2>

        <div className="space-y-2.5">
          {LANDMARKS.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.08]"
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
      </Section>

      {/* ════════ CONNECTIVITY ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Reach Anywhere</p>
        <h2 className="text-3xl font-black mb-6">Connectivity that <span className="text-amber-400">pays</span></h2>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/5 to-transparent p-1">
          <div className="rounded-[1.4rem] bg-[#0A0F1C]/60 backdrop-blur p-5">
            {CONNECTIVITY.map((c, i) => (
              <div key={c.place} className={`flex items-center justify-between py-3 ${i < CONNECTIVITY.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400/70" />
                  <span className="font-semibold text-[15px]">{c.place}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-white">{c.time}</div>
                  <div className="text-[10px] text-white/40 font-medium">{c.km}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════ INDUSTRIAL NEIGHBORS ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Your Industrial Neighbors</p>
        <h2 className="text-3xl font-black mb-3">The companies that <span className="text-amber-400">moved here first</span></h2>
        <p className="text-white/60 text-[14px] leading-relaxed mb-6">
          When global manufacturers anchor a corridor, land value follows. These plants are already running, adjacent to your plot.
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {BRANDS.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="aspect-square rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 flex items-center justify-center p-3 text-center"
            >
              <span className="text-[11px] font-bold text-white/90 leading-tight">{b}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ PRICING TEASER (no CTA — info only) ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative p-7 text-[#05070D]">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-70 mb-2">Plots Starting From</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-black opacity-80">₹</span>
              <span className="text-6xl font-black tracking-tight">7,525</span>
            </div>
            <p className="text-sm font-bold opacity-80 mb-5">per square yard</p>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center py-3 bg-black/10 rounded-xl">
                <div className="text-xl font-black">10%</div>
                <div className="text-[10px] font-bold uppercase opacity-70">Booking</div>
              </div>
              <div className="text-center py-3 bg-black/10 rounded-xl">
                <div className="text-xl font-black">35%</div>
                <div className="text-[10px] font-bold uppercase opacity-70">Registry</div>
              </div>
              <div className="text-center py-3 bg-black/10 rounded-xl">
                <div className="text-xl font-black">60</div>
                <div className="text-[10px] font-bold uppercase opacity-70">Mo EMI</div>
              </div>
            </div>

            <p className="text-center text-[11px] font-bold opacity-70 mt-4">
              Plot sizes: 50 · 55 · 60 · 80 · 100 · 120 · 150 · 200 · 250 sq yd
            </p>
          </div>
        </div>
      </Section>

      {/* ════════ INFRASTRUCTURE ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Inside the Gates</p>
        <h2 className="text-3xl font-black mb-6">Built like a <span className="text-amber-400">forever home</span></h2>

        <div className="grid grid-cols-2 gap-3">
          {INFRA.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-white/60 text-[11px] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ TRUST BADGES ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-3 text-center">Investor Assurance</p>
        <h2 className="text-3xl font-black text-center mb-6">Promises we <span className="text-amber-400">put in writing</span></h2>

        <div className="grid grid-cols-2 gap-3">
          {TRUST.map((t) => (
            <div key={t.label} className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-amber-500/20 text-center">
              <t.icon className="w-7 h-7 mx-auto text-amber-400 mb-2" />
              <div className="font-bold text-sm">{t.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════ SECURITY ════════ */}
      <Section className="px-5 py-12 max-w-md mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-blue-900/30 via-[#0A0F1C] to-[#0A0F1C] p-7">
          <Shield className="w-12 h-12 text-blue-400 mb-4" />
          <h2 className="text-2xl font-black mb-3">A community you can <span className="text-blue-400">leave at the gate</span></h2>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">
            Closed boundary. Single entry. 24×7 trained guards. CCTV at gate and access points. Only authorized vehicles inside.
            Your family's peace, your plot's protection — engineered in.
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
      </Section>

      {/* ════════ FINAL — no CTAs, just legacy framing ════════ */}
      <Section className="px-5 py-20 max-w-md mx-auto text-center">
        <Star className="w-10 h-10 text-amber-400 mx-auto mb-4 fill-amber-400" />
        <h2 className="text-4xl font-black mb-3 leading-tight">
          Your plot.<br/>
          <span className="text-amber-400">Your legacy.</span>
        </h2>
        <p className="text-white/70 text-[15px] leading-relaxed mb-8">
          Inventory on the front rows of NH-2 is finite. Speak to the advisor who shared this page with you to lock the plot that fits your goal.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/[0.05] border border-amber-400/30">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[13px] font-semibold text-amber-200">
            Continue this conversation with your advisor
          </span>
        </div>

        <p className="mt-12 text-[11px] text-white/40 leading-relaxed">
          Shree Kunj Bihari Enclave · Kosi Kalan · Mathura, UP<br/>
          A <span className="text-amber-400 font-bold">Fanbe Group</span> Project
        </p>
      </Section>
    </div>
  );
};

export default KunjBihariLanding;
