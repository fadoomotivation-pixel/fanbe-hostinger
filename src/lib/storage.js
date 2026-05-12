
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
    
    if (saved) {
      console.log('Lead submitted successfully:', newLead.id);
      return { success: true, data: newLead };
    }
    throw new Error('Failed to save lead');
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
