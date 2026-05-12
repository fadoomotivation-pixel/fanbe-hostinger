
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ROLES } from '@/lib/permissions';
import { Search, Upload } from 'lucide-react';
import projects from '@/data/projects';
import ImportLeadsModal from '@/crm/components/ImportLeadsModal';
import LeadTable from '@/crm/components/LeadTable';
import AssignmentModal from '@/crm/components/AssignmentModal';
import BulkDeleteModal from '@/crm/components/BulkDeleteModal';
import { isVIPLead } from '@/lib/smartAssignmentEngine';

const LeadManagement = () => {
  const { leads, addLead, updateLead, deleteLead, employees, getUniqueSources } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  
  // Modals
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    project: '',
    source: 'Website',
    budget: '',
    status: 'Open',
    notes: ''
  });

  // Filter based on Role and Search/Source
  const visibleLeads = leads.filter(lead => {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SUB_ADMIN) return true;
    return lead.assignedTo === user.id;
  });

  const filteredLeads = visibleLeads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
      const matchesSource = filterSource === 'all' || l.source === filterSource;
      return matchesSearch && matchesSource;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLead = {
      ...formData,
      assignedTo: user.role === ROLES.EMPLOYEE ? user.id : null,
      assignedToName: user.role === ROLES.EMPLOYEE ? user.name : null,
      assignmentDate: user.role === ROLES.EMPLOYEE ? new Date().toISOString() : null,
      isVIP: isVIPLead(formData)
    };
    addLead(newLead);
    toast({ title: "Success", description: "Lead uploaded successfully!" });
    setFormData({ name: '', phone: '', email: '', project: '', source: 'Website', budget: '', status: 'Open', notes: '' });
  };

  const handleLeadAction = (action, lead) => {
     if (action === 'call') window.location.href = `tel:${lead.phone}`;
     if (action === 'bulk_delete') setIsBulkDeleteModalOpen(true);
     if (action === 'bulk_assign') setIsAssignmentModalOpen(true);
     if (action === 'bulk_status') {
         selectedLeadIds.forEach(id => updateLead(id, { status: 'FollowUp' }));
         toast({ title: "Updated", description: "Selected leads moved to Follow Up" });
         setSelectedLeadIds([]);
     }
  };

  const handleStatusChange = (lead, newStatus) => {
     updateLead(lead.id, { status: newStatus });
     toast({ title: "Updated", description: "Status changed successfully." });
  };

  const handleSelectLead = (id, checked) => {
      if (checked) setSelectedLeadIds([...selectedLeadIds, id]);
      else setSelectedLeadIds(selectedLeadIds.filter(lid => lid !== id));
  };

  const handleSelectAll = (checked) => {
      if (checked) setSelectedLeadIds(filteredLeads.map(l => l.id));
      else setSelectedLeadIds([]);
  };

  const handleAssignment = (empId, empName) => {
      selectedLeadIds.forEach(leadId => {
          updateLead(leadId, { 
              assignedTo: empId, 
              assignedToName: empName,
              assignmentDate: new Date().toISOString()
          });
      });
      toast({ title: "Assigned", description: `${selectedLeadIds.length} leads assigned to ${empName}` });
      setSelectedLeadIds([]);
      setIsAssignmentModalOpen(false);
  };

  const handleBulkDelete = async (ids) => {
      return new Promise((resolve) => {
          ids.forEach(id => deleteLead(id));
          setSelectedLeadIds(prev => prev.filter(pId => !ids.includes(pId)));
          resolve();
      });
  };

  const leadsToDelete = filteredLeads.filter(l => selectedLeadIds.includes(l.id));
  const leadsToAssign = filteredLeads.filter(l => selectedLeadIds.includes(l.id));
  const uniqueSources = getUniqueSources();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Lead Management</h1>
          <p className="text-gray-500">Track, score, and manage potential clients.</p>
        </div>
        <div className="flex gap-2">
            {user.role === ROLES.SUPER_ADMIN && (
                <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
                    <Upload size={16} /> Import Leads
                </Button>
            )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List Leads</TabsTrigger>
          <TabsTrigger value="upload">Upload Lead</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
               <Input 
                 placeholder="Search by name, phone..." 
                 className="pl-10"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
             <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Source" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>

          <Card>
             <div className="p-0">
                 <LeadTable 
                    leads={filteredLeads}
                    onAction={handleLeadAction}
                    onStatusChange={handleStatusChange}
                    selectedIds={selectedLeadIds}
                    onSelectLead={handleSelectLead}
                    onSelectAll={handleSelectAll}
                    type="daily"
                    showSource={true} // New prop for table
                 />
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
             <CardHeader><CardTitle>Upload New Lead</CardTitle></CardHeader>
             <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Lead Name</label>
                         <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Phone Number</label>
                         <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Email</label>
                         <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Project Interest (Optional)</label>
                         <Select value={formData.project} onValueChange={v => setFormData({...formData, project: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                            <SelectContent>
                               {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Source</label>
                         <Select value={formData.source} onValueChange={v => setFormData({...formData, source: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="Website">Website</SelectItem>
                               <SelectItem value="Referral">Referral</SelectItem>
                               <SelectItem value="Advertisement">Advertisement</SelectItem>
                               <SelectItem value="Walk-in">Walk-in</SelectItem>
                               <SelectItem value="Social Media">Social Media</SelectItem>
                               <SelectItem value="Manual Import">Manual Entry</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Client Budget (₹)</label>
                         <Input required type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Initial Notes</label>
                      <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                   </div>
                   <div className="flex justify-end">
                      <Button type="submit">Upload Lead</Button>
                   </div>
                </form>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ImportLeadsModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        employees={employees} 
      />
      
      <AssignmentModal 
         isOpen={isAssignmentModalOpen}
         onClose={() => setIsAssignmentModalOpen(false)}
         leads={leadsToAssign}
         employees={employees}
         onAssign={handleAssignment}
      />
      
      <BulkDeleteModal
         isOpen={isBulkDeleteModalOpen}
         onClose={() => setIsBulkDeleteModalOpen(false)}
         leads={leadsToDelete}
         onDelete={handleBulkDelete}
      />
    </div>
  );
};

export default LeadManagement;
