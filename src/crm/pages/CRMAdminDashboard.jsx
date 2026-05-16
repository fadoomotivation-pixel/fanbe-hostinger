import React, { useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, UserPlus, Briefcase, Activity, Globe, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROLES } from '@/lib/permissions';

const CRMAdminDashboard = () => {
  const { leads, employees, workLogs } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculated from Supabase data
  const totalLeads   = leads.length;
  const totalStaff   = employees.filter(e => e.role !== 'super_admin').length;
  const openLeads    = leads.filter(l => l.status === 'Open').length;
  const followUpLeads = leads.filter(l => l.status === 'FollowUp').length;
  const bookedLeads  = leads.filter(l => l.status === 'Booked').length;
  const lostLeads    = leads.filter(l => l.status === 'Lost').length;

  // workLogs from localStorage (calls/visits logged by employees)
  const realTotalCalls  = workLogs.reduce((sum, log) => sum + (log.totalCalls || 0), 0);
  const realConnected   = workLogs.reduce((sum, log) => sum + (log.connectedCalls || 0), 0);
  const avgConversion   = realTotalCalls > 0 ? Math.round((realConnected / realTotalCalls) * 100) : 0;

  // Top performer from employees + workLogs
  const empPerformance = {};
  workLogs.forEach(log => {
    if (!empPerformance[log.employeeId]) empPerformance[log.employeeId] = { connected: 0, total: 0 };
    empPerformance[log.employeeId].connected += log.connectedCalls || 0;
    empPerformance[log.employeeId].total     += log.totalCalls     || 0;
  });
  let topPerformer = { name: 'N/A', rate: 0 };
  Object.keys(empPerformance).forEach(empId => {
    const stats = empPerformance[empId];
    if (stats.total === 0) return;
    const rate = Math.round((stats.connected / stats.total) * 100);
    if (rate > topPerformer.rate) {
      const emp = employees.find(e => e.id === empId);
      topPerformer = { name: emp?.name || empId, rate };
    }
  });

  // Lead Sources from real Supabase leads
  const sourceCounts = leads.reduce((acc, l) => {
    const src = l.source || 'Direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F3A5F]">Super Admin Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {user?.name}! <span className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{user?.role}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Last Login: {new Date(user?.lastLogin || Date.now()).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" onClick={() => navigate('/crm/admin/cms')} className="whitespace-nowrap">
            <Globe className="mr-2 h-4 w-4" /> Content Mgmt
          </Button>
          <Button variant="outline" onClick={() => navigate('/crm/admin/settings/staff')} className="whitespace-nowrap">
            <Briefcase className="mr-2 h-4 w-4" /> Manage Staff
          </Button>
          <Button variant="outline" onClick={() => navigate('/crm/admin/settings')} className="whitespace-nowrap">
            <SettingsIcon className="mr-2 h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards - All from Supabase */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Staff</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{totalStaff}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Leads</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{totalLeads}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Open</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{openLeads}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-yellow-50 to-white border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Follow-Ups</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{followUpLeads}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-green-50 to-white border-l-4 border-green-600">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Booked</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{bookedLeads}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-red-50 to-white border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Lost</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{lostLeads}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left: Lead Sources Pie from real data */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Card className="p-4 shadow-sm">
            <CardHeader><CardTitle>Lead Sources Overview (Live)</CardTitle></CardHeader>
            <div className="h-64">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No lead source data yet</div>
              )}
            </div>
          </Card>

          {/* Staff Table from Supabase */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Active Staff ({totalStaff})</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y">
                {employees.filter(e => e.role !== 'super_admin').slice(0, 6).map(emp => (
                  <div key={emp.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {(emp.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{emp.role}</span>
                  </div>
                ))}
                {employees.length === 0 && (
                  <p className="text-center text-gray-400 py-4 text-sm">No staff found in Supabase</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: System Alerts + Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Lead Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { label: 'Open',      count: openLeads,     color: 'bg-blue-500' },
                { label: 'Follow-Up', count: followUpLeads, color: 'bg-orange-500' },
                { label: 'Booked',    count: bookedLeads,   color: 'bg-green-500' },
                { label: 'Lost',      count: lostLeads,     color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-800">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                ✅ Supabase database sync active.
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                📊 {totalLeads} leads loaded live from database.
              </div>
              <div className="p-3 bg-purple-50 text-purple-800 rounded-lg text-sm">
                👥 {totalStaff} staff accounts active.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRMAdminDashboard;
