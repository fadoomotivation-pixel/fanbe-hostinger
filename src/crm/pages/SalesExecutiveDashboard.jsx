import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, Users, Calendar, TrendingUp, CheckSquare, PlusCircle, 
  Clock, ArrowUpRight, DollarSign, Activity 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Ensure this exists or use simple div
import { format } from 'date-fns';

const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const { leads, calls, siteVisits, bookings, tasks } = useCRMData();
  const navigate = useNavigate();

  // Filter Data for "My" Metrics
  const myLeads = leads.filter(l => l.assignedTo === user?.id);
  const myCalls = calls.filter(c => c.employeeId === user?.id);
  const myVisits = siteVisits.filter(v => v.employeeId === user?.id);
  const myBookings = bookings.filter(b => b.employeeId === user?.id);
  const myTasks = tasks.filter(t => t.employeeId === user?.id);

  // Daily Metrics
  const today = new Date().toISOString().split('T')[0];
  const callsToday = myCalls.filter(c => c.timestamp.startsWith(today));
  const visitsToday = myVisits.filter(v => v.timestamp.startsWith(today));
  const bookingsToday = myBookings.filter(b => b.timestamp.startsWith(today));
  
  const connectedCallsToday = callsToday.filter(c => c.status === 'Connected');
  const totalRevenue = myBookings.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  
  // Tasks Logic
  const pendingTasks = myTasks.filter(t => t.status === 'Pending');
  const tasksToday = pendingTasks.filter(t => t.deadline?.startsWith(today));

  // Recent Activity
  const recentActivity = [
    ...myCalls.map(c => ({ ...c, type: 'call', label: 'Call Logged' })),
    ...myVisits.map(v => ({ ...v, type: 'visit', label: 'Site Visit' })),
    ...myBookings.map(b => ({ ...b, type: 'booking', label: 'Booking' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">Dashboard</h1>
           <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-sm font-medium text-gray-900">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-blue-600 uppercase">Calls Today</p>
                    <h3 className="text-2xl font-bold text-blue-900">{callsToday.length}</h3>
                    <p className="text-xs text-blue-500">{connectedCallsToday.length} Connected</p>
                 </div>
                 <Phone className="text-blue-400 h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-purple-600 uppercase">Site Visits</p>
                    <h3 className="text-2xl font-bold text-purple-900">{visitsToday.length}</h3>
                    <p className="text-xs text-purple-500">Total: {myVisits.length}</p>
                 </div>
                 <Users className="text-purple-400 h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-green-600 uppercase">Bookings</p>
                    <h3 className="text-2xl font-bold text-green-900">{myBookings.length}</h3>
                    <p className="text-xs text-green-500">Val: ₹{(totalRevenue/100000).toFixed(1)}L</p>
                 </div>
                 <DollarSign className="text-green-400 h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Pending Tasks</p>
                    <h3 className="text-2xl font-bold text-orange-900">{pendingTasks.length}</h3>
                    <p className="text-xs text-orange-500">{tasksToday.length} Due Today</p>
                 </div>
                 <CheckSquare className="text-orange-400 h-5 w-5" />
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Main Column */}
         <div className="md:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <Card>
               <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/daily-calling')}>
                     <Phone className="h-5 w-5 text-blue-600" />
                     <span className="text-xs">Log Call</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/site-visits')}>
                     <Users className="h-5 w-5 text-purple-600" />
                     <span className="text-xs">Log Visit</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/bookings')}>
                     <DollarSign className="h-5 w-5 text-green-600" />
                     <span className="text-xs">New Booking</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/tasks')}>
                     <CheckSquare className="h-5 w-5 text-orange-600" />
                     <span className="text-xs">Add Task</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/my-leads')}>
                     <PlusCircle className="h-5 w-5 text-gray-600" />
                     <span className="text-xs">Add Lead</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/eod-reports')}>
                     <Activity className="h-5 w-5 text-red-600" />
                     <span className="text-xs">EOD Report</span>
                  </Button>
               </CardContent>
            </Card>

            {/* My Leads Summary */}
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">My Leads Overview</CardTitle>
                  <Link to="/crm/sales/my-leads" className="text-sm text-blue-600 hover:underline">View All</Link>
               </CardHeader>
               <CardContent>
                  <div className="flex gap-2 mb-4">
                     {['Open', 'FollowUp', 'Booked', 'Lost'].map(status => (
                        <div key={status} className="flex-1 bg-gray-50 rounded p-2 text-center">
                           <div className="text-xs text-gray-500 uppercase">{status}</div>
                           <div className="font-bold text-gray-900">{myLeads.filter(l => l.status === status).length}</div>
                        </div>
                     ))}
                  </div>
                  <div className="space-y-3">
                     <p className="text-xs font-semibold text-gray-500 uppercase">Recently Assigned</p>
                     {myLeads.slice(0, 3).map(lead => (
                        <div key={lead.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                           <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-gray-500">{lead.project} • {lead.phone}</p>
                           </div>
                           <div className={`px-2 py-1 rounded text-xs ${lead.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                              {lead.status}
                           </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Sidebar Column */}
         <div className="space-y-6">
            
            {/* Targets */}
            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-lg">Performance vs Target</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div>
                     <div className="flex justify-between text-xs mb-1">
                        <span>Daily Calls ({callsToday.length}/40)</span>
                        <span>{Math.min(100, Math.round((callsToday.length/40)*100))}%</span>
                     </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (callsToday.length/40)*100)}%` }}></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-xs mb-1">
                        <span>Site Visits ({visitsToday.length}/2)</span>
                        <span>{Math.min(100, Math.round((visitsToday.length/2)*100))}%</span>
                     </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (visitsToday.length/2)*100)}%` }}></div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {recentActivity.map((act, i) => (
                        <div key={i} className="flex gap-3 text-sm border-b pb-2 last:border-0">
                           <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${act.type === 'booking' ? 'bg-green-500' : act.type === 'visit' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                           <div>
                              <p className="font-medium">{act.label}</p>
                              <p className="text-xs text-gray-500">{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs text-gray-400 truncate w-40">{act.notes || 'No notes'}</p>
                           </div>
                        </div>
                     ))}
                     {recentActivity.length === 0 && <p className="text-sm text-gray-500 text-center">No activity today.</p>}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default SalesExecutiveDashboard;