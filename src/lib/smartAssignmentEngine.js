
// Mock data for employee stats - in real app would come from DB
export const getEmployeeStats = (employees) => {
    return employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        currentLoad: Math.floor(Math.random() * 20), // Mock active leads
        performanceScore: (Math.random() * 5).toFixed(1), // Mock rating out of 5
        expertise: ['Residential', 'Luxury'].slice(0, Math.floor(Math.random() * 2) + 1),
        isAvailable: Math.random() > 0.2 // 80% available
    }));
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
