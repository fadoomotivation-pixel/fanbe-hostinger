import React, { useState, useMemo } from 'react';
import projects from '@/data/projects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator, Info, TrendingUp, ChevronRight, IndianRupee } from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const fmtL = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(2)} L`;
  return `\u20b9${fmt(n)}`;
};

// Returns the EMI for a given project at 50 sq yd (starting price)
const getStartingEmi = (p) => {
  const total   = p.pricing.pricePerSqYdNum * 50;
  const booking = Math.round(total * (p.pricing.bookingPct || 0.10));
  const balance = total - booking;
  return Math.ceil(balance / (p.pricing.emiMonths || 60));
};

const PRESET_SIZES = [50, 100, 150, 200, 250];
const ROI_PCT      = 0.15;

// ── Breakdown Modal ────────────────────────────────────────────────────────
const BreakdownModal = ({ isOpen, onClose, data }) => {
  if (!data) return null;
  const { totalCost, booking, remaining, emi, project, sqyd, bookingPctDisplay, emiMonths } = data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-[#0F3A5F] flex items-center gap-2">
            <IndianRupee size={18} className="text-amber-500" />
            Payment Breakdown
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-800 font-medium">
            {project} — {sqyd} sq yd plot
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Plot Cost</span>
              <span className="font-bold text-[#0F3A5F]">₹{fmt(totalCost)}</span>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-0 h-full w-px bg-gray-200" />
              <div className="space-y-2 pl-10">
                <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Booking Amount ({bookingPctDisplay})</p>
                    <p className="text-xs text-amber-600">Pay at booking — registry starts after this</p>
                  </div>
                  <span className="font-bold text-amber-700">₹{fmt(booking)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-green-800">Remaining Balance</p>
                    <p className="text-xs text-green-600">Split into {emiMonths} interest-free EMIs</p>
                  </div>
                  <span className="font-bold text-green-700">₹{fmt(remaining)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#0F3A5F] text-white rounded-xl">
              <div>
                <p className="text-xs text-blue-200">Monthly EMI (for {emiMonths} months)</p>
                <p className="text-2xl font-bold">₹{fmt(emi)}</p>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">0% Interest</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-purple-600" />
              <p className="text-sm font-bold text-purple-800">Investment Projection (est. 15% p.a.)</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[1, 3, 5].map(yr => (
                <div key={yr} className="bg-white rounded-lg p-2 border border-purple-100">
                  <p className="text-xs text-gray-500">{yr} Year{yr > 1 ? 's' : ''}</p>
                  <p className="text-sm font-bold text-purple-700">{fmtL(totalCost * Math.pow(1 + ROI_PCT, yr))}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">*Estimates based on historical area appreciation. Not guaranteed.</p>
          </div>

          <div className="space-y-2">
            {[
              `Registry starts after ${bookingPctDisplay} booking payment`,
              'All installments are 100% interest-free',
              'No hidden charges — transparent pricing',
              'Free site visit with pick & drop available',
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <ChevronRight size={12} className="mt-0.5 text-green-500 shrink-0" />
                {note}
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 pt-3 border-t">
          <Button
            className="w-full bg-[#0F3A5F] hover:bg-[#1a4d7a] text-white"
            onClick={() => {
              onClose();
              window.open(`https://wa.me/918076146988?text=Hi%2C%20I%27m%20interested%20in%20a%20${sqyd}%20sq%20yd%20plot%20at%20${encodeURIComponent(project)}.%20Total%3A%20%E2%82%B9${fmt(totalCost)}`, '_blank');
            }}
          >
            Book Now on WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main EMI Calculator ────────────────────────────────────────────────────
const EMICalculator = ({ defaultProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || projects[0].id
  );
  const [sqyd, setSqyd] = useState(50);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) || projects[0],
    [selectedProjectId]
  );

  const rate              = selectedProject.pricing.pricePerSqYdNum || 0;
  const bookingPct        = selectedProject.pricing.bookingPct      || 0.10;
  const emiMonths         = selectedProject.pricing.emiMonths       || 60;
  const bookingPctDisplay = selectedProject.pricing.bookingPctDisplay || '10%';

  const calc = useMemo(() => {
    const totalCost = rate * sqyd;
    const booking   = Math.round(totalCost * bookingPct);
    const remaining = totalCost - booking;
    const emi       = Math.ceil(remaining / emiMonths);
    return { totalCost, booking, remaining, emi };
  }, [rate, sqyd, bookingPct, emiMonths]);

  const breakdownData = {
    ...calc,
    project: selectedProject.name,
    sqyd,
    bookingPctDisplay,
    emiMonths,
  };

  const sliderFill = Math.round(((sqyd - 50) / (300 - 50)) * 100);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3A5F] to-[#1a5c8a] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Calculator size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Investment Calculator</h3>
              <p className="text-blue-200 text-xs">Instant pricing · 0% interest · No hidden charges</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Project</label>
            <div className="grid grid-cols-2 gap-2">
              {projects.map(p => {
                const startEmi = getStartingEmi(p);
                const isSelected = selectedProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#0F3A5F] text-white border-[#0F3A5F] shadow-md'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className={`text-[10px] mt-0.5 font-medium ${
                      isSelected ? 'text-[#D4AF37]' : 'text-green-600'
                    }`}>
                      EMI from ₹{fmt(startEmi)}/mo
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset size chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plot Size (sq yd)</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setSqyd(size)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    sqyd === size
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="relative pt-1">
              <input
                type="range" min={50} max={300} step={5} value={sqyd}
                onChange={e => setSqyd(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #0F3A5F ${sliderFill}%, #e5e7eb ${sliderFill}%)` }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>50 sq yd</span>
                <span className="font-bold text-[#0F3A5F]">{sqyd} sq yd selected</span>
                <span>300 sq yd</span>
              </div>
            </div>
          </div>

          {/* Live result cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F3A5F] rounded-xl p-4 text-white col-span-2">
              <p className="text-xs text-blue-200 mb-1">Total Plot Cost</p>
              <p className="text-3xl font-extrabold tracking-tight">₹{fmt(calc.totalCost)}</p>
              <p className="text-xs text-blue-300 mt-1">{sqyd} sq yd × ₹{fmt(rate)}/sq yd</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-medium mb-1">Booking ({bookingPctDisplay})</p>
              <p className="text-xl font-bold text-amber-700">₹{fmt(calc.booking)}</p>
              <p className="text-[10px] text-amber-500 mt-1">Pay to start registry</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-1">Monthly EMI</p>
              <p className="text-xl font-bold text-green-700">₹{fmt(calc.emi)}</p>
              <p className="text-[10px] text-green-500 mt-1">{emiMonths} months · 0% interest</p>
            </div>
          </div>

          {/* ROI teaser */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              <div>
                <p className="text-xs font-semibold text-purple-800">Est. value in 3 years</p>
                <p className="text-sm font-bold text-purple-700">{fmtL(calc.totalCost * Math.pow(1 + ROI_PCT, 3))}</p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">+15% p.a.</span>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-blue-50" onClick={() => setShowBreakdown(true)}>
              <Info size={15} /> Full Breakdown
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              onClick={() => window.open(`https://wa.me/918076146988?text=Hi%2C%20I%27m%20interested%20in%20${sqyd}%20sq%20yd%20plot%20at%20${encodeURIComponent(selectedProject.name)}.%20Total%3A%20%E2%82%B9${fmt(calc.totalCost)}`, '_blank')}
            >
              ✨ Book Now
            </Button>
          </div>
        </div>
      </div>

      <BreakdownModal isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} data={breakdownData} />
    </>
  );
};

export default EMICalculator;
