// src/crm/pages/CallAnalytics.jsx
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Phone, PhoneIncoming, Clock, Download } from 'lucide-react';

const CallAnalytics = () => {
  const { workLogs } = useCRMData();
  
  // ── Real aggregated data ───────────────────────────────────────────────────────────────
  const totalCalls = workLogs.reduce((acc, l) => acc + (l.totalCalls || 0), 0);
  const connectedCalls = workLogs.reduce((acc, l) => acc + (l.connectedCalls || 0), 0);
  const connectionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  // ── Avg Call Duration ── (computed from logs if `callDuration` field exists)
  const logsWithDuration = workLogs.filter(l => l.callDuration && l.callDuration > 0);
  const avgDurationSec = logsWithDuration.length > 0
    ? Math.round(logsWithDuration.reduce((sum, l) => sum + l.callDuration, 0) / logsWithDuration.length)
    : 0;
  const avgDurationDisplay = avgDurationSec > 0
    ? `${Math.floor(avgDurationSec / 60)}m ${avgDurationSec % 60}s`
    : 'N/A';

  // ── Daily trends (last 14 days) ────────────────────────────────────────────────────────────────────
  const dailyTrends = workLogs
    .slice(0, 14)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' }),
      calls: l.totalCalls || 0,
      connected: l.connectedCalls || 0,
    }))
    .reverse();

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <div>
           <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">Call Analytics</h1>
           <p className="text-xs sm:text-sm text-gray-500">Tele-calling performance metrics</p>
         </div>
         <Button variant="outline" className="text-xs h-9 gap-1.5">
           <Download size={14} /> Export
         </Button>
       </div>

       {/* ── KPI Cards ────────────────────────────────────────────────────────────────────── */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Total Calls</p>
                <h3 className="text-2xl font-bold text-blue-900 leading-none mt-1">{totalCalls}</h3>
              </div>
              <Phone className="text-blue-400 h-5 w-5" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Connected</p>
                <h3 className="text-2xl font-bold text-green-900 leading-none mt-1">{connectedCalls}</h3>
              </div>
              <PhoneIncoming className="text-green-400 h-5 w-5" />
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide">Connect Rate</p>
                <h3 className="text-2xl font-bold text-purple-900 leading-none mt-1">{connectionRate}%</h3>
              </div>
              <div className="text-purple-400 font-bold text-xl">٪</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">Avg Duration</p>
                <h3 className="text-xl font-bold text-orange-900 leading-none mt-1">{avgDurationDisplay}</h3>
              </div>
              <Clock className="text-orange-400 h-5 w-5" />
            </CardContent>
          </Card>
       </div>

       {/* ── Chart ──────────────────────────────────────────────────────────────────────────────────── */}
       <Card className="shadow-sm">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Call Volume vs Connection Trend</CardTitle>
         </CardHeader>
         <CardContent className="h-[300px] sm:h-[350px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={dailyTrends} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="date" tick={{ fontSize: 10 }} />
               <YAxis tick={{ fontSize: 10 }} />
               <Tooltip />
               <Bar dataKey="calls" name="Total Calls" fill="#94a3b8" radius={[4, 4, 0, 0]} />
               <Bar dataKey="connected" name="Connected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </CardContent>
       </Card>
    </div>
  );
};

export default CallAnalytics;
