import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  ArrowDown, Compass, Layers, Mountain, FileCheck, CheckCircle2, Shield, TrendingUp
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
const PLACE_QUERY = encodeURIComponent('Shree Kunj Bihari Enclave, Kosi Kalan, Mathura');
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

// Krishna / ISKCON-inspired palette (peacock blue, saffron, gold, ivory)
//   bg              #050818  Krishna midnight (deep blue-violet)
//   peacock         #14B8A6  Peacock feather teal
//   peacock-2       #22D3EE  Bright cyan rim
//   saffron         #F59E0B  Sacred saffron / marigold
//   saffron-2       #FB923C  Warm marigold
//   gold            #FCD34D  Soft gold ornament
//   ivory           #FEF3C7  Soft cream

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
  ['Grand Entrance',     'Dedicated guard room at single access'],
  ['Wide Damar Roads',   'Blacktop internal roads, planned grid'],
  ['Electricity',        'Full power-supply infrastructure'],
  ['Water Supply',       'Dependable 24×7 utility'],
  ['Green Belt',         'Pollution-free planned greenery'],
  ['Gated Boundary',     'Closed perimeter, single entry'],
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
// Typographic primitives — back to bold sans, Krishna palette

const Eyebrow = ({ children }) => (
  <p className="text-[11px] tracking-[0.35em] uppercase font-bold mb-3"
     style={{ color: '#22D3EE' }}>{children}</p>
);

const Display = ({ children, className = '' }) => (
  <h2 className={`text-3xl font-black leading-[1.08] tracking-tight text-white ${className}`}>
    {children}
  </h2>
);

const Lede = ({ children }) => (
  <p className="text-slate-400 text-[15px] leading-[1.65] mt-3 max-w-md">{children}</p>
);

const Row = ({ left, right, sub }) => (
  <div className="flex items-baseline justify-between py-3.5 border-b border-white/[0.07]">
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-[14px] text-white truncate">{left}</div>
      {sub && <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{sub}</div>}
    </div>
    <div className="text-[13px] font-black tabular-nums" style={{ color: '#FCD34D' }}>{right}</div>
  </div>
);

const Rule = () => (
  <div className="max-w-md mx-auto px-6">
    <div className="h-px my-10"
         style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.25), rgba(245,158,11,0.25), transparent)' }} />
  </div>
);

// Subtle peacock glow blob — Krishna ambient
const PeacockGlow = ({ x = '50%', y = '50%', size = 600, opacity = 0.25 }) => (
  <div className="absolute pointer-events-none" style={{ inset: 0 }}>
    <div className="absolute rounded-full"
         style={{
           left: x, top: y, width: size, height: size,
           transform: 'translate(-50%, -50%)',
           background: `radial-gradient(circle, rgba(20,184,166,${opacity * 0.7}) 0%, rgba(34,211,238,${opacity * 0.4}) 35%, transparent 70%)`,
           filter: 'blur(40px)',
         }} />
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
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col" style={{ background: '#050818' }}>
        <PeacockGlow x="50%" y="55%" size={700} opacity={0.4} />

        <div className="px-6 pt-10 pb-2 text-center relative z-10">
          <Eyebrow>② Connectivity · The NH-2 corridor</Eyebrow>
          <Display>Drive the highway.</Display>
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mt-4">Scroll to advance ↓</p>
        </div>

        <div className="flex-1 relative flex items-center overflow-hidden z-10">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-px"
               style={{ background: 'linear-gradient(to right, transparent 0%, rgba(252,211,77,0.5) 50%, transparent 100%)' }} />
          <motion.div style={{ x }} className="flex items-center will-change-transform">
            {STATIONS.map((s) => (
              <div key={s.name} className="shrink-0 flex items-center justify-center" style={{ width: '90vw' }}>
                {s.anchor ? (
                  <div className="text-center relative">
                    <div className="absolute inset-0 -m-12 rounded-full" style={{
                      background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(20,184,166,0.2) 40%, transparent 70%)',
                      filter: 'blur(30px)'
                    }} />
                    <p className="relative text-[11px] tracking-[0.4em] uppercase font-bold mb-3"
                       style={{ color: '#FCD34D' }}>★ The Enclave ★</p>
                    <h3 className="relative text-[88px] font-black leading-none tracking-tighter mb-4"
                        style={{
                          background: 'linear-gradient(135deg, #FCD34D 0%, #FB923C 50%, #F59E0B 100%)',
                          WebkitBackgroundClip: 'text', backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                      KOSI
                    </h3>
                    <p className="relative text-[12px] text-cyan-200/80 tracking-[0.3em] uppercase font-bold">Shree Kunj Bihari Enclave</p>
                  </div>
                ) : (
                  <div className="text-center opacity-90">
                    <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-3 text-slate-500">Station</p>
                    <h3 className="text-[64px] font-black leading-none tracking-tighter mb-3 text-white">
                      {s.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 tracking-wider">{s.meta}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="px-6 pb-8 relative z-10">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STATIONS.map((_, j) => (
              <div key={j} className="h-px transition-all duration-300"
                   style={{
                     width: j === i ? '40px' : '16px',
                     background: j === i ? '#FCD34D' : 'rgba(255,255,255,0.15)',
                   }} />
            ))}
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 text-center">
            {STATIONS[0].name} <span className="mx-2 opacity-30">·</span>
            <span style={{ color: '#22D3EE' }}>{STATIONS[i].name}</span>
            <span className="mx-2 opacity-30">·</span> {STATIONS[STATIONS.length - 1].name}
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
  const heroY  = useTransform(hp, [0, 1], [0, 120]);
  const heroSc = useTransform(hp, [0, 1], [1.05, 1.15]);
  const heroOp = useTransform(hp, [0, 0.8, 1], [1, 0.4, 0]);
  const titleY = useTransform(hp, [0, 1], [0, -30]);

  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  return (
    <div className="min-h-screen text-white antialiased relative overflow-hidden"
         style={{ backgroundColor: '#050818' }}>
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Gated plots beside NH-2, near Kosi-Mathura. Immediate registry, industrial corridor, spiritual heritage." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Plots near Mathura NH-2" />
        <meta property="og:description" content="Gated plots beside the National Highway, Kosi-Mathura. By Fanbe Group." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <style>{`
          @keyframes pulseRing { 0% { transform: scale(0.7); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
        `}</style>
      </Helmet>

      {/* Ambient peacock background — deep Krishna midnight glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <PeacockGlow x="20%" y="30%" size={600} opacity={0.18} />
        <PeacockGlow x="80%" y="70%" size={700} opacity={0.12} />
      </div>

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-start justify-end text-left px-6 pb-16 overflow-hidden z-10">
        <motion.div style={{ y: heroY, scale: heroSc, opacity: heroOp }} className="absolute inset-0 z-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,8,24,0.2), rgba(5,8,24,0.65), #050818)' }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 30% 25%, rgba(20,184,166,0.18), transparent 55%), radial-gradient(circle at 75% 80%, rgba(245,158,11,0.12), transparent 60%)'
          }} />
        </motion.div>

        <motion.div style={{ y: titleY }} className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="w-6 h-px" style={{ background: '#22D3EE' }} />
            <span className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: '#22D3EE' }}>
              Fanbe Group
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="font-black leading-[0.95] tracking-tighter text-white"
            style={{ fontSize: 'clamp(48px, 12vw, 76px)' }}
          >
            Shree Kunj<br/>
            Bihari{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FCD34D 0%, #FB923C 60%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Enclave
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-[13px] tracking-[0.3em] uppercase font-semibold mt-5"
            style={{ color: '#FCD34D' }}
          >
            कोसी · मथुरा · NH-2
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="text-slate-300 text-[15px] leading-[1.65] mt-5 max-w-sm"
          >
            A gated address beside India's legendary highway —
            where the Braj heritage of Mathura meets the corridor's
            industrial future.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-10 flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase"
            style={{ color: '#22D3EE' }}
          >
            <ArrowDown className="w-3 h-3" />
            <span>The full story</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ KICKER ════════ */}
      <section className="max-w-md mx-auto px-6 pt-24 pb-8 relative z-10">
        <p className="text-[28px] font-black leading-[1.2] tracking-tight text-white">
          Of all the corridors investors quietly accumulate in,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #22D3EE 0%, #14B8A6 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            NH-2 is the one with both heritage and growth on its side.
          </span>
        </p>
      </section>

      {/* ════════ ① LOCATION ════════ */}
      <section className="max-w-md mx-auto px-6 pt-16 pb-8 relative z-10">
        <Eyebrow>① Location</Eyebrow>
        <Display>The exact spot.</Display>
        <Lede>
          Kosi Kalan, Mathura. Beside NH-2, walking distance to Shanidev Temple
          and Durwasha Rishi Ashram. Pinned below, live from Google.
        </Lede>
      </section>

      <div className="max-w-md mx-auto px-6 relative z-10">
        <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
          <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-black/60 backdrop-blur border border-white/15">
            {[
              { id: 'satellite', Icon: Mountain, label: 'Satellite' },
              { id: 'hybrid',    Icon: Layers,   label: 'Labels' },
            ].map(t => (
              <button key={t.id} onClick={() => setMapType(t.id)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 transition"
                style={mapType === t.id
                  ? { background: '#FCD34D', color: '#050818' }
                  : { color: 'rgba(255,255,255,0.7)' }}
              >
                <t.Icon className="w-3 h-3" /> {t.label}
              </button>
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border" style={{ borderColor: 'rgba(252,211,77,0.6)', animation: 'pulseRing 2s infinite ease-out' }} />
              <div className="absolute inset-0 m-5 rounded-full shadow-lg" style={{ background: '#FCD34D', boxShadow: '0 0 16px rgba(252,211,77,0.7)' }} />
            </div>
          </div>
          <iframe
            key={mapType}
            src={mapSrc}
            title="Shree Kunj Bihari Enclave Location"
            className="w-full aspect-[4/3] block"
            style={{ border: 0, filter: 'contrast(1.05) saturate(1.15) brightness(0.92)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="flex items-center justify-between px-1 pt-3">
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Compass className="w-3.5 h-3.5" style={{ color: '#22D3EE' }} />
            Kosi Kalan · Mathura, UP
          </div>
          <a href={MAPS_LINK} target="_blank" rel="noreferrer"
             className="text-[11px] font-bold tracking-wide hover:opacity-80"
             style={{ color: '#FCD34D' }}>
            Open in Maps →
          </a>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-12 relative z-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-2 font-bold">Within the neighbourhood</p>
        <div>
          {LANDMARKS.map(l => (
            <Row key={l.n} left={l.n} right={l.d} sub={l.k} />
          ))}
        </div>
      </div>

      <Rule />

      {/* ════════ ② CONNECTIVITY ════════ */}
      <HighwayDrive />

      <div className="max-w-md mx-auto px-6 pt-16 relative z-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-2 font-bold">Drive times from Kosi</p>
        <div>
          {DRIVES.map(d => (
            <Row key={d.p} left={d.p} right={d.t} sub={d.k} />
          ))}
        </div>
      </div>

      <Rule />

      {/* ════════ ③ INFRASTRUCTURE ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-4 relative z-10">
        <Eyebrow>③ Infrastructure</Eyebrow>
        <Display>Built like a forever home.</Display>
        <Lede>
          Every utility, every margin of safety, engineered in before the first
          plot was handed over.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6 relative z-10">
        {INFRA.map(([t, d], i) => (
          <div key={t} className="flex items-baseline gap-4 py-4 border-b border-white/[0.07]">
            <span className="text-[14px] font-black tabular-nums" style={{ color: '#22D3EE' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1">
              <div className="font-bold text-[15px] text-white">{t}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <Rule />

      {/* ════════ ④ INDUSTRY ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-2 relative z-10">
        <Eyebrow>④ Industry</Eyebrow>
        <Display>Anchored by manufacturers.</Display>
        <Lede>
          When companies of this scale plant their factories in a corridor,
          land value moves alongside. Yours is already among them.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6 grid grid-cols-3 gap-2.5 relative z-10">
        {BRANDS.map(b => (
          <div key={b.name}
               className="aspect-square rounded-xl bg-white border flex flex-col items-center justify-center p-2 gap-1"
               style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
            <img
              src={`https://logo.clearbit.com/${b.domain}`}
              alt={b.name}
              className="max-h-9 max-w-full object-contain"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-[9px] font-bold text-slate-800 text-center leading-tight">{b.name}</span>
          </div>
        ))}
      </div>
      <p className="max-w-md mx-auto px-6 pt-4 text-center text-[11px] text-slate-500 relative z-10">
        Active plants of {BRANDS.length}+ global manufacturers within the corridor.
      </p>

      <Rule />

      {/* ════════ ⑤ SECURITY ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-2 relative z-10">
        <Eyebrow>⑤ Security</Eyebrow>
        <Display>Leave it at the gate.</Display>
        <Lede>
          A closed perimeter. A single supervised entry. CCTV at the gate and
          along access points. Authorised vehicles only.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6 relative z-10">
        {[
          '24×7 trained guards',
          'CCTV at every gate',
          'Closed boundary wall',
          'Authorised entry only',
        ].map((b, i) => (
          <div key={b} className="flex items-baseline gap-4 py-3.5 border-b border-white/[0.07]">
            <span className="text-[14px] font-black tabular-nums" style={{ color: '#22D3EE' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[14px] font-semibold text-white">{b}</span>
          </div>
        ))}
      </div>

      <Rule />

      {/* ════════ ⑥ APPRECIATION ════════ */}
      <section className="max-w-md mx-auto px-6 pt-8 pb-4 relative z-10">
        <Eyebrow>⑥ Appreciation</Eyebrow>
        <Display>Why this corridor climbs.</Display>
        <Lede>
          Four forces are pulling NH-2 up at the same time, year after year.
        </Lede>
      </section>
      <div className="max-w-md mx-auto px-6 pt-6 relative z-10">
        {APPRECIATION.map((a) => (
          <div key={a.copy} className="py-5 border-b border-white/[0.07]">
            <div className="text-[44px] font-black leading-none tracking-tighter"
                 style={{
                   background: 'linear-gradient(135deg, #FCD34D 0%, #FB923C 60%, #F59E0B 100%)',
                   WebkitBackgroundClip: 'text', backgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                 }}>
              {a.stat}
            </div>
            <p className="text-[13px] text-slate-400 mt-2">{a.copy}</p>
          </div>
        ))}
      </div>

      {/* Pricing — editorial in Krishna palette */}
      <section className="max-w-md mx-auto px-6 pt-16 relative z-10">
        <Eyebrow>Launch pricing</Eyebrow>
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-slate-500 text-base line-through font-semibold">₹12,525</span>
          <span className="text-[10px] font-black tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
                style={{ color: '#FCD34D', background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.3)' }}>
            Save 40%
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[88px] font-black leading-none tracking-tighter text-white">
            ₹7,525
          </span>
        </div>
        <p className="text-slate-500 text-[13px]">per square yard · today's corridor entry price</p>

        <div className="grid grid-cols-3 gap-6 mt-10 pb-6 border-b border-white/[0.07]">
          {[
            ['10', '%', 'Booking'],
            ['35', '%', 'Registry'],
            ['60', '',  'Mo EMI'],
          ].map(([v, sfx, l]) => (
            <div key={l}>
              <div className="text-[34px] font-black leading-none tracking-tighter text-white">
                {v}<span style={{ color: '#22D3EE' }}>{sfx}</span>
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mt-2 font-bold">{l}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mt-10 mb-3 font-bold">All plot sizes</p>
        <div>
          {PLOTS.map(p => (
            <div key={p.size} className="flex items-baseline justify-between gap-3 py-4 border-b border-white/[0.07]">
              <div className="flex items-baseline gap-3">
                <span className="text-[20px] font-black tabular-nums text-white">
                  {p.size}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">sq yd</span>
                {p.tag && (
                  <span className="text-[9px] tracking-widest uppercase font-black"
                        style={{ color: '#FCD34D' }}>★ {p.tag}</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold text-white tabular-nums">{p.total}</div>
                <div className="text-[11px] tabular-nums" style={{ color: '#22D3EE' }}>{p.emi} / mo</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-10">
          {TRUST.map(t => (
            <div key={t.l} className="flex items-center gap-2.5 py-2">
              <t.i className="w-4 h-4 flex-shrink-0" style={{ color: '#FCD34D' }} />
              <span className="text-[12px] text-slate-300 font-semibold">{t.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FINALE ════════ */}
      <section className="max-w-md mx-auto px-6 pt-28 pb-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="w-8 h-px" style={{ background: '#22D3EE' }} />
          <span className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: '#FCD34D' }}>श्री</span>
          <span className="w-8 h-px" style={{ background: '#22D3EE' }} />
        </div>
        <h2 className="font-black leading-[1.05] tracking-tighter text-white"
            style={{ fontSize: 'clamp(40px, 10vw, 60px)' }}>
          Your plot.<br/>
          <span style={{
            background: 'linear-gradient(135deg, #FCD34D 0%, #FB923C 60%, #F59E0B 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Your legacy.</span>
        </h2>
        <p className="text-slate-400 text-[14px] leading-[1.65] mt-6 max-w-sm mx-auto">
          Inventory on the front rows of NH-2 is finite. Continue the
          conversation with the advisor who shared this page with you.
        </p>
        <p className="text-slate-600 text-[10px] tracking-[0.3em] uppercase font-bold mt-16">
          Shree Kunj Bihari Enclave · Kosi Kalan · Mathura, UP<br/>
          <span style={{ color: '#FCD34D' }}>A Fanbe Group Development</span>
        </p>
      </section>
    </div>
  );
};

export default KunjBihariLanding;
