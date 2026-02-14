
import { staffData } from '@/crm/data/staffData';
import { leadsData } from '@/crm/data/leadsData';
import { performanceData } from '@/crm/data/performanceData';

export const initializeData = () => {
  if (typeof window === 'undefined') return;

  // Initialize Staff
  if (!localStorage.getItem('crm_employees')) {
    console.log('Initializing Staff Data...');
    localStorage.setItem('crm_employees', JSON.stringify(staffData));
  }

  // Initialize Leads
  if (!localStorage.getItem('crm_leads')) {
    console.log('Initializing Leads Data...');
    localStorage.setItem('crm_leads', JSON.stringify(leadsData));
  }

  // Initialize Work Logs / Performance
  if (!localStorage.getItem('crm_work_logs')) {
    console.log('Initializing Performance Data...');
    localStorage.setItem('crm_work_logs', JSON.stringify(performanceData));
  }
  
  // Initialize other collections if empty
  if (!localStorage.getItem('crm_customers')) localStorage.setItem('crm_customers', '[]');
  if (!localStorage.getItem('crm_invoices')) localStorage.setItem('crm_invoices', '[]');
};
