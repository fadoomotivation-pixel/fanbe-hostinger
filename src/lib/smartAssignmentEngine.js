
// Compute real employee stats from leads data
// `allLeads` is optional — when provided, currentLoad is the actual assigned count
export const getEmployeeStats = (employees, allLeads = []) => {
    return employees.map(emp => {
        const assignedLeads = allLeads.filter(l =>
            l.assignedTo === emp.id || l.assigned_to === emp.id
        );
        const activeLeads = assignedLeads.filter(l =>
            l.status !== 'Lost' && l.status !== 'Booked'
        );
        return {
            id: emp.id,
            name: emp.name,
            role: emp.role,
            currentLoad: activeLeads.length,
            performanceScore: assignedLeads.length > 0
                ? Math.min(5, (assignedLeads.filter(l => l.status === 'Booked').length / assignedLeads.length * 5) || 1).toFixed(1)
                : '2.5',
            expertise: ['Residential'],
            isAvailable: emp.status !== 'Suspended',
        };
    });
};

export const suggestEmployee = (lead, employeeStats) => {
    // 1. Filter available
    const available = employeeStats.filter(e => e.isAvailable);
    if (available.length === 0) return null;

    // 2. Score each employee for this lead
    const scoredEmployees = available.map(emp => {
        let score = 0;
        
        // Lower load is better
        score += (50 - emp.currentLoad); 
        
        // Higher performance is better
        score += (emp.performanceScore * 10);

        // Expertise match (if lead has project type - mocked here)
        // if (lead.type && emp.expertise.includes(lead.type)) score += 20;

        return { ...emp, matchScore: score };
    });

    // 3. Return highest score
    scoredEmployees.sort((a, b) => b.matchScore - a.matchScore);
    return scoredEmployees[0];
};

export const isVIPLead = (lead) => {
    const budget = parseInt(lead.budget || 0);
    const timeline = (lead.timeline || '').toLowerCase();
    
    // High budget (>50L) or High budget (>20L) + Urgent
    if (budget > 5000000) return true;
    if (budget > 2000000 && (timeline.includes('immediate') || timeline.includes('urgent'))) return true;
    
    return false;
};
