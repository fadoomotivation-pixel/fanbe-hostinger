import { useMemo } from 'react';

/**
 * Custom hook to sort leads by follow-up priority
 * 
 * Priority Order:
 * 1. Overdue follow-ups (past date) - RED
 * 2. Today's follow-ups - YELLOW  
 * 3. Tomorrow's follow-ups - BLUE
 * 4. This week's follow-ups (2-7 days) - INDIGO
 * 5. Future follow-ups (>7 days) - GRAY
 * 6. No follow-up scheduled - LOWEST PRIORITY
 * 
 * Within each priority group, sorts by:
 * - Follow-up date (earliest first)
 * - Then by creation date (newest first)
 */

export const calculatePriority = (followUpDate) => {
  if (!followUpDate) return 999; // No follow-up

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUp = new Date(followUpDate);
  followUp.setHours(0, 0, 0, 0);
  
  const diffTime = followUp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 1;      // Overdue
  if (diffDays === 0) return 2;    // Today
  if (diffDays === 1) return 3;    // Tomorrow
  if (diffDays <= 7) return 4;     // This week
  return 5;                         // Future
};

export const useLeadPriority = (leads, options = {}) => {
  const {
    filterByStatus = null,      // Filter by lead status
    filterByAssignee = null,    // Filter by assigned_to
    includeCompleted = false    // Include completed follow-ups
  } = options;

  const sortedLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];

    // Apply filters
    let filteredLeads = [...leads];

    if (filterByStatus) {
      filteredLeads = filteredLeads.filter(lead => lead.status === filterByStatus);
    }

    if (filterByAssignee) {
      filteredLeads = filteredLeads.filter(lead => lead.assigned_to === filterByAssignee);
    }

    if (!includeCompleted) {
      filteredLeads = filteredLeads.filter(lead => 
        !lead.follow_up_status || lead.follow_up_status !== 'completed'
      );
    }

    // Calculate priority for each lead
    const leadsWithPriority = filteredLeads.map(lead => ({
      ...lead,
      calculatedPriority: calculatePriority(lead.follow_up_date)
    }));

    // Sort by priority, then by follow-up date, then by created date
    leadsWithPriority.sort((a, b) => {
      // Primary sort: Priority (lower number = higher priority)
      if (a.calculatedPriority !== b.calculatedPriority) {
        return a.calculatedPriority - b.calculatedPriority;
      }

      // Secondary sort: Follow-up date (earlier dates first)
      if (a.follow_up_date && b.follow_up_date) {
        return new Date(a.follow_up_date) - new Date(b.follow_up_date);
      }
      if (a.follow_up_date) return -1;
      if (b.follow_up_date) return 1;

      // Tertiary sort: Created/Updated date (newest first)
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB - dateA;
    });

    return leadsWithPriority;
  }, [leads, filterByStatus, filterByAssignee, includeCompleted]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!sortedLeads || sortedLeads.length === 0) {
      return {
        total: 0,
        overdue: 0,
        today: 0,
        tomorrow: 0,
        thisWeek: 0,
        future: 0,
        noFollowUp: 0
      };
    }

    return sortedLeads.reduce((acc, lead) => {
      acc.total++;
      switch (lead.calculatedPriority) {
        case 1: acc.overdue++; break;
        case 2: acc.today++; break;
        case 3: acc.tomorrow++; break;
        case 4: acc.thisWeek++; break;
        case 5: acc.future++; break;
        case 999: acc.noFollowUp++; break;
      }
      return acc;
    }, {
      total: 0,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      future: 0,
      noFollowUp: 0
    });
  }, [sortedLeads]);

  return {
    leads: sortedLeads,
    summary
  };
};

export default useLeadPriority;
