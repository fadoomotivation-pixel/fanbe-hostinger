// src/crm/hooks/useCRMData.js
// ✅ Leads    → Supabase
// ✅ Employees → Supabase profiles table
// ✅ Calls, SiteVisits, Bookings → Supabase
// ✅ WorkLogs → Computed from calls (REAL DATA)
// Tasks, EOD Reports → localStorage (will migrate later)
import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { addCall, getCalls, addSiteVisit, getSiteVisits, addBooking, getBookings } from '@/lib/crmSupabase';
import {
  sampleCustomers, sampleInvoices,
  samplePayments, sampleSettings, sampleWhatsAppTemplates
} from '../data/sampleData';

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

export const useCRMData = () => {
  // ── Supabase state ────────────────────────────────────────
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [employees, setEmployees]   = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  
  // ✅ NOW USING SUPABASE
  const [calls, setCalls]           = useState([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [siteVisits, setSiteVisits] = useState([]);
  const [siteVisitsLoading, setSiteVisitsLoading] = useState(true);
  const [bookings, setBookings]     = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // ✅ COMPUTED from calls data (NOT localStorage)
  const [workLogs, setWorkLogs]     = useState([]);

  // ── localStorage state (will migrate later) ─────────────────────────
  const [customers, setCustomers]         = useState([]);
  const [invoices, setInvoices]           = useState([]);
  const [payments, setPayments]           = useState([]);
  const [settings, setSettings]           = useState(sampleSettings);
  const [waTemplates, setWaTemplates]     = useState([]);
  const [promoMaterials, setPromoMaterials] = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [eodReports, setEodReports]       = useState([]);
  const [auditLogs, setAuditLogs]         = useState([]);

  // ── Load localStorage data once ─────────────────────────────────
  useEffect(() => {
    const get = (key, def) => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : def;
    };
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

  // ── Load all Supabase data ──────────────────────────────────────
  useEffect(() => {
    fetchLeads();
    fetchEmployees();
    fetchCalls();
    fetchSiteVisits();
    fetchBookings();
  }, []);

  // ── Compute workLogs from calls, siteVisits, bookings data ──────────────────
  useEffect(() => {
    if (callsLoading || siteVisitsLoading || bookingsLoading) return;

    // Aggregate by employeeId and date
    const logsMap = {};

    calls.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      const key = `${c.employeeId}_${date}`;
      if (!logsMap[key]) {
        logsMap[key] = {
          id: key,
          employeeId: c.employeeId,
          date,
          totalCalls: 0,
          connectedCalls: 0,
          siteVisits: 0,
          bookings: 0,
          conversionRate: 0,
        };
      }
      logsMap[key].totalCalls += 1;
      if (c.status === 'connected' || c.status === 'interested') {
        logsMap[key].connectedCalls += 1;
      }
    });

    siteVisits.forEach(sv => {
      const date = new Date(sv.timestamp).toISOString().split('T')[0];
      const key = `${sv.employeeId}_${date}`;
      if (!logsMap[key]) {
        logsMap[key] = {
          id: key,
          employeeId: sv.employeeId,
          date,
          totalCalls: 0,
          connectedCalls: 0,
          siteVisits: 0,
          bookings: 0,
          conversionRate: 0,
        };
      }
      logsMap[key].siteVisits += 1;
    });

    bookings.forEach(b => {
      const date = new Date(b.timestamp).toISOString().split('T')[0];
      const key = `${b.employeeId}_${date}`;
      if (!logsMap[key]) {
        logsMap[key] = {
          id: key,
          employeeId: b.employeeId,
          date,
          totalCalls: 0,
          connectedCalls: 0,
          siteVisits: 0,
          bookings: 0,
          conversionRate: 0,
        };
      }
      logsMap[key].bookings += 1;
    });

    // Calculate conversion rates
    Object.values(logsMap).forEach(log => {
      if (log.totalCalls > 0) {
        log.conversionRate = Math.round((log.connectedCalls / log.totalCalls) * 100);
      }
    });

    const computed = Object.values(logsMap).sort((a, b) => b.date.localeCompare(a.date));
    setWorkLogs(computed);
    console.log(`[WorkLogs] Computed ${computed.length} work logs from real Supabase data`);
  }, [calls, siteVisits, bookings, callsLoading, siteVisitsLoading, bookingsLoading]);

  // ── LEADS ───────────────────────────────────────────────────────
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

      const normalized = (data || []).map(row => ({
        id:               row.id,
        name:             row.full_name          || '',
        phone:            row.phone              || '',
        email:            row.email              || '',
        source:           row.source             || 'Manual Import',
        status:           row.final_status       || row.status || 'FollowUp',
        budget:           row.budget             || '',
        interestLevel:    row.interest_level     || 'Cold',
        notes:            row.notes              || '',
        callAttempt:      row.call_attempt       || '',
        callStatus:       row.call_status        || '',
        siteVisitStatus:  row.site_visit_status  || '',
        finalStatus:      row.final_status       || 'FollowUp',
        assignedTo:       row.assigned_to        || null,
        assignedToName:   row.assigned_to_name   || null,
        createdBy:        row.created_by         || null,
        createdAt:        row.created_at,
        lastActivity:     row.updated_at,
        activityLog:      [],
        project:          row.project            || '',
        followUpDate:     row.next_followup_date || null,
        isVIP:            row.is_vip             || false,
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

  const addLead = async (lead) => {
    try {
      let budgetValue = lead.budget || '';
      if (budgetValue && typeof budgetValue !== 'string') {
        budgetValue = String(budgetValue);
      }
      
      const doc = {
        name:               lead.name,
        full_name:          lead.name,
        phone:              lead.phone,
        email:              lead.email            || '',
        source:             lead.source           || 'Manual Import',
        status:             'Active',
        budget:             budgetValue,
        interest_level:     lead.interestLevel    || lead.interest_level || 'Cold',
        notes:              lead.notes            || '',
        call_attempt:       lead.callAttempt      || '',
        call_status:        lead.callStatus       || '',
        site_visit_status:  lead.siteVisitStatus  || 'not_planned',
        final_status:       lead.status           || 'FollowUp',
        assigned_to:        lead.assignedTo       || null,
        assigned_to_name:   lead.assignedToName   || null,
        created_by:         lead.createdBy        || null,
        project:            lead.project          || null,
        next_followup_date: lead.followUpDate     || null,
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
      const mapped = {};
      if (updates.name             !== undefined) mapped.full_name          = updates.name;
      if (updates.phone            !== undefined) mapped.phone              = updates.phone;
      if (updates.email            !== undefined) mapped.email              = updates.email;
      if (updates.source           !== undefined) mapped.source             = updates.source;
      if (updates.budget           !== undefined) {
        mapped.budget = updates.budget && typeof updates.budget !== 'string' 
          ? String(updates.budget) 
          : updates.budget;
      }
      if (updates.status           !== undefined) mapped.final_status       = updates.status;
      if (updates.interestLevel    !== undefined) mapped.interest_level     = updates.interestLevel;
      if (updates.notes            !== undefined) mapped.notes              = updates.notes;
      if (updates.callAttempt      !== undefined) mapped.call_attempt       = updates.callAttempt;
      if (updates.callStatus       !== undefined) mapped.call_status        = updates.callStatus;
      if (updates.siteVisitStatus  !== undefined) mapped.site_visit_status  = updates.siteVisitStatus;
      if (updates.assignedTo       !== undefined) mapped.assigned_to        = updates.assignedTo;
      if (updates.assignedToName   !== undefined) mapped.assigned_to_name   = updates.assignedToName;
      if (updates.project          !== undefined) mapped.project            = updates.project;
      if (updates.followUpDate     !== undefined) mapped.next_followup_date = updates.followUpDate;
      if (updates.isVIP            !== undefined) mapped.is_vip             = updates.isVIP;
      mapped.updated_at = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('leads')
        .update(mapped)
        .eq('id', id);

      if (error) {
        console.error('[Leads] updateLead error:', error.message);
        return;
      }

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

  // ── EMPLOYEES ─────────────────────────────────────────────────
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Employees] Fetch error:', error.message);
        setEmployees([]);
        return;
      }

      const normalized = (data || []).map(row => ({
        id:          row.id,
        name:        row.name        || row.username || '',
        email:       row.email       || '',
        username:    row.username    || '',
        role:        row.role        || 'sales_executive',
        status:      row.status      || 'Active',
        phone:       row.phone       || '',
        department:  row.department  || '',
        permissions: row.permissions || [],
        createdAt:   row.created_at,
        lastLogin:   row.last_login  || null,
      }));

      setEmployees(normalized);
      console.log(`[Employees] Loaded ${normalized.length} employees from Supabase`);
    } catch (err) {
      console.error('[Employees] Unexpected error:', err);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // ── CALLS ✅ NOW USING SUPABASE ─────────────────────────────────
  const fetchCalls = async () => {
    try {
      setCallsLoading(true);
      const data = await getCalls();
      
      // Normalize to match existing structure
      const normalized = data.map(row => ({
        id:           row.id,
        employeeId:   row.employee_id,
        leadId:       row.lead_id,
        leadName:     row.lead_name,
        projectName:  row.project_name,
        type:         row.call_type,
        status:       row.status,
        duration:     row.duration,
        notes:        row.notes,
        timestamp:    row.created_at,
      }));
      
      setCalls(normalized);
      console.log(`[Calls] Loaded ${normalized.length} calls from Supabase`);
    } catch (err) {
      console.error('[Calls] Fetch error:', err);
      setCalls([]);
    } finally {
      setCallsLoading(false);
    }
  };

  const addCallLog = async (log) => {
    try {
      const result = await addCall(log);
      if (result.success) {
        await fetchCalls();
        if (log.leadId) {
          await updateLead(log.leadId, { lastActivity: new Date().toISOString() });
        }
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[Calls] addCallLog error:', err);
      return null;
    }
  };

  // ── SITE VISITS ✅ NOW USING SUPABASE ─────────────────────────────
  const fetchSiteVisits = async () => {
    try {
      setSiteVisitsLoading(true);
      const data = await getSiteVisits();
      
      const normalized = data.map(row => ({
        id:           row.id,
        employeeId:   row.employee_id,
        leadId:       row.lead_id,
        leadName:     row.lead_name,
        projectName:  row.project_name,
        visitDate:    row.visit_date,
        visitTime:    row.visit_time,
        status:       row.status,
        location:     row.location,
        duration:     row.duration,
        notes:        row.notes,
        feedback:     row.feedback,
        timestamp:    row.created_at,
      }));
      
      setSiteVisits(normalized);
      console.log(`[SiteVisits] Loaded ${normalized.length} site visits from Supabase`);
    } catch (err) {
      console.error('[SiteVisits] Fetch error:', err);
      setSiteVisits([]);
    } finally {
      setSiteVisitsLoading(false);
    }
  };

  const addSiteVisitLog = async (log) => {
    try {
      const result = await addSiteVisit(log);
      if (result.success) {
        await fetchSiteVisits();
        if (log.leadId) {
          await updateLead(log.leadId, { lastActivity: new Date().toISOString() });
        }
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[SiteVisits] addSiteVisitLog error:', err);
      return null;
    }
  };

  // ── BOOKINGS ✅ NOW USING SUPABASE ──────────────────────────────
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await getBookings();
      
      const normalized = data.map(row => ({
        id:             row.id,
        employeeId:     row.employee_id,
        leadId:         row.lead_id,
        leadName:       row.lead_name,
        projectName:    row.project_name,
        unitType:       row.unit_type,
        unitNumber:     row.unit_number,
        amount:         parseFloat(row.booking_amount),
        paymentMode:    row.payment_mode,
        paymentStatus:  row.payment_status,
        bookingDate:    row.booking_date,
        expectedClosureDate: row.expected_closure_date,
        notes:          row.notes,
        timestamp:      row.created_at,
      }));
      
      setBookings(normalized);
      console.log(`[Bookings] Loaded ${normalized.length} bookings from Supabase`);
    } catch (err) {
      console.error('[Bookings] Fetch error:', err);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const addBookingLog = async (log) => {
    try {
      const result = await addBooking(log);
      if (result.success) {
        await fetchBookings();
        if (log.leadId) {
          await updateLead(log.leadId, { status: 'Booked' });
        }
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[Bookings] addBookingLog error:', err);
      return null;
    }
  };

  // ── localStorage helpers (for remaining items) ─────────────────────────
  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    switch (key) {
      case STORAGE_KEYS.PROMO_MATERIALS: setPromoMaterials(data); break;
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
    // Clear localStorage cache
    localStorage.removeItem('crm_work_logs');
    saveData(STORAGE_KEYS.TASKS, []);
    saveData(STORAGE_KEYS.EOD_REPORTS, []);
    
    // Refresh Supabase data
    await fetchCalls();
    await fetchSiteVisits();
    await fetchBookings();
  };

  const getUniqueSources = () => {
    const sources = new Set(leads.map(l => l.source || 'Manual Import'));
    return Array.from(sources);
  };

  return {
    // Supabase - Leads
    leads, leadsLoading, fetchLeads,
    addLead, updateLead, deleteLead, addLeadNote,
    
    // Supabase - Employees
    employees, employeesLoading, fetchEmployees,
    
    // Supabase - Calls ✅
    calls, callsLoading, fetchCalls, addCallLog,
    
    // Supabase - Site Visits ✅
    siteVisits, siteVisitsLoading, fetchSiteVisits, addSiteVisitLog,
    
    // Supabase - Bookings ✅
    bookings, bookingsLoading, fetchBookings, addBookingLog,
    
    // Computed from real Supabase data ✅
    workLogs,
    
    // localStorage (remaining)
    customers, invoices, payments,
    settings, waTemplates, promoMaterials,
    tasks, eodReports, auditLogs,
    addPromoMaterial, deletePromoMaterial,
    addTask, updateTask, addEodReport, addAuditLog,
    clearDummyData, getUniqueSources,
  };
};
