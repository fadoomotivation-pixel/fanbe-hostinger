// src/lib/brokerSupabase.js
// Dynamic Broker Payout System — Supabase backend
import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL;
const KEY  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const brokerDb = createClient(URL, KEY);

// ─── Rank config (mirrors static data) ──────────────────────────────────────
export const RANKS = [
  { rank:'RANK.1',  title:'EX',               commission:5,    directMin:100,  teamQual:'100 SQYD (min 1 direct)' },
  { rank:'RANK.2',  title:'SR. EX',            commission:5.5,  directMin:0,    teamQual:'750 SQYD' },
  { rank:'RANK.3',  title:'Sales Officer',      commission:6,    directMin:0,    teamQual:'1250 SQYD' },
  { rank:'RANK.4',  title:'SR S.O',             commission:6.5,  directMin:0,    teamQual:'2000 SQYD' },
  { rank:'RANK.5',  title:'Team Manager',       commission:7,    directMin:0,    teamQual:'3 SR S.O' },
  { rank:'RANK.6',  title:'SR T.M',             commission:7.5,  directMin:0,    teamQual:'3 T.M' },
  { rank:'RANK.7',  title:'Asst. Sales Mgr',    commission:8,    directMin:0,    teamQual:'3 SR T.M' },
  { rank:'RANK.8',  title:'Sales Mgr',          commission:8.5,  directMin:0,    teamQual:'3 Asst. Sales Mgr' },
  { rank:'RANK.9',  title:'Sr. S.M',            commission:9,    directMin:0,    teamQual:'3 Sales Mgr' },
  { rank:'RANK.10', title:'Asst. Gen. Mgr',     commission:9.5,  directMin:0,    teamQual:'3 Sr. S.M' },
  { rank:'RANK.11', title:'G.M',                commission:10,   directMin:0,    teamQual:'3 Asst. Gen. Mgr' },
  { rank:'RANK.12', title:'Sr. G.M',            commission:10.5, directMin:0,    teamQual:'3 G.M' },
  { rank:'RANK.13', title:'Zonal Mgr',          commission:11,   directMin:0,    teamQual:'3 Sr. G.M' },
  { rank:'RANK.14', title:'Vice President',     commission:11.5, directMin:0,    teamQual:'3 Zonal Mgr' },
  { rank:'RANK.15', title:'President',          commission:12,   directMin:0,    teamQual:'3 Vice President' },
];

export const getRankConfig = (rankStr) =>
  RANKS.find(r => r.rank === rankStr) || RANKS[0];

// Level commission differential — parent earns difference
// e.g. RANK.2 parent (5.5%) on RANK.1 sale (5%) earns 0.5% differential
export const getLevelCommission = (parentRank, childRank, saleAmount) => {
  const pr = getRankConfig(parentRank);
  const cr = getRankConfig(childRank);
  const diff = Math.max(0, pr.commission - cr.commission);
  return (diff / 100) * saleAmount;
};

// ─── Auth ─────────────────────────────────────────────────────────────────
const SESSION_KEY = 'broker_session_v2';

export const getBrokerSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
};

export const setBrokerSession = (broker) =>
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(broker));

export const clearBrokerSession = () =>
  sessionStorage.removeItem(SESSION_KEY);

export const isBrokerAuthenticated = () => !!getBrokerSession();

// Simple hash (bcrypt not available client-side, use SHA-256 via WebCrypto)
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Generate unique broker ID: FNB-XXXXX
async function generateBrokerId() {
  const { count } = await brokerDb.from('brokers').select('*', { count: 'exact', head: true });
  const num = String((count || 0) + 1).padStart(5, '0');
  return `FNB-${num}`;
}

// Generate 8-char referral code
function generateReferralCode(name) {
  const base = name.replace(/\s+/g,'').toUpperCase().slice(0,4);
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `${base}${rand}`;
}

// ─── Register ──────────────────────────────────────────────────────────────
export async function brokerRegister({ name, email, phone, password, referralCode }) {
  // Check email unique
  const { data: existing } = await brokerDb.from('brokers').select('id').eq('email', email).maybeSingle();
  if (existing) return { success: false, message: 'Email already registered.' };

  // Find parent by referral code
  let parentId = null;
  if (referralCode) {
    const { data: parent } = await brokerDb.from('brokers')
      .select('id').eq('referral_code', referralCode.toUpperCase()).maybeSingle();
    if (!parent) return { success: false, message: 'Invalid referral code.' };
    parentId = parent.id;
  }

  const hash      = await sha256(password);
  const brokerId  = await generateBrokerId();
  const myCode    = generateReferralCode(name);

  const { data, error } = await brokerDb.from('brokers').insert({
    broker_id: brokerId,
    name, email, phone,
    password_hash: hash,
    parent_id: parentId,
    referral_code: myCode,
    rank: 'RANK.1',
    status: 'active',
  }).select().single();

  if (error) return { success: false, message: error.message };
  setBrokerSession(data);
  return { success: true, broker: data };
}

// ─── Login ─────────────────────────────────────────────────────────────────
export async function brokerLogin(email, password) {
  const hash = await sha256(password);
  const { data, error } = await brokerDb.from('brokers')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('password_hash', hash)
    .maybeSingle();

  if (error || !data) return { success: false, message: 'Invalid email or password.' };
  if (data.status === 'suspended') return { success: false, message: 'Account suspended. Contact admin.' };

  setBrokerSession(data);
  return { success: true, broker: data };
}

export const brokerLogout = () => clearBrokerSession();

// ─── Fetch broker's own data (fresh) ────────────────────────────────────────
export async function fetchBroker(id) {
  const { data } = await brokerDb.from('brokers').select('*').eq('id', id).single();
  return data;
}

// ─── Fetch broker's sales ───────────────────────────────────────────────────
export async function fetchBrokerSales(brokerId) {
  const { data } = await brokerDb.from('broker_sales')
    .select('*').eq('broker_id', brokerId).order('booking_date', { ascending: false });
  return data || [];
}

// ─── Fetch broker's payouts ─────────────────────────────────────────────────
export async function fetchBrokerPayouts(brokerId) {
  const { data } = await brokerDb.from('broker_payouts')
    .select('*').eq('broker_id', brokerId).order('created_at', { ascending: false });
  return data || [];
}

// ─── Fetch downline (direct children) ───────────────────────────────────────
export async function fetchDownline(parentId) {
  const { data } = await brokerDb.from('brokers')
    .select('id, broker_id, name, email, phone, rank, created_at, status')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Admin: all brokers ─────────────────────────────────────────────────────
export async function fetchAllBrokers() {
  const { data } = await brokerDb.from('brokers')
    .select('id, broker_id, name, email, phone, rank, status, referral_code, parent_id, created_at')
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Admin: all sales ───────────────────────────────────────────────────────
export async function fetchAllSales() {
  const { data } = await brokerDb.from('broker_sales')
    .select('*, brokers(name, broker_id, rank)')
    .order('booking_date', { ascending: false });
  return data || [];
}

// ─── Admin: add sale + auto-compute payouts ─────────────────────────────────
export async function adminAddSale({ broker_id, project, sqyd, sale_amount, booking_date, notes }) {
  // 1. Insert sale
  const { data: sale, error } = await brokerDb.from('broker_sales').insert({
    broker_id, project, sqyd: Number(sqyd),
    sale_amount: Number(sale_amount),
    booking_date: booking_date || new Date().toISOString().split('T')[0],
    notes, status: 'confirmed',
  }).select().single();

  if (error) return { success: false, message: error.message };

  // 2. Direct commission for the broker
  const { data: broker } = await brokerDb.from('brokers').select('rank, parent_id').eq('id', broker_id).single();
  const rankCfg = getRankConfig(broker.rank);
  const directAmt = (rankCfg.commission / 100) * Number(sale_amount);

  await brokerDb.from('broker_payouts').insert({
    broker_id, sale_id: sale.id,
    amount: directAmt,
    payout_type: 'direct_commission',
    level: 0, status: 'pending',
  });

  // 3. Level (upline) differential commission — walk up 3 levels
  let childRank = broker.rank;
  let parentId  = broker.parent_id;
  let level     = 1;

  while (parentId && level <= 3) {
    const { data: parent } = await brokerDb.from('brokers')
      .select('rank, parent_id').eq('id', parentId).single();
    if (!parent) break;

    const levelAmt = getLevelCommission(parent.rank, childRank, Number(sale_amount));
    if (levelAmt > 0) {
      await brokerDb.from('broker_payouts').insert({
        broker_id: parentId, sale_id: sale.id,
        amount: levelAmt,
        payout_type: 'level_commission',
        level, status: 'pending',
        notes: `L${level} differential from ${broker_id}`,
      });
    }
    childRank = parent.rank;
    parentId  = parent.parent_id;
    level++;
  }

  return { success: true, sale };
}

// ─── Admin: mark payout paid ────────────────────────────────────────────────
export async function markPayoutPaid(payoutId) {
  const { error } = await brokerDb.from('broker_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payoutId);
  return !error;
}

// ─── Admin: update broker rank/status ───────────────────────────────────────
export async function updateBroker(id, updates) {
  const { error } = await brokerDb.from('brokers').update(updates).eq('id', id);
  return !error;
}

// ─── Totals helper ──────────────────────────────────────────────────────────
export function calcTotals(sales, payouts) {
  const totalSqyd     = sales.filter(s => s.status === 'confirmed').reduce((a,s) => a + Number(s.sqyd || 0), 0);
  const totalSaleAmt  = sales.filter(s => s.status === 'confirmed').reduce((a,s) => a + Number(s.sale_amount || 0), 0);
  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((a,p) => a + Number(p.amount || 0), 0);
  const paidPayout    = payouts.filter(p => p.status === 'paid').reduce((a,p) => a + Number(p.amount || 0), 0);
  return { totalSqyd, totalSaleAmt, pendingPayout, paidPayout };
}
