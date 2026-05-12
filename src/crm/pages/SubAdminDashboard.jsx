
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, TrendingUp, Phone, Calendar, ArrowUpRight, DollarSign, 
  Activity, ArrowDownRight, Award, FileText, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SubAdminDashboard = () => {
  const { user } = useAuth();
  const { leads, workLogs, employees, customers } = useCRMData();
  const [dateRange, setDateRange] = useState('month');

  // --- Mock Calculations for Demo ---
  const totalRevenue = customers.reduce((acc, c) => acc + (c.bookingAmount || 0), 0);
  const totalBookings = customers.length;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  
  const totalCalls = workLogs.reduce((acc, l) => acc + l.totalCalls, 0);
  const connectedCalls = workLogs.reduce((acc, l) => acc + l.connectedCalls, 0);
  const siteVisits = workLogs.reduce((acc, l) => acc + l.siteVisits, 0);
  
  const conversionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  // Lead Funnel Data
  const leadStatusCounts = {
    Open: leads.filter(l => l.status === 'Open').length,
    FollowUp: leads.filter(l => l.status === 'FollowUp').length,
    Booked: leads.filter(l => l.status === 'Booked').length,
    Lost: leads.filter(l => l.status === 'Lost').length,
  };

  const funnelData = [
    { name: 'Total Leads', value: leads.length, fill: '#3b82f6' },
    { name: 'Engaged (Calls)', value: connectedCalls, fill: '#8b5cf6' },
    { name: 'Site Visits', value: siteVisits, fill: '#ec4899' },
    { name: 'Bookings', value: totalBookings, fill: '#10b981' }
  ];

  // Project Performance Mock Data
  const projects = [
    { name: 'Shree Kunj Bihari', revenue: 12500000, bookings: 5, leads: 45 },
    { name: 'Khatu Shyam Enclave', revenue: 8500000, bookings: 3, leads: 32 },
    { name: 'Jagannath Dham', revenue: 18000000, bookings: 8, leads: 56 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3A5F]">Executive CRM Dashboard</h1>
          <p className="text-gray-500">Performance overview & key metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                 <h3 className="text-3xl font-bold mt-2">₹{(totalRevenue / 100000).toFixed(1)}L</h3>
                 <div className="flex items-center mt-2 text-blue-100 text-xs">
                   <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% from last month
                 </div>
               </div>
               <div className="p-2 bg-white/20 rounded-lg">
                 <DollarSign className="h-6 w-6 text-white" />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-purple-100 text-sm font-medium">Total Bookings</p>
                 <h3 className="text-3xl font-bold mt-2">{totalBookings}</h3>
                 <div className="flex items-center mt-2 text-purple-100 text-xs">
                   <ArrowUpRight className="h-3 w-3 mr-1" /> +3 new this week
                 </div>
               </div>
               <div className="p-2 bg-white/20 rounded-lg">
                 <Award className="h-6 w-6 text-white" />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-500 text-sm font-medium uppercase">Conversion Rate</p>
                 <h3 className="text-3xl font-bold mt-2 text-gray-800">{conversionRate}%</h3>
                 <p className="text-xs text-green-600 mt-1">Healthy Range</p>
               </div>
               <Activity className="h-5 w-5 text-green-500" />
             </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-orange-500 shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-500 text-sm font-medium uppercase">Active Leads</p>
                 <h3 className="text-3xl font-bold mt-2 text-gray-800">{leads.filter(l=>l.status==='Open'||l.status==='FollowUp').length}</h3>
                 <p className="text-xs text-orange-600 mt-1">Requiring Attention</p>
               </div>
               <Users className="h-5 w-5 text-orange-500" />
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <Card className="lg:col-span-2 shadow-sm">
           <CardHeader><CardTitle>Sales Funnel Visualization</CardTitle></CardHeader>
           <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                  layout="vertical" 
                  data={funnelData} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>

        {/* Lead Status Distribution */}
        <Card className="shadow-sm">
           <CardHeader><CardTitle>Lead Status</CardTitle></CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={[
                     { name: 'Open', value: leadStatusCounts.Open }, 
                     { name: 'Follow-up', value: leadStatusCounts.FollowUp },
                     { name: 'Booked', value: leadStatusCounts.Booked },
                     { name: 'Lost', value: leadStatusCounts.Lost }
                   ]}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   <Cell fill="#3b82f6" />
                   <Cell fill="#f59e0b" />
                   <Cell fill="#10b981" />
                   <Cell fill="#ef4444" />
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>

      {/* Project Performance Cards */}
      <h2 className="text-xl font-bold text-[#0F3A5F]">Project Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {projects.map((proj, idx) => (
           <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-blue-500">
             <CardHeader className="pb-2">
               <CardTitle className="text-base font-bold text-gray-800">{proj.name}</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Revenue</span>
                   <span className="font-bold">₹{(proj.revenue / 100000).toFixed(1)}L</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Bookings</span>
                   <span className="font-bold">{proj.bookings}</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                   <div 
                     className="bg-blue-500 h-1.5 rounded-full" 
                     style={{ width: `${(proj.bookings / 10) * 100}%` }}
                   ></div>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Staff Activity Table (Mini) */}
      <Card className="shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Staff Compliance & Recent Activity</CardTitle>
            <Button variant="outline" size="sm">View Full Report</Button>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Staff Member</TableHead>
                 <TableHead>Last Login</TableHead>
                 <TableHead>EOD Status</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {employees.filter(e => e.role === 'sales_executive').slice(0, 5).map(emp => (
                 <TableRow key={emp.id}>
                   <TableCell className="font-medium">
                     <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                         {emp.name.charAt(0)}
                       </div>
                       {emp.name}
                     </div>
                   </TableCell>
                   <TableCell className="text-xs text-gray-500">Today, 09:30 AM</TableCell>
                   <TableCell>
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       Submitted
                     </span>
                   </TableCell>
                   <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${emp.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                        {emp.status}
                      </span>
                   </TableCell>
                   <TableCell className="text-right">
                     <Button variant="ghost" size="sm">Details</Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminDashboard;
