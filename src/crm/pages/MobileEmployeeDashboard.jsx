
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, MapPin, CheckCircle, ClipboardList, FileText, ArrowRight } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';

const MobileEmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, workLogs } = useCRMData();
  const navigate = useNavigate();
  
  const myLeads = leads.filter(l => l.assignedTo === user.id);
  const openLeads = myLeads.filter(l => l.status === 'Open').length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayLog = workLogs.find(l => l.employeeId === user.id && l.date === today);
  
  const callsToday = todayLog?.totalCalls || 0;
  const visitsToday = todayLog?.siteVisits || 0;
  const bookingsToday = todayLog?.bookings || 0;

  const quickActions = [
      { label: "My Leads", icon: Users, path: "/crm/my-leads", color: "bg-blue-100 text-blue-600" },
      { label: "Log Call", icon: Phone, path: "/crm/sales/daily-calling", color: "bg-green-100 text-green-600" },
      { label: "Log Visit", icon: MapPin, path: "/crm/sales/site-visits", color: "bg-purple-100 text-purple-600" },
      { label: "Log Booking", icon: CheckCircle, path: "/crm/sales/bookings", color: "bg-yellow-100 text-yellow-600" },
      { label: "EOD Report", icon: ClipboardList, path: "/crm/sales/eod-reports", color: "bg-orange-100 text-orange-600" },
      { label: "Materials", icon: FileText, path: "/crm/sales/tools", color: "bg-gray-100 text-gray-600" },
  ];

  return (
    <div className="pb-24 pt-4 px-4 space-y-6 bg-gray-50 min-h-screen">
       {/* Header */}
       <div className="flex justify-between items-center">
           <div>
               <h1 className="text-xl font-bold text-gray-900">Hi, {user.name.split(' ')[0]}! 👋</h1>
               <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
           </div>
           <div className="bg-white p-2 rounded-lg shadow-sm border text-center min-w-[80px]">
               <p className="text-xs text-gray-500 uppercase">Leads</p>
               <p className="font-bold text-blue-600 text-lg">{myLeads.length}</p>
           </div>
       </div>

       {/* Quick Stats Cards */}
       <div className="grid grid-cols-2 gap-3">
           <Card className="shadow-none border-none bg-white">
               <CardContent className="p-3">
                   <p className="text-xs text-gray-400 uppercase">Calls Today</p>
                   <p className="text-xl font-bold text-gray-800 mt-1">{callsToday}</p>
               </CardContent>
           </Card>
           <Card className="shadow-none border-none bg-white">
               <CardContent className="p-3">
                   <p className="text-xs text-gray-400 uppercase">Open Leads</p>
                   <p className="text-xl font-bold text-blue-600 mt-1">{openLeads}</p>
               </CardContent>
           </Card>
       </div>

       {/* Quick Actions Grid */}
       <div>
           <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
           <div className="grid grid-cols-3 gap-3">
               {quickActions.map((action, idx) => (
                   <button 
                      key={idx}
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                   >
                       <div className={`p-2 rounded-full mb-2 ${action.color}`}>
                           <action.icon size={20} />
                       </div>
                       <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{action.label}</span>
                   </button>
               ))}
           </div>
       </div>

       {/* Leads Requiring Follow-up */}
       <div>
            <div className="flex justify-between items-center mb-3">
               <h2 className="text-sm font-bold text-gray-700">Follow-ups Due</h2>
               <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 text-xs" onClick={() => navigate('/crm/my-leads')}>View All</Button>
            </div>
            <div className="space-y-3">
                {myLeads.filter(l => l.status === 'FollowUp').slice(0, 3).map(lead => (
                    <Card key={lead.id} className="border-l-4 border-l-yellow-500 shadow-sm">
                        <CardContent className="p-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-sm text-gray-800">{lead.name}</p>
                                <p className="text-xs text-gray-500">{lead.project}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
                                    <Phone size={14} />
                                </Button>
                                <WhatsAppButton 
                                    leadName={lead.name}
                                    phoneNumber={lead.phone}
                                    size="sm"
                                    className="h-8 px-2 rounded-full"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {myLeads.filter(l => l.status === 'FollowUp').length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-4 bg-white rounded-lg border border-dashed">No pending follow-ups</p>
                )}
            </div>
       </div>
    </div>
  );
};

export default MobileEmployeeDashboard;
