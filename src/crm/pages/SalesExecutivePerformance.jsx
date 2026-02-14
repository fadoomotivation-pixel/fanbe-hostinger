
import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Target, TrendingUp } from 'lucide-react';

const SalesExecutivePerformance = () => {
  const { user } = useAuth();
  const { leads } = useCRMData();
  
  const myLeads = leads.filter(l => l.assignedTo === user.id);
  const totalLeads = myLeads.length;
  const siteVisits = myLeads.filter(l => l.status === 'Site Visit Done').length;
  const bookings = myLeads.filter(l => l.status === 'Booked').length;
  const conversionRate = siteVisits > 0 ? ((bookings / siteVisits) * 100).toFixed(1) : 0;

  // Mock Trend Data
  const data = [
    { name: 'Week 1', leads: 4 },
    { name: 'Week 2', leads: 8 },
    { name: 'Week 3', leads: 6 },
    { name: 'Week 4', leads: 12 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">My Performance</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-blue-100 text-sm">Total Leads</p>
               <h3 className="text-4xl font-bold">{totalLeads}</h3>
             </div>
             <Target className="opacity-50" />
           </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-purple-100 text-sm">Site Visits</p>
               <h3 className="text-4xl font-bold">{siteVisits}</h3>
             </div>
             <Trophy className="opacity-50" />
           </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-green-100 text-sm">Conversion Rate</p>
               <h3 className="text-4xl font-bold">{conversionRate}%</h3>
             </div>
             <TrendingUp className="opacity-50" />
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-bold text-[#0F3A5F] mb-4">Weekly Lead Acquisition</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={data}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Line type="monotone" dataKey="leads" stroke="#0F3A5F" strokeWidth={2} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesExecutivePerformance;
