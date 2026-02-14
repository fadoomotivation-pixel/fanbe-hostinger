
// 30 days of dummy performance data
const generateDailyData = (empId, baseCalls, baseConversion) => {
  return Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Randomize slightly
    const totalCalls = baseCalls + Math.floor(Math.random() * 10);
    const connectedCalls = Math.floor(totalCalls * (baseConversion / 100)) + Math.floor(Math.random() * 5);
    const siteVisits = Math.random() > 0.7 ? 1 : 0;
    const bookings = Math.random() > 0.9 ? 1 : 0;
    const emiAmount = bookings * 11000;

    return {
      id: `PERF_${empId}_${dateStr}`,
      employeeId: empId,
      date: dateStr,
      totalCalls,
      connectedCalls,
      siteVisits,
      bookings,
      emiAmount,
      conversionRate: Math.round((connectedCalls / totalCalls) * 100)
    };
  });
};

export const performanceData = [
  ...generateDailyData('EMP001', 45, 70), // Ankita
  ...generateDailyData('EMP002', 35, 65)  // Nidhi
];
