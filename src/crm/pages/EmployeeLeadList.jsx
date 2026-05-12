
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, Phone, Eye, Edit2 } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { useNavigate } from 'react-router-dom';

const EmployeeLeadList = () => {
  const { leads } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter leads assigned to current user
  const myLeads = leads.filter(l => l.assignedTo === user.id);

  // Apply filters
  const filteredLeads = myLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination (Simple for now)
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const stats = {
    total: myLeads.length,
    open: myLeads.filter(l => l.status === 'Open').length,
    followUp: myLeads.filter(l => l.status === 'FollowUp').length,
    booked: myLeads.filter(l => l.status === 'Booked').length,
    lost: myLeads.filter(l => l.status === 'Lost').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">My Leads</h1>
           <p className="text-gray-500">Manage your assigned prospects</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-blue-50 px-3 py-1 rounded text-sm text-blue-700 border border-blue-200">
             Total: <span className="font-bold">{stats.total}</span>
           </div>
           <div className="bg-yellow-50 px-3 py-1 rounded text-sm text-yellow-700 border border-yellow-200">
             Follow-Up: <span className="font-bold">{stats.followUp}</span>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
             <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="FollowUp">Follow Up</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/crm/lead/${lead.id}`)}>
                  <TableCell className="font-medium text-[#0F3A5F]">{lead.name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={lead.project}>{lead.project}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${lead.status === 'Booked' ? 'bg-green-100 text-green-700' : 
                        lead.status === 'FollowUp' ? 'bg-yellow-100 text-yellow-700' :
                        lead.status === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                     <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                       <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Call">
                         <Phone size={14} />
                       </Button>
                       <WhatsAppButton 
                         leadName={lead.name}
                         projectName={lead.project}
                         phoneNumber={lead.phone}
                         size="sm"
                         className="h-8 px-2"
                       />
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(`/crm/lead/${lead.id}`)}>
                         <Eye size={14} className="text-gray-500" />
                       </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedLeads.length === 0 && (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-gray-500">No leads found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
           <div className="p-4 border-t flex justify-center gap-2">
             <Button 
               variant="outline" 
               disabled={page === 1}
               onClick={() => setPage(p => p - 1)}
             >Previous</Button>
             <div className="flex items-center text-sm text-gray-500">
               Page {page} of {totalPages}
             </div>
             <Button 
               variant="outline" 
               disabled={page === totalPages}
               onClick={() => setPage(p => p + 1)}
             >Next</Button>
           </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeadList;
