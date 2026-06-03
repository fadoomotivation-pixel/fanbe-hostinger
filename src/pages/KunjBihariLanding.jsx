import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  MapPin, Compass, Layers, Mountain, FileCheck, CheckCircle2,
  Shield, Phone, Zap, Droplet, Trees, Car, Building2, Train, Clock
} from 'lucide-react';

const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
const PLACE_QUERY = encodeURIComponent('Shree Kunj Bihari Enclave, Kosi Kalan, Mathura');
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

const HIGHLIGHTS = [
  { icon: Train,    title: '5 Min',  sub: 'to NH-2 Highway' },
  { icon: MapPin,   title: '5 Min',  sub: 'to Kosi Railway' },
  { icon: Shield,   title: '24×7',   sub: 'Gated Security' },
  { icon: FileCheck, title: '0% EMI', sub: 'Interest Free' },
];

const PROJECT_INFO = [
  ['Project Type',    'Residential Plots'],
  ['Plot Sizes',      '50 – 250 sq yd'],
  ['Possession',      'Immediate'],
  ['Booking Amount',  '10% of Total'],
  ['Registry',        '35% of Total'],
  ['EMI Tenure',      '60 Months · 0% Interest'],
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

const AMENITIES = [
  { icon: Building2, title: 'Grand Entrance',     desc: 'With dedicated guard room' },
  { icon: Car,       title: 'Wide Damar Roads',   desc: 'Blacktop internal roads' },
  { icon: Zap,       title: 'Electricity',        desc: 'Full power infrastructure' },
  { icon: Droplet,   title: 'Water Supply',       desc: 'Dependable 24×7 utility' },
  { icon: Trees,     title: 'Green Belt',         desc: 'Planned greenery zones' },
  { icon: Shield,    title: 'Gated Boundary',     desc: 'Closed perimeter walls' },
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

const PLOTS = [
  { size: 50,  total: '₹3,76,250',  emi: '₹5,644' },
  { size: 60,  total: '₹4,51,500',  emi: '₹6,772' },
  { size: 80,  total: '₹6,02,000',  emi: '₹9,030' },
  { size: 100, total: '₹7,52,500',  emi: '₹11,287', tag: 'Popular' },
  { size: 120, total: '₹9,03,000',  emi: '₹13,545' },
  { size: 150, total: '₹11,28,750', emi: '₹16,931' },
  { size: 200, total: '₹15,05,000', emi: '₹22,575' },
  { size: 250, total: '₹18,81,250', emi: '₹28,219' },
];

const WHY_INVEST = [
  '22% YoY land-price growth on the NH-2 corridor',
  '5+ active multinational manufacturing plants nearby',
  'Mathura-Vrindavan-Govardhan religious tourism circuit',
  'Direct Delhi-Agra national highway frontage',
];

const TRUST = [
  '100% Clear Title with immediate mutation',
  'Immediate Registry on 35% payment',
  'No hidden charges, transparent pricing',
  '0% interest EMI for 60 months',
];

// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-30px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const Section = ({ children, className = '', kicker, title, lede }) => (
  <section className={`max-w-4xl mx-auto px-6 ${className}`}>
    {kicker && <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-stone-500 mb-3">{kicker}</p>}
    {title && <h2 className="text-[28px] sm:text-[34px] leading-tight font-bold text-stone-900 mb-3 tracking-tight">{title}</h2>}
    {lede && <p className="text-stone-600 text-[15px] leading-relaxed mb-8 max-w-xl">{lede}</p>}
    {children}
  </section>
);

const KunjBihariLanding = () => {
  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 antialiased">
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Premium Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Residential gated plots beside National Highway 2, near Kosi-Mathura. Immediate registry, 0% interest EMI, 100% clear title. A Fanbe Group project." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Premium Plots near Mathura NH-2" />
        <meta property="og:description" content="Residential gated plots beside the National Highway, Kosi-Mathura. By Fanbe Group." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      {/* ════════ TOP BAR ════════ */}
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-stone-500">Fanbe Group</div>
            <div className="text-[13px] font-bold text-stone-900">Shree Kunj Bihari Enclave</div>
          </div>
          <div className="text-[11px] text-stone-600 hidden sm:block">Kosi Kalan · Mathura · NH-2</div>
        </div>
      </header>

      {/* ════════ HERO ════════ */}
      <section className="relative">
        <div className="relative w-full" style={{ aspectRatio: '4/3', maxHeight: '70svh' }}>
          <img src={HERO} alt="Shree Kunj Bihari Enclave" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(20,15,8,0) 50%, rgba(20,15,8,0.9))' }} />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold">Now Booking</span>
              </div>
              <h1 className="text-[36px] sm:text-[48px] leading-[1.05] font-bold tracking-tight">
                Shree Kunj Bihari Enclave
              </h1>
              <p className="text-white/80 text-[14px] mt-2">Kosi Kalan · Mathura, Uttar Pradesh</p>
            </div>
          </div>
        </div>

        {/* Highlight strip */}
        <div className="border-b border-stone-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HIGHLIGHTS.map(h => (
              <div key={h.sub} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-stone-900 leading-tight">{h.title}</div>
                  <div className="text-[11px] text-stone-500">{h.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ OVERVIEW ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Overview"
          title="A gated community on India's most travelled highway."
          lede="Shree Kunj Bihari Enclave is a planned residential plotted development beside National Highway 2, in Kosi Kalan, Mathura. Backed by Fanbe Group, the project offers a rare combination of religious heritage, industrial corridor growth, and direct highway frontage — with immediate registry on a 35% payment."
        >
          <div className="border-t border-stone-200">
            {PROJECT_INFO.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3 border-b border-stone-200">
                <div className="text-[13px] text-stone-500">{k}</div>
                <div className="text-[14px] font-semibold text-stone-900">{v}</div>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ LOCATION ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Location"
          title="The exact spot."
          lede="Kosi Kalan, Mathura. Beside NH-2. Walking distance to Shani Dev Mandir and Durwasha Rishi Ashram."
        >
          <div className="relative rounded-xl overflow-hidden border border-stone-200">
            <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-full bg-white/95 backdrop-blur border border-stone-200 shadow-sm">
              {[
                { id: 'satellite', Icon: Mountain, label: 'Satellite' },
                { id: 'hybrid',    Icon: Layers,   label: 'Map' },
              ].map(t => (
                <button key={t.id} onClick={() => setMapType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${mapType === t.id ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>
                  <t.Icon className="w-3 h-3" /> {t.label}
                </button>
              ))}
            </div>
            <iframe
              key={mapType}
              src={mapSrc}
              title="Shree Kunj Bihari Enclave Location"
              className="w-full aspect-[4/3] block"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2 text-[12px] text-stone-600">
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              Kosi Kalan · Mathura, UP
            </div>
            <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-amber-700 hover:underline">
              Open in Maps →
            </a>
          </div>

          {/* Landmarks table */}
          <div className="mt-10">
            <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-stone-500 mb-3">Nearby Landmarks</p>
            <div className="border-t border-stone-200">
              {LANDMARKS.map(l => (
                <div key={l.n} className="flex items-baseline justify-between py-3 border-b border-stone-200">
                  <div>
                    <div className="text-[14px] font-semibold text-stone-900">{l.n}</div>
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-0.5">{l.k}</div>
                  </div>
                  <div className="text-[13px] font-semibold text-amber-700 tabular-nums">{l.d}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ CONNECTIVITY ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Connectivity"
          title="Reach the Braj Bhoomi · Reach Delhi."
          lede="Direct frontage on National Highway 2 connects the project to every major destination in the corridor."
        >
          <div className="border-t border-stone-200">
            {DRIVES.map(d => (
              <div key={d.p} className="flex items-center justify-between py-3 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="text-[14px] font-semibold text-stone-900">{d.p}</span>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-stone-900 tabular-nums">{d.t}</div>
                  <div className="text-[11px] text-stone-500">{d.k}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ AMENITIES ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Amenities"
          title="Built like a forever home."
          lede="Every utility and margin of safety, engineered in before the first plot was handed over."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {AMENITIES.map(a => (
              <div key={a.title} className="p-4 bg-white border border-stone-200 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                  <a.icon className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-[14px] font-bold text-stone-900 mb-1">{a.title}</div>
                <div className="text-[12px] text-stone-500 leading-relaxed">{a.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ INDUSTRY ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Industry"
          title="Anchored by global manufacturers."
          lede="When companies of this scale plant their factories in a corridor, land value follows. Yours is already among them."
        >
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            {BRANDS.map(b => (
              <div key={b.name} className="aspect-square rounded-lg bg-white border border-stone-200 flex flex-col items-center justify-center p-3 gap-1.5">
                <img
                  src={`https://logo.clearbit.com/${b.domain}`}
                  alt={b.name}
                  className="max-h-10 max-w-full object-contain"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="text-[10px] font-semibold text-stone-700 text-center leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-stone-500 text-center">
            Active plants of {BRANDS.length}+ global manufacturers within the corridor.
          </p>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ PRICING / PLOTS ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Plot Sizes & Pricing"
          title="Choose your plot."
          lede="Launch pricing of ₹7,525 per square yard. 10% booking, 35% registry, 60-month interest-free EMI."
        >
          <div className="overflow-hidden border border-stone-200 rounded-xl">
            <div className="grid grid-cols-4 px-4 py-3 bg-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <span>Plot Size</span>
              <span className="text-right col-span-1">Per sq yd</span>
              <span className="text-right">Total</span>
              <span className="text-right">EMI/mo</span>
            </div>
            {PLOTS.map(p => (
              <div key={p.size} className={`grid grid-cols-4 px-4 py-3 items-center text-[13px] border-t border-stone-200 ${p.tag ? 'bg-amber-50' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">{p.size} sq yd</span>
                  {p.tag && (
                    <span className="text-[9px] tracking-widest uppercase font-bold text-amber-700 px-1.5 py-0.5 bg-amber-100 rounded">
                      {p.tag}
                    </span>
                  )}
                </div>
                <span className="text-right text-stone-600 tabular-nums">₹7,525</span>
                <span className="text-right font-semibold text-stone-900 tabular-nums">{p.total}</span>
                <span className="text-right font-semibold text-amber-700 tabular-nums">{p.emi}</span>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ WHY INVEST ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Why Invest"
          title="Four forces pulling NH-2 up."
        >
          <div className="space-y-3">
            {WHY_INVEST.map(r => (
              <div key={r} className="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-stone-800 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      <div className="h-px bg-stone-200 max-w-4xl mx-auto" />

      {/* ════════ TRUST ════════ */}
      <motion.div {...fadeUp}>
        <Section
          className="py-14"
          kicker="Promises"
          title="What we put in writing."
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {TRUST.map(t => (
              <div key={t} className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                <FileCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-stone-800 leading-relaxed">{t}</span>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-stone-900 text-stone-300 mt-10">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-amber-400 mb-3">A Fanbe Group Project</p>
          <h3 className="text-[24px] font-bold text-white mb-2">Shree Kunj Bihari Enclave</h3>
          <p className="text-stone-400 text-[13px] mb-6">Kosi Kalan · Mathura · Uttar Pradesh</p>
          <div className="max-w-md mx-auto p-4 bg-stone-800 border border-stone-700 rounded-xl">
            <p className="text-[13px] text-stone-300 leading-relaxed">
              For plot availability, pricing and site visit scheduling, please continue with the
              <span className="text-amber-300 font-semibold"> advisor who shared this page</span> with you.
            </p>
          </div>
          <p className="mt-10 text-[10px] text-stone-500 tracking-wider">
            © Fanbe Developers · Information subject to change without notice
          </p>
        </div>
      </footer>
    </div>
  );
};

export default KunjBihariLanding;
