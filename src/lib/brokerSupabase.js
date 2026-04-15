// src/lib/brokerSupabase.js
// Dynamic Broker Payout System — Supabase backend
import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL;
const KEY  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const brokerDb = createClient(URL, KEY);

// ─── Rank config (fallback static data; can be overridden by DB rules) ─────
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

let rankRulesCache = null;
let rankRulesCacheTime = 0;
const RANK_RULES_CACHE_MS = 5 * 60 * 1000;

function mapRankRowsToConfig(rows = []) {
  return rows.map(r => ({
    rank: r.rank,
    title: r.title,
    commission: Number(r.commission_percent || 0),
    directMin: Number(r.direct_min_sqyd || 0),
    teamQual: r.team_qualification || '-',
    levelDepth: Number(r.level_depth || 20),
  }));
}

export async function fetchRankConfigs() {
  const now = Date.now();
  if (rankRulesCache && now - rankRulesCacheTime < RANK_RULES_CACHE_MS) return rankRulesCache;

  const { data, error } = await brokerDb.from('broker_rank_rules')
    .select('rank,title,commission_percent,direct_min_sqyd,team_qualification,level_depth')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    rankRulesCache = RANKS;
    rankRulesCacheTime = now;
    return rankRulesCache;
  }

  rankRulesCache = mapRankRowsToConfig(data);
  rankRulesCacheTime = now;
  return rankRulesCache;
}

export async function getRankConfig(rankStr) {
  const rules = await fetchRankConfigs();
  return rules.find(r => r.rank === rankStr) || rules[0] || RANKS[0];
}

export async function getLevelCommission(parentRank, childRank, saleAmount) {
  const [pr, cr] = await Promise.all([
    getRankConfig(parentRank),
    getRankConfig(childRank),
  ]);
  const diff = Math.max(0, Number(pr.commission || 0) - Number(cr.commission || 0));
  return (diff / 100) * Number(saleAmount || 0);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────────
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

// Generate unique broker ID from DB function if available
async function generateBrokerId() {
  const { data, error } = await brokerDb.rpc('next_broker_code');
  if (!error && data) return data;

  const { count } = await brokerDb.from('brokers').select('*', { count: 'exact', head: true });
  const num = String((count || 0) + 1).padStart(5, '0');
  return `FNB-${num}`;
}

// Generate 8-char referral code
function generateReferralCode(name) {
  const base = name.replace(/\s+/g,'').toUpperCase().slice(0,4) || 'FNBR';
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `${base}${rand}`;
}

async function generateUniqueReferralCode(name) {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode(name);
    const { data } = await brokerDb.from('brokers').select('id').eq('referral_code', code).maybeSingle();
    if (!data) return code;
  }
  return `${(name || 'FNBR').replace(/\s+/g,'').toUpperCase().slice(0,4)}${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

// ─── Register ─────────────────────────────────────────────────────────────
export async function brokerRegister({ name, email, phone, password, referralBrokerId, referralCode }) {
  // Check email unique
  const { data: existing } = await brokerDb.from('brokers').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (existing) return { success: false, message: 'Email already registered.' };

  // Find parent — first try by broker_id (FNB-05001), then by referral_code (legacy)
  let parentId = null;
  const refId = (referralBrokerId || referralCode || '').trim().toUpperCase();

  if (refId) {
    // Try broker_id first (format used in referral links: ?ref=FNB-05000)
    if (refId.startsWith('FNB-')) {
      const { data: parent } = await brokerDb.from('brokers')
        .select('id').eq('broker_id', refId).maybeSingle();
      if (!parent) return { success: false, message: `Referral ID “${refId}” not found.` };
      parentId = parent.id;
    } else {
      // fallback: look up by referral_code
      const { data: parent } = await brokerDb.from('brokers')
        .select('id').eq('referral_code', refId).maybeSingle();
      if (!parent) return { success: false, message: `Referral code “${refId}” not found.` };
      parentId = parent.id;
    }
  }

  const hash      = await sha256(password);
  const brokerId  = await generateBrokerId();
  const myCode    = await generateUniqueReferralCode(name);

  const { data, error } = await brokerDb.from('brokers').insert({
    broker_id: brokerId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
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

// ─── Login ─────────────────────────────────────────────────────────────────────
const brokerLogin_orig = async (email, password) => {
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
};
export const brokerLogin = brokerLogin_orig;

export const brokerLogout = () => clearBrokerSession();

// ─── Fetch broker's own data (fresh) ──────────────────────────────────────────────
export async function fetchBroker(id) {
  const { data } = await brokerDb.from('brokers').select('*').eq('id', id).single();
  return data;
}

// ─── Fetch broker's sales ─────────────────────────────────────────────────────────────────────
export async function fetchBrokerSales(brokerId) {
  const { data } = await brokerDb.from('broker_sales')
    .select('*').eq('broker_id', brokerId).order('booking_date', { ascending: false });
  return data || [];
}

// ─── Fetch broker's payouts ───────────────────────────────────────────────────────────────────
const fetchBrokerPayouts_fn = async (brokerId) => {
  const { data } = await brokerDb.from('broker_payouts')
    .select('*').eq('broker_id', brokerId).order('created_at', { ascending: false });
  return data || [];
};
export const fetchBrokerPayouts = fetchBrokerPayouts_fn;

// ─── Fetch downline (direct children) ───────────────────────────────────────────────────
export async function fetchDownline(parentId) {
  const { data } = await brokerDb.from('brokers')
    .select('id, broker_id, name, email, phone, rank, created_at, status')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Admin: all brokers ──────────────────────────────────────────────────────────────────────
export async function fetchAllBrokers() {
  const { data } = await brokerDb.from('brokers')
    .select('id, broker_id, name, email, phone, rank, status, referral_code, parent_id, created_at')
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Admin: all sales ─────────────────────────────────────────────────────────────────────────
export async function fetchAllSales() {
  const { data } = await brokerDb.from('broker_sales')
    .select('*, brokers(name, broker_id, rank)')
    .order('booking_date', { ascending: false });
  return data || [];
}

// ─── Admin: add sale + auto-compute payouts (dynamic depth) ────────────────────────
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
  const rankCfg = await getRankConfig(broker.rank);
  const directAmt = (Number(rankCfg.commission || 0) / 100) * Number(sale_amount);

  await brokerDb.from('broker_payouts').insert({
    broker_id, sale_id: sale.id,
    amount: directAmt,
    payout_type: 'direct_commission',
    level: 0, status: 'pending',
    notes: `Direct ${rankCfg.commission}%`,
  });

  // 3. Level (upline) differential commission — dynamic depth from rank rule
  let childRank = broker.rank;
  let parentId  = broker.parent_id;
  let level     = 1;
  const maxDepth = Math.max(1, Number(rankCfg.levelDepth || 20));

  while (parentId && level <= maxDepth) {
    const { data: parent } = await brokerDb.from('brokers')
      .select('id, rank, parent_id').eq('id', parentId).single();
    if (!parent) break;

    const levelAmt = await getLevelCommission(parent.rank, childRank, Number(sale_amount));
    if (levelAmt > 0) {
      await brokerDb.from('broker_payouts').insert({
        broker_id: parent.id,
        sale_id: sale.id,
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

// ─── Admin: mark payout paid ────────────────────────────────────────────────────────────────
export async function markPayoutPaid(payoutId) {
  const { error } = await brokerDb.from('broker_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payoutId);
  return !error;
}

// ─── Admin: update broker rank/status ──────────────────────────────────────────────────────────
export async function updateBroker(id, updates) {
  const { error } = await brokerDb.from('brokers').update(updates).eq('id', id);
  return !error;
}

// ─── Totals helper ───────────────────────────────────────────────────────────────────────────
export function calcTotals(sales, payouts) {
  const totalSqyd     = sales.filter(s => s.status === 'confirmed').reduce((a,s) => a + Number(s.sqyd || 0), 0);
  const totalSaleAmt  = sales.filter(s => s.status === 'confirmed').reduce((a,s) => a + Number(s.sale_amount || 0), 0);
  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((a,p) => a + Number(p.amount || 0), 0);
  const paidPayout    = payouts.filter(p => p.status === 'paid').reduce((a,p) => a + Number(p.amount || 0), 0);
  return { totalSqyd, totalSaleAmt, pendingPayout, paidPayout };
}
