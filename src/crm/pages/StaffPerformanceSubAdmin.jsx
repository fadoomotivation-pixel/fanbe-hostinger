import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { ROLES } from '@/lib/permissions';

const StaffPerformanceSubAdmin = () => {
  const { employees, workLogs, leads } = useCRMData();
  const salesStaff = employees.filter(e => e.role === ROLES.EMPLOYEE);
  
  const [selectedStaffId, setSelectedStaffId] = useState(salesStaff[0]?.id || 'all');
  
  // Aggregate Stats
  const relevantLogs = selectedStaffId === 'all' 
    ? workLogs 
    : workLogs.filter(l => l.employeeId === selectedStaffId);
    
  const totalCalls = relevantLogs.reduce((acc, log) => acc + log.totalCalls, 0);
  const connectedCalls = relevantLogs.reduce((acc, log) => acc + log.connectedCalls, 0);
  const siteVisits = relevantLogs.reduce((acc, log) => acc + log.siteVisits, 0);
  const bookings = relevantLogs.reduce((acc, log) => acc + log.bookings, 0);
  const totalEMI = relevantLogs.reduce((acc, log) => acc + (log.emiAmount || 0), 0);
  const conversionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  // Chart Data (Last 30 Days)
  const chartData = relevantLogs.slice(0, 30).reverse();

  // Associated Leads
  const staffLeads = leads.filter(l => selectedStaffId === 'all' || l.assignedTo === selectedStaffId);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">Fanbe CRM Staff Performance</h1>
          <p className="text-xs sm:text-sm text-gray-500">Analyze team productivity and results</p>
        </div>
        <div className="w-full sm:w-[200px]">
           <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
             <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select Staff" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Staff</SelectItem>
               {salesStaff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-t-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs text-gray-500 uppercase">Total Calls</p>
                 <h3 className="text-2xl font-bold text-blue-700">{totalCalls}</h3>
               </div>
               <Phone className="h-4 w-4 text-blue-400" />
             </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-green-500 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs text-gray-500 uppercase">Connected</p>
                 <h3 className="text-2xl font-bold text-green-700">{connectedCalls}</h3>
               </div>
               <ArrowUpRight className="h-4 w-4 text-green-400" />
             </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-purple-500 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs text-gray-500 uppercase">Site Visits</p>
                 <h3 className="text-2xl font-bold text-purple-700">{siteVisits}</h3>
               </div>
               <Users className="h-4 w-4 text-purple-400" />
             </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs text-gray-500 uppercase">Bookings</p>
                 <h3 className="text-2xl font-bold text-yellow-700">{bookings}</h3>
               </div>
               <TrendingUp className="h-4 w-4 text-yellow-400" />
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart */}
         <Card className="lg:col-span-2 shadow-sm">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-semibold">Daily Activity Trend</CardTitle>
           </CardHeader>
           <CardContent className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top:4, right:10, left:-10, bottom:4 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="date" tickFormatter={val => new Date(val).getDate()} tick={{ fontSize: 10 }} />
                 <YAxis tick={{ fontSize: 10 }} />
                 <Tooltip />
                 <Bar dataKey="totalCalls" name="Total Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="connectedCalls" name="Connected" fill="#22c55e" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>

         {/* Call Logs / Recent History */}
         <Card className="lg:col-span-1 shadow-sm">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-semibold">Recent Logs</CardTitle>
           </CardHeader>
           <div className="max-h-[280px] overflow-y-auto p-4 space-y-3">
              {relevantLogs.slice(0, 10).map((log, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                   <div>
                     <p className="font-medium text-gray-800">{new Date(log.date).toLocaleDateString()}</p>
                     <p className="text-xs text-gray-500">{log.totalCalls} calls made</p>
                   </div>
                   <div className="text-right">
                     <span className={`px-2 py-0.5 rounded-full text-xs ${log.conversionRate > 50 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                       {log.conversionRate}% Conv
                     </span>
                   </div>
                </div>
              ))}
           </div>
         </Card>
      </div>
      
      {/* Leads Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assigned Leads</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffLeads.slice(0, 10).map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 rounded-full text-xs 
                       ${lead.status === 'Booked' ? 'bg-green-100 text-green-800' : 
                         lead.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                       {lead.status}
                     </span>
                  </TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{employees.find(e => e.id === lead.assignedTo)?.name || 'Unassigned'}</TableCell>
                  <TableCell>{new Date(lead.lastActivity).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {staffLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">No leads found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default StaffPerformanceSubAdmin;
