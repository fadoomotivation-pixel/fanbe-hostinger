
import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneCall, Users, TrendingUp, Award } from 'lucide-react';

const EmployeePerformanceDashboard = () => {
  const { workLogs, employees } = useCRMData();
  const today = new Date().toISOString().split('T')[0];

  const todaysLogs = workLogs.filter(log => log.date === today);

  // Calculate Summary
  const summary = todaysLogs.reduce((acc, log) => {
    acc.totalCalls += log.totalCalls;
    acc.connectedCalls += log.connectedCalls;
    acc.siteVisits += log.siteVisits;
    return acc;
  }, { totalCalls: 0, connectedCalls: 0, siteVisits: 0 });

  const avgConversion = summary.totalCalls > 0 
    ? Math.round((summary.connectedCalls / summary.totalCalls) * 100) 
    : 0;

  const topPerformerLog = todaysLogs.length > 0 
    ? todaysLogs.reduce((prev, current) => (prev.conversionRate > current.conversionRate) ? prev : current)
    : null;
  
  const topPerformerName = topPerformerLog 
    ? employees.find(e => e.id === topPerformerLog.employeeId)?.name 
    : 'N/A';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Live Performance Dashboard</h1>
        <p className="text-gray-500">Real-time overview for {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-100 p-2 rounded-full mb-2"><PhoneCall size={20} className="text-blue-600"/></div>
            <div className="text-2xl font-bold text-[#0F3A5F]">{summary.totalCalls}</div>
            <div className="text-xs text-gray-500">Total Calls Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 p-2 rounded-full mb-2"><TrendingUp size={20} className="text-green-600"/></div>
            <div className="text-2xl font-bold text-[#0F3A5F]">{summary.connectedCalls}</div>
            <div className="text-xs text-gray-500">Connected Calls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             <div className="bg-purple-100 p-2 rounded-full mb-2"><Users size={20} className="text-purple-600"/></div>
             <div className="text-2xl font-bold text-[#0F3A5F]">{summary.siteVisits}</div>
             <div className="text-xs text-gray-500">Site Visits Fixed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             <div className="bg-yellow-100 p-2 rounded-full mb-2"><Award size={20} className="text-yellow-600"/></div>
             <div className="text-lg font-bold text-[#0F3A5F] truncate w-full">{topPerformerName}</div>
             <div className="text-xs text-gray-500">Top Performer</div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <h2 className="text-xl font-bold text-[#0F3A5F] mt-8">Staff Activity Today</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.filter(e => e.role !== 'super_admin').map(emp => {
          const log = todaysLogs.find(l => l.employeeId === emp.id);
          const hasLog = !!log;

          return (
            <Card key={emp.id} className={`border-l-4 ${hasLog ? 'border-l-green-500' : 'border-l-gray-300'}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{emp.name}</h3>
                    <p className="text-xs text-gray-500">{emp.role}</p>
                  </div>
                  {hasLog ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Pending Log</span>
                  )}
                </div>

                {hasLog ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-bold text-blue-700">{log.totalCalls}</div>
                      <div className="text-[10px] text-blue-600 uppercase">Calls</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-bold text-green-700">{log.connectedCalls}</div>
                      <div className="text-[10px] text-green-600 uppercase">Conn.</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="font-bold text-purple-700">{log.conversionRate}%</div>
                      <div className="text-[10px] text-purple-600 uppercase">Rate</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded text-gray-400 text-sm italic">
                    No activity logged yet today.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeePerformanceDashboard;
