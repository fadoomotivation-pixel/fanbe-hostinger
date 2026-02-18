// src/crm/hooks/useCRMData.js
// Leads → Supabase (supabaseAdmin bypasses RLS)
// Everything else → localStorage (unchanged)
import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import {
  sampleEmployees, sampleCustomers, sampleInvoices,
  samplePayments, sampleSettings, sampleWhatsAppTemplates, sampleWorkLogs
} from '../data/sampleData';

const STORAGE_KEYS = {
  EMPLOYEES:       'crm_employees',
  CUSTOMERS:       'crm_customers',
  INVOICES:        'crm_invoices',
  PAYMENTS:        'crm_payments',
  SETTINGS:        'crm_settings',
  WA_TEMPLATES:    'crm_wa_templates',
  WORK_LOGS:       'crm_work_logs',
  CALLS:           'crm_calls',
  SITE_VISITS:     'crm_site_visits',
  BOOKINGS:        'crm_bookings_granular',
  TASKS:           'crm_tasks',
  EOD_REPORTS:     'crm_eod_reports',
  PROMO_MATERIALS: 'crm_promo_materials',
  AUDIT_LOGS:      'crm_audit_logs',
};

export const useCRMData = () => {
  // ── Supabase state ──────────────────────────────────────────
  const [leads, setLeads]       = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // ── localStorage state ──────────────────────────────────────
  const [employees, setEmployees]         = useState([]);
  const [customers, setCustomers]         = useState([]);
  const [invoices, setInvoices]           = useState([]);
  const [payments, setPayments]           = useState([]);
  const [settings, setSettings]           = useState(sampleSettings);
  const [waTemplates, setWaTemplates]     = useState([]);
  const [workLogs, setWorkLogs]           = useState([]);
  const [promoMaterials, setPromoMaterials] = useState([]);
  const [calls, setCalls]                 = useState([]);
  const [siteVisits, setSiteVisits]       = useState([]);
  const [bookings, setBookings]           = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [eodReports, setEodReports]       = useState([]);
  const [auditLogs, setAuditLogs]         = useState([]);

  // ── Load localStorage data once ─────────────────────────────
  useEffect(() => {
    const get = (key, def) => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : def;
    };
    setEmployees(get(STORAGE_KEYS.EMPLOYEES, sampleEmployees));
    setCustomers(get(STORAGE_KEYS.CUSTOMERS, sampleCustomers));
    setInvoices(get(STORAGE_KEYS.INVOICES, sampleInvoices));
    setPayments(get(STORAGE_KEYS.PAYMENTS, samplePayments));
    setSettings(get(STORAGE_KEYS.SETTINGS, sampleSettings));
    setWaTemplates(get(STORAGE_KEYS.WA_TEMPLATES, sampleWhatsAppTemplates));
    setWorkLogs(get(STORAGE_KEYS.WORK_LOGS, sampleWorkLogs));
    setPromoMaterials(get(STORAGE_KEYS.PROMO_MATERIALS, []));
    setCalls(get(STORAGE_KEYS.CALLS, []));
    setSiteVisits(get(STORAGE_KEYS.SITE_VISITS, []));
    setBookings(get(STORAGE_KEYS.BOOKINGS, []));
    setTasks(get(STORAGE_KEYS.TASKS, []));
    setEodReports(get(STORAGE_KEYS.EOD_REPORTS, []));
    setAuditLogs(get(STORAGE_KEYS.AUDIT_LOGS, []));
  }, []);

  // ── Load leads from Supabase ─────────────────────────────────
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Leads] Fetch error:', error.message);
        setLeads([]);
        return;
      }

      // Normalize Supabase column names → CRM field names
      const normalized = (data || []).map(row => ({
        id:               row.id,
        name:             row.full_name || '',
        phone:            row.phone     || '',
        email:            row.email     || '',
        source:           row.source    || 'Manual Import',
        status:           row.final_status || row.status || 'FollowUp',
        budget:           row.budget    || '',
        interestLevel:    row.interest_level || 'Cold',
        notes:            row.notes     || '',
        callAttempt:      row.call_attempt || '',
        callStatus:       row.call_status  || '',
        siteVisitStatus:  row.site_visit_status || '',
        finalStatus:      row.final_status || 'FollowUp',
        assignedTo:       row.assigned_to  || null,
        createdBy:        row.created_by   || null,
        createdAt:        row.created_at,
        lastActivity:     row.updated_at,
        activityLog:      [],
      }));

      setLeads(normalized);
      console.log(`[Leads] Loaded ${normalized.length} leads from Supabase`);
    } catch (err) {
      console.error('[Leads] Unexpected error:', err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  // ── Lead CRUD — all go to Supabase ───────────────────────────

  const addLead = async (lead) => {
    try {
      const doc = {
        full_name:          lead.name,
        phone:              lead.phone,
        email:              lead.email || '',
        source:             lead.source || 'Manual Import',
        status:             'Active',
        budget:             lead.budget || null,
        interest_level:     lead.interestLevel || lead.interest_level || 'Cold',
        notes:              lead.notes || '',
        call_attempt:       lead.callAttempt || '',
        call_status:        lead.callStatus  || '',
        site_visit_status:  lead.siteVisitStatus || 'not planned',
        final_status:       lead.status || 'FollowUp',
        assigned_to:        lead.assignedTo || null,
        created_by:         lead.createdBy  || null,
        created_at:         new Date().toISOString(),
        updated_at:         new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert(doc)
        .select()
        .single();

      if (error) {
        console.error('[Leads] addLead error:', error.message);
        return null;
      }

      await fetchLeads();
      return data;
    } catch (err) {
      console.error('[Leads] addLead unexpected error:', err);
      return null;
    }
  };

  const updateLead = async (id, updates) => {
    try {
      // Map CRM field names back to Supabase column names
      const mapped = {};
      if (updates.name             !== undefined) mapped.full_name          = updates.name;
      if (updates.phone            !== undefined) mapped.phone              = updates.phone;
      if (updates.email            !== undefined) mapped.email              = updates.email;
      if (updates.source           !== undefined) mapped.source             = updates.source;
      if (updates.budget           !== undefined) mapped.budget             = updates.budget;
      if (updates.status           !== undefined) mapped.final_status       = updates.status;
      if (updates.interestLevel    !== undefined) mapped.interest_level     = updates.interestLevel;
      if (updates.notes            !== undefined) mapped.notes              = updates.notes;
      if (updates.callAttempt      !== undefined) mapped.call_attempt       = updates.callAttempt;
      if (updates.callStatus       !== undefined) mapped.call_status        = updates.callStatus;
      if (updates.siteVisitStatus  !== undefined) mapped.site_visit_status  = updates.siteVisitStatus;
      if (updates.assignedTo       !== undefined) mapped.assigned_to        = updates.assignedTo;
      mapped.updated_at = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('leads')
        .update(mapped)
        .eq('id', id);

      if (error) {
        console.error('[Leads] updateLead error:', error.message);
        return;
      }

      // Optimistic update in local state
      setLeads(prev => prev.map(l =>
        l.id === id ? { ...l, ...updates, lastActivity: new Date().toISOString() } : l
      ));
    } catch (err) {
      console.error('[Leads] updateLead unexpected error:', err);
    }
  };

  const deleteLead = async (id) => {
    try {
      const { error } = await supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Leads] deleteLead error:', error.message);
        return;
      }

      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('[Leads] deleteLead unexpected error:', err);
    }
  };

  const addLeadNote = async (id, text, author) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const existingNotes = lead.notes || '';
    const newNote = `${existingNotes}\n[${new Date().toLocaleString('en-IN')}] ${author}: ${text}`.trim();
    await updateLead(id, { notes: newNote });
  };

  // ── localStorage helpers (non-leads) ────────────────────────
  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    switch (key) {
      case STORAGE_KEYS.PROMO_MATERIALS: setPromoMaterials(data); break;
      case STORAGE_KEYS.CALLS:          setCalls(data);          break;
      case STORAGE_KEYS.SITE_VISITS:    setSiteVisits(data);     break;
      case STORAGE_KEYS.BOOKINGS:       setBookings(data);       break;
      case STORAGE_KEYS.TASKS:          setTasks(data);          break;
      case STORAGE_KEYS.EOD_REPORTS:    setEodReports(data);     break;
      case STORAGE_KEYS.AUDIT_LOGS:     setAuditLogs(data);      break;
    }
  };

  const addPromoMaterial = (material) => {
    const newMat = { ...material, id: `MAT${Date.now()}`, uploadDate: new Date().toISOString() };
    saveData(STORAGE_KEYS.PROMO_MATERIALS, [newMat, ...promoMaterials]);
  };

  const deletePromoMaterial = (id) => {
    saveData(STORAGE_KEYS.PROMO_MATERIALS, promoMaterials.filter(m => m.id !== id));
  };

  const addCallLog = (log) => {
    const newLog = { ...log, id: `CALL${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.CALLS, [newLog, ...calls]);
    if (log.leadId) updateLead(log.leadId, { lastActivity: newLog.timestamp });
    return newLog;
  };

  const addSiteVisitLog = (log) => {
    const newLog = { ...log, id: `VISIT${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.SITE_VISITS, [newLog, ...siteVisits]);
    if (log.leadId) updateLead(log.leadId, { lastActivity: newLog.timestamp });
    return newLog;
  };

  const addBookingLog = (log) => {
    const newLog = { ...log, id: `BOOK${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.BOOKINGS, [newLog, ...bookings]);
    if (log.leadId) updateLead(log.leadId, { status: 'Booked' });
    return newLog;
  };

  const addTask = (task) => {
    const newTask = { ...task, id: `TASK${Date.now()}`, status: 'Pending', timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.TASKS, [newTask, ...tasks]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    saveData(STORAGE_KEYS.TASKS, tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addEodReport = (report) => {
    const newReport = { ...report, id: `EOD${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.EOD_REPORTS, [newReport, ...eodReports]);
    return newReport;
  };

  const addAuditLog = (log) => {
    const newLog = { ...log, id: `AUDIT${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...auditLogs]);
  };

  const clearDummyData = async () => {
    saveData(STORAGE_KEYS.CALLS, []);
    saveData(STORAGE_KEYS.SITE_VISITS, []);
    saveData(STORAGE_KEYS.BOOKINGS, []);
    saveData(STORAGE_KEYS.TASKS, []);
    saveData(STORAGE_KEYS.EOD_REPORTS, []);
    saveData(STORAGE_KEYS.WORK_LOGS, []);
  };

  const getUniqueSources = () => {
    const sources = new Set(leads.map(l => l.source || 'Manual Import'));
    return Array.from(sources);
  };

  return {
    // Supabase
    leads, leadsLoading, fetchLeads,
    addLead, updateLead, deleteLead, addLeadNote,
    // localStorage
    employees, customers, invoices, payments,
    settings, waTemplates, workLogs, promoMaterials,
    calls, siteVisits, bookings, tasks, eodReports, auditLogs,
    addPromoMaterial, deletePromoMaterial,
    addCallLog, addSiteVisitLog, addBookingLog,
    addTask, updateTask, addEodReport, addAuditLog,
    clearDummyData, getUniqueSources,
  };
};
