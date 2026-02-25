import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Filter, Phone, MessageCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import projects from '@/data/projects';
import { format, isToday, isYesterday, isThisWeek, parseISO, startOfDay, endOfDay } from 'date-fns';

const MyLeads = () => {
  const { user } = useAuth();
  const { leads, addLead } = useCRMData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [groupByDate, setGroupByDate] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const myLeads = leads.filter(l => l.assignedTo === user?.id);

  const getFilteredLeadsByDate = (leadsArray) => {
    if (dateFilter === 'all') return leadsArray;

    return leadsArray.filter(lead => {
      if (!lead.createdAt) return false;
      const leadDate = parseISO(lead.createdAt);

      switch(dateFilter) {
        case 'today':
          return isToday(leadDate);
        case 'yesterday':
          return isYesterday(leadDate);
        case 'this_week':
          return isThisWeek(leadDate);
        case 'custom':
          if (!customDate) return true;
          const selectedDate = parseISO(customDate);
          return leadDate >= startOfDay(selectedDate) && leadDate <= endOfDay(selectedDate);
        default:
          return true;
      }
    });
  };

  const filteredLeads = getFilteredLeadsByDate(myLeads).filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesProject = projectFilter === 'all' || l.project === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const groupLeadsByDate = (leadsArray) => {
    const grouped = {};
    
    leadsArray.forEach(lead => {
      if (!lead.createdAt) {
        if (!grouped['No Date']) grouped['No Date'] = [];
        grouped['No Date'].push(lead);
        return;
      }

      const leadDate = parseISO(lead.createdAt);
      let dateKey;

      if (isToday(leadDate)) {
        dateKey = 'Today';
      } else if (isYesterday(leadDate)) {
        dateKey = 'Yesterday';
      } else if (isThisWeek(leadDate)) {
        dateKey = 'This Week';
      } else {
        dateKey = format(leadDate, 'MMM dd, yyyy');
      }

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(lead);
    });

    const sortedGroups = Object.entries(grouped).sort((a, b) => {
      const order = ['Today', 'Yesterday', 'This Week'];
      const aIndex = order.indexOf(a[0]);
      const bIndex = order.indexOf(b[0]);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return b[0].localeCompare(a[0]);
    });

    return Object.fromEntries(sortedGroups);
  };

  const toggleGroup = (groupName) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Booked': return 'bg-green-100 text-green-800';
      case 'FollowUp': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const renderLeadRow = (lead) => (
    <TableRow 
      key={lead.id} 
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
    >
      <TableCell>
        <div className="font-medium text-blue-600">{lead.name}</div>
        <div className="text-xs text-gray-500">{lead.phone}</div>
      </TableCell>
      <TableCell>{lead.project}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </TableCell>
      <TableCell className="text-xs text-gray-500">
        {lead.createdAt ? format(parseISO(lead.createdAt), 'MMM dd, hh:mm a') : 'N/A'}
      </TableCell>
      <TableCell>
        {lead.lastActivity ? format(parseISO(lead.lastActivity), 'MMM dd') : 'Never'}
      </TableCell>
      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => window.location.href=`tel:${lead.phone}`}>
          <Phone className="h-4 w-4 text-blue-600" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
          <MessageCircle className="h-4 w-4 text-green-600" />
        </Button>
      </TableCell>
    </TableRow>
  );

  const groupedLeads = groupByDate ? groupLeadsByDate(filteredLeads) : null;

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

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
               <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Assigned Date:</span>
               </div>
               <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                     <SelectValue placeholder="Select Date" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Dates</SelectItem>
                     <SelectItem value="today">Today</SelectItem>
                     <SelectItem value="yesterday">Yesterday</SelectItem>
                     <SelectItem value="this_week">This Week</SelectItem>
                     <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
               </Select>

               {dateFilter === 'custom' && (
                  <Input 
                     type="date" 
                     className="w-[180px]"
                     value={customDate}
                     onChange={(e) => setCustomDate(e.target.value)}
                  />
               )}

               <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGroupByDate(!groupByDate)}
                  className="ml-auto"
               >
                  <Filter className="h-4 w-4 mr-2" />
                  {groupByDate ? 'Ungroup' : 'Group by Date'}
               </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
               <span>Showing {filteredLeads.length} of {myLeads.length} leads</span>
               {dateFilter !== 'all' && (
                  <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => { setDateFilter('all'); setCustomDate(''); }}
                  >
                     Clear Date Filter
                  </Button>
               )}
            </div>

            <div className="rounded-md border">
               {groupByDate ? (
                  <div className="divide-y">
                     {Object.entries(groupedLeads).map(([dateGroup, groupLeads]) => (
                        <Collapsible key={dateGroup} open={openGroups[dateGroup]} onOpenChange={() => toggleGroup(dateGroup)}>
                           <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                                 <div className="flex items-center gap-3">
                                    {openGroups[dateGroup] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    <span className="font-semibold text-gray-900">{dateGroup}</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                       {groupLeads.length} leads
                                    </span>
                                 </div>
                              </div>
                           </CollapsibleTrigger>
                           <CollapsibleContent>
                              <Table>
                                 <TableHeader>
                                    <TableRow>
                                       <TableHead>Lead Name</TableHead>
                                       <TableHead>Project</TableHead>
                                       <TableHead>Status</TableHead>
                                       <TableHead>Assigned At</TableHead>
                                       <TableHead>Last Contact</TableHead>
                                       <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {groupLeads.map(renderLeadRow)}
                                 </TableBody>
                              </Table>
                           </CollapsibleContent>
                        </Collapsible>
                     ))}
                     {Object.keys(groupedLeads).length === 0 && (
                        <div className="text-center py-8 text-gray-500">No leads found matching your filters.</div>
                     )}
                  </div>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Lead Name</TableHead>
                           <TableHead>Project</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Assigned At</TableHead>
                           <TableHead>Last Contact</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {filteredLeads.map(renderLeadRow)}
                        {filteredLeads.length === 0 && (
                           <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No leads found matching your filters.</TableCell></TableRow>
                        )}
                     </TableBody>
                  </Table>
               )}
            </div>
         </CardContent>
      </Card>
    </div>
  );
};

export default MyLeads;
