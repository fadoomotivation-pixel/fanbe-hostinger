import { captureLead, collectAttribution } from './whatsappLeadCapture';
import { projectsData } from '@/data/projectsData';

// Callers are inconsistent: SiteVisitLeadModal sends a slug, SiteVisitModal
// sends a display name. The CRM shows this string verbatim, so resolve
// slugs to the readable title before it goes across.
const toProjectName = (value) => {
  if (!value) return '';
  const match = projectsData.find(p => p.slug === value);
  return match ? match.title : value;
};

// Local mirror of what the visitor submitted. This is NOT where the business
// reads its leads from — that is the Supabase `leads` table, which every
// submission below now also writes to. Historically only this line existed,
// which meant every website enquiry lived and died in the visitor's own
// browser and never reached the CRM.
const LEADS_KEY = 'crm_leads'; 

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', {
      key: key,
      newValue: JSON.stringify(data)
    }));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

export const submitLead = async ({ name, phone, email, projectSlug, preferredCallbackTime, leadSource = 'Website' }) => {
  try {
    const leads = getFromStorage(LEADS_KEY);
    
    // Check for duplicates within last 24 hours to prevent spam
    const recentDuplicate = leads.find(l => 
      l.phone === phone && 
      l.project === projectSlug && 
      (new Date() - new Date(l.createdAt)) < 24 * 60 * 60 * 1000
    );

    if (recentDuplicate) {
      console.log('Duplicate lead prevented');
      return { success: true, message: 'We already have your request!', isDuplicate: true };
    }

    const newLead = {
      id: `LEAD${Date.now()}`,
      name,
      phone,
      email: email || '',
      project: projectSlug,
      preferredCallbackTime: preferredCallbackTime || 'Anytime',
      source: leadSource,
      status: 'New',
      assignedTo: null, 
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: [{
        text: `Lead captured via website form for ${projectSlug}`,
        timestamp: new Date().toISOString(),
        author: 'System'
      }],
      convertedToCustomer: false
    };
    
    leads.unshift(newLead);
    const saved = saveToStorage(LEADS_KEY, leads);

    // The write that actually matters — push it to the CRM. Not awaited so a
    // slow network never stalls the success screen; captureLead queues and
    // retries on its own if the request fails.
    captureLead({
      name,
      phone,
      email,
      project:       toProjectName(projectSlug),
      source:        leadSource,
      label:         `${leadSource} form`,
      interestLevel: 'Warm',
      message:       preferredCallbackTime
        ? `Preferred callback: ${preferredCallbackTime}`
        : '',
      attribution:   collectAttribution(),
    });

    if (saved) {
      console.log('Lead submitted successfully:', newLead.id);
      return { success: true, data: newLead };
    }
    // The CRM write is already in flight, so the visitor's request is not
    // lost even when localStorage is unavailable (private mode, quota).
    return { success: true, data: newLead };
  } catch (error) {
    console.error('Error submitting lead:', error);
    return { success: false, error: error.message };
  }
};

// Keeping existing functions for compatibility if needed elsewhere
export const submitSiteVisit = async (leadData) => {
  return submitLead({
    name: leadData.name,
    phone: leadData.phone,
    projectSlug: leadData.preferred_project,
    leadSource: 'Website'
  });
};
