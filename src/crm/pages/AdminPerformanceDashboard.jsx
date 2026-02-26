import React, { useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PhoneCall, Users, TrendingUp, Award, AlertCircle, Activity } from 'lucide-react';
import { ROLES } from '@/lib/permissions';

const AdminPerformanceDashboard = () => {
  const { workLogs, employees, leads } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only allow Sub Admin (and Super Admin if they navigate here manually)
    if (user && user.role !== ROLES.SUB_ADMIN && user.role !== ROLES.SUPER_ADMIN) {
      navigate('/crm/login');
    }
  }, [user, navigate]);

  // Admin Metrics
  const totalLeads = leads.length;
  const realTotalCalls = workLogs.reduce((sum, log) => sum + log.totalCalls, 0);
  const realConnected = workLogs.reduce((sum, log) => sum + log.connectedCalls, 0);
  const avgConversion = realTotalCalls > 0 ? Math.round((realConnected / realTotalCalls) * 100) : 0;
  
  // Find Top Performer
  const empPerformance = {};
  workLogs.forEach(log => {
    if(!empPerformance[log.employeeId]) empPerformance[log.employeeId] = { connected: 0, total: 0 };
    empPerformance[log.employeeId].connected += log.connectedCalls;
    empPerformance[log.employeeId].total += log.totalCalls;
  });
  
  let topPerformer = { name: 'N/A', rate: 0 };
  Object.keys(empPerformance).forEach(empId => {
    const stats = empPerformance[empId];
    const rate = Math.round((stats.connected / stats.total) * 100);
    if(rate > topPerformer.rate) {
      const emp = employees.find(e => e.id === empId);
      topPerformer = { name: emp?.name || empId, rate };
    }
  });

  const staffMembers = employees.filter(e => e.role === ROLES.SALES_EXECUTIVE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Performance Analytics</h1>
        <p className="text-gray-500">Fanbe Admin Console • Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-100 p-2 rounded-full mb-2"><Users size={20} className="text-blue-600"/></div>
            <div className="text-2xl font-bold text-[#0F3A5F]">{totalLeads}</div>
            <div className="text-xs text-gray-500 uppercase">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 p-2 rounded-full mb-2"><PhoneCall size={20} className="text-green-600"/></div>
            <div className="text-2xl font-bold text-[#0F3A5F]">{realTotalCalls}</div>
            <div className="text-xs text-gray-500 uppercase">Total Calls</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             <div className="bg-purple-100 p-2 rounded-full mb-2"><TrendingUp size={20} className="text-purple-600"/></div>
             <div className="text-2xl font-bold text-[#0F3A5F]">{realConnected}</div>
             <div className="text-xs text-gray-500 uppercase">Conversions</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             <div className="bg-yellow-100 p-2 rounded-full mb-2"><Award size={20} className="text-yellow-600"/></div>
             <div className="text-lg font-bold text-[#0F3A5F] truncate w-full">{topPerformer.name}</div>
             <div className="text-xs text-gray-500 uppercase">Top Performer</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             <div className="bg-gray-100 p-2 rounded-full mb-2"><Activity size={20} className="text-gray-600"/></div>
             <div className="text-2xl font-bold text-[#0F3A5F]">{avgConversion}%</div>
             <div className="text-xs text-gray-500 uppercase">Avg Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
           <CardTitle>Staff Performance Report</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Connected</TableHead>
                <TableHead>Site Visits</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map(emp => {
                // Aggregated stats for the employee
                const empLogs = workLogs.filter(l => l.employeeId === emp.id);
                const tCalls = empLogs.reduce((s, l) => s + l.totalCalls, 0);
                const tConn = empLogs.reduce((s, l) => s + l.connectedCalls, 0);
                const tVisits = empLogs.reduce((s, l) => s + l.siteVisits, 0);
                const tBookings = empLogs.reduce((s, l) => s + l.bookings, 0);
                const rate = tCalls > 0 ? Math.round((tConn / tCalls) * 100) : 0;

                return (
                  <TableRow key={emp.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-[#0F3A5F]">{emp.name}</TableCell>
                    <TableCell>{tCalls}</TableCell>
                    <TableCell>{tConn}</TableCell>
                    <TableCell>{tVisits}</TableCell>
                    <TableCell>{tBookings}</TableCell>
                    <TableCell>
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${rate > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {rate}%
                        </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminPerformanceDashboard;
