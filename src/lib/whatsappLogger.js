
// Utility for logging WhatsApp interactions

export const logWhatsAppInteraction = (leadId, templateName, executiveId) => {
  try {
    const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) return false;

    const interaction = {
      type: 'whatsapp',
      templateName,
      executiveId,
      timestamp: new Date().toISOString(),
      status: 'Sent'
    };

    const lead = leads[leadIndex];
    const history = lead.history || [];
    
    // Update lead
    const updatedLead = {
      ...lead,
      whatsappStatus: 'Sent',
      lastActivity: new Date().toISOString(),
      history: [...history, interaction]
    };

    leads[leadIndex] = updatedLead;
    localStorage.setItem('crm_leads', JSON.stringify(leads));
    
    // Trigger storage event to update other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'crm_leads',
      newValue: JSON.stringify(leads)
    }));

    return true;
  } catch (error) {
    console.error('Error logging WhatsApp interaction:', error);
    return false;
  }
};
