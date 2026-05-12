
import { useState, useEffect } from 'react';
import { sampleEmployees, sampleLeads, sampleCustomers, sampleInvoices, samplePayments, sampleSettings, sampleWhatsAppTemplates, sampleWorkLogs } from '../data/sampleData';

const STORAGE_KEYS = {
  EMPLOYEES: 'crm_employees',
  LEADS: 'crm_leads',
  CUSTOMERS: 'crm_customers',
  INVOICES: 'crm_invoices',
  PAYMENTS: 'crm_payments',
  SETTINGS: 'crm_settings',
  WA_TEMPLATES: 'crm_wa_templates',
  WORK_LOGS: 'crm_work_logs',
  CALLS: 'crm_calls',
  SITE_VISITS: 'crm_site_visits',
  BOOKINGS: 'crm_bookings_granular',
  TASKS: 'crm_tasks',
  EOD_REPORTS: 'crm_eod_reports',
  PROMO_MATERIALS: 'crm_promo_materials',
  AUDIT_LOGS: 'crm_audit_logs'
};

export const useCRMData = () => {
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(sampleSettings);
  const [waTemplates, setWaTemplates] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [promoMaterials, setPromoMaterials] = useState([]);
  
  // New Granular Data
  const [calls, setCalls] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [eodReports, setEodReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Initialize Data
  useEffect(() => {
    const loadData = () => {
      const get = (key, def) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : def;
      };

      setEmployees(get(STORAGE_KEYS.EMPLOYEES, sampleEmployees));
      setLeads(get(STORAGE_KEYS.LEADS, sampleLeads));
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
    };
    loadData();
    
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.LEADS) setLeads(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.PROMO_MATERIALS) setPromoMaterials(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    switch (key) {
      case STORAGE_KEYS.LEADS: setLeads(data); break;
      case STORAGE_KEYS.PROMO_MATERIALS: setPromoMaterials(data); break;
      case STORAGE_KEYS.CALLS: setCalls(data); break;
      case STORAGE_KEYS.SITE_VISITS: setSiteVisits(data); break;
      case STORAGE_KEYS.BOOKINGS: setBookings(data); break;
      case STORAGE_KEYS.TASKS: setTasks(data); break;
      case STORAGE_KEYS.EOD_REPORTS: setEodReports(data); break;
      case STORAGE_KEYS.AUDIT_LOGS: setAuditLogs(data); break;
    }
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(data) }));
  };

  // --- Lead Operations ---
  const addLead = (lead) => {
    const newLead = { 
      ...lead, 
      id: `LEAD${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: [],
      status: lead.status || 'Open',
      source: lead.source || 'Manual Import', // Default source
      activityLog: [{ action: 'Lead Created', author: 'System', timestamp: new Date().toISOString() }]
    };
    saveData(STORAGE_KEYS.LEADS, [newLead, ...leads]);
    return newLead;
  };

  const updateLead = (id, updates, author = 'System') => {
    const updated = leads.map(l => l.id === id ? { ...l, ...updates, lastActivity: new Date().toISOString() } : l);
    saveData(STORAGE_KEYS.LEADS, updated);
  };
  
  const addLeadNote = (id, text, author) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const newNote = { id: `NOTE${Date.now()}`, text, author, timestamp: new Date().toISOString() };
    const updatedLead = { ...lead, notes: [...(lead.notes || []), newNote], lastActivity: new Date().toISOString() };
    saveData(STORAGE_KEYS.LEADS, leads.map(l => l.id === id ? updatedLead : l));
  };
  
  const deleteLead = (id) => {
    const updated = leads.filter(l => l.id !== id);
    saveData(STORAGE_KEYS.LEADS, updated);
  }

  // --- Promo Materials ---
  const addPromoMaterial = (material) => {
    const newMat = { ...material, id: `MAT${Date.now()}`, uploadDate: new Date().toISOString() };
    saveData(STORAGE_KEYS.PROMO_MATERIALS, [newMat, ...promoMaterials]);
  };

  const deletePromoMaterial = (id) => {
    saveData(STORAGE_KEYS.PROMO_MATERIALS, promoMaterials.filter(m => m.id !== id));
  };

  // --- Granular Logging ---
  const addCallLog = (log) => {
    const newLog = { ...log, id: `CALL${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.CALLS, [newLog, ...calls]);
    if (log.leadId) updateLead(log.leadId, { lastActivity: newLog.timestamp }, 'System');
    return newLog;
  };

  const addSiteVisitLog = (log) => {
    const newLog = { ...log, id: `VISIT${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.SITE_VISITS, [newLog, ...siteVisits]);
    if (log.leadId) updateLead(log.leadId, { lastActivity: newLog.timestamp }, 'System');
    return newLog;
  };

  const addBookingLog = (log) => {
    const newLog = { ...log, id: `BOOK${Date.now()}`, timestamp: new Date().toISOString() };
    saveData(STORAGE_KEYS.BOOKINGS, [newLog, ...bookings]);
    if (log.leadId) updateLead(log.leadId, { status: 'Booked', lastActivity: newLog.timestamp }, 'System');
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

  // --- Data Clearing ---
  const clearDummyData = () => {
      // Keep only manually created employees (or specific admins)
      // This is a simplified logic. In a real app, you might flag "dummy" vs "real" data better.
      // Here we will clear all functional data but keep critical config/employees.
      
      saveData(STORAGE_KEYS.LEADS, []);
      saveData(STORAGE_KEYS.CALLS, []);
      saveData(STORAGE_KEYS.SITE_VISITS, []);
      saveData(STORAGE_KEYS.BOOKINGS, []);
      saveData(STORAGE_KEYS.TASKS, []);
      saveData(STORAGE_KEYS.EOD_REPORTS, []);
      saveData(STORAGE_KEYS.WORK_LOGS, []);
      // Intentionally NOT clearing employees, settings, or promo materials as per request "Keep real employees"
  };

  const getUniqueSources = () => {
    const sources = new Set(leads.map(l => l.source || 'Manual Import'));
    return Array.from(sources);
  };

  return {
    employees, leads, customers, settings, waTemplates, workLogs, promoMaterials,
    calls, siteVisits, bookings, tasks, eodReports, auditLogs,
    addLead, updateLead, deleteLead, addLeadNote,
    addPromoMaterial, deletePromoMaterial,
    addCallLog, addSiteVisitLog, addBookingLog,
    addTask, updateTask, addEodReport, addAuditLog,
    clearDummyData, getUniqueSources
  };
};
