// src/pages/BrokerAdminPage.jsx — Admin panel to manage all brokers & sales
// Access: /broker/admin  (protect with CRM super_admin session check)
import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchAllBrokers, fetchAllSales, adminAddSale,
  updateBroker, markPayoutPaid, brokerDb, RANKS
} from '@/lib/brokerSupabase';
import { Loader2, Plus, Check, RefreshCw, Users, TrendingUp, IndianRupee, X } from 'lucide-react';

const fmt  = (n) => Number(n||0).toLocaleString('en-IN');
const fmtC = (n) => '₹' + fmt(n);

const EMPTY_SALE = { broker_id:'', project:'', sqyd:'', sale_amount:'', booking_date: new Date().toISOString().slice(0,10), notes:'' };

const BrokerAdminPage = () => {
  const [brokers,  setBrokers]  = useState([]);
  const [sales,    setSales]    = useState([]);
  const [payouts,  setPayouts]  = useState([]);
  const [tab,      setTab]      = useState('brokers');
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [saleForm, setSaleForm] = useState(EMPTY_SALE);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const load = async () => {
    setLoading(true);
    const [b, s] = await Promise.all([fetchAllBrokers(), fetchAllSales()]);
    setBrokers(b); setSales(s);
    // also load all payouts
    const { data: p } = await brokerDb.from('broker_payouts')
      .select('*, brokers(name,broker_id)').order('created_at',{ascending:false});
    setPayouts(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setSF = (k) => (e) => setSaleForm(f => ({ ...f, [k]: e.target.value }));

  const handleAddSale = async (e) => {
    e.preventDefault();
    if (!saleForm.broker_id) { setMsg('Select a broker'); return; }
    setSaving(true); setMsg('');
    const r = await adminAddSale(saleForm);
    setSaving(false);
    if (r.success) { setMsg('Sale added & payouts computed!'); setSaleForm(EMPTY_SALE); setShowAdd(false); load(); }
    else setMsg(r.message);
  };

  const handleRankChange = async (id, rank) => {
    await updateBroker(id, { rank });
    setBrokers(prev => prev.map(b => b.id===id ? {...b,rank} : b));
  };

  const handleStatusToggle = async (id, status) => {
    const newStatus = status === 'active' ? 'suspended' : 'active';
    await updateBroker(id, { status: newStatus });
    setBrokers(prev => prev.map(b => b.id===id ? {...b,status:newStatus} : b));
  };

  const handleMarkPaid = async (pid) => {
    await markPayoutPaid(pid);
    setPayouts(prev => prev.map(p => p.id===pid ? {...p,status:'paid'} : p));
  };

  const totalPending = useMemo(() => payouts.filter(p=>p.status==='pending').reduce((a,p)=>a+Number(p.amount||0),0),[payouts]);
  const totalPaid    = useMemo(() => payouts.filter(p=>p.status==='paid').reduce((a,p)=>a+Number(p.amount||0),0),[payouts]);

  if (loading) return <div className="flex items-center justify-center h-80"><Loader2 className="animate-spin text-[#0F3A5F]" size={32}/></div>;

  return (
    <div className="min-h-screen bg-[#f5f6fa] pb-20">
      {/* Header */}
      <div className="bg-[#0F3A5F] px-6 py-8">
        <h1 className="text-2xl font-black text-white">Broker Admin Panel</h1>
        <div className="flex gap-6 mt-3 text-sm text-white/70">
          <span><strong className="text-white">{brokers.length}</strong> brokers</span>
          <span><strong className="text-white">{sales.length}</strong> sales</span>
          <span><strong className="text-[#D4AF37]">{fmtC(totalPending)}</strong> pending payout</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 sticky top-0 z-10">
        {['brokers','sales','payouts'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition capitalize ${
              tab===t?'border-[#0F3A5F] text-[#0F3A5F]':'border-transparent text-gray-400'
            }`}>{t}</button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2">
          <button onClick={()=>setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#0F3A5F] text-white px-3 py-1.5 rounded-full">
            <Plus size={12}/>Add Sale
          </button>
          <button onClick={load} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <RefreshCw size={13}/>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-4xl mx-auto space-y-3">

        {/* ── BROKERS ── */}
        {tab==='brokers' && brokers.map(b => (
          <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0F3A5F] text-sm">{b.name}</p>
                <p className="text-xs text-gray-400">{b.broker_id} · {b.email}</p>
                <p className="text-xs text-gray-400">Referral: <strong>{b.referral_code}</strong></p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <select value={b.rank} onChange={e=>handleRankChange(b.id,e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-[#0F3A5F] font-semibold">
                  {RANKS.map(r=><option key={r.rank} value={r.rank}>{r.rank} – {r.title}</option>)}
                </select>
                <button onClick={()=>handleStatusToggle(b.id,b.status)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                    b.status==='active'?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-500'
                  }`}>
                  {b.status}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* ── SALES ── */}
        {tab==='sales' && sales.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-sm text-[#0F3A5F]">{s.project}</p>
                <p className="text-xs text-gray-400">{s.brokers?.name} ({s.brokers?.broker_id}) · {s.booking_date}</p>
                <p className="text-xs text-gray-400">{s.sqyd} sqyd</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600">{fmtC(s.sale_amount)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  s.status==='confirmed'?'bg-emerald-50 text-emerald-600':'bg-amber-50 text-amber-600'
                }`}>{s.status}</span>
              </div>
            </div>
          </div>
        ))}

        {/* ── PAYOUTS ── */}
        {tab==='payouts' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-semibold">Total Pending</p>
                <p className="text-xl font-black text-amber-700">{fmtC(totalPending)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-semibold">Total Paid</p>
                <p className="text-xl font-black text-emerald-700">{fmtC(totalPaid)}</p>
              </div>
            </div>
            {payouts.map(p=>(
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.brokers?.name} <span className="text-gray-400 text-xs">({p.brokers?.broker_id})</span></p>
                  <p className="text-xs text-gray-400 capitalize">{p.payout_type.replace(/_/g,' ')} · L{p.level} · {p.created_at?.slice(0,10)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#0F3A5F]">{fmtC(p.amount)}</span>
                  {p.status==='pending'
                    ? <button onClick={()=>handleMarkPaid(p.id)}
                        className="text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Check size={10}/>Mark Paid
                      </button>
                    : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">Paid</span>
                  }
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add Sale Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b">
              <h3 className="font-bold text-[#0F3A5F]">Add Sale & Compute Payout</h3>
              <button onClick={()=>setShowAdd(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleAddSale} className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Broker *</label>
                <select required value={saleForm.broker_id} onChange={setSF('broker_id')}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm">
                  <option value="">Select broker</option>
                  {brokers.filter(b=>b.status==='active').map(b=>(
                    <option key={b.id} value={b.id}>{b.name} ({b.broker_id})</option>
                  ))}
                </select>
              </div>
              {[['project','Project Name','text'],['sqyd','SQYD','number'],['sale_amount','Sale Amount (₹)','number'],['booking_date','Booking Date','date']]
                .map(([k,l,t])=>(
                  <div key={k}>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{l} *</label>
                    <input type={t} required={k!=='notes'} value={saleForm[k]} onChange={setSF(k)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
                <input value={saleForm.notes} onChange={setSF('notes')}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm" />
              </div>
              {msg && <p className={`text-xs font-semibold ${msg.includes('!')?'text-emerald-600':'text-red-500'}`}>{msg}</p>}
              <button type="submit" disabled={saving}
                className="w-full h-11 bg-[#0F3A5F] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {saving&&<Loader2 size={14} className="animate-spin"/>}
                {saving?'Saving…':'Add Sale & Compute Payouts'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerAdminPage;
