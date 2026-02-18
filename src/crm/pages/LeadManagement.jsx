import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ROLES } from '@/lib/permissions';
import { Search, Upload, UserCheck, Users, UserX, RefreshCw } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('unassigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all'); // for assigned tab
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Modals
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', project: '',
    source: 'Website', budget: '', status: 'Open', notes: ''
  });

  const isAdmin = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SUB_ADMIN;

  // ── Lead buckets ─────────────────────────────────────────────
  const myLeads = isAdmin ? leads : leads.filter(l => l.assignedTo === user.id);

  const unassignedLeads = myLeads.filter(l => !l.assignedTo);
  const assignedLeads   = myLeads.filter(l => !!l.assignedTo);

  // Search + Source filter applied to whichever tab is active
  const applyFilters = (list) => list.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.phone.includes(searchTerm);
    const matchSource = filterSource === 'all' || l.source === filterSource;
    return matchSearch && matchSource;
  });

  const filteredUnassigned = applyFilters(unassignedLeads);

  const filteredAssigned = applyFilters(
    filterEmployee === 'all'
      ? assignedLeads
      : assignedLeads.filter(l => l.assignedTo === filterEmployee)
  );

  // current tab's visible list (used for bulk select-all)
  const currentList = activeTab === 'assigned' ? filteredAssigned
                    : activeTab === 'unassigned' ? filteredUnassigned
                    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLead = {
      ...formData,
      assignedTo:     user.role === ROLES.EMPLOYEE ? user.id   : null,
      assignedToName: user.role === ROLES.EMPLOYEE ? user.name : null,
      assignmentDate: user.role === ROLES.EMPLOYEE ? new Date().toISOString() : null,
      isVIP: isVIPLead(formData)
    };
    addLead(newLead);
    toast({ title: 'Success', description: 'Lead uploaded successfully!' });
    setFormData({ name: '', phone: '', email: '', project: '', source: 'Website', budget: '', status: 'Open', notes: '' });
  };

  const handleLeadAction = (action, lead) => {
    if (action === 'call')         window.location.href = `tel:${lead.phone}`;
    if (action === 'bulk_delete')  setIsBulkDeleteModalOpen(true);
    if (action === 'bulk_assign')  setIsAssignmentModalOpen(true);
    if (action === 'bulk_status') {
      selectedLeadIds.forEach(id => updateLead(id, { status: 'FollowUp' }));
      toast({ title: 'Updated', description: 'Selected leads moved to Follow Up' });
      setSelectedLeadIds([]);
    }
  };

  const handleStatusChange = (lead, newStatus) => {
    updateLead(lead.id, { status: newStatus });
    toast({ title: 'Updated', description: 'Status changed successfully.' });
  };

  const handleSelectLead = (id, checked) => {
    if (checked) setSelectedLeadIds(prev => [...prev, id]);
    else         setSelectedLeadIds(prev => prev.filter(lid => lid !== id));
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedLeadIds(currentList.map(l => l.id));
    else         setSelectedLeadIds([]);
  };

  const handleAssignment = (empId, empName) => {
    selectedLeadIds.forEach(leadId => {
      updateLead(leadId, {
        assignedTo:     empId,
        assignedToName: empName,
        assignmentDate: new Date().toISOString()
      });
    });
    toast({ title: 'Assigned', description: `${selectedLeadIds.length} leads assigned to ${empName}` });
    setSelectedLeadIds([]);
    setIsAssignmentModalOpen(false);
    // If we were on unassigned tab, switch to assigned tab so user can see result
    if (activeTab === 'unassigned') setActiveTab('assigned');
  };

  const handleBulkDelete = async (ids) => {
    return new Promise((resolve) => {
      ids.forEach(id => deleteLead(id));
      setSelectedLeadIds(prev => prev.filter(pId => !ids.includes(pId)));
      resolve();
    });
  };

  // Reassign: clear assignment from selected assigned leads
  const handleUnassign = () => {
    selectedLeadIds.forEach(id => updateLead(id, {
      assignedTo:     null,
      assignedToName: null,
      assignmentDate: null
    }));
    toast({ title: 'Unassigned', description: `${selectedLeadIds.length} leads moved back to Unassigned` });
    setSelectedLeadIds([]);
    setActiveTab('unassigned');
  };

  const leadsToAssign  = currentList.filter(l => selectedLeadIds.includes(l.id));
  const leadsToDelete  = currentList.filter(l => selectedLeadIds.includes(l.id));
  const uniqueSources  = getUniqueSources();

  // Per-employee count badge for dropdown
  const employeeLeadCount = (empId) =>
    assignedLeads.filter(l => l.assignedTo === empId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Lead Management</h1>
          <p className="text-gray-500">Track, score, and manage potential clients.</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <Upload size={16} /> Import Leads
          </Button>
        )}
      </div>

      {/* Stats Row — admin only */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
            <UserX size={22} className="text-orange-500" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Unassigned</p>
              <p className="text-2xl font-bold text-orange-700">{unassignedLeads.length}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <UserCheck size={22} className="text-blue-500" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Assigned</p>
              <p className="text-2xl font-bold text-blue-700">{assignedLeads.length}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
            <Users size={22} className="text-green-500" />
            <div>
              <p className="text-xs text-green-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-green-700">{leads.length}</p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setSelectedLeadIds([]); }}>
        <TabsList>
          {/* Admin sees Unassigned + Assigned + Upload */}
          {isAdmin && (
            <>
              <TabsTrigger value="unassigned" className="gap-2">
                Unassigned
                {unassignedLeads.length > 0 && (
                  <Badge className="bg-orange-500 text-white text-[10px] h-4 px-1.5 ml-1">
                    {unassignedLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assigned" className="gap-2">
                Assigned
                {assignedLeads.length > 0 && (
                  <Badge className="bg-blue-500 text-white text-[10px] h-4 px-1.5 ml-1">
                    {assignedLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}
          {/* Employee sees only My Leads */}
          {!isAdmin && <TabsTrigger value="unassigned">My Leads</TabsTrigger>}
          <TabsTrigger value="upload">Upload Lead</TabsTrigger>
        </TabsList>

        {/* ── UNASSIGNED TAB ── */}
        <TabsContent value="unassigned" className="space-y-4">
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
                leads={filteredUnassigned}
                onAction={handleLeadAction}
                onStatusChange={handleStatusChange}
                selectedIds={selectedLeadIds}
                onSelectLead={handleSelectLead}
                onSelectAll={handleSelectAll}
                type="daily"
                showSource={true}
              />
            </div>
          </Card>
        </TabsContent>

        {/* ── ASSIGNED TAB (admin only) ── */}
        {isAdmin && (
          <TabsContent value="assigned" className="space-y-4">
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
              {/* Employee filter */}
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees ({assignedLeads.length})</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                      <span className="ml-2 text-xs text-gray-400">
                        ({employeeLeadCount(emp.id)} leads)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Reassign selected button */}
              {selectedLeadIds.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={handleUnassign}
                >
                  <RefreshCw size={14} /> Move to Unassigned ({selectedLeadIds.length})
                </Button>
              )}
            </div>

            {/* Per-employee mini stats */}
            {filterEmployee === 'all' && employees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setFilterEmployee(emp.id)}
                    className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {emp.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700">{emp.name}</span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                      {employeeLeadCount(emp.id)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            <Card>
              <div className="p-0">
                <LeadTable
                  leads={filteredAssigned}
                  onAction={handleLeadAction}
                  onStatusChange={handleStatusChange}
                  selectedIds={selectedLeadIds}
                  onSelectLead={handleSelectLead}
                  onSelectAll={handleSelectAll}
                  type="daily"
                  showSource={true}
                />
              </div>
            </Card>
          </TabsContent>
        )}

        {/* ── UPLOAD TAB ── */}
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
