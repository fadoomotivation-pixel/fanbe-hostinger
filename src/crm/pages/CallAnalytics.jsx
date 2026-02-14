
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Phone, PhoneIncoming, Clock, Download } from 'lucide-react';

const CallAnalytics = () => {
  const { workLogs } = useCRMData();
  
  // Aggregated data mock
  const totalCalls = workLogs.reduce((acc, l) => acc + l.totalCalls, 0);
  const connectedCalls = workLogs.reduce((acc, l) => acc + l.connectedCalls, 0);
  const connectionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  
  const dailyTrends = workLogs.slice(0, 14).map(l => ({
    date: new Date(l.date).toLocaleDateString(undefined, {weekday: 'short'}),
    calls: l.totalCalls,
    connected: l.connectedCalls
  })).reverse();

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">Call Analytics</h1>
           <p className="text-sm text-gray-500">Tele-calling performance metrics</p>
         </div>
         <Button variant="outline" className="gap-2">
           <Download size={16} /> Export Data
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Total Calls</p>
                <h3 className="text-2xl font-bold text-blue-900">{totalCalls}</h3>
              </div>
              <Phone className="text-blue-400" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">Connected</p>
                <h3 className="text-2xl font-bold text-green-900">{connectedCalls}</h3>
              </div>
              <PhoneIncoming className="text-green-400" />
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-bold uppercase">Connect Rate</p>
                <h3 className="text-2xl font-bold text-purple-900">{connectionRate}%</h3>
              </div>
              <div className="text-purple-400 font-bold">%</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-bold uppercase">Avg Duration</p>
                <h3 className="text-2xl font-bold text-orange-900">2m 45s</h3>
              </div>
              <Clock className="text-orange-400" />
            </CardContent>
          </Card>
       </div>

       <Card className="shadow-sm">
         <CardHeader><CardTitle>Call Volume vs Connection Trend</CardTitle></CardHeader>
         <CardContent className="h-[350px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={dailyTrends}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="date" />
               <YAxis />
               <Tooltip />
               <Legend />
               <Bar dataKey="calls" name="Total Calls" fill="#94a3b8" radius={[4, 4, 0, 0]} />
               <Bar dataKey="connected" name="Connected Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </CardContent>
       </Card>
    </div>
  );
};

export default CallAnalytics;
