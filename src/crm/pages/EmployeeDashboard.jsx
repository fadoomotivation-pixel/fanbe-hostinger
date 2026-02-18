
import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Users, Phone, MapPin, CheckCircle, TrendingUp, AlertCircle,
  ArrowRight, Calendar, Download
} from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, workLogs } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Filtering Data ---
  const myLeads = leads.filter(l => l.assignedTo === user.id);

  // Today's Stats
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = workLogs.filter(l => l.employeeId === user.id && l.date === today);
  const callsToday = todayLogs.reduce((acc, l) => acc + l.totalCalls, 0);
  const connectedToday = todayLogs.reduce((acc, l) => acc + l.connectedCalls, 0);
  const visitsToday = todayLogs.reduce((acc, l) => acc + l.siteVisits, 0);
  const bookingsToday = todayLogs.reduce((acc, l) => acc + (l.bookings || 0), 0);

  // Targets (Hardcoded for demo)
  const targets = { calls: 50, visits: 2, bookings: 1 };

  // Overdue Follow-ups
  const overdueLeads = myLeads.filter(l => {
    if (l.status !== 'FollowUp' || !l.followUpDate) return false;
    return new Date(l.followUpDate) < new Date(today);
  }).slice(0, 5);

  const stats = [
    { label: 'Assigned Leads', value: myLeads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Calls Today', value: callsToday, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Visits Today', value: visitsToday, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Bookings', value: bookingsToday, icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  ];

  // ── Export My Data ────────────────────────────────────────────────────
  const handleExportData = () => {
    try {
      const keys = [
        'crm_work_logs',
        'crm_calls',
        'crm_site_visits',
        'crm_bookings_granular',
        'crm_tasks',
        'crm_eod_reports',
        'workLogs',
        'calls',
        'siteVisits',
        'bookings',
        'tasks',
        'eodReports',
      ];

      const exportData = {
        exportedBy: user.name,
        employeeId: user.id,
        username: user.username,
        exportedAt: new Date().toISOString(),
        data: {}
      };

      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            // Only export records that belong to this employee
            if (Array.isArray(parsed)) {
              exportData.data[k] = parsed.filter(item =>
                !item.employeeId || item.employeeId === user.id ||
                !item.userId || item.userId === user.id
              );
            } else {
              exportData.data[k] = parsed;
            }
          } catch {
            exportData.data[k] = raw;
          }
        }
      });

      // Count total records
      const totalRecords = Object.values(exportData.data).reduce((acc, val) =>
        acc + (Array.isArray(val) ? val.length : 1), 0
      );

      if (totalRecords === 0) {
        toast({
          title: '⚠️ No Data Found',
          description: 'No local activity data found to export.',
          variant: 'destructive'
        });
        return;
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_crm_data_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: '✅ Export Successful!',
        description: `${totalRecords} records exported. Send this file to your admin.`,
        duration: 6000
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: '❌ Export Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500">Here's your activity overview for today.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* Export My Data Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export My Data
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow Ups Alert */}
          {overdueLeads.length > 0 && (
            <Card className="border-l-4 border-red-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-600 flex items-center text-lg">
                  <AlertCircle className="mr-2 h-5 w-5" /> Follow-ups Overdue ({overdueLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-bold text-gray-800">{lead.name}</p>
                        <p className="text-xs text-red-500">Due: {new Date(lead.followUpDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-200" onClick={() => window.location.href = `tel:${lead.phone}`}>
                          <Phone size={14} className="text-red-600" />
                        </Button>
                        <WhatsAppButton
                          leadName={lead.name}
                          projectName={lead.project}
                          phoneNumber={lead.phone}
                          size="sm"
                          className="h-8 px-2 bg-green-500 hover:bg-green-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Priority Leads</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate('/crm/my-leads')}>
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeads.slice(0, 5).map(lead => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                    onClick={() => navigate(`/crm/lead/${lead.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white
                        ${lead.status === 'Booked' ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.project} • {lead.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                        <Phone size={16} />
                      </Button>
                      <WhatsAppButton
                        leadName={lead.name}
                        projectName={lead.project}
                        phoneNumber={lead.phone}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-400 hover:text-green-600 bg-transparent hover:bg-transparent"
                      />
                    </div>
                  </div>
                ))}
                {myLeads.length === 0 && <p className="text-center text-gray-500 py-4">No leads assigned yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Targets */}
          <Card>
            <CardHeader><CardTitle>Daily Targets</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Calls ({callsToday}/{targets.calls})</span>
                  <span className="font-bold text-blue-600">{Math.round((callsToday / targets.calls) * 100)}%</span>
                </div>
                <Progress value={(callsToday / targets.calls) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Site Visits ({visitsToday}/{targets.visits})</span>
                  <span className="font-bold text-purple-600">{Math.round((visitsToday / targets.visits) * 100)}%</span>
                </div>
                <Progress value={(visitsToday / targets.visits) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bookings ({bookingsToday}/{targets.bookings})</span>
                  <span className="font-bold text-yellow-600">{Math.round((bookingsToday / targets.bookings) * 100)}%</span>
                </div>
                <Progress value={(bookingsToday / targets.bookings) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions List */}
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2" onClick={() => navigate('/crm/sales/daily-calling')}>
                <Phone className="h-5 w-5 text-blue-500" />
                <span className="text-xs">Log Call</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2" onClick={() => navigate('/crm/sales/site-visits')}>
                <MapPin className="h-5 w-5 text-purple-500" />
                <span className="text-xs">Log Visit</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2" onClick={() => navigate('/crm/sales/eod-reports')}>
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-xs">EOD Report</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2" onClick={() => navigate('/crm/sales/tasks')}>
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-xs">Tasks</span>
              </Button>
            </CardContent>
          </Card>

          {/* Export Info Card */}
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Export Your Data</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Click <strong>"Export My Data"</strong> at the top to download all your calls, visits, tasks & reports as a JSON file. Send it to your admin to migrate to the cloud.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
