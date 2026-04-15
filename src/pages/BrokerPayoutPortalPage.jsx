// src/pages/BrokerPayoutPortalPage.jsx — Dynamic broker dashboard
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getBrokerSession, brokerLogout,
  fetchBroker, fetchBrokerSales, fetchBrokerPayouts, fetchDownline,
  calcTotals, RANKS, getRankConfig
} from '@/lib/brokerSupabase';
import {
  LogOut, Copy, CheckCheck, TrendingUp, Users, Wallet,
  Clock, BadgeCheck, ChevronRight, Loader2, RefreshCw,
  Share2, IndianRupee, Building2
} from 'lucide-react';

const fmt  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtC = (n) => '₹' + fmt(n);

// ── Stat card ───────────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      {Icon && <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent || 'bg-gray-100'}`}>
        <Icon size={15} className={accent ? 'text-white' : 'text-gray-500'} /></div>}
    </div>
    <p className="text-xl font-black text-[#0F3A5F]">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Rank badge ──────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  const cfg = getRankConfig(rank);
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#9a7720] text-xs font-bold px-3 py-1 rounded-full">
      <BadgeCheck size={11}/>{cfg.rank} · {cfg.title} · {cfg.commission}%
    </span>
  );
};

const BrokerPayoutPortalPage = () => {
  const navigate  = useNavigate();
  const session   = getBrokerSession();

  const [broker,   setBroker]   = useState(session);
  const [sales,    setSales]    = useState([]);
  const [payouts,  setPayouts]  = useState([]);
  const [downline, setDownline] = useState([]);
  const [tab,      setTab]      = useState('overview');
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const [b, s, p, d] = await Promise.all([
      fetchBroker(session.id),
      fetchBrokerSales(session.id),
      fetchBrokerPayouts(session.id),
      fetchDownline(session.id),
    ]);
    if (b) setBroker(b);
    setSales(s); setPayouts(p); setDownline(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => calcTotals(sales, payouts), [sales, payouts]);

  const referralLink = `${window.location.origin}/broker/register?ref=${broker?.referral_code || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = () => { brokerLogout(); navigate('/broker/login', { replace: true }); };

  if (loading) return (
    <section className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-[#0F3A5F]" />
    </section>
  );

  const TABS = ['overview','sales','payouts','team','plan'];
  const TAB_LABELS = { overview:'Dashboard', sales:'My Sales', payouts:'Payouts', team:'My Team', plan:'Income Plan' };

  return (
    <section className="min-h-screen bg-[#f5f6fa] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F3A5F] to-[#1a5480] px-4 pt-10 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={16} className="text-[#D4AF37]" />
                <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Fanbe Broker Portal</span>
              </div>
              <h1 className="text-2xl font-black text-white">{broker?.name}</h1>
              <p className="text-sm text-white/60 mt-0.5">{broker?.broker_id} · {broker?.email}</p>
              <div className="mt-2"><RankBadge rank={broker?.rank} /></div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition">
              <LogOut size={14}/> Logout
            </button>
          </div>

          {/* Referral share box */}
          <div className="mt-5 bg-white/10 backdrop-blur rounded-2xl p-4">
            <p className="text-xs font-bold text-[#D4AF37] mb-1 flex items-center gap-1"><Share2 size={11}/>Your Referral Link — share to earn level commission</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-white/80 truncate bg-white/5 rounded-lg px-3 py-2">{referralLink}</code>
              <button onClick={copyLink} className="shrink-0 w-9 h-9 rounded-xl bg-[#D4AF37] flex items-center justify-center active:scale-90 transition">
                {copied ? <CheckCheck size={15} className="text-white"/> : <Copy size={15} className="text-white"/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto flex overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                tab === t ? 'border-[#0F3A5F] text-[#0F3A5F]' : 'border-transparent text-gray-400'
              }`}>
              {TAB_LABELS[t]}
            </button>
          ))}
          <button onClick={load} className="ml-auto px-4 py-3 text-gray-300 hover:text-gray-500">
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total SQYD" value={fmt(totals.totalSqyd) + ' sq'} icon={Building2} accent="bg-[#0F3A5F]" />
              <Stat label="Total Sales" value={fmtC(totals.totalSaleAmt)} icon={TrendingUp} accent="bg-emerald-500" />
              <Stat label="Pending Payout" value={fmtC(totals.pendingPayout)} sub="Awaiting payment" icon={Clock} accent="bg-amber-400" />
              <Stat label="Paid Out" value={fmtC(totals.paidPayout)} sub="Total received" icon={Wallet} accent="bg-[#D4AF37]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Sales Count" value={sales.filter(s=>s.status==='confirmed').length} icon={BadgeCheck} />
              <Stat label="Team Members" value={downline.length} sub="Direct recruits" icon={Users} />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab('team')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-[0.98] transition">
                <Users size={18} className="text-[#0F3A5F] mb-2"/>
                <p className="text-sm font-bold text-[#0F3A5F]">My Team</p>
                <p className="text-xs text-gray-400">{downline.length} direct members</p>
              </button>
              <button onClick={() => setTab('payouts')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-[0.98] transition">
                <IndianRupee size={18} className="text-emerald-600 mb-2"/>
                <p className="text-sm font-bold text-emerald-700">Payouts</p>
                <p className="text-xs text-gray-400">{fmtC(totals.pendingPayout)} pending</p>
              </button>
            </div>
          </>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700">My Confirmed Sales ({sales.length})</h2>
            {sales.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No sales recorded yet.</p>}
            {sales.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#0F3A5F] text-sm">{s.project}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.booking_date} · {s.sqyd} sqyd</p>
                    {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-emerald-600">{fmtC(s.sale_amount)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status==='confirmed' ? 'bg-emerald-50 text-emerald-600' :
                      s.status==='pending'   ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                    }`}>{s.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PAYOUTS ── */}
        {tab === 'payouts' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-semibold">Pending</p>
                <p className="text-xl font-black text-amber-700">{fmtC(totals.pendingPayout)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-semibold">Paid</p>
                <p className="text-xl font-black text-emerald-700">{fmtC(totals.paidPayout)}</p>
              </div>
            </div>
            {payouts.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No payout records yet.</p>}
            {payouts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{p.payout_type.replace(/_/g,' ')}</p>
                  <p className="text-xs text-gray-400">{p.level > 0 ? `Level ${p.level} commission` : 'Direct commission'} · {p.created_at?.slice(0,10)}</p>
                  {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-black text-[#0F3A5F]">{fmtC(p.amount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status==='paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEAM ── */}
        {tab === 'team' && (
          <div className="space-y-3">
            <div className="bg-[#0F3A5F]/5 rounded-2xl p-4 border border-[#0F3A5F]/10">
              <p className="text-xs font-bold text-[#0F3A5F] mb-1">Your Referral Code</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-[#D4AF37] tracking-widest">{broker?.referral_code}</span>
                <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-[#0F3A5F] font-semibold bg-white border border-[#0F3A5F]/20 px-3 py-1.5 rounded-full">
                  {copied ? <><CheckCheck size={11}/>Copied!</> : <><Copy size={11}/>Copy Link</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">When someone registers with your code, you earn level commission on all their sales.</p>
            </div>

            <h2 className="text-sm font-bold text-gray-700">Direct Team ({downline.length})</h2>
            {downline.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No team members yet. Share your referral link to recruit.</p>}
            {downline.map(m => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.broker_id} · {m.phone || m.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-[#0F3A5F]/10 text-[#0F3A5F] px-2 py-1 rounded-full">{m.rank}</span>
                  <span className={`block text-[10px] mt-1 font-semibold ${ m.status==='active' ? 'text-emerald-500' : 'text-red-400' }`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INCOME PLAN ── */}
        {tab === 'plan' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-xs bg-white">
                <thead className="bg-[#0F3A5F] text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Rank</th>
                    <th className="px-3 py-3 text-left">Title</th>
                    <th className="px-3 py-3 text-left">Commission</th>
                    <th className="px-3 py-3 text-left">Team Qual.</th>
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map((r,i) => (
                    <tr key={r.rank} className={`border-t ${ broker?.rank === r.rank ? 'bg-[#D4AF37]/10' : i%2===0?'bg-white':'bg-gray-50/50' }`}>
                      <td className="px-3 py-2.5 font-bold text-[#0F3A5F]">{r.rank}</td>
                      <td className="px-3 py-2.5">{r.title}</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-600">{r.commission}%</td>
                      <td className="px-3 py-2.5 text-gray-500">{r.teamQual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-red-600 mb-3">Direct Bonanza</h3>
              {[['500 SQYD','Bike (Ex-Showroom)'],['Next 1100 SQYD','Alto (Ex-Showroom)'],['Next 2100 SQYD','Breeza (Ex-Showroom)'],['Next 5100 SQYD','Scorpio (Ex-Showroom)']]
                .map(([t,r])=>(<div key={t} className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="font-semibold text-[#0F3A5F]">{t}</span><span className="text-gray-600">{r}</span></div>))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-red-600 mb-3">Team Reward</h3>
              {[['50 Unit','Laptop Mini'],['Next 110 Unit','L.E.D (55")'],['Next 210 Unit','Bullet'],['Next 410 Unit','Alto'],['Next 810 Unit','Breeza'],['Next 5000 Unit','Farm House (35L)'],['Next 12000 Unit','Farm House (1 Cr)']]
                .map(([t,r])=>(<div key={t} className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="font-semibold text-[#0F3A5F]">{t}</span><span className="text-gray-600">{r}</span></div>))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-red-600 mb-3">Terms & Conditions</h3>
              <ul className="space-y-2 text-xs text-gray-600 list-disc pl-4">
                <li>Payout is calculated on differential basis.</li>
                <li>Payout closing done daily, distributed monthly.</li>
                <li>No payout on equal rank or super-seeded team.</li>
                <li>Sales counted only when booking amount is deposited.</li>
                <li>Grace period for installment is 90 days.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrokerPayoutPortalPage;
