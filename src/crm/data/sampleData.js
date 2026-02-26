// Cleaned data - no dummy records, reset stats
export const sampleEmployees = [];
export const sampleLeads = [];
export const sampleCustomers = [];
export const sampleInvoices = [];
export const samplePayments = [];
export const sampleWorkLogs = [];

export const sampleWhatsAppTemplates = [
  {
    id: 'TPL001',
    name: 'Initial Contact',
    content: 'Hello [Client Name], I am from Fanbe Group. Thank you for your interest in [Project Name]. I would like to share more details about this investment opportunity. When is a good time to talk?'
  },
  {
    id: 'TPL002',
    name: 'Site Visit Invite',
    content: 'Hello [Client Name], we are organizing site visits for [Project Name] this weekend. Would you be interested in seeing the development progress and available plots?'
  }
];

export const sampleSettings = {
  leadSources: ['Website', 'Facebook Ads', 'MagicBricks', 'Walk-in', 'Referral', 'Newspaper'],
  leadStatuses: ['Open', 'FollowUp', 'Booked', 'Lost'],
  company: {
    name: 'Fanbe Group',
    phone: '+91 8076146988',
    email: 'info@fanbegroup.com',
    address: 'Mathura-Vrindavan Road, Uttar Pradesh'
  },
  sessionTimeout: 30 // minutes
};
