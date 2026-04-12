// src/context/CRMDataContext.jsx
// ✅ SINGLETON — one fetch, one state, shared across every page.
// ✅ ROLE-SCOPED QUERIES — sales employees only fetch their own data (fast!)
// ✅ STALE-WHILE-REVALIDATE — cached data shown immediately, refresh in background
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { addCall, getCalls, addSiteVisit, getSiteVisits, addBooking, getBookings } from '@/lib/crmSupabase';
import {
  sampleCustomers, sampleInvoices,
  samplePayments, sampleSettings, sampleWhatsAppTemplates
} from '@/crm/data/sampleData';

const CRMDataContext = createContext(null);

const STORAGE_KEYS = {
  CUSTOMERS:       'crm_customers',
  INVOICES:        'crm_invoices',
  PAYMENTS:        'crm_payments',
  SETTINGS:        'crm_settings',
  WA_TEMPLATES:    'crm_wa_templates',
  TASKS:           'crm_tasks',
  EOD_REPORTS:     'crm_eod_reports',
  PROMO_MATERIALS: 'crm_promo_materials',
  AUDIT_LOGS:      'crm_audit_logs',
};

// Cache keys for stale-while-revalidate (per user)
const cacheKey = (userId, type) => `crm_cache_${userId}_${type}`;

// Lean column list — no heavy text columns in list fetch
const LIST_COLUMNS = [
  'id','full_name','phone','email','source',
  'status','final_status','budget','interest_level',
  'project','next_followup_date','is_vip',
  'assigned_to','assigned_to_name','assigned_at',
  'prev_assigned_to','prev_assigned_to_name','prev_assigned_at',
  'created_at','updated_at','created_by',
  'token_amount','booking_amount','partial_payment',
  'payment_mode','unit_number',
  'call_attempt','call_status','site_visit_status',
].join(',');

const normalizeRow = (row) => ({
  id:                  row.id,
  name:                row.full_name          || '',
  phone:               row.phone              || '',
  email:               row.email              || '',
  source:              row.source             || 'Manual Import',
  status:              row.final_status       || row.status || 'FollowUp',
  budget:              row.budget             || '',
  interestLevel:       row.interest_level     || 'Cold',
  notes:               row.notes              || '',
  callAttempt:         row.call_attempt       || '',
  callStatus:          row.call_status        || '',
  siteVisitStatus:     row.site_visit_status  || '',
  finalStatus:         row.final_status       || 'FollowUp',
  assignedTo:          row.assigned_to        || null,
  assignedToName:      row.assigned_to_name   || null,
  createdBy:           row.created_by         || null,
  createdAt:           row.created_at,
  lastActivity:        row.updated_at,
  activityLog:         [],
  project:             row.project            || '',
  followUpDate:        row.next_followup_date || null,
  follow_up_date:      row.next_followup_date || null,
  tokenAmount:         row.token_amount       || 0,
  bookingAmount:       row.booking_amount     || 0,
  partialPayment:      row.partial_payment    || 0,
  paymentMode:         row.payment_mode       || 'Cash',
  unitNumber:          row.unit_number        || '',
  isVIP:               row.is_vip             || false,
  assignedAt:          row.assigned_at            || null,
  prevAssignedTo:      row.prev_assigned_to       || null,
  prevAssignedToName:  row.prev_assigned_to_name  || null,
  prevAssignedAt:      row.prev_assigned_at       || null,
});

const ADMIN_ROLES = ['admin', 'super_admin', 'manager', 'team_leader'];
const isAdminRole = (role) => ADMIN_ROLES.includes(role);

// Read stale cache synchronously (returns [] if missing/expired)
const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Cache expires after 5 minutes — after that we show loading instead
    if (Date.now() - ts > 5 * 60 * 1000) return null;
    return data;
  } catch { return null; }
};

const writeCache = (key, data) => {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
};

const useCRMDataInternal = ({ userId, role } = {}) => {
  const isAdmin = isAdminRole(role);

  // ── Stale cache seeds (synchronous — available before first render) ──────────
  const cachedLeads       = userId ? (readCache(cacheKey(userId, 'leads'))       || []) : [];
  const cachedCalls       = userId ? (readCache(cacheKey(userId, 'calls'))       || []) : [];
  const cachedVisits      = userId ? (readCache(cacheKey(userId, 'visits'))      || []) : [];
  const cachedBookings    = userId ? (readCache(cacheKey(userId, 'bookings'))    || []) : [];

  const hasLeadsCache   = cachedLeads.length   > 0;
  const hasCallsCache   = cachedCalls.length   > 0;
  const hasVisitsCache  = cachedVisits.length  > 0;
  const hasBookingCache = cachedBookings.length > 0;

  const [leads, setLeads]                         = useState(cachedLeads);
  const [leadsLoading, setLeadsLoading]           = useState(!hasLeadsCache);
  const [employees, setEmployees]                 = useState([]);
  const [employeesLoading, setEmployeesLoading]   = useState(true);
  const [calls, setCalls]                         = useState(cachedCalls);
  const [callsLoading, setCallsLoading]           = useState(!hasCallsCache);
  const [siteVisits, setSiteVisits]               = useState(cachedVisits);
  const [siteVisitsLoading, setSiteVisitsLoading] = useState(!hasVisitsCache);
  const [bookings, setBookings]                   = useState(cachedBookings);
  const [bookingsLoading, setBookingsLoading]     = useState(!hasBookingCache);
  const [workLogs, setWorkLogs]                   = useState([]);

  const [customers, setCustomers]           = useState([]);
  const [invoices, setInvoices]             = useState([]);
  const [payments, setPayments]             = useState([]);
  const [settings, setSettings]             = useState(sampleSettings);
  const [waTemplates, setWaTemplates]       = useState([]);
  const [promoMaterials, setPromoMaterials] = useState([]);
  const [tasks, setTasks]                   = useState([]);
  const [eodReports, setEodReports]         = useState([]);
  const [auditLogs, setAuditLogs]           = useState([]);

  const leadsReqId   = useRef(0);
  const tabWasHidden = useRef(false);
  const userIdRef    = useRef(userId);
  const roleRef      = useRef(role);

  // Keep refs up to date when props change
  useEffect(() => { userIdRef.current = userId; roleRef.current = role; }, [userId, role]);

  useEffect(() => {
    const get = (key, def) => { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : def; } catch { return def; } };
    setCustomers(get(STORAGE_KEYS.CUSTOMERS, sampleCustomers));
    setInvoices(get(STORAGE_KEYS.INVOICES, sampleInvoices));
    setPayments(get(STORAGE_KEYS.PAYMENTS, samplePayments));
    setSettings(get(STORAGE_KEYS.SETTINGS, sampleSettings));
    setWaTemplates(get(STORAGE_KEYS.WA_TEMPLATES, sampleWhatsAppTemplates));
    setPromoMaterials(get(STORAGE_KEYS.PROMO_MATERIALS, []));
    setTasks(get(STORAGE_KEYS.TASKS, []));
    setEodReports(get(STORAGE_KEYS.EOD_REPORTS, []));
    setAuditLogs(get(STORAGE_KEYS.AUDIT_LOGS, []));
  }, []);

  // ── Initial fetches — run only once userId is available ─────────────────────
  useEffect(() => {
    if (!userId) return; // wait for auth
    fetchLeads();
    fetchEmployees();
    fetchCalls();
    fetchSiteVisits();
    fetchBookings();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const leadsFilter = isAdmin
      ? undefined
      : `assigned_to=eq.${userId}`;

    const leadsChannel = supabaseAdmin
      .channel(`realtime:leads:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'leads',
        ...(leadsFilter ? { filter: leadsFilter } : {}),
      }, ({ new: row }) => {
        setLeads(prev => prev.some(l => l.id === row.id) ? prev : [normalizeRow(row), ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'leads',
        ...(leadsFilter ? { filter: leadsFilter } : {}),
      }, ({ new: row }) => {
        setLeads(prev => prev.map(l => l.id === row.id ? { ...normalizeRow(row), notes: l.notes } : l));
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'leads',
      }, ({ old: row }) => {
        setLeads(prev => prev.filter(l => l.id !== row.id));
      })
      .subscribe();

    const callsChannel = supabaseAdmin
      .channel(`realtime:calls:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'calls',
        ...(isAdmin ? {} : { filter: `employee_id=eq.${userId}` }),
      }, () => fetchCalls())
      .subscribe();

    const visitsChannel = supabaseAdmin
      .channel(`realtime:site_visits:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'site_visits',
        ...(isAdmin ? {} : { filter: `employee_id=eq.${userId}` }),
      }, () => fetchSiteVisits())
      .subscribe();

    const bookingsChannel = supabaseAdmin
      .channel(`realtime:bookings:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        ...(isAdmin ? {} : { filter: `employee_id=eq.${userId}` }),
      }, () => fetchBookings())
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabWasHidden.current = true;
      } else if (document.visibilityState === 'visible' && tabWasHidden.current) {
        tabWasHidden.current = false;
        fetchLeads();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabaseAdmin.removeChannel(leadsChannel);
      supabaseAdmin.removeChannel(callsChannel);
      supabaseAdmin.removeChannel(visitsChannel);
      supabaseAdmin.removeChannel(bookingsChannel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Work logs derived from calls/visits/bookings ────────────────────────────
  useEffect(() => {
    if (callsLoading || siteVisitsLoading || bookingsLoading) return;
    const logsMap = {};
    calls.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      const key  = `${c.employeeId}_${date}`;
      if (!logsMap[key]) logsMap[key] = { id: key, employeeId: c.employeeId, date, totalCalls: 0, connectedCalls: 0, siteVisits: 0, bookings: 0, conversionRate: 0 };
      logsMap[key].totalCalls += 1;
      if (['connected', 'interested'].includes(c.status)) logsMap[key].connectedCalls += 1;
    });
    siteVisits.forEach(sv => {
      const date = new Date(sv.timestamp).toISOString().split('T')[0];
      const key  = `${sv.employeeId}_${date}`;
      if (!logsMap[key]) logsMap[key] = { id: key, employeeId: sv.employeeId, date, totalCalls: 0, connectedCalls: 0, siteVisits: 0, bookings: 0, conversionRate: 0 };
      logsMap[key].siteVisits += 1;
    });
    bookings.forEach(b => {
      const date = new Date(b.timestamp).toISOString().split('T')[0];
      const key  = `${b.employeeId}_${date}`;
      if (!logsMap[key]) logsMap[key] = { id: key, employeeId: b.employeeId, date, totalCalls: 0, connectedCalls: 0, siteVisits: 0, bookings: 0, conversionRate: 0 };
      logsMap[key].bookings += 1;
    });
    Object.values(logsMap).forEach(log => {
      if (log.totalCalls > 0) log.conversionRate = Math.round((log.connectedCalls / log.totalCalls) * 100);
    });
    setWorkLogs(Object.values(logsMap).sort((a, b) => b.date.localeCompare(a.date)));
  }, [calls, siteVisits, bookings, callsLoading, siteVisitsLoading, bookingsLoading]);

  // ── FETCH LEADS ─────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    const thisReq = ++leadsReqId.current;
    const uid  = userIdRef.current;
    const rle  = roleRef.current;
    const admin = isAdminRole(rle);

    try {
      setLeadsLoading(true);
      const PAGE_SIZE = 500; // smaller pages = faster first paint
      let allData = [], from = 0, keepGoing = true;

      while (keepGoing) {
        let query = supabaseAdmin
          .from('leads')
          .select(LIST_COLUMNS)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        // 🔑 KEY OPTIMISATION: employees only fetch their own leads
        if (!admin && uid) query = query.eq('assigned_to', uid);

        const { data, error } = await query;

        if (error) {
          console.error('[Leads] Fetch error:', error.message);
          if (thisReq === leadsReqId.current) setLeads([]);
          return;
        }
        if (thisReq !== leadsReqId.current) return;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) keepGoing = false;
        else from += PAGE_SIZE;
      }

      if (thisReq !== leadsReqId.current) return;
      const normalized = allData.map(normalizeRow);
      setLeads(normalized);
      if (uid) writeCache(cacheKey(uid, 'leads'), normalized);
      console.log(`[Leads] req#${thisReq} — ${normalized.length} leads (${admin ? 'admin' : 'employee'})`);
    } catch (err) {
      console.error('[Leads] Unexpected error:', err);
      if (thisReq === leadsReqId.current) setLeads([]);
    } finally {
      if (thisReq === leadsReqId.current) setLeadsLoading(false);
    }
  }, []); // deps empty — reads from refs

  const addLead = async (lead) => {
    try {
      let budgetValue = lead.budget || '';
      if (budgetValue && typeof budgetValue !== 'string') budgetValue = String(budgetValue);
      const doc = {
        name: lead.name, full_name: lead.name, phone: lead.phone, email: lead.email || '',
        source: lead.source || 'Manual Import', status: 'Active',
        budget: budgetValue,
        interest_level: lead.interestLevel || lead.interest_level || 'Cold',
        notes: lead.notes || '', call_attempt: lead.callAttempt || '',
        call_status: lead.callStatus || '', site_visit_status: lead.siteVisitStatus || 'not_planned',
        final_status: lead.status || 'FollowUp',
        assigned_to: lead.assignedTo || null, assigned_to_name: lead.assignedToName || null,
        created_by: lead.createdBy || null, project: lead.project || null,
        next_followup_date: lead.followUpDate || null,
        assigned_at: lead.assignedTo ? new Date().toISOString() : null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabaseAdmin.from('leads').insert(doc).select().single();
      if (error) { console.error('[Leads] addLead error:', error.message); return null; }
      setLeads(prev => [normalizeRow(data), ...prev]);
      return data;
    } catch (err) { console.error('[Leads] addLead unexpected error:', err); return null; }
  };

  const updateLead = async (id, updates) => {
    try {
      const mapped = {};
      if (updates.name             !== undefined) mapped.full_name          = updates.name;
      if (updates.phone            !== undefined) mapped.phone              = updates.phone;
      if (updates.email            !== undefined) mapped.email              = updates.email;
      if (updates.source           !== undefined) mapped.source             = updates.source;
      if (updates.budget           !== undefined) mapped.budget = updates.budget && typeof updates.budget !== 'string' ? String(updates.budget) : updates.budget;
      if (updates.status           !== undefined) mapped.final_status       = updates.status;
      if (updates.interestLevel    !== undefined) mapped.interest_level     = updates.interestLevel;
      if (updates.notes            !== undefined) mapped.notes              = updates.notes;
      if (updates.callAttempt      !== undefined) mapped.call_attempt       = updates.callAttempt;
      if (updates.callStatus       !== undefined) mapped.call_status        = updates.callStatus;
      if (updates.siteVisitStatus  !== undefined) mapped.site_visit_status  = updates.siteVisitStatus;
      if (updates.project          !== undefined) mapped.project            = updates.project;
      if (updates.followUpDate     !== undefined) { mapped.next_followup_date = updates.followUpDate; mapped.follow_up_date = updates.followUpDate; }
      if (updates.follow_up_date   !== undefined) { mapped.next_followup_date = updates.follow_up_date; mapped.follow_up_date = updates.follow_up_date; }
      if (updates.follow_up_time   !== undefined) mapped.follow_up_time   = updates.follow_up_time;
      if (updates.follow_up_notes  !== undefined) mapped.follow_up_notes  = updates.follow_up_notes;
      if (updates.follow_up_status !== undefined) mapped.follow_up_status = updates.follow_up_status;
      if (updates.last_activity    !== undefined) mapped.updated_at         = updates.last_activity;
      if (updates.tokenAmount      !== undefined) mapped.token_amount       = updates.tokenAmount  || 0;
      if (updates.bookingAmount    !== undefined) mapped.booking_amount     = updates.bookingAmount || 0;
      if (updates.partialPayment   !== undefined) mapped.partial_payment    = updates.partialPayment || 0;
      if (updates.paymentMode      !== undefined) mapped.payment_mode       = updates.paymentMode   || 'Cash';
      if (updates.unitNumber       !== undefined) mapped.unit_number        = updates.unitNumber    || '';
      if (updates.isVIP            !== undefined) mapped.is_vip             = updates.isVIP;
      if (updates.prevAssignedTo       !== undefined) mapped.prev_assigned_to      = updates.prevAssignedTo;
      if (updates.prevAssignedToName   !== undefined) mapped.prev_assigned_to_name = updates.prevAssignedToName;
      if (updates.prevAssignedAt       !== undefined) mapped.prev_assigned_at      = updates.prevAssignedAt;
      if (updates.assignedTo !== undefined) {
        mapped.assigned_to = updates.assignedTo;
        mapped.assigned_at = updates.assignedTo ? (updates.assignedAt || new Date().toISOString()) : null;
      } else if (updates.assignedAt !== undefined) {
        mapped.assigned_at = updates.assignedAt;
      }
      if (updates.assignedToName !== undefined) mapped.assigned_to_name = updates.assignedToName;
      mapped.updated_at = new Date().toISOString();

      const { error } = await supabaseAdmin.from('leads').update(mapped).eq('id', id);
      if (error) { console.error('[Leads] updateLead error:', error.message); return; }

      const hasFollowUpUpdate = updates.follow_up_date !== undefined || updates.followUpDate !== undefined;
      const newFollowUp = hasFollowUpUpdate ? (updates.follow_up_date ?? updates.followUpDate ?? null) : undefined;
      setLeads(prev => prev.map(l => {
        if (l.id !== id) return l;
        const updated = {
          ...l, ...updates,
          lastActivity: new Date().toISOString(),
          status:        updates.status        !== undefined ? updates.status        : l.status,
          interestLevel: updates.interestLevel !== undefined ? updates.interestLevel : l.interestLevel,
          assignedAt: updates.assignedTo !== undefined && updates.assignedTo
            ? (updates.assignedAt || new Date().toISOString())
            : updates.assignedTo === null ? null : l.assignedAt,
        };
        if (hasFollowUpUpdate) {
          updated.follow_up_date     = newFollowUp;
          updated.followUpDate       = newFollowUp;
          updated.next_followup_date = newFollowUp;
        }
        return updated;
      }));
    } catch (err) { console.error('[Leads] updateLead unexpected error:', err); }
  };

  const deleteLead = async (id) => {
    try {
      const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
      if (error) { console.error('[Leads] deleteLead error:', error.message); return; }
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error('[Leads] deleteLead unexpected error:', err); }
  };

  const addLeadNote = async (id, text, author) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const existingNotes = lead.notes || '';
    const newNote = `${existingNotes}\n[${new Date().toLocaleString('en-IN')}] ${author}: ${text}`.trim();
    await updateLead(id, { notes: newNote });
  };

  // ── FETCH EMPLOYEES ──────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) { console.error('[Employees] Fetch error:', error.message); setEmployees([]); return; }
      setEmployees((data || []).map(row => ({
        id: row.id, name: row.name || row.username || '', email: row.email || '',
        username: row.username || '', role: row.role || 'sales_executive',
        status: row.status || 'Active', phone: row.phone || '',
        department: row.department || '', permissions: row.permissions || [],
        createdAt: row.created_at, lastLogin: row.last_login || null,
      })));
    } catch (err) { console.error('[Employees] Unexpected error:', err); setEmployees([]); }
    finally { setEmployeesLoading(false); }
  };

  // ── FETCH CALLS ─────────────────────────────────────────────────────────────
  const fetchCalls = useCallback(async () => {
    const uid   = userIdRef.current;
    const admin = isAdminRole(roleRef.current);
    try {
      setCallsLoading(true);
      // Employees only fetch their own calls — much faster
      const data = await getCalls(admin ? null : uid);
      const normalized = data.map(row => ({
        id: row.id, employeeId: row.employee_id, leadId: row.lead_id,
        leadName: row.lead_name, projectName: row.project_name, type: row.call_type,
        status: row.status, duration: row.duration, notes: row.notes,
        employee_name: row.employee_name, created_at: row.created_at,
        timestamp: row.created_at, majorObjection: row.major_objection || null,
      }));
      setCalls(normalized);
      if (uid) writeCache(cacheKey(uid, 'calls'), normalized);
    } catch (err) { console.error('[Calls] Fetch error:', err); setCalls([]); }
    finally { setCallsLoading(false); }
  }, []);

  const addCallLog = async (log) => {
    try {
      const result = await addCall(log);
      if (result.success) { await fetchCalls(); return result.data; }
      return null;
    } catch (err) { console.error('[Calls] addCallLog error:', err); return null; }
  };

  // ── FETCH SITE VISITS ───────────────────────────────────────────────────────
  const fetchSiteVisits = useCallback(async () => {
    const uid   = userIdRef.current;
    const admin = isAdminRole(roleRef.current);
    try {
      setSiteVisitsLoading(true);
      const data = await getSiteVisits(admin ? null : uid);
      const normalized = data.map(row => ({
        id: row.id, employeeId: row.employee_id, leadId: row.lead_id,
        leadName: row.lead_name, projectName: row.project_name,
        visitDate: row.visit_date, visitTime: row.visit_time,
        status: row.status, location: row.location, duration: row.duration,
        notes: row.notes, feedback: row.feedback, interest: row.interest_level || null,
        timestamp: row.created_at,
      }));
      setSiteVisits(normalized);
      if (uid) writeCache(cacheKey(uid, 'visits'), normalized);
    } catch (err) { console.error('[SiteVisits] Fetch error:', err); setSiteVisits([]); }
    finally { setSiteVisitsLoading(false); }
  }, []);

  const addSiteVisitLog = async (log) => {
    try {
      const result = await addSiteVisit(log);
      if (result.success) {
        await fetchSiteVisits();
        if (log.leadId) await updateLead(log.leadId, { siteVisitStatus: 'completed', lastActivity: new Date().toISOString() });
        return result.data;
      }
      return null;
    } catch (err) { console.error('[SiteVisits] addSiteVisitLog error:', err); return null; }
  };

  const updateSiteVisit = async (id, updates) => {
    try {
      const mapped = {};
      if (updates.interest      !== undefined) mapped.interest_level = updates.interest;
      if (updates.interestLevel !== undefined) mapped.interest_level = updates.interestLevel;
      if (updates.notes         !== undefined) mapped.notes          = updates.notes;
      if (updates.feedback      !== undefined) mapped.feedback       = updates.feedback;
      if (updates.status        !== undefined) mapped.status         = updates.status;
      if (updates.visitDate     !== undefined) mapped.visit_date     = updates.visitDate;
      if (updates.visitTime     !== undefined) mapped.visit_time     = updates.visitTime;
      const { error } = await supabaseAdmin.from('site_visits').update(mapped).eq('id', id);
      if (error) { console.error('[SiteVisits] updateSiteVisit error:', error.message); throw new Error(error.message); }
      setSiteVisits(prev => prev.map(v =>
        v.id === id ? { ...v,
          interest:  updates.interest || updates.interestLevel || v.interest,
          notes:     updates.notes    !== undefined ? updates.notes    : v.notes,
          feedback:  updates.feedback !== undefined ? updates.feedback : v.feedback,
          status:    updates.status   !== undefined ? updates.status   : v.status,
          visitDate: updates.visitDate!== undefined ? updates.visitDate: v.visitDate,
        } : v
      ));
    } catch (err) { console.error('[SiteVisits] updateSiteVisit unexpected error:', err); throw err; }
  };

  // ── FETCH BOOKINGS ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    const uid   = userIdRef.current;
    const admin = isAdminRole(roleRef.current);
    try {
      setBookingsLoading(true);
      const data = await getBookings(admin ? null : uid);
      const normalized = data.map(row => ({
        id: row.id, employeeId: row.employee_id, leadId: row.lead_id, leadName: row.lead_name,
        projectName: row.project_name, unitType: row.unit_type, unitNumber: row.unit_number,
        amount: parseFloat(row.booking_amount), paymentMode: row.payment_mode,
        paymentStatus: row.payment_status, bookingDate: row.booking_date,
        expectedClosureDate: row.expected_closure_date, notes: row.notes,
        timestamp: row.created_at,
      }));
      setBookings(normalized);
      if (uid) writeCache(cacheKey(uid, 'bookings'), normalized);
    } catch (err) { console.error('[Bookings] Fetch error:', err); setBookings([]); }
    finally { setBookingsLoading(false); }
  }, []);

  const addBookingLog = async (log) => {
    try {
      const result = await addBooking(log);
      if (result.success) {
        if (log.leadId) {
          const leadUpdate = { status: 'Booked', follow_up_date: null, followUpDate: null };
          if (log.tokenAmount    !== undefined) leadUpdate.tokenAmount    = log.tokenAmount;
          if (log.bookingAmount  !== undefined) leadUpdate.bookingAmount  = log.bookingAmount;
          if (log.partialPayment !== undefined) leadUpdate.partialPayment = log.partialPayment;
          if (log.unitNumber     !== undefined) leadUpdate.unitNumber     = log.unitNumber;
          if (log.paymentMode    !== undefined) leadUpdate.paymentMode    = log.paymentMode;
          await updateLead(log.leadId, leadUpdate);
        }
        await fetchBookings();
        return result.data;
      }
      return null;
    } catch (err) { console.error('[Bookings] addBookingLog error:', err); return null; }
  };

  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    switch (key) {
      case STORAGE_KEYS.PROMO_MATERIALS: setPromoMaterials(data); break;
      case STORAGE_KEYS.TASKS:           setTasks(data);          break;
      case STORAGE_KEYS.EOD_REPORTS:     setEodReports(data);     break;
      case STORAGE_KEYS.AUDIT_LOGS:      setAuditLogs(data);      break;
    }
  };

  const addPromoMaterial    = (m)    => saveData(STORAGE_KEYS.PROMO_MATERIALS, [{ ...m, id: `MAT${Date.now()}`, uploadDate: new Date().toISOString() }, ...promoMaterials]);
  const deletePromoMaterial = (id)   => saveData(STORAGE_KEYS.PROMO_MATERIALS, promoMaterials.filter(m => m.id !== id));
  const addTask      = (task) => { const n = { ...task, id: `TASK${Date.now()}`, status: 'Pending', timestamp: new Date().toISOString() }; saveData(STORAGE_KEYS.TASKS, [n, ...tasks]); return n; };
  const updateTask   = (id, u)=> saveData(STORAGE_KEYS.TASKS, tasks.map(t => t.id === id ? { ...t, ...u } : t));
  const addEodReport = (r)    => { const n = { ...r, id: `EOD${Date.now()}`, timestamp: new Date().toISOString() }; saveData(STORAGE_KEYS.EOD_REPORTS, [n, ...eodReports]); return n; };
  const addAuditLog  = (l)    => { const n = { ...l, id: `AUDIT${Date.now()}`, timestamp: new Date().toISOString() }; saveData(STORAGE_KEYS.AUDIT_LOGS, [n, ...auditLogs]); };
  const clearDummyData = async () => {
    localStorage.removeItem('crm_work_logs');
    saveData(STORAGE_KEYS.TASKS, []);
    saveData(STORAGE_KEYS.EOD_REPORTS, []);
    await fetchCalls(); await fetchSiteVisits(); await fetchBookings();
  };
  const getUniqueSources = () => Array.from(new Set(leads.map(l => l.source || 'Manual Import')));

  return {
    leads, leadsLoading, fetchLeads, addLead, updateLead, deleteLead, addLeadNote,
    employees, employeesLoading, fetchEmployees,
    calls, callsLoading, fetchCalls, addCallLog,
    siteVisits, siteVisitsLoading, fetchSiteVisits, addSiteVisitLog, updateSiteVisit,
    bookings, bookingsLoading, fetchBookings, addBookingLog,
    workLogs,
    customers, invoices, payments, settings, waTemplates, promoMaterials,
    tasks, eodReports, auditLogs,
    addPromoMaterial, deletePromoMaterial, addTask, updateTask,
    addEodReport, addAuditLog, clearDummyData, getUniqueSources,
  };
};

// ── Provider — wrap your app with this once ──────────────────────────────────
// Pass userId and role from AuthContext so queries are scoped at the DB level
export const CRMDataProvider = ({ children, userId, role }) => {
  const value = useCRMDataInternal({ userId, role });
  return (
    <CRMDataContext.Provider value={value}>
      {children}
    </CRMDataContext.Provider>
  );
};

// Public hook
export const useCRMData = () => {
  const ctx = useContext(CRMDataContext);
  if (!ctx) throw new Error('useCRMData must be used inside <CRMDataProvider>');
  return ctx;
};
