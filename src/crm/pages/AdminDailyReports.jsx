
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminDailyReports = () => {
  const { workLogs, employees } = useCRMData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter logs for selected date
  const logsForDate = workLogs.filter(log => log.date === selectedDate);
  
  // Create unified list of all employees + their status for the day
  const reportData = employees
    .filter(e => e.role !== 'super_admin' && e.status === 'Active')
    .map(emp => {
      const log = logsForDate.find(l => l.employeeId === emp.id);
      return {
        empId: emp.id,
        name: emp.name,
        log: log || null,
        status: log ? 'Submitted' : 'Pending'
      };
    })
    .filter(item => {
      if (statusFilter === 'all') return true;
      return item.status === statusFilter;
    });

  // Stats
  const totalCalls = logsForDate.reduce((sum, l) => sum + (l.totalCalls || 0), 0);
  const totalConversions = logsForDate.reduce((sum, l) => sum + (l.connectedCalls || 0), 0);
  const avgConversion = totalCalls > 0 ? Math.round((totalConversions / totalCalls) * 100) : 0;
  const pendingCount = employees.filter(e => e.role !== 'super_admin' && e.status === 'Active').length - logsForDate.length;
  
  const topPerformerLog = logsForDate.reduce((prev, current) => (prev.conversionRate > current.conversionRate) ? prev : current, { conversionRate: -1 });
  const topPerformerName = topPerformerLog.employeeId ? employees.find(e => e.id === topPerformerLog.employeeId)?.name : 'N/A';

  const exportToExcel = () => {
    const data = reportData.map(item => ({
      Date: selectedDate,
      Employee: item.name,
      Status: item.status,
      'Total Calls': item.log?.totalCalls || 0,
      'Connected': item.log?.connectedCalls || 0,
      'Site Visits': item.log?.siteVisits || 0,
      'Conversion %': item.log?.conversionRate || 0,
      'Token': item.log?.token || 0,
      'Objection': item.log?.majorObjection || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Reports");
    XLSX.writeFile(wb, `EOD_Report_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Daily Reports Monitoring</h1>
        <div className="flex w-full md:w-auto gap-2">
           <Input 
             type="date" 
             value={selectedDate} 
             onChange={(e) => setSelectedDate(e.target.value)} 
             className="w-full md:w-48 bg-white"
           />
           <Button onClick={exportToExcel} variant="outline" className="shrink-0">
             <Download className="mr-2 h-4 w-4" /> Export
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{totalCalls}</div>
            <div className="text-xs text-blue-600 font-medium uppercase">Total Calls</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{totalConversions}</div>
            <div className="text-xs text-green-600 font-medium uppercase">Conn. Calls</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{avgConversion}%</div>
            <div className="text-xs text-purple-600 font-medium uppercase">Avg. Conv.</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-yellow-700 truncate">{topPerformerName}</div>
            <div className="text-xs text-yellow-600 font-medium uppercase">Top Performer</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{pendingCount}</div>
            <div className="text-xs text-red-600 font-medium uppercase">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
         <span className="text-sm font-medium text-gray-500">Filter Status:</span>
         <div className="flex gap-2">
           {['All', 'Submitted', 'Pending'].map(s => (
             <button
               key={s}
               onClick={() => setStatusFilter(s === 'All' ? 'all' : s)}
               className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                 (statusFilter === s || (statusFilter === 'all' && s === 'All'))
                 ? 'bg-[#0F3A5F] text-white border-[#0F3A5F]' 
                 : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
               }`}
             >
               {s}
             </button>
           ))}
         </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportData.map((item) => (
          <Card key={item.empId} className={`border-l-4 ${item.status === 'Submitted' ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-[#0F3A5F]">{item.name}</h3>
                  <p className="text-xs text-gray-500">Sales Executive</p>
                </div>
                {item.status === 'Submitted' ? (
                  <span className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    <CheckCircle size={12} className="mr-1" /> Submitted
                  </span>
                ) : (
                  <span className="flex items-center bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                    <Clock size={12} className="mr-1" /> Pending
                  </span>
                )}
              </div>

              {item.status === 'Submitted' && item.log ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-bold text-gray-800">{item.log.totalCalls}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Calls</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-bold text-gray-800">{item.log.connectedCalls}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Conn.</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-bold text-gray-800">{item.log.siteVisits}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Visits</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs pt-2 border-t">
                     <span className="text-gray-500">Objection: <span className="text-gray-800 font-medium">{item.log.majorObjection}</span></span>
                     <span className="text-gray-500">Token: <span className="text-green-600 font-bold">₹{item.log.token}</span></span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                  <AlertCircle className="mx-auto text-gray-300 mb-2" size={24} />
                  <p className="text-xs text-gray-400">No report submitted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {reportData.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">No matching records found.</div>}
      </div>
    </div>
  );
};

export default AdminDailyReports;
