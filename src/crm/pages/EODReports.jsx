
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EODReportModal from '@/crm/components/EODReportModal';

const EODReports = () => {
  const { user } = useAuth();
  const { eodReports } = useCRMData();
  const [modalOpen, setModalOpen] = useState(false);

  const myReports = eodReports.filter(r => r.employeeId === user?.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-[#0F3A5F]">EOD Reports</h1>
         <Button onClick={() => setModalOpen(true)}>Submit Report</Button>
      </div>

      <Card>
         <CardHeader><CardTitle>Submission History</CardTitle></CardHeader>
         <CardContent>
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Calls</TableHead>
                     <TableHead>Visits</TableHead>
                     <TableHead>Bookings</TableHead>
                     <TableHead>Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {myReports.map(report => (
                     <TableRow key={report.id}>
                        <TableCell>{new Date(report.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>{report.totalCalls}</TableCell>
                        <TableCell>{report.siteVisits}</TableCell>
                        <TableCell>{report.bookings}</TableCell>
                        <TableCell><span className="text-green-600 font-medium">Submitted</span></TableCell>
                     </TableRow>
                  ))}
                  {myReports.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No reports submitted.</TableCell></TableRow>}
               </TableBody>
            </Table>
         </CardContent>
      </Card>

      <EODReportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaveSuccess={() => setModalOpen(false)} />
    </div>
  );
};

export default EODReports;
