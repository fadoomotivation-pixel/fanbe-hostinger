import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ROLES } from '@/lib/permissions';

const BookingAnalytics = () => {
  const { customers, projects, employees, workLogs } = useCRMData();

  // ─── Real Data: Bookings by Project ──────────────────────────────────────────────────────────────────────
  const projectBookingsMap = {};
  customers.filter(c => c.status === 'Booked').forEach(c => {
    const projId = c.projectId || 'Unassigned';
    if (!projectBookingsMap[projId]) projectBookingsMap[projId] = 0;
    projectBookingsMap[projId] += 1;
  });
  const projectBookings = Object.entries(projectBookingsMap).map(([projId, bookings]) => {
    const proj = projects.find(p => p.id === projId);
    return { name: proj?.name || projId, bookings };
  }).sort((a, b) => b.bookings - a.bookings).slice(0, 5); // Top 5

  // ─── Real Data: Bookings by Staff (from workLogs.bookings field) ─────────────────────────────────────────
  const staffBookingsMap = {};
  workLogs.forEach(log => {
    if (!log.bookings || log.bookings <= 0) return;
    if (!staffBookingsMap[log.employeeId]) staffBookingsMap[log.employeeId] = 0;
    staffBookingsMap[log.employeeId] += log.bookings;
  });
  const staffBookings = Object.entries(staffBookingsMap).map(([empId, bookings]) => {
    const emp = employees.find(e => e.id === empId);
    return { name: emp?.name || empId, bookings };
  }).sort((a, b) => b.bookings - a.bookings).slice(0, 10); // Top 10

  // ─── Monthly Booking Trend (from customers' createdAt or updatedAt) ──────────────────────────────────────
  const monthlyBookingsMap = {};
  customers.filter(c => c.status === 'Booked').forEach(c => {
    const date = new Date(c.updatedAt || c.createdAt || Date.now());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyBookingsMap[monthKey]) {
      monthlyBookingsMap[monthKey] = { name: monthKey, count: 0 };
    }
    monthlyBookingsMap[monthKey].count += 1;
  });
  const monthlyTrend = Object.values(monthlyBookingsMap).sort((a, b) => a.name.localeCompare(b.name)).slice(-6); // Last 6 months
  const formattedMonthlyTrend = monthlyTrend.map(m => ({
    name: new Date(m.name + '-01').toLocaleDateString('en-US', { month: 'short' }),
    count: m.count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA66CC'];

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <div>
           <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">Booking Analytics</h1>
           <p className="text-xs sm:text-sm text-gray-500">Sales closure insights</p>
         </div>
         <Button variant="outline" className="text-xs h-9 gap-1.5">
           <Download size={14} /> Export
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bookings by Project */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Bookings by Project (Top 5)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {projectBookings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectBookings} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                     <XAxis type="number" tick={{ fontSize: 10 }} />
                     <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                     <Tooltip />
                     <Bar dataKey="bookings" fill="#8884d8" radius={[0, 4, 4, 0]}>
                       {projectBookings.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No project bookings data available yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings by Staff */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Bookings by Staff (Top 10)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {staffBookings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffBookings} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" tick={{ fontSize: 9, angle: -20 }} height={60} />
                     <YAxis tick={{ fontSize: 10 }} />
                     <Tooltip />
                     <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No staff bookings data available yet.
                </div>
              )}
            </CardContent>
          </Card>
       </div>

       {/* Monthly Booking Trend */}
       <Card className="shadow-sm">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm font-semibold">Monthly Booking Trend (Last 6 Months)</CardTitle>
         </CardHeader>
         <CardContent className="h-[280px]">
           {formattedMonthlyTrend.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={formattedMonthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                 <YAxis tick={{ fontSize: 10 }} />
                 <Tooltip />
                 <Line type="monotone" dataKey="count" name="Bookings" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
               </LineChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-sm text-gray-400">
               No monthly booking trend data available yet.
             </div>
           )}
         </CardContent>
       </Card>
    </div>
  );
};

export default BookingAnalytics;
