import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  MapPin, Train, Building2, Shield, ArrowDown, Compass, Layers, Mountain,
  TrendingUp, FileCheck, CheckCircle2
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
const PLACE_QUERY = encodeURIComponent('Shree Kunj Bihari Enclave, Kosi Kalan, Mathura');
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

const STATIONS = [
  { name: 'Delhi NCR', meta: '110 km · 90 min' },
  { name: 'Palwal',    meta: '60 km · 55 min' },
  { name: 'Hodal',     meta: '30 km · 30 min' },
  { name: 'Kosi',      meta: 'The Enclave', anchor: true },
  { name: 'Chhata',    meta: '10 km · 10 min' },
  { name: 'Vrindavan', meta: '30 km · 25 min' },
  { name: 'Mathura',   meta: '24 km · 20 min' },
];

const LANDMARKS = [
  { n: 'National Highway (NH-2)', d: '5 min',    k: 'Connectivity' },
  { n: 'Kosi Railway Station',    d: '5 min',    k: 'Transport' },
  { n: 'Shani Dev Mandir',        d: '5 min',    k: 'Spiritual' },
  { n: 'Durwasha Rishi Ashram',   d: 'Nearby',   k: 'Heritage' },
  { n: 'Jagannath Dham',          d: 'Nearby',   k: 'Spiritual' },
  { n: 'Nand Baba Mandir',        d: 'Nearby',   k: 'Spiritual' },
  { n: 'Industrial Area',         d: 'Adjacent', k: 'Employment' },
  { n: 'Gokul Vatika',            d: 'Nearby',   k: 'Lifestyle' },
];

const DRIVES = [
  { p: 'Mathura',    t: '20 min', k: '24 km' },
  { p: 'Vrindavan',  t: '25 min', k: '30 km' },
  { p: 'Govardhan',  t: '40 min', k: '45 km' },
  { p: 'Palwal',     t: '55 min', k: '60 km' },
  { p: 'Delhi NCR',  t: '90 min', k: '110 km' },
  { p: 'Agra',       t: '90 min', k: '70 km' },
];

const BRANDS = [
  { name: 'Maruti Suzuki', domain: 'marutisuzuki.com' },
  { name: 'Reliance',      domain: 'ril.com' },
  { name: 'DAIKIN',        domain: 'daikin.com' },
  { name: 'HAVELLS',       domain: 'havells.com' },
  { name: 'JK Tyre',       domain: 'jktyre.com' },
  { name: 'Bharat Forge',  domain: 'bharatforge.com' },
  { name: 'PARLE',         domain: 'parleproducts.com' },
  { name: 'YAZAKI',        domain: 'yazaki-group.com' },
  { name: 'UFLEX',         domain: 'uflexltd.com' },
];

const INFRA = [
  ['Grand Entrance',     'Dedicated guard room at single point of access'],
  ['Wide Damar Roads',   'Blacktop internal roads, planned grid'],
  ['Electricity',        'Full power supply infrastructure provisioned'],
  ['Water Supply',       'Dependable 24×7 utility connection'],
  ['Green Belt',         'Pollution-free planned greenery'],
  ['Gated Boundary',     'Closed perimeter, single authorised entry'],
];

const APPRECIATION = [
  { stat: '22%',  copy: 'YoY land-price growth on this NH-2 belt' },
  { stat: '35%',  copy: 'YoY tourism rise in Braj Bhoomi' },
  { stat: '5+',   copy: 'Active MNC plants in the immediate corridor' },
  { stat: 'NH-2', copy: 'Delhi-Agra national corridor frontage' },
];

const PLOTS = [
  { size: 50,  total: '₹3,76,250',  emi: '₹5,644' },
  { size: 80,  total: '₹6,02,000',  emi: '₹9,030' },
  { size: 100, total: '₹7,52,500',  emi: '₹11,287', tag: 'Popular' },
  { size: 150, total: '₹11,28,750', emi: '₹16,931' },
  { size: 250, total: '₹18,81,250', emi: '₹28,219' },
];

const TRUST = [
  { l: 'Immediate Registry',  i: FileCheck },
  { l: 'Mutation in Hand',    i: CheckCircle2 },
  { l: 'No Hidden Charges',   i: Shield },
  { l: '0% Interest EMI',     i: TrendingUp },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reusable typographic helpers

const Eyebrow = ({ children }) => (
  <p className="text-[10px] tracking-[0.4em] text-amber-400/80 uppercase font-semibold mb-4">{children}</p>
);

const Display = ({ children, className = '' }) => (
  <h2 className={`font-serif text-[42px] leading-[1.05] tracking-tight text-stone-100 ${className}`}
      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
    {children}
  </h2>
);

const Lede = ({ children }) => (
  <p className="text-stone-400 text-[15px] leading-[1.65] mt-4 max-w-md">{children}</p>
);

const Row = ({ left, right, sub }) => (
  <div className="flex items-baseline justify-between py-4 border-b border-stone-800/80">
    <div className="flex-1 min-w-0">
      <div className="font-medium text-[15px] text-stone-100 truncate">{left}</div>
      {sub && <div className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">{sub}</div>}
    </div>
    <div className="text-[14px] font-semibold text-amber-300 tabular-nums">{right}</div>
  </div>
);

const Rule = () => (
  <div className="max-w-md mx-auto px-6">
    <div className="h-px bg-gradient-to-r from-transparent via-stone-700/60 to-transparent my-12" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal scroll-jack — drive down NH-2 as you scroll

const HighwayDrive = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', `-${(STATIONS.length - 1) * 90}vw`]);
  const [i, setI] = useState(0);
  useEffect(() => scrollYProgress.on('change', v => {
    setI(Math.min(STATIONS.length - 1, Math.round(v * (STATIONS.length - 1))));
  }), [scrollYProgress]);

  return (
    <section ref={ref} className="relative" style={{ height: `${STATIONS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col bg-[#0E0A07]">
        <div className="px-6 pt-10 pb-2 text-center">
          <Eyebrow>Connectivity · The NH-2 corridor</Eyebrow>
          <Display>Drive the highway</Display>
          <p className="text-[11px] tracking-[0.3em] uppercase text-stone-500 mt-4">Scroll to advance ↓</p>
        </div>

        <div className="flex-1 relative flex items-center overflow-hidden">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-amber-400/20 -translate-y-px" />
          <motion.div style={{ x }} className="flex items-center will-change-transform">
            {STATIONS.map((s, idx) => (
              <div key={s.name} className="shrink-0 flex items-center justify-center" style={{ width: '90vw' }}>
                {s.anchor ? (
                  <div className="text-center">
                    <p className="text-[10px] tracking-[0.4em] text-amber-300 uppercase font-semibold mb-3">★ The Enclave ★</p>
                    <h3 className="font-serif text-[80px] leading-none tracking-tight text-amber-300 mb-4"
                        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                      {s.name}
                    </h3>
                    <p className="text-[13px] text-stone-300 tracking-wider">Shree Kunj Bihari Enclave</p>
                  </div>
                ) : (
                  <div className="text-center opacity-90">
                    <p className="text-[10px] tracking-[0.4em] text-stone-500 uppercase font-semibold mb-3">Station</p>
                    <h3 className="font-serif text-[64px] leading-none tracking-tight text-stone-100 mb-3"
                        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                      {s.name}
                    </h3>
                    <p className="text-[12px] text-stone-500 tracking-wider">{s.meta}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="px-6 pb-8">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STATIONS.map((_, j) => (
              <div key={j} className={`h-px transition-all duration-300 ${j === i ? 'w-10 bg-amber-300' : 'w-4 bg-stone-700'}`} />
            ))}
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 text-center">
            {STATIONS[0].name} <span className="mx-2 text-stone-700">·</span> {STATIONS[i].name} <span className="mx-2 text-stone-700">·</span> {STATIONS[STATIONS.length - 1].name}
          </p>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const KunjBihariLanding = () => {
  const heroRef = useRef(null);
  const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY    = useTransform(hp, [0, 1], [0, 120]);
  const heroSc   = useTransform(hp, [0, 1], [1.05, 1.15]);
  const heroOp   = useTransform(hp, [0, 0.8, 1], [1, 0.4, 0]);
  const titleY   = useTransform(hp, [0, 1], [0, -30]);

  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  return (
    <div className="min-h-screen text-stone-200 antialiased" style={{ backgroundColor: '#0E0A07' }}>
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Gated plots beside NH-2, near Kosi-Mathura. Immediate registry, industrial corridor, spiritual heritage." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Plots near Mathura NH-2" />
        <meta property="og:description" content="Gated plots beside the National Highway, Kosi-Mathura. By Fanbe Group." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          html, body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
          @keyframes pulseRing { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
        `}</style>
      </Helmet>

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-start justify-end text-left px-6 pb-16 overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroSc, opacity: heroOp }} className="absolute inset-0 z-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E0A07]/20 via-[#0E0A07]/60 to-[#0E0A07]" />
        </motion.div>

        <motion.div style={{ y: titleY }} className="relative z-10 max-w-md">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-[10px] tracking-[0.4em] uppercase text-amber-300 font-semibold mb-6"
          >
            Fanbe Group · Kosi · Mathura
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="text-stone-100 leading-[0.95] tracking-tight"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 500, fontSize: 'clamp(48px, 11vw, 72px)' }}
          >
            Shree Kunj<br/>
            Bihari <em className="text-amber-300 not-italic" style={{ fontStyle: 'italic', fontWeight: 400 }}>Enclave</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-stone-400 text-[15px] leading-[1.6] mt-6 max-w-sm"
          >
            A gated address beside India's legendary National Highway 2 — where
            the Braj heritage of Mathura meets the corridor's industrial future.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="mt-10 flex items-center gap-2 text-stone-500 text-[10px] tracking-[0.4em] uppercase"
          >
            <ArrowDown className="w-3 h-3" />
            <span>The full story</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ KICKER PARAGRAPH ════════ */}
      <section className="max-w-md mx-auto px-6 pt-24 pb-8">
        <p className="font-serif text-[28px] leading-[1.25] tracking-tight text-stone-200"
           style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          Of all the corridors investors quietly accumulate in,
          <em className="text-amber-300"> NH-2 is the one with both heritage and growth on its side.</em>
        </p>
      </section>

      {/* ════════ ① LOCATION ════════ */}
      <section className="max-w-md mx-auto px-6 pt-16 pb-8">
        <Eyebrow>① Location</Eyebrow>
        <Display>The exact spot.</Display>
        <Lede>
          Kosi Kalan, Mathura. Beside NH-2, walking distance to Shanidev Temple
          and Durwasha Rishi Ashram. Pinned below, live from Google.
        </Lede>
      </section>

      <div className="max-w-md mx-auto px-6">
        <div className="relative rounded-2xl overflow-hidden border border-stone-800/80">
          <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-black/60 backdrop-blur border border-stone-700/60">
            {[
              { id: 'satellite', Icon: Mountain, label: 'Satellite' },
              { id: 'hybrid',    Icon: Layers,   label: 'Labels' },
            ].map(t => (
              <button key={t.id} onClick={() => setMapType(t.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1 transition ${mapType === t.id ? 'bg-amber-300 text-stone-900' : 'text-stone-300'}`}>
                <t.Icon className="w-3 h-3" /> {t.label}
              </button>
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border border-amber-300/60" style={{ animation: 'pulseRing 2s infinite ease-out' }} />
              <div className="absolute inset-0 m-5 rounded-full bg-amber-300 shadow-lg shadow-amber-400/80" />
            </div>
          </div>
          <iframe
            key={mapType}
            src={mapSrc}
            title="Shree Kunj Bihari Enclave Location"
            className="w-full aspect-[4/3] block"
            style={{ border: 0, filter: 'contrast(1.05) saturate(1.1) brightness(0.95)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="flex items-center justify-between px-1 pt-3">
          <div className="flex items-center gap-2 text-[12px] text-stone-400">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Kosi Kalan · Mathura, UP
          </div>
          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="text-[11px] text-amber-300 font-semibold tracking-wide hover:text-amber-200">
            Open in Maps →
          </a>
        </div>
      </div>

      {/* Landmarks list */}
      <div className="max-w-md mx-auto px-6 pt-12">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-2">Within the neighbourhood</p>
        <div>
          {LANDMARKS.map(l => (
            <Row key={l.n} left={l.n} right={l.d} sub={l.k} />
          ))}
        </div>
      </div>

      <Rule />

      {/* ════════ ② CONNECTIVITY — scroll-jacked drive ════════ */}
      <HighwayDrive />

      {/* Drive times — calm data residue */}
      <div className="max-w-md mx-auto px-6 pt-16">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-2">Drive times from Kosi</p>
        <div>
          {DRIVES.map(d => (
            <Row key={d.p} left={d.p} right={d.t} sub={d.k} />
          ))}
        </div>
      </div>

      <Rule />

      {/* ════════ ③ INFRASTRUCTURE ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-4">
        <Eyebrow>③ Infrastructure</Eyebrow>
        <Display>Built like a forever home.</Display>
        <Lede>
          Every utility, every margin of safety, engineered in before the first
          plot was handed over.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6">
        {INFRA.map(([t, d], i) => (
          <div key={t} className="flex items-baseline gap-4 py-4 border-b border-stone-800/80">
            <span className="font-serif text-[14px] text-amber-400/80 tabular-nums"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1">
              <div className="font-medium text-[15px] text-stone-100">{t}</div>
              <div className="text-[12px] text-stone-500 mt-0.5">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <Rule />

      {/* ════════ ④ INDUSTRY ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-2">
        <Eyebrow>④ Industry</Eyebrow>
        <Display>Anchored by manufacturers.</Display>
        <Lede>
          When companies of this scale plant their factories in a corridor,
          land value moves alongside. Yours is already among them.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6 grid grid-cols-3 gap-2.5">
        {BRANDS.map(b => (
          <div key={b.name} className="aspect-square rounded-xl bg-stone-50 border border-stone-200/60 flex flex-col items-center justify-center p-2 gap-1">
            <img
              src={`https://logo.clearbit.com/${b.domain}`}
              alt={b.name}
              className="max-h-9 max-w-full object-contain"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-[9px] font-semibold text-stone-700 text-center leading-tight">{b.name}</span>
          </div>
        ))}
      </div>
      <p className="max-w-md mx-auto px-6 pt-4 text-center text-[11px] text-stone-500">
        Active plants of {BRANDS.length}+ global manufacturers within the corridor.
      </p>

      <Rule />

      {/* ════════ ⑤ SECURITY ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-2">
        <Eyebrow>⑤ Security</Eyebrow>
        <Display>Leave it at the gate.</Display>
        <Lede>
          A closed perimeter. A single supervised entry. CCTV at the gate and
          along access points. Authorised vehicles only.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6">
        {[
          '24×7 trained guards',
          'CCTV at every gate',
          'Closed boundary wall',
          'Authorised entry only',
        ].map((b, i) => (
          <div key={b} className="flex items-baseline gap-4 py-3.5 border-b border-stone-800/80">
            <span className="font-serif text-[14px] text-amber-400/80 tabular-nums"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[14px] text-stone-200">{b}</span>
          </div>
        ))}
      </div>

      <Rule />

      {/* ════════ ⑥ APPRECIATION ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-4">
        <Eyebrow>⑥ Appreciation</Eyebrow>
        <Display>Why this corridor climbs.</Display>
        <Lede>
          Four forces are pulling NH-2 up at the same time, year after year.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6">
        {APPRECIATION.map((a) => (
          <div key={a.copy} className="py-5 border-b border-stone-800/80">
            <div className="font-serif text-[44px] leading-none text-amber-300 tracking-tight"
                 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {a.stat}
            </div>
            <p className="text-[13px] text-stone-400 mt-2">{a.copy}</p>
          </div>
        ))}
      </div>

      {/* Pricing — editorial */}
      <section className="max-w-md mx-auto px-6 pt-16">
        <Eyebrow>Launch pricing</Eyebrow>
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-stone-500 text-base line-through font-medium">₹12,525</span>
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-300 bg-amber-300/10 border border-amber-300/30 px-2 py-0.5 rounded-full">Save 40%</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-serif text-[88px] leading-none text-stone-100 tracking-tight"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            ₹7,525
          </span>
        </div>
        <p className="text-stone-500 text-[13px]">per square yard · today's corridor entry price</p>

        <div className="grid grid-cols-3 gap-6 mt-10 pb-6 border-b border-stone-800/80">
          {[
            ['10%', 'Booking'],
            ['35%', 'Registry'],
            ['60', 'Mo EMI'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-serif text-[34px] leading-none text-stone-100 tracking-tight"
                   style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                {v}{l !== 'Mo EMI' && '%'}
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 mt-2">{l}</div>
            </div>
          ))}
        </div>

        <p className="text-[11px] tracking-[0.3em] uppercase text-stone-500 mt-10 mb-3">All plot sizes</p>
        <div>
          {PLOTS.map(p => (
            <div key={p.size} className="flex items-baseline justify-between gap-3 py-4 border-b border-stone-800/80">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[20px] text-stone-100 tabular-nums"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {p.size}
                </span>
                <span className="text-[11px] text-stone-500 uppercase tracking-wider">sq yd</span>
                {p.tag && <span className="text-[9px] tracking-widest uppercase text-amber-300 font-bold">★ {p.tag}</span>}
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold text-stone-100 tabular-nums">{p.total}</div>
                <div className="text-[11px] text-amber-300 tabular-nums">{p.emi} / mo</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-10">
          {TRUST.map(t => (
            <div key={t.l} className="flex items-center gap-2.5 py-2">
              <t.i className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="text-[12px] text-stone-300">{t.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FINALE ════════ */}
      <section className="max-w-md mx-auto px-6 pt-28 pb-32 text-center">
        <p className="font-serif italic text-amber-300/80 text-[18px] mb-6"
           style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          &mdash;
        </p>
        <h2 className="font-serif text-stone-100 leading-[1.05] tracking-tight"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 500, fontSize: 'clamp(38px, 9vw, 56px)' }}>
          Your plot.<br/>
          <em className="text-amber-300" style={{ fontStyle: 'italic', fontWeight: 400 }}>Your legacy.</em>
        </h2>
        <p className="text-stone-400 text-[14px] leading-[1.65] mt-6 max-w-sm mx-auto">
          Inventory on the front rows of NH-2 is finite. Continue the
          conversation with the advisor who shared this page with you.
        </p>
        <p className="text-stone-600 text-[10px] tracking-[0.3em] uppercase mt-16">
          Shree Kunj Bihari Enclave · Kosi Kalan · Mathura, UP<br/>
          <span className="text-amber-400">A Fanbe Group Development</span>
        </p>
      </section>
    </div>
  );
};

export default KunjBihariLanding;
