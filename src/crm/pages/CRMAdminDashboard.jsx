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
  const { leads, workLogs, employees } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Basic role protection is handled by ProtectedRoute, but ensure component correctness
    if (user && user.role !== ROLES.SUPER_ADMIN) {
      // Logic handled in route usually
    }
  }, [user, navigate]);

  // Calculations
  const totalLeads = leads.length; 
  const realTotalCalls = workLogs.reduce((sum, log) => sum + log.totalCalls, 0);
  const realConnected = workLogs.reduce((sum, log) => sum + log.connectedCalls, 0);
  const avgConversion = realTotalCalls > 0 ? Math.round((realConnected / realTotalCalls) * 100) : 0;
  const totalStaff = employees.length;
  
  // Determine Top Performer
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

  const sourceData = [
    { name: 'Facebook', value: 45 },
    { name: 'Google Ads', value: 30 },
    { name: 'Referrals', value: 15 },
    { name: 'Direct', value: 10 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

      {/* Stats Cards */}
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
        <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Calls</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{realTotalCalls}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-yellow-50 to-white border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Avg Conversion</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">{avgConversion}%</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-pink-50 to-white border-l-4 border-pink-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Top Performer</p>
            <h3 className="text-lg font-bold text-[#0F3A5F] truncate">{topPerformer.name}</h3>
            <p className="text-xs text-green-600">{topPerformer.rate}% Rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-red-50 to-white border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Pending Reports</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F]">0</h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Card className="p-4 shadow-sm">
            <CardHeader><CardTitle>Lead Sources Overview</CardTitle></CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right: Quick Actions / Activity */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-3 border-b">
               <CardTitle className="text-lg">Recent System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
               <div className="space-y-4">
                 <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                   System health check passed. Database sync active.
                 </div>
                 <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                   New content published to Homepage Slider by Admin.
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRMAdminDashboard;