import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Filter, Phone, MessageCircle } from 'lucide-react';
import projects from '@/data/projects';

const MyLeads = () => {
  const { user } = useAuth();
  const { leads, addLead } = useCRMData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const myLeads = leads.filter(l => l.assignedTo === user?.id);

  const filteredLeads = myLeads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesProject = projectFilter === 'all' || l.project === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Booked': return 'bg-green-100 text-green-800';
      case 'FollowUp': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-[#0F3A5F]">My Leads</h1>
            <p className="text-gray-500">Manage and track your potential clients</p>
         </div>
         <Button><Plus className="mr-2 h-4 w-4" /> Add New Lead</Button>
      </div>

      <Card>
         <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by name or phone..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Status</SelectItem>
                     <SelectItem value="Open">Open</SelectItem>
                     <SelectItem value="FollowUp">Follow Up</SelectItem>
                     <SelectItem value="Booked">Booked</SelectItem>
                     <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Projects</SelectItem>
                     {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>

            <div className="rounded-md border">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Lead Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredLeads.map(lead => (
                        <TableRow key={lead.id}>
                           <TableCell>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-xs text-gray-500">{lead.phone}</div>
                           </TableCell>
                           <TableCell>{lead.project}</TableCell>
                           <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                 {lead.status}
                              </span>
                           </TableCell>
                           <TableCell>
                              {lead.lastActivity ? new Date(lead.lastActivity).toLocaleDateString() : 'Never'}
                           </TableCell>
                           <TableCell className="text-right space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => window.location.href=`tel:${lead.phone}`}>
                                 <Phone className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
                                 <MessageCircle className="h-4 w-4 text-green-600" />
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                     {filteredLeads.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No leads found matching your filters.</TableCell></TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>
         </CardContent>
      </Card>
    </div>
  );
};

export default MyLeads;