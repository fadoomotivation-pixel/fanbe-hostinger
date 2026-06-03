import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  Compass, Layers, Mountain, FileCheck, CheckCircle2, Shield,
  Zap, Droplet, Trees, Car, Building2, Train, MapPin, Clock
} from 'lucide-react';

const HERO = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg';
const PLACE_QUERY = encodeURIComponent('Shree Kunj Bihari Enclave, Kosi Kalan, Mathura');
const MAPS_LINK = 'https://maps.app.goo.gl/AdZxBk4tLRGceHAn8';
const SATELLITE_EMBED = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
const HYBRID_EMBED    = `https://maps.google.com/maps?q=${PLACE_QUERY}&t=h&z=15&ie=UTF8&iwloc=&output=embed`;

const PHRASES = [
  { lead: 'Beside',     end: 'the highway.' },
  { lead: 'Surrounded by', end: 'temples.' },
  { lead: 'Anchored by',   end: 'industry.' },
  { lead: 'Held by',       end: 'Fanbe Group.' },
];

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

const WHY = [
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
// Soft rain — ambient vertical drift (the "gentle rain" mood signal)
const Rain = ({ count = 24 }) => {
  const seeds = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 6,
      dur: 8 + Math.random() * 6,
      o: 0.05 + Math.random() * 0.18,
      h: 30 + Math.random() * 60,
      id: i,
    })), [count]
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {seeds.map(s => (
        <motion.div
          key={s.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: '110vh', opacity: [0, s.o, s.o, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'linear' }}
          className="absolute w-px"
          style={{ left: `${s.x}%`, height: s.h, background: 'linear-gradient(to bottom, transparent, rgba(166,124,82,0.5), transparent)' }}
        />
      ))}
    </div>
  );
};

// Sticky hero with scroll-locked phrase reveals
const HeroPinned = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const photoBlur  = useTransform(scrollYProgress, [0, 0.5, 1], ['0px', '0px', '4px']);
  const photoOp    = useTransform(scrollYProgress, [0, 0.9, 1], [1, 0.3, 0]);
  // 4 phrases over the scroll range
  const phraseI    = useTransform(scrollYProgress, [0, 0.95], [0, PHRASES.length]);
  const [active, setActive] = useState(0);
  useEffect(() => phraseI.on('change', v => setActive(Math.min(PHRASES.length - 1, Math.floor(v)))), [phraseI]);

  return (
    <section ref={ref} className="relative" style={{ height: `${PHRASES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center px-6">
        <motion.div style={{ scale: photoScale, opacity: photoOp, filter: useTransform(photoBlur, v => `blur(${v})`) }}
                    className="absolute inset-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(30,22,15,0.25) 0%, rgba(30,22,15,0.65) 70%, rgba(250,247,242,0.95) 100%)' }} />
        </motion.div>

        <div className="relative z-10 max-w-md w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/25 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-white">A Fanbe Group Project</span>
          </div>

          {/* Static project name */}
          <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-bold tracking-tight text-white mb-2">
            Shree Kunj Bihari Enclave
          </h1>
          <p className="text-white/70 text-[12px] tracking-[0.2em] uppercase mb-12">Kosi Kalan · Mathura · NH-2</p>

          {/* Scroll-locked phrase reveal */}
          <div className="relative h-[120px] flex items-center justify-center">
            {PHRASES.map((p, i) => (
              <motion.div
                key={i}
                animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 14 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <p className="text-white/70 text-[14px] font-medium tracking-wide">{p.lead}</p>
                <p className="text-white text-[40px] font-bold tracking-tight leading-tight mt-1">{p.end}</p>
              </motion.div>
            ))}
          </div>

          {/* Phrase indicator dots */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            {PHRASES.map((_, i) => (
              <div key={i} className="h-1 rounded-full transition-all duration-300"
                   style={{ width: active === i ? 24 : 6, background: active === i ? '#FAF7F2' : 'rgba(250,247,242,0.3)' }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Sticky title — content scrolls underneath
const StickyTitleSection = ({ kicker, title, lede, children }) => (
  <section className="relative">
    <div className="max-w-4xl mx-auto px-6 py-14 grid sm:grid-cols-12 gap-6">
      <div className="sm:col-span-4 sm:sticky sm:top-24 self-start">
        <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-stone-500 mb-3">{kicker}</p>
        <h2 className="text-[26px] sm:text-[32px] leading-tight font-bold text-stone-900 tracking-tight mb-3">{title}</h2>
        {lede && <p className="text-stone-600 text-[14px] leading-relaxed">{lede}</p>}
      </div>
      <div className="sm:col-span-8">{children}</div>
    </div>
  </section>
);

// Stack-reveal card — scroll position drives Y + opacity per card
const StackedCards = ({ items }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return (
    <div ref={ref} className="space-y-3">
      {items.map((it, i) => {
        const start = i / items.length;
        const end   = (i + 1) / items.length;
        // soft slide in
        return <StackCard key={it.n || it} item={it} progress={scrollYProgress} start={start} end={end} />;
      })}
    </div>
  );
};

const StackCard = ({ item, progress, start, end }) => {
  const y = useTransform(progress, [start - 0.1, start + 0.1], [40, 0]);
  const o = useTransform(progress, [start - 0.1, start + 0.05], [0, 1]);
  const ys = useSpring(y, { stiffness: 80, damping: 22, mass: 0.5 });
  return (
    <motion.div style={{ y: ys, opacity: o }}
                className="flex items-baseline justify-between p-4 bg-white border border-stone-200 rounded-xl">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-stone-900 truncate">{item.n}</div>
        <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-0.5">{item.k}</div>
      </div>
      <div className="text-[13px] font-semibold text-amber-700 tabular-nums flex-shrink-0 ml-3">{item.d}</div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const KunjBihariLanding = () => {
  const [mapType, setMapType] = useState('satellite');
  const mapSrc = mapType === 'satellite' ? SATELLITE_EMBED : HYBRID_EMBED;

  // Page-level scroll progress for the top hairline
  const { scrollYProgress } = useScroll();
  const railScale = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 antialiased relative overflow-x-hidden">
      <Helmet>
        <title>Shree Kunj Bihari Enclave — Premium Plots near Mathura NH-2 | Fanbe Group</title>
        <meta name="description" content="Residential gated plots beside NH-2, near Kosi-Mathura. Immediate registry, 0% interest EMI, 100% clear title. A Fanbe Group project." />
        <meta property="og:title" content="Shree Kunj Bihari Enclave — Premium Plots near Mathura NH-2" />
        <meta property="og:description" content="Residential gated plots beside the National Highway, Kosi-Mathura. By Fanbe Group." />
        <meta property="og:image" content={HERO} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      {/* Gentle rain ambient backdrop */}
      <Rain count={20} />

      {/* Top progress hairline (whisper-thin) */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[1px] z-50"
        style={{
          scaleX: railScale,
          transformOrigin: '0% 50%',
          background: 'linear-gradient(to right, transparent, #A67C52, transparent)',
        }}
      />

      {/* Sticky brand header */}
      <header className="border-b border-stone-200/70 bg-[#FAF7F2]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-stone-500">Fanbe Group</div>
            <div className="text-[13px] font-bold text-stone-900">Shree Kunj Bihari Enclave</div>
          </div>
          <div className="text-[11px] text-stone-600 hidden sm:block">Kosi Kalan · Mathura · NH-2</div>
        </div>
      </header>

      {/* ═══ HERO with scroll-locked phrase reveals ═══ */}
      <HeroPinned />

      {/* ═══ Highlight strip ═══ */}
      <section className="bg-white border-y border-stone-200 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {HIGHLIGHTS.map(h => (
            <motion.div
              key={h.sub}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <h.icon className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-stone-900 leading-tight">{h.title}</div>
                <div className="text-[11px] text-stone-500">{h.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ Overview (sticky title) ═══ */}
      <StickyTitleSection
        kicker="Overview"
        title="A gated community on India's most travelled highway."
        lede="Shree Kunj Bihari Enclave is a planned residential plotted development beside National Highway 2, in Kosi Kalan, Mathura."
      >
        <div className="border-t border-stone-200">
          {PROJECT_INFO.map(([k, v], i) => (
            <motion.div key={k}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-center justify-between py-3 border-b border-stone-200"
            >
              <div className="text-[13px] text-stone-500">{k}</div>
              <div className="text-[14px] font-semibold text-stone-900">{v}</div>
            </motion.div>
          ))}
        </div>
      </StickyTitleSection>

      {/* ═══ Location (sticky title + map + stacked landmarks) ═══ */}
      <StickyTitleSection
        kicker="Location"
        title="The exact spot."
        lede="Kosi Kalan, Mathura. Beside NH-2, walking distance to Shani Dev Mandir and Durwasha Rishi Ashram."
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-xl overflow-hidden border border-stone-200"
        >
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
        </motion.div>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2 text-[12px] text-stone-600">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            Kosi Kalan · Mathura, UP
          </div>
          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-amber-700 hover:underline">
            Open in Maps →
          </a>
        </div>

        <div className="mt-8">
          <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-stone-500 mb-3">Nearby Landmarks</p>
          <StackedCards items={LANDMARKS} />
        </div>
      </StickyTitleSection>

      {/* ═══ Connectivity ═══ */}
      <StickyTitleSection
        kicker="Connectivity"
        title="Reach the Braj Bhoomi · Reach Delhi."
        lede="Direct frontage on National Highway 2 connects every major destination in the corridor."
      >
        <div className="border-t border-stone-200">
          {DRIVES.map((d, i) => (
            <motion.div
              key={d.p}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-center justify-between py-3 border-b border-stone-200"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-stone-400" />
                <span className="text-[14px] font-semibold text-stone-900">{d.p}</span>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold text-stone-900 tabular-nums">{d.t}</div>
                <div className="text-[11px] text-stone-500">{d.k}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </StickyTitleSection>

      {/* ═══ Amenities ═══ */}
      <StickyTitleSection
        kicker="Amenities"
        title="Built like a forever home."
        lede="Every utility and margin of safety, engineered in before the first plot was handed over."
      >
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.06 }}
              className="p-4 bg-white border border-stone-200 rounded-xl"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                <a.icon className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-[14px] font-bold text-stone-900 mb-1">{a.title}</div>
              <div className="text-[12px] text-stone-500 leading-relaxed">{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </StickyTitleSection>

      {/* ═══ Industry ═══ */}
      <StickyTitleSection
        kicker="Industry"
        title="Anchored by global manufacturers."
        lede="When companies of this scale plant their factories in a corridor, land value follows."
      >
        <div className="grid grid-cols-3 gap-3">
          {BRANDS.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              className="aspect-square rounded-lg bg-white border border-stone-200 flex flex-col items-center justify-center p-3 gap-1.5"
            >
              <img
                src={`https://logo.clearbit.com/${b.domain}`}
                alt={b.name}
                className="max-h-9 max-w-full object-contain"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-[10px] font-semibold text-stone-700 text-center leading-tight">{b.name}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-stone-500 text-center">
          {BRANDS.length}+ global manufacturers operating within the corridor.
        </p>
      </StickyTitleSection>

      {/* ═══ Pricing ═══ */}
      <StickyTitleSection
        kicker="Plot Sizes & Pricing"
        title="Choose your plot."
        lede="Launch pricing of ₹7,525 per square yard. 10% booking · 35% registry · 60 months 0% EMI."
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden border border-stone-200 rounded-xl"
        >
          <div className="grid grid-cols-4 px-4 py-3 bg-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <span>Plot</span>
            <span className="text-right">Per sq yd</span>
            <span className="text-right">Total</span>
            <span className="text-right">EMI/mo</span>
          </div>
          {PLOTS.map((p) => (
            <div key={p.size} className={`grid grid-cols-4 px-4 py-3 items-center text-[13px] border-t border-stone-200 ${p.tag ? 'bg-amber-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{p.size}</span>
                <span className="text-[10px] text-stone-500 uppercase">sq yd</span>
                {p.tag && <span className="text-[9px] tracking-widest uppercase font-bold text-amber-700 px-1.5 py-0.5 bg-amber-100 rounded">{p.tag}</span>}
              </div>
              <span className="text-right text-stone-600 tabular-nums">₹7,525</span>
              <span className="text-right font-semibold text-stone-900 tabular-nums">{p.total}</span>
              <span className="text-right font-semibold text-amber-700 tabular-nums">{p.emi}</span>
            </div>
          ))}
        </motion.div>
      </StickyTitleSection>

      {/* ═══ Why Invest ═══ */}
      <StickyTitleSection
        kicker="Why Invest"
        title="Four forces pulling NH-2 up."
      >
        <div className="space-y-3">
          {WHY.map((r, i) => (
            <motion.div
              key={r}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl"
            >
              <CheckCircle2 className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <span className="text-[14px] text-stone-800 leading-relaxed">{r}</span>
            </motion.div>
          ))}
        </div>
      </StickyTitleSection>

      {/* ═══ Trust ═══ */}
      <StickyTitleSection
        kicker="Promises"
        title="What we put in writing."
      >
        <div className="grid gap-3">
          {TRUST.map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl"
            >
              <FileCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <span className="text-[14px] text-stone-800 leading-relaxed">{t}</span>
            </motion.div>
          ))}
        </div>
      </StickyTitleSection>

      {/* ═══ Footer ═══ */}
      <footer className="bg-stone-900 text-stone-300 mt-12 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-amber-400 mb-3">A Fanbe Group Project</p>
          <h3 className="text-[26px] font-bold text-white mb-2">Shree Kunj Bihari Enclave</h3>
          <p className="text-stone-400 text-[13px] mb-8">Kosi Kalan · Mathura · Uttar Pradesh</p>
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
