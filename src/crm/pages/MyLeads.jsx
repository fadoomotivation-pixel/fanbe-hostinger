// src/crm/pages/MyLeads.jsx
// ✅ REDESIGN v4 — Rich mobile UI, action-first, vivid palette
// ✅ FIX v4.1 — All overflow-x issues patched, nothing bleeds outside screen
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMyLeads } from '@/crm/hooks/useMyLeads';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import SmartDateInput from '@/crm/components/SmartDateInput';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import {
  format, isToday, isTomorrow, isYesterday,
  isPast, differenceInDays, formatDistanceToNow
} from 'date-fns';
import {
  Search, Phone, ChevronRight, AlertCircle, Loader2,
  X, Copy, CheckCircle, Filter, ArrowUpDown,
  Plus, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';

// ─────────────────────────── helpers ──────────────────────────────────────
const parseLocalDate = (s) => {
  if (!s || typeof s !== 'string') return null;
  const [y, m, d] = s.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,5)}-${d.slice(5)}`;
  if (d.length > 10) return `+${d.slice(0,d.length-10)}-${d.slice(-10,-5)}-${d.slice(-5)}`;
  return p;
};
const getLatestNote = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const clean = lines[lines.length-1].replace(/^\[.*?\]:\s*/, '').trim();
  return clean.length > 0 ? clean : null;
};
const timeAgo = (ts) => {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    const mins = Math.floor((Date.now() - d) / 60000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24)  return `${hrs}h ago`;
    if (days === 1) return `Yesterday ${format(d,'h:mm a')}`;
    if (days < 7)  return `${days}d ago`;
    return format(d, 'dd MMM');
  } catch { return null; }
};
const urgencyScore = (lead) => {
  const fu = lead.follow_up_date || lead.followUpDate;
  if (!fu) return lead.status === 'New' ? 2 : 1;
  try {
    const d = parseLocalDate(fu);
    if (!d) return 1;
    if (isPast(d) && !isToday(d)) return 100;
    if (isToday(d))               return 90;
    return Math.max(0, 10 - differenceInDays(d, new Date()));
  } catch { return 1; }
};
const initials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase();
};

// ─────────────────────────── constants ────────────────────────────────────
const QUICK_OUTCOMES = [
  { id:'Not Answered', label:'No Answer', emoji:'📵', bg:'#374151' },
  { id:'Connected',    label:'Connected', emoji:'✅', bg:'#059669' },
  { id:'Busy',         label:'Busy',      emoji:'🔴', bg:'#DC2626' },
  { id:'Switched Off', label:'S/Off',     emoji:'📴', bg:'#4B5563' },
];
const QUICK_STATUSES = [
  { id:'FollowUp',      emoji:'📅', label:'Follow Up',  bg:'#D97706' },
  { id:'SiteVisit',     emoji:'📍', label:'Site Visit', bg:'#7C3AED' },
  { id:'Booked',        emoji:'💰', label:'Booked',     bg:'#059669' },
  { id:'NotInterested', emoji:'❌', label:'Not Int.',   bg:'#E11D48' },
];
const STATUS_BADGE = {
  New:           { bg:'#DBEAFE', text:'#1D4ED8', label:'New'        },
  Open:          { bg:'#E0F2FE', text:'#0369A1', label:'Open'       },
  FollowUp:      { bg:'#FEF3C7', text:'#B45309', label:'Follow Up'  },
  SiteVisit:     { bg:'#EDE9FE', text:'#6D28D9', label:'Site Visit' },
  Booked:        { bg:'#D1FAE5', text:'#065F46', label:'Booked ✓'   },
  NotInterested: { bg:'#F1F5F9', text:'#475569', label:'Not Int.'   },
  Lost:          { bg:'#FEE2E2', text:'#B91C1C', label:'Lost'       },
  CallBackLater: { bg:'#EEF2FF', text:'#4338CA', label:'Call Back'  },
};
const AVATAR_COLORS = ['#0F2744','#1E3A5F','#065F46','#6D28D9','#B45309','#0369A1','#BE185D','#374151'];
const avatarColor = (name) => AVATAR_COLORS[(name||'A').charCodeAt(0) % AVATAR_COLORS.length];
const TABS = [
  { id:'new',       label:'New'         },
  { id:'all',       label:'All'         },
  { id:'overdue',   label:'🚨 Overdue'   },
  { id:'yesterday', label:'⏪ Yesterday'  },
  { id:'today',     label:'📅 Today'     },
  { id:'tomorrow',  label:'🌅 Tomorrow'  },
  { id:'followup',  label:'Follow Up'   },
  { id:'booked',    label:'Booked'      },
  { id:'submitted', label:'📋 Submitted' },
];
const TERMINAL  = ['NotInterested','Lost','Booked'];
const TAB_KEY   = 'myLeads_activeTab';
const PAGE_SIZE = 20;
const SL_STATUS_STYLES  = {
  pending:   { bg:'#FEF3C7', text:'#92400E', border:'#FDE68A' },
  converted: { bg:'#DBEAFE', text:'#1E40AF', border:'#BFDBFE' },
  rejected:  { bg:'#FEE2E2', text:'#991B1B', border:'#FECACA' },
};
const SL_STATUS_LABELS   = { pending:'Pending', converted:'Converted ✓', rejected:'Rejected' };
const SL_PROPERTY_LABELS = { plot:'Plot', flat:'Flat/Apartment', villa:'Villa', commercial:'Commercial', other:'Other' };
const SL_PURPOSE_LABELS  = { investment:'Investment', self_use:'Self Use', both:'Both' };
const SL_TIMELINE_LABELS = { immediate:'Immediate','3_months':'3 Months','6_months':'6 Months','1_year':'1 Year',flexible:'Flexible' };
const SL_FINANCING_LABELS= { cash:'Cash', loan:'Bank Loan', both:'Both' };
const INTEREST_COLORS_SL = {
  hot:  { bg:'#FEE2E2', text:'#B91C1C' },
  warm: { bg:'#FEF3C7', text:'#92400E' },
  cold: { bg:'#DBEAFE', text:'#1E40AF' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const MyLeads = () => {
  const { user }  = useAuth();
  const userId    = user?.uid || user?.id;
  const { leads, leadsLoading, updateLead, addCallLog, calls } = useMyLeads(userId);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState(() => {
    if (location.state?.tab && TABS.map(t=>t.id).includes(location.state.tab)) return location.state.tab;
    const saved = sessionStorage.getItem(TAB_KEY);
    return TABS.map(t=>t.id).includes(saved) ? saved : 'new';
  });
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('urgency');
  const [dateFilter, setDateFilter] = useState('');
  const [quickLead, setQuickLead]   = useState(null);
  const [outcome, setOutcome]       = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [followDate, setFollowDate] = useState('');
  const [quickNote, setQuickNote]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [copiedId, setCopiedId]     = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const [submittedLeads, setSubmittedLeads]   = useState([]);
  const [submittedLoading, setSubmittedLoading] = useState(false);
  const [submittedExpandedId, setSubmittedExpandedId] = useState(null);

  useEffect(() => { sessionStorage.setItem(TAB_KEY, tab); }, [tab]);
  useEffect(() => {
    if (tab !== 'submitted') return;
    setSubmittedLoading(true);
    getEmployeeLeads(userId)
      .then(d => setSubmittedLeads(d || []))
      .catch(() => toast({ title:'Error', description:'Failed to load submitted leads.', variant:'destructive' }))
      .finally(() => setSubmittedLoading(false));
  }, [tab, userId]);

  const copyPhone = useCallback((phone, id) => {
    navigator.clipboard?.writeText(phone).then(() => { setCopiedId(id); setTimeout(()=>setCopiedId(null),1500); });
  }, []);
  const callPhone = useCallback((phone, lead) => {
    if (!phone) return;
    const raw = phone.replace(/\D/g,'');
    window.location.href = `tel:${raw.length===10?`+91${raw}`:`+${raw}`}`;
    setTimeout(() => { setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote(''); }, 600);
  }, []);
  const openQuickLog = useCallback((lead) => {
    setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
  }, []);

  const myCallsMap = useMemo(() => {
    if (!calls?.length) return new Map();
    const map = new Map();
    for (const c of calls) { const b=map.get(c.leadId); if(!b)map.set(c.leadId,[c]); else b.push(c); }
    map.forEach(b=>b.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    return map;
  }, [calls]);

  const myLeads = useMemo(() => {
    return leads
      .map(l => ({ ...l, _callCount:(myCallsMap.get(l.id)||[]).length, _lastCall:myCallsMap.get(l.id)?.[0] }))
      .sort((a,b) => {
        if (sortBy==='name')   return (a.name||'').localeCompare(b.name||'');
        if (sortBy==='recent') return new Date(b.updatedAt||0)-new Date(a.updatedAt||0);
        return urgencyScore(b)-urgencyScore(a);
      });
  }, [leads, myCallsMap, sortBy]);

  const scheduleCounts = useMemo(() => {
    let overdue=0, yesterday=0, today=0, tomorrow=0;
    myLeads.forEach(l => {
      if (TERMINAL.includes(l.status)) return;
      const d = parseLocalDate(l.follow_up_date||l.followUpDate);
      if (!d) return;
      if (isYesterday(d)) yesterday++;
      else if (isPast(d)&&!isToday(d)) overdue++;
      else if (isToday(d)) today++;
      else if (isTomorrow(d)) tomorrow++;
    });
    return { overdue, yesterday, today, tomorrow };
  }, [myLeads]);

  const filtered = useMemo(() => {
    let arr = myLeads;
    if      (tab==='overdue')   arr=arr.filter(l=>{ if(TERMINAL.includes(l.status))return false; const d=parseLocalDate(l.follow_up_date||l.followUpDate); return d&&isPast(d)&&!isToday(d)&&!isYesterday(d); });
    else if (tab==='yesterday') arr=arr.filter(l=>{ if(TERMINAL.includes(l.status))return false; const d=parseLocalDate(l.follow_up_date||l.followUpDate); return d&&isYesterday(d); });
    else if (tab==='today')     arr=arr.filter(l=>{ if(TERMINAL.includes(l.status))return false; const d=parseLocalDate(l.follow_up_date||l.followUpDate); return d&&isToday(d); });
    else if (tab==='tomorrow')  arr=arr.filter(l=>{ if(TERMINAL.includes(l.status))return false; const d=parseLocalDate(l.follow_up_date||l.followUpDate); return d&&isTomorrow(d); });
    else if (tab==='followup')  arr=arr.filter(l=>l.status==='FollowUp'||l.status==='CallBackLater');
    else if (tab==='new')       {
      // "New" tab includes genuinely new leads (status New/Open/empty) AND any
      // lead freshly assigned to this telecaller within the last 48h —
      // even if the lead's STATUS is carried over (NotInterested, FollowUp,
      // etc.) from a previous owner via admin reassignment. Admin reassigns
      // because they want this person to try again; the receiving telecaller
      // shouldn't have to dig through the "All" tab to find their newly-
      // handed leads. Matches the 48h freshBonus window from PR #109.
      const FRESH_HOURS = 48;
      const now = Date.now();
      // Only Booked/Lost are truly terminal for the "New" tab. NotInterested is
      // explicitly NOT excluded here: admin reassigns NotInterested leads so a
      // fresh telecaller can retry — those must surface in New, not All.
      const NEW_TAB_TERMINAL = ['Lost','Booked'];
      arr = arr.filter(l => {
        const assignedT = new Date(l.assignedAt || l.assigned_at || 0).getTime();
        // Once the telecaller has touched the lead AFTER (re)assignment,
        // it's no longer "new" to them — drop it. Two signals, either
        // suffices:
        //   1. lastActivity (bumped by updateLead on Quick Log save —
        //      bulletproof since it's set locally in the same tick)
        //   2. _lastCall.timestamp (from the calls table; survives a
        //      page reload, which lastActivity won't if state is reset)
        if (assignedT) {
          const lastActivityT = new Date(l.lastActivity || l.updatedAt || 0).getTime();
          if (lastActivityT > assignedT) return false;
          if (l._lastCall) {
            const lastCallT = new Date(l._lastCall.timestamp || 0).getTime();
            if (lastCallT >= assignedT) return false;
          }
        }
        if (l.status === 'New' || l.status === 'Open' || !l.status) return true;
        if (NEW_TAB_TERMINAL.includes(l.status)) return false;
        if (!assignedT) return false;
        const hoursSinceAssigned = (now - assignedT) / (1000 * 60 * 60);
        return hoursSinceAssigned >= 0 && hoursSinceAssigned <= FRESH_HOURS;
      });
      arr = [...arr].sort((a,b) => new Date(b.assignedAt||b.createdAt||0) - new Date(a.assignedAt||a.createdAt||0));
    }
    else if (tab==='booked')    arr=arr.filter(l=>l.status==='Booked');
    if (search.trim()) { const q=search.toLowerCase(); arr=arr.filter(l=>l.name?.toLowerCase().includes(q)||l.phone?.includes(q)||l.project?.toLowerCase().includes(q)); }
    if (dateFilter) arr=arr.filter(l=>{ const fu=l.follow_up_date||l.followUpDate; const cr=(l.createdAt||'').split('T')[0]; const as=(l.assignedAt||'').split('T')[0]; return fu===dateFilter||cr===dateFilter||as===dateFilter; });
    return arr;
  }, [myLeads, tab, search, dateFilter]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [tab, search, dateFilter, sortBy]);
  useEffect(() => {
    const el=sentinelRef.current; if(!el) return;
    const obs=new IntersectionObserver(entries=>{ if(entries[0].isIntersecting&&visibleCount<filtered.length) setVisibleCount(p=>Math.min(p+PAGE_SIZE,filtered.length)); },{rootMargin:'200px'});
    obs.observe(el); return ()=>obs.disconnect();
  }, [visibleCount, filtered.length]);

  const visibleLeads = useMemo(() => filtered.slice(0,visibleCount), [filtered, visibleCount]);
  const hasMore      = visibleCount < filtered.length;
  const urgentCount  = scheduleCounts.overdue + scheduleCounts.today;

  const handleQuickSave = async () => {
    if (!outcome) { toast({ title:'Select outcome first', variant:'destructive' }); return; }
    setSaving(true);
    try {
      await addCallLog({ leadId:quickLead.id, leadName:quickLead.name, projectName:quickLead.project||'', employeeId:userId, employeeName:user?.name||'', type:'Outgoing', status:outcome, duration:0, notes:quickNote||`Quick log: ${outcome}` });
      const patch = { last_activity:new Date().toISOString() };
      if (newStatus) patch.status=newStatus;
      if (TERMINAL.includes(newStatus)) { patch.follow_up_date=null; patch.followUpDate=null; }
      else if (followDate) { patch.follow_up_date=followDate; patch.followUpDate=followDate; patch.next_followup_date=followDate; patch.follow_up_status='pending'; }
      await updateLead(quickLead.id, patch);
      toast({ title:'Logged! ✓', description:newStatus?`Status → ${newStatus}`:'Call saved' });
      setQuickLead(null); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
    } catch(e) { toast({ title:'Error', description:e.message, variant:'destructive' }); }
    setSaving(false);
  };

  if (leadsLoading) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:12 }}>
      <Loader2 style={{ width:40,height:40,color:'#0F2744',animation:'spin 1s linear infinite' }} />
      <p style={{ fontSize:14,color:'#6B7280' }}>Loading your leads…</p>
    </div>
  );

  // ─── STYLES ────────────────────────────────────────────────────────────
  const S = {
    // PAGE — key fix: width 100%, maxWidth 100%, overflowX hidden stops everything from bleeding
    page: {
      width:'100%', maxWidth:'100%', overflowX:'hidden',
      minHeight:'100vh', background:'#F1F5F9',
      paddingBottom:'calc(7rem + env(safe-area-inset-bottom))',
      fontFamily:"'Inter',-apple-system,sans-serif",
      boxSizing:'border-box',
    },
    // HEADER
    header: {
      width:'100%', maxWidth:'100%', boxSizing:'border-box',
      background:'linear-gradient(135deg,#0F2744 0%,#1a3d6e 100%)',
      position:'sticky', top:0, zIndex:20,
      boxShadow:'0 4px 20px rgba(15,39,68,0.35)',
    },
    headerInner: { width:'100%', boxSizing:'border-box', padding:'14px 16px 0' },
    headerTop: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:8, minWidth:0 },
    title: { fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' },
    subtitle: { fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:1 },
    // right side of header — never grow beyond screen
    headerRight: { display:'flex', alignItems:'center', gap:6, flexShrink:0 },
    urgentBadge: { display:'flex',alignItems:'center',gap:4,background:'#EF4444',color:'#fff',fontSize:11,fontWeight:700,padding:'5px 10px',borderRadius:999,whiteSpace:'nowrap' },
    sortBtn: { display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.9)',fontSize:11,fontWeight:600,padding:'6px 10px',borderRadius:999,border:'none',cursor:'pointer',whiteSpace:'nowrap' },
    // SEARCH ROW — full width, no overflow
    searchRow: { display:'flex', gap:8, marginBottom:0, width:'100%', boxSizing:'border-box' },
    searchWrap: { position:'relative', flex:1, minWidth:0 },
    searchInput: { width:'100%', boxSizing:'border-box', paddingLeft:36, paddingRight:32, paddingTop:10, paddingBottom:10, fontSize:13, background:'rgba(255,255,255,0.13)', color:'#fff', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.15)', outline:'none' },
    searchIcon: { position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.5)',width:15,height:15,flexShrink:0 },
    // TABS
    tabsRow: { display:'flex', gap:6, overflowX:'auto', paddingBottom:12, marginTop:10, scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
    tabActive:   { flexShrink:0, padding:'7px 14px', borderRadius:999, fontSize:11, fontWeight:700, background:'#F59E0B', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(245,158,11,0.4)', whiteSpace:'nowrap' },
    tabInactive: { flexShrink:0, padding:'7px 14px', borderRadius:999, fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.75)', border:'none', cursor:'pointer', whiteSpace:'nowrap' },
    // BANNER
    bannerGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'12px 12px 4px', width:'100%', boxSizing:'border-box' },
    bannerCard: (bg,border) => ({ background:bg, border:`1.5px solid ${border}`, borderRadius:14, padding:'10px 10px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', minWidth:0, overflow:'hidden' }),
    bannerTextBox: { minWidth:0, overflow:'hidden' },
    bannerTitle: (color) => ({ fontSize:12, fontWeight:800, color, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }),
    bannerSub:   (color) => ({ fontSize:10, color, opacity:0.75, marginTop:1 }),
    // CARD — overflow:hidden clips everything inside
    card: (urgency) => ({
      width:'100%', boxSizing:'border-box',
      background:'#fff', borderRadius:16, marginBottom:8, overflow:'hidden',
      boxShadow: urgency==='overdue'?'0 0 0 2px #EF4444,0 4px 12px rgba(239,68,68,0.12)'
               : urgency==='today'  ?'0 0 0 2px #F59E0B,0 4px 12px rgba(245,158,11,0.12)'
               : urgency==='booked' ?'0 0 0 2px #10B981,0 4px 12px rgba(16,185,129,0.12)'
               : '0 1px 4px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.04)',
    }),
    // inner flex wrapper — MUST have minWidth:0 on children to stop flex blowout
    cardFlex: { display:'flex', width:'100%', overflow:'hidden' },
    cardLeft: (urgency) => ({
      width:4, flexShrink:0,
      background: urgency==='overdue'?'#EF4444': urgency==='today'?'#F59E0B': urgency==='booked'?'#10B981':'#E2E8F0',
      alignSelf:'stretch',
    }),
    // card right column — MUST have minWidth:0 to allow text truncation
    cardRight: { flex:1, minWidth:0, overflow:'hidden' },
    cardBody: { padding:'12px 12px 0 12px' },
    // avatar — fixed size, never shrinks
    avatar: (name) => ({ width:38, height:38, borderRadius:10, flexShrink:0, background:avatarColor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }),
    // info column — must have minWidth:0 to truncate children
    infoCol: { flex:1, minWidth:0, overflow:'hidden' },
    leadName: { fontSize:15, fontWeight:800, color:'#0F172A', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    project:  { fontSize:11, color:'#64748B', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    badge: (s) => { const c=STATUS_BADGE[s]||{bg:'#F1F5F9',text:'#475569',label:s}; return { display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.text,lineHeight:'16px',flexShrink:0 }; },
    badgeLabel: (s) => STATUS_BADGE[s]?.label || s,
    phone: { fontSize:12, color:'#334155', fontFamily:'monospace', fontWeight:600, flexShrink:0 },
    fuChip: (urgency) => ({ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:6,flexShrink:0, background:urgency==='overdue'?'#FEE2E2':urgency==='today'?'#FEF3C7':'#F8FAFC', color:urgency==='overdue'?'#DC2626':urgency==='today'?'#B45309':'#64748B' }),
    callBadge: { display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,background:'#EFF6FF',color:'#1D4ED8',padding:'2px 7px',borderRadius:999,flexShrink:0 },
    // note — single line, truncated
    note: { fontSize:11, color:'#94A3B8', marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' },
    // meta row — flex-wrap so chips never overflow
    metaRow: { display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' },
    badgeRow: { display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginTop:2 },
    // ACTION ROW
    actionRow: { display:'flex', gap:8, padding:'10px 12px 12px', width:'100%', boxSizing:'border-box' },
    btnCall: { flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px 0', background:'#16A34A', color:'#fff', borderRadius:12, fontSize:13, fontWeight:800, border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(22,163,74,0.3)' },
    btnLog:  { flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px 0', background:'#F8FAFC', color:'#334155', borderRadius:12, fontSize:13, fontWeight:700, border:'1.5px solid #E2E8F0', cursor:'pointer' },
    btnCopy: { width:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'11px 0', background:'#F8FAFC', color:'#64748B', borderRadius:12, border:'1.5px solid #E2E8F0', cursor:'pointer' },
    // QUICK LOG SHEET
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:50, display:'flex', alignItems:'flex-end', backdropFilter:'blur(4px)' },
    sheet: { width:'100%', maxWidth:'100%', background:'#0F172A', borderRadius:'24px 24px 0 0', paddingTop:16, paddingBottom:'max(20px,env(safe-area-inset-bottom))', boxShadow:'0 -8px 40px rgba(0,0,0,0.4)', maxHeight:'92vh', overflowY:'auto', overflowX:'hidden', boxSizing:'border-box' },
    sheetHandle: { width:40, height:4, background:'rgba(255,255,255,0.2)', borderRadius:999, margin:'0 auto 16px' },
    sheetHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'0 16px', marginBottom:16, gap:8 },
    sheetTitleBox: { flex:1, minWidth:0 },
    sheetTitle: { fontSize:16, fontWeight:800, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    sheetSub:   { fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 },
    sheetClose: { width:36, height:36, flexShrink:0, borderRadius:999, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' },
    sheetLabel: { fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', padding:'0 16px', marginBottom:8 },
    sheetGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'0 16px', marginBottom:16 },
    outcomeBtn: (active,color) => ({ padding:'13px 0', borderRadius:12, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:active?color:'rgba(255,255,255,0.07)', color:active?'#fff':'rgba(255,255,255,0.6)', border:active?'none':'1.5px solid rgba(255,255,255,0.1)', cursor:'pointer', transform:active?'scale(1.03)':'scale(1)', transition:'all 0.15s' }),
    sheetInput:    { width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(255,255,255,0.07)', color:'#fff', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.12)', fontSize:13, outline:'none' },
    sheetTextarea: { width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(255,255,255,0.07)', color:'#fff', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.12)', fontSize:13, outline:'none', resize:'none' },
    saveBtn: (sv) => ({ width:'100%', padding:'15px 0', background:sv?'#374151':'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff', borderRadius:14, fontSize:15, fontWeight:900, border:'none', cursor:sv?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 16px rgba(245,158,11,0.4)' }),
    empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 24px', textAlign:'center' },
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>

      {/* ═══════ HEADER ═══════ */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={S.headerTop}>
            <div style={{ minWidth:0 }}>
              <div style={S.title}>My Leads</div>
              <div style={S.subtitle}>{myLeads.length} leads assigned to you</div>
            </div>
            <div style={S.headerRight}>
              {urgentCount > 0 && (
                <div style={S.urgentBadge}>
                  <AlertCircle style={{width:12,height:12,flexShrink:0}} />{urgentCount} urgent
                </div>
              )}
              <button style={S.sortBtn} onClick={()=>setSortBy(s=>s==='urgency'?'name':s==='name'?'recent':'urgency')}>
                <ArrowUpDown style={{width:12,height:12,flexShrink:0}} />
                {sortBy==='urgency'?'Priority':sortBy==='name'?'A-Z':'Recent'}
              </button>
            </div>
          </div>

          {tab !== 'submitted' && (
            <div style={S.searchRow}>
              <div style={S.searchWrap}>
                <Search style={S.searchIcon} />
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search name, phone, project…" style={S.searchInput} />
                {search && (
                  <button onClick={()=>setSearch('')} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',padding:0,lineHeight:0 }}>
                    <X style={{width:14,height:14}} />
                  </button>
                )}
              </div>
              <div style={{ position:'relative', flexShrink:0 }}>
                <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
                  style={{ width:44, height:44, borderRadius:12, border:dateFilter?'2px solid #F59E0B':'1.5px solid rgba(255,255,255,0.15)', background:dateFilter?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.1)', color:'transparent', cursor:'pointer', outline:'none', boxSizing:'border-box' }} />
                <Filter style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',width:15,height:15,color:dateFilter?'#F59E0B':'rgba(255,255,255,0.5)',pointerEvents:'none' }} />
              </div>
            </div>
          )}

          <div style={S.tabsRow}>
            {TABS.map(t => {
              let badge='';
              if (t.id==='overdue'   && scheduleCounts.overdue>0)   badge=` ●${scheduleCounts.overdue}`;
              if (t.id==='yesterday' && scheduleCounts.yesterday>0)  badge=` ●${scheduleCounts.yesterday}`;
              if (t.id==='today'     && scheduleCounts.today>0)      badge=` ●${scheduleCounts.today}`;
              if (t.id==='tomorrow'  && scheduleCounts.tomorrow>0)   badge=` ●${scheduleCounts.tomorrow}`;
              if (t.id==='all')      badge=` (${myLeads.length})`;
              if (t.id==='submitted' && submittedLeads.length>0) badge=` (${submittedLeads.length})`;
              return <button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id?S.tabActive:S.tabInactive}>{t.label}{badge}</button>;
            })}
          </div>
        </div>
      </div>

      {/* ═══════ SUBMITTED TAB ═══════ */}
      {tab === 'submitted' ? (
        <div style={{ padding:'16px 12px 80px', width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { label:'Total',      value:submittedLeads.length, bg:'#ECFDF5', accent:'#10B981', text:'#065F46' },
              { label:'This Month', value:submittedLeads.filter(l=>{ const d=new Date(l.created_at),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length, bg:'#EFF6FF', accent:'#3B82F6', text:'#1D4ED8' },
              { label:'Pending',    value:submittedLeads.filter(l=>!l.admin_status||l.admin_status==='pending').length, bg:'#FFFBEB', accent:'#F59E0B', text:'#92400E' },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'12px 8px', borderBottom:`3px solid ${s.accent}`, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:s.text, opacity:0.7, textTransform:'uppercase' }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color:s.text, marginTop:2 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>navigate('/crm/sales/add-lead')}
            style={{ width:'100%', boxSizing:'border-box', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 0', background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff', borderRadius:14, fontSize:14, fontWeight:800, border:'none', cursor:'pointer', marginBottom:16, boxShadow:'0 4px 12px rgba(16,185,129,0.3)' }}>
            <Plus style={{width:18,height:18}} /> Add New Submitted Lead
          </button>
          {submittedLoading ? (
            <div style={S.empty}><Loader2 style={{width:32,height:32,color:'#94A3B8',animation:'spin 1s linear infinite'}}/><p style={{color:'#94A3B8',marginTop:8}}>Loading…</p></div>
          ) : submittedLeads.length===0 ? (
            <div style={S.empty}>
              <AlertCircle style={{width:48,height:48,color:'#CBD5E1',marginBottom:12}}/>
              <p style={{fontSize:16,fontWeight:700,color:'#334155'}}>No leads submitted yet</p>
              <button onClick={()=>navigate('/crm/sales/add-lead')} style={{ marginTop:16, display:'inline-flex', alignItems:'center', gap:8, padding:'12px 20px', background:'#10B981', color:'#fff', borderRadius:12, fontSize:14, fontWeight:700, border:'none', cursor:'pointer' }}>
                <Plus style={{width:16,height:16}}/> Submit First Lead
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {submittedLeads.map(lead => {
                const isExp=submittedExpandedId===lead.id;
                const st=lead.admin_status||'pending';
                const stStyle=SL_STATUS_STYLES[st]||SL_STATUS_STYLES.pending;
                const intC=INTEREST_COLORS_SL[lead.interest_level];
                return (
                  <div key={lead.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', width:'100%', boxSizing:'border-box' }}>
                    <div style={{ padding:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer', gap:8 }}
                        onClick={()=>setSubmittedExpandedId(isExp?null:lead.id)}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <span style={{ fontSize:15, fontWeight:800, color:'#0F172A' }}>{lead.customer_name}</span>
                            {intC && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:intC.bg, color:intC.text }}>{(lead.interest_level||'').toUpperCase()}</span>}
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:stStyle.bg, color:stStyle.text, border:`1px solid ${stStyle.border}` }}>{SL_STATUS_LABELS[st]||st}</span>
                          </div>
                          <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:3 }}>
                            {lead.phone && <span style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{formatPhone(lead.phone)}</span>}
                            {lead.project_interested && <span style={{ fontSize:12, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🏢 {lead.project_interested}</span>}
                            {lead.budget_range && <span style={{ fontSize:12, color:'#64748B' }}>💰 {lead.budget_range}</span>}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                          <span style={{ fontSize:10, color:'#94A3B8' }}>{new Date(lead.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</span>
                          {isExp ? <ChevronUp style={{width:16,height:16,color:'#94A3B8'}}/> : <ChevronDown style={{width:16,height:16,color:'#94A3B8'}}/>}
                        </div>
                      </div>
                      {isExp && (
                        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'#475569' }}>
                          {lead.email             && <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><b>Email:</b> {lead.email}</span>}
                          {lead.alternate_phone   && <span><b>Alt:</b> {lead.alternate_phone}</span>}
                          {lead.occupation        && <span><b>Job:</b> {lead.occupation}</span>}
                          {lead.city              && <span><b>City:</b> {lead.city}{lead.locality?`, ${lead.locality}`:''}</span>}
                          {lead.property_type     && <span><b>Type:</b> {SL_PROPERTY_LABELS[lead.property_type]||lead.property_type}</span>}
                          {lead.purpose           && <span><b>Purpose:</b> {SL_PURPOSE_LABELS[lead.purpose]||lead.purpose}</span>}
                          {lead.possession_timeline && <span><b>Timeline:</b> {SL_TIMELINE_LABELS[lead.possession_timeline]||lead.possession_timeline}</span>}
                          {lead.financing         && <span><b>Finance:</b> {SL_FINANCING_LABELS[lead.financing]||lead.financing}</span>}
                          {lead.how_they_know     && <span style={{gridColumn:'1/-1'}}><b>Source:</b> {lead.how_they_know}</span>}
                          {lead.customer_remarks  && <div style={{gridColumn:'1/-1',padding:'8px 10px',background:'#F8FAFC',borderRadius:8,fontSize:11}}><b>Customer:</b> {lead.customer_remarks}</div>}
                          {lead.employee_remarks  && <div style={{gridColumn:'1/-1',padding:'8px 10px',background:'#EFF6FF',borderRadius:8,fontSize:11}}><b>Your notes:</b> {lead.employee_remarks}</div>}
                          {lead.admin_remarks     && <div style={{gridColumn:'1/-1',padding:'8px 10px',background:'#ECFDF5',borderRadius:8,fontSize:11}}><b>Admin:</b> {lead.admin_remarks}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (
        /* ═══════ MAIN LEADS LIST ═══════ */
        <div style={{ padding:'8px 12px 80px', width:'100%', boxSizing:'border-box' }}>

          {tab==='all' && (scheduleCounts.overdue>0||scheduleCounts.yesterday>0||scheduleCounts.today>0||scheduleCounts.tomorrow>0) && (
            <div style={S.bannerGrid}>
              {scheduleCounts.overdue>0 && (
                <button onClick={()=>setTab('overdue')} style={S.bannerCard('#FFF1F2','#FECDD3')}>
                  <span style={{fontSize:20,flexShrink:0}}>🚨</span>
                  <div style={S.bannerTextBox}><div style={S.bannerTitle('#BE123C')}>{scheduleCounts.overdue} Overdue</div><div style={S.bannerSub('#BE123C')}>Call now!</div></div>
                </button>
              )}
              {scheduleCounts.today>0 && (
                <button onClick={()=>setTab('today')} style={S.bannerCard('#FFFBEB','#FDE68A')}>
                  <span style={{fontSize:20,flexShrink:0}}>⏰</span>
                  <div style={S.bannerTextBox}><div style={S.bannerTitle('#92400E')}>{scheduleCounts.today} Today</div><div style={S.bannerSub('#92400E')}>Follow up now</div></div>
                </button>
              )}
              {scheduleCounts.yesterday>0 && (
                <button onClick={()=>setTab('yesterday')} style={S.bannerCard('#FFF7ED','#FED7AA')}>
                  <span style={{fontSize:20,flexShrink:0}}>⏪</span>
                  <div style={S.bannerTextBox}><div style={S.bannerTitle('#9A3412')}>{scheduleCounts.yesterday} Yesterday</div><div style={S.bannerSub('#9A3412')}>Missed</div></div>
                </button>
              )}
              {scheduleCounts.tomorrow>0 && (
                <button onClick={()=>setTab('tomorrow')} style={S.bannerCard('#EFF6FF','#BFDBFE')}>
                  <span style={{fontSize:20,flexShrink:0}}>🌅</span>
                  <div style={S.bannerTextBox}><div style={S.bannerTitle('#1E40AF')}>{scheduleCounts.tomorrow} Tomorrow</div><div style={S.bannerSub('#1E40AF')}>Plan ahead</div></div>
                </button>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <p style={{ fontSize:11, color:'#94A3B8', padding:'8px 4px 4px', fontWeight:500 }}>
              Showing {Math.min(visibleCount,filtered.length)} of {filtered.length}
            </p>
          )}

          {visibleLeads.length===0 ? (
            <div style={S.empty}>
              <AlertCircle style={{width:44,height:44,color:'#CBD5E1',marginBottom:12}}/>
              <p style={{fontSize:15,fontWeight:700,color:'#334155'}}>No leads found</p>
              <p style={{fontSize:12,color:'#94A3B8',marginTop:4}}>{search?'Try a different search':'Switch to another tab'}</p>
            </div>
          ) : (
            <div style={{ width:'100%' }}>
              {visibleLeads.map(lead => {
                const fu    = lead.follow_up_date||lead.followUpDate;
                const fuDate= fu?parseLocalDate(fu):null;
                const isOD  = fuDate&&isPast(fuDate)&&!isToday(fuDate);
                const isTD  = fuDate&&isToday(fuDate);
                const isBK  = lead.status==='Booked';
                const urgency = isOD?'overdue':isTD?'today':isBK?'booked':'normal';
                const note  = getLatestNote(lead.notes);
                const ago   = timeAgo(lead.assignedAt||lead.assigned_at);

                return (
                  <div key={lead.id} style={S.card(urgency)}>
                    {/* KEY FIX: cardFlex has overflow:hidden, children have minWidth:0 */}
                    <div style={S.cardFlex}>
                      <div style={S.cardLeft(urgency)} />
                      <div style={S.cardRight}>
                        {/* Tap card body → detail page */}
                        <div style={S.cardBody} onClick={()=>navigate(`/crm/sales/lead/${lead.id}`, { state: { lead } })}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:10, overflow:'hidden' }}>
                            <div style={S.avatar(lead.name)}>{initials(lead.name)}</div>
                            {/* info col — minWidth:0 allows truncation */}
                            <div style={S.infoCol}>
                              <div style={S.badgeRow}>
                                <span style={S.leadName}>{lead.name||'Unknown'}</span>
                                {lead.status && <span style={S.badge(lead.status)}>{S.badgeLabel(lead.status)}</span>}
                                {isOD && <span style={{ fontSize:10,fontWeight:800,color:'#DC2626',background:'#FEF2F2',padding:'2px 6px',borderRadius:999,flexShrink:0 }}>🚨 OD</span>}
                                {isTD&&!isOD && <span style={{ fontSize:10,fontWeight:800,color:'#D97706',background:'#FFFBEB',padding:'2px 6px',borderRadius:999,flexShrink:0 }}>⏰</span>}
                              </div>
                              {lead.project && <div style={S.project}>🏢 {lead.project}</div>}
                              {(lead.budget || lead.budget_range) && (
                                <div style={{ fontSize:11, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:2 }}>
                                  💰 {typeof (lead.budget || lead.budget_range) === 'number'
                                    ? `₹${Number(lead.budget || lead.budget_range).toLocaleString('en-IN')}`
                                    : (lead.budget || lead.budget_range)}
                                </div>
                              )}
                              <div style={S.metaRow}>
                                {lead.phone && <span style={S.phone}>{formatPhone(lead.phone)}</span>}
                                {fuDate && <span style={S.fuChip(urgency)}>📅 {format(fuDate,'dd MMM')}</span>}
                                {lead._callCount>0 && <span style={S.callBadge}><Phone style={{width:9,height:9}}/> {lead._callCount}</span>}
                                {ago && <span style={{ fontSize:10,color:'#94A3B8',flexShrink:0 }}>{ago}</span>}
                              </div>
                              {note && <div style={S.note}>📝 {note}</div>}
                            </div>
                            <ChevronRight style={{ width:16,height:16,color:'#CBD5E1',flexShrink:0,marginTop:4 }}/>
                          </div>
                        </div>
                        {/* Action row */}
                        <div style={S.actionRow}>
                          <button style={S.btnCall} onClick={e=>{e.stopPropagation();callPhone(lead.phone,lead);}}>
                            <Phone style={{width:14,height:14,flexShrink:0}}/> Call
                          </button>
                          <button style={S.btnLog} onClick={e=>{e.stopPropagation();openQuickLog(lead);}}>
                            <MessageSquare style={{width:14,height:14,flexShrink:0}}/> Log
                          </button>
                          <button style={S.btnCopy} onClick={e=>{e.stopPropagation();copyPhone(lead.phone,lead.id);}}>
                            {copiedId===lead.id
                              ? <CheckCircle style={{width:15,height:15,color:'#10B981'}}/>
                              : <Copy style={{width:15,height:15}}/>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={sentinelRef} style={{ height:8 }}/>
          {hasMore && (
            <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
              <p style={{ fontSize:11,color:'#94A3B8',marginBottom:8 }}>{Math.min(visibleCount,filtered.length)} of {filtered.length} shown</p>
              <button onClick={()=>setVisibleCount(p=>Math.min(p+PAGE_SIZE,filtered.length))}
                style={{ padding:'10px 24px',background:'#0F2744',color:'#fff',borderRadius:999,fontSize:12,fontWeight:700,border:'none',cursor:'pointer' }}>
                Load {Math.min(PAGE_SIZE,filtered.length-visibleCount)} more
              </button>
            </div>
          )}
          {!hasMore && filtered.length>PAGE_SIZE && (
            <p style={{ textAlign:'center',fontSize:11,color:'#CBD5E1',padding:'12px 0' }}>✓ All {filtered.length} leads shown</p>
          )}
        </div>
      )}

      {/* ═══════ QUICK LOG SHEET ═══════ */}
      {quickLead && (
        <div style={S.overlay} onClick={()=>setQuickLead(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetHandle}/>
            <div style={S.sheetHeader}>
              <div style={S.sheetTitleBox}>
                <div style={S.sheetTitle}>{quickLead.name}</div>
                <div style={S.sheetSub}>{quickLead.project||'No project'} • {formatPhone(quickLead.phone)}</div>
              </div>
              <button style={S.sheetClose} onClick={()=>setQuickLead(null)}>
                <X style={{width:18,height:18,color:'rgba(255,255,255,0.7)'}}/>
              </button>
            </div>
            <div style={S.sheetLabel}>Call Outcome *</div>
            <div style={S.sheetGrid}>
              {QUICK_OUTCOMES.map(o => (
                <button key={o.id} onClick={()=>setOutcome(o.id)} style={S.outcomeBtn(outcome===o.id,o.bg)}>
                  <span style={{fontSize:16}}>{o.emoji}</span> {o.label}
                </button>
              ))}
            </div>
            <div style={S.sheetLabel}>Update Status</div>
            <div style={S.sheetGrid}>
              {QUICK_STATUSES.map(s => (
                <button key={s.id} onClick={()=>setNewStatus(p=>p===s.id?'':s.id)} style={S.outcomeBtn(newStatus===s.id,s.bg)}>
                  <span style={{fontSize:16}}>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
            {newStatus && !TERMINAL.includes(newStatus) && (
              <>
                <div style={S.sheetLabel}>Next Follow-up Date</div>
                <div style={{ padding:'0 16px', marginBottom:16 }}>
                  <SmartDateInput value={followDate} onChange={setFollowDate} placeholder="Pick date" className="" style={S.sheetInput}/>
                </div>
              </>
            )}
            <div style={S.sheetLabel}>Quick Note</div>
            <div style={{ padding:'0 16px', marginBottom:20 }}>
              <textarea value={quickNote} onChange={e=>setQuickNote(e.target.value)}
                placeholder="Optional note…" rows={2} style={S.sheetTextarea}/>
            </div>
            <div style={{ padding:'0 16px', marginTop:4 }}>
              <button onClick={handleQuickSave} disabled={saving} style={S.saveBtn(saving)}>
                {saving ? <><Loader2 style={{width:18,height:18,animation:'spin 1s linear infinite'}}/> Saving…</> : <>✓ &nbsp;Save Call Log</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
