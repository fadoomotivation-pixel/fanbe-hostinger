
export const leadsData = [
  // Ankita's Leads (15)
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `LEAD_A_${i + 1}`,
    name: `Ankita Lead ${i + 1}`,
    phone: `98000000${String(i).padStart(2, '0')}`,
    project: i % 3 === 0 ? 'Highway Meadows' : 'Vrindavan Enclave',
    status: i < 5 ? 'Open' : i < 12 ? 'FollowUp' : 'Booked',
    assignedTo: 'EMP001', // Ankita
    assignedToName: 'Ankita Singh',
    source: 'Facebook',
    createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
    lastActivity: new Date(Date.now() - (i * 3600000)).toISOString(),
    daysSinceCreation: i
  })),
  // Nidhi's Leads (18)
  ...Array.from({ length: 18 }).map((_, i) => ({
    id: `LEAD_N_${i + 1}`,
    name: `Nidhi Lead ${i + 1}`,
    phone: `99000000${String(i).padStart(2, '0')}`,
    project: i % 2 === 0 ? 'Divine City' : 'Highway Meadows',
    status: i < 8 ? 'Open' : i < 15 ? 'FollowUp' : 'Booked',
    assignedTo: 'EMP002', // Nidhi
    assignedToName: 'Nidhi Sharma',
    source: 'Google Ads',
    createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
    lastActivity: new Date(Date.now() - (i * 3600000)).toISOString(),
    daysSinceCreation: i
  }))
];
