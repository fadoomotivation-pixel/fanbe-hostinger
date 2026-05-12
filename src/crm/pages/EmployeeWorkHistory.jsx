
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const EmployeeWorkHistory = () => {
  const { workLogs, employees } = useCRMData();
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredLogs = workLogs.filter(log => {
    if (selectedEmp !== 'all' && log.employeeId !== selectedEmp) return false;
    if (dateRange.start && log.date < dateRange.start) return false;
    if (dateRange.end && log.date > dateRange.end) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      Date: log.date,
      Employee: employees.find(e => e.id === log.employeeId)?.name || log.employeeId,
      'Total Calls': log.totalCalls,
      'Connected Calls': log.connectedCalls,
      'Site Visits': log.siteVisits,
      'Conversion Rate': `${log.conversionRate}%`,
      'Token': log.token,
      'Major Objection': log.majorObjection
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Logs");
    XLSX.writeFile(wb, "Employee_Work_History.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Employee Performance History</h1>
        <Button onClick={exportToExcel} variant="outline" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Employee</label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.filter(e => e.role !== 'super_admin').map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">From Date</label>
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">To Date</label>
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </div>

            <div className="flex items-end">
              <Button 
                variant="ghost" 
                onClick={() => { setSelectedEmp('all'); setDateRange({start:'', end:''}); }}
                className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-center">Calls (Total/Conn)</TableHead>
              <TableHead className="text-center">Site Visits</TableHead>
              <TableHead className="text-center">Conversion</TableHead>
              <TableHead className="text-center">Token</TableHead>
              <TableHead>Objection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-gray-400">No logs found matching criteria.</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map(log => {
                const emp = employees.find(e => e.id === log.employeeId);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>{emp?.name || log.employeeId}</div>
                      <div className="text-xs text-gray-400">{emp?.role}</div>
                    </TableCell>
                    <TableCell className="text-center">{log.totalCalls} / <span className="text-blue-600 font-bold">{log.connectedCalls}</span></TableCell>
                    <TableCell className="text-center">{log.siteVisits}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${log.conversionRate > 10 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {log.conversionRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{log.token}</TableCell>
                    <TableCell className="text-sm text-gray-500 truncate max-w-[150px]">{log.majorObjection}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredLogs.map(log => {
          const emp = employees.find(e => e.id === log.employeeId);
          return (
            <Card key={log.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-[#0F3A5F]">{emp?.name || 'Unknown'}</h3>
                    <p className="text-xs text-gray-500">{new Date(log.date).toDateString()}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${log.conversionRate > 10 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {log.conversionRate}% Conv.
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded flex justify-between">
                    <span className="text-gray-500">Total Calls</span>
                    <span className="font-medium">{log.totalCalls}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded flex justify-between">
                    <span className="text-gray-500">Connected</span>
                    <span className="font-medium">{log.connectedCalls}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded flex justify-between">
                    <span className="text-gray-500">Visits</span>
                    <span className="font-medium">{log.siteVisits}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded flex justify-between">
                    <span className="text-gray-500">Token</span>
                    <span className="font-medium">{log.token}</span>
                  </div>
                </div>
                {log.majorObjection && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Obj: {log.majorObjection}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
         {filteredLogs.length === 0 && <div className="text-center py-8 text-gray-400">No logs found.</div>}
      </div>
    </div>
  );
};

export default EmployeeWorkHistory;
