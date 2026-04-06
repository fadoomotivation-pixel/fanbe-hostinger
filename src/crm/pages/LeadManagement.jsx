import React, { useState, useEffect, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ROLES } from '@/lib/permissions';
import { Search, Upload, UserCheck, Users, UserX, RefreshCw, History, ArrowRightLeft, Download, UserPlus, Trash2, X, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import projects from '@/data/projects';
import ImportLeadsModal from '@/crm/components/ImportLeadsModal';
import LeadTable from '@/crm/components/LeadTable';
import AssignmentModal from '@/crm/components/AssignmentModal';
import BulkDeleteModal from '@/crm/components/BulkDeleteModal';
import { isVIPLead } from '@/lib/smartAssignmentEngine';

const fmtDate = (d, fmt = 'dd MMM yyyy') => {
  if (!d) return '—';
  try { return format(parseISO(d), fmt); } catch { return d; }
};

const ADMIN_ROLES = [
  'super_admin', 'superadmin', 'admin',
  'sub_admin',   'subadmin',
  'hr_manager',  'hr',
];

const sortNewestFirst = (arr) =>
  [...arr].sort((a, b) => {
    const da = new Date(a.assignedAt || a.createdAt || 0);
    const db = new Date(b.assignedAt || b.createdAt || 0);
    return db - da;
  });

const LeadManagement = () => {
  const { leads, addLead, updateLead, deleteLead, employees, getUniqueSources } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('leadMgmt_activeTab') || 'unassigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterAssignLog, setFilterAssignLog] = useState('all');
  const [showOnlyReassigned, setShowOnlyReassigned] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ── selection state (shared between tabs) ──
  const [selectedLeadIds, setSelectedLeadIds]   = useState([]);
  // ── Assignment Log tab selection (separate state) ──
  const [selectedLogIds,  setSelectedLogIds]    = useState([]);

  const [isAssignmentModalOpen,    setIsAssignmentModalOpen]    = useState(false);
  const [isBulkDeleteModalOpen,    setIsBulkDeleteModalOpen]    = useState(false);
  // log-specific modals reuse same modals but with log selection
  const [isLogAssignModalOpen,     setIsLogAssignModalOpen]     = useState(false);
  const [isLogBulkDeleteModalOpen, setIsLogBulkDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', project: '',
    source: 'Website', budget: '', status: 'Open', notes: ''
  });

  useEffect(() => { sessionStorage.setItem('leadMgmt_activeTab', activeTab); }, [activeTab]);

  const isAdmin = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SUB_ADMIN;

  const salesEmployees = employees.filter(emp =>
    !ADMIN_ROLES.includes((emp.role || '').toLowerCase().replace(/\s+/g, '_'))
  );

  const myLeads         = isAdmin ? leads : leads.filter(l => l.assignedTo === user.id);
  const unassignedLeads = myLeads.filter(l => !l.assignedTo);
  const assignedLeads   = useMemo(() => sortNewestFirst(myLeads.filter(l => !!l.assignedTo)), [myLeads]);

  const reassignedCount = assignedLeads.filter(l => l.prevAssignedTo).length;

  const assignLogLeads = (
    filterAssignLog === 'all'
      ? assignedLeads
      : assignedLeads.filter(l => l.assignedTo === filterAssignLog)
  )
    .filter(l => !showOnlyReassigned || l.prevAssignedTo)
    .sort((a, b) => new Date(b.assignedAt || b.createdAt) - new Date(a.assignedAt || a.createdAt));

  const applyFilters = (list) => list.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
    const matchSource = filterSource === 'all' || l.source === filterSource;
    return matchSearch && matchSource;
  });

  const filteredUnassigned = applyFilters(unassignedLeads);
  const filteredAssigned   = applyFilters(
    filterEmployee === 'all' ? assignedLeads : assignedLeads.filter(l => l.assignedTo === filterEmployee)
  );

  const currentList = activeTab === 'assigned'  ? filteredAssigned
                    : activeTab === 'unassigned' ? filteredUnassigned
                    : [];

  // ── Assignment Log helpers ──────────────────────────────────────
  const allLogSelected  = assignLogLeads.length > 0 && selectedLogIds.length === assignLogLeads.length;

  const handleLogSelectAll = (checked) => {
    if (checked) setSelectedLogIds(assignLogLeads.map(l => l.id));
    else         setSelectedLogIds([]);
  };

  const handleLogSelectOne = (id, checked) => {
    if (checked) setSelectedLogIds(prev => [...prev, id]);
    else         setSelectedLogIds(prev => prev.filter(x => x !== id));
  };

  const handleLogSelectN = (n) => {
    const topN = assignLogLeads.slice(0, n).map(l => l.id);
    const merged = [...new Set([...selectedLogIds, ...topN])];
    setSelectedLogIds(merged);
  };

  // Bulk status on log: mark selected as FollowUp (same as other tabs)
  const handleLogBulkStatus = () => {
    selectedLogIds.forEach(id => updateLead(id, { status: 'FollowUp' }));
    toast({ title: 'Updated', description: `${selectedLogIds.length} leads moved to Follow Up` });
    setSelectedLogIds([]);
  };

  // Assignment from log uses same AssignmentModal but we pass log selection
  const handleLogAssignment = (empId, empName) => {
    const now = new Date().toISOString();
    selectedLogIds.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId);
      const updates = { assignedTo: empId, assignedToName: empName, assignedAt: now };
      if (lead?.assignedTo && lead.assignedTo !== empId) {
        updates.prevAssignedTo     = lead.assignedTo;
        updates.prevAssignedToName = lead.assignedToName || null;
        updates.prevAssignedAt     = lead.assignedAt || lead.createdAt || now;
        updates.reassignedOn       = now;
      }
      updateLead(leadId, updates);
    });
    toast({ title: 'Assigned', description: `${selectedLogIds.length} leads assigned to ${empName}` });
    setSelectedLogIds([]);
    setIsLogAssignModalOpen(false);
  };

  const handleLogBulkDelete = async (ids) => {
    return new Promise(resolve => {
      ids.forEach(id => deleteLead(id));
      setSelectedLogIds(prev => prev.filter(x => !ids.includes(x)));
      resolve();
    });
  };

  // ── Existing tab handlers ───────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const newLead = {
      ...formData,
      assignedTo:     user.role === ROLES.EMPLOYEE ? user.id   : null,
      assignedToName: user.role === ROLES.EMPLOYEE ? user.name : null,
      assignedAt:     user.role === ROLES.EMPLOYEE ? new Date().toISOString() : null,
      isVIP: isVIPLead(formData)
    };
    addLead(newLead);
    toast({ title: 'Success', description: 'Lead uploaded successfully!' });
    setFormData({ name: '', phone: '', email: '', project: '', source: 'Website', budget: '', status: 'Open', notes: '' });
  };

  const handleLeadAction = (action, lead) => {
    if (action === 'call')        window.location.href = `tel:${lead.phone}`;
    if (action === 'bulk_delete') setIsBulkDeleteModalOpen(true);
    if (action === 'bulk_assign') setIsAssignmentModalOpen(true);
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

  const handleSelectLead   = (id, checked) => {
    if (checked) setSelectedLeadIds(prev => [...prev, id]);
    else         setSelectedLeadIds(prev => prev.filter(lid => lid !== id));
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedLeadIds(currentList.map(l => l.id));
    else         setSelectedLeadIds([]);
  };

  const handleAssignment = (empId, empName) => {
    const now = new Date().toISOString();
    selectedLeadIds.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId);
      const updates = { assignedTo: empId, assignedToName: empName, assignedAt: now };
      if (lead?.assignedTo && lead.assignedTo !== empId) {
        updates.prevAssignedTo     = lead.assignedTo;
        updates.prevAssignedToName = lead.assignedToName || null;
        updates.prevAssignedAt     = lead.assignedAt || lead.createdAt || now;
        updates.reassignedOn       = now;
      }
      updateLead(leadId, updates);
    });
    toast({ title: 'Assigned', description: `${selectedLeadIds.length} leads assigned to ${empName}` });
    setSelectedLeadIds([]);
    setIsAssignmentModalOpen(false);
    if (activeTab === 'unassigned') setActiveTab('assigned');
  };

  const handleBulkDelete = async (ids) => {
    return new Promise(resolve => {
      ids.forEach(id => deleteLead(id));
      setSelectedLeadIds(prev => prev.filter(pId => !ids.includes(pId)));
      resolve();
    });
  };

  const handleUnassign = () => {
    selectedLeadIds.forEach(id => updateLead(id, { assignedTo: null, assignedToName: null, assignedAt: null }));
    toast({ title: 'Unassigned', description: `${selectedLeadIds.length} leads moved back to Unassigned` });
    setSelectedLeadIds([]);
    setActiveTab('unassigned');
  };

  const exportAssignLog = () => {
    const rows = [
      ['Lead Name', 'Phone', 'Project', 'Assigned To', 'Date Assigned', 'Prev Assigned To', 'Reassigned On', 'Status'],
      ...assignLogLeads.map(l => [
        l.name, l.phone, l.project || '',
        l.assignedToName || '',
        fmtDate(l.assignedAt, 'dd/MM/yyyy HH:mm'),
        l.prevAssignedToName || '',
        fmtDate(l.reassignedOn || l.prevAssignedAt, 'dd/MM/yyyy HH:mm'),
        l.status || '',
      ])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `assignment-log-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const leadsToAssign = currentList.filter(l => selectedLeadIds.includes(l.id));
  const leadsToDelete = currentList.filter(l => selectedLeadIds.includes(l.id));
  const logLeadsToAssign = assignLogLeads.filter(l => selectedLogIds.includes(l.id));
  const logLeadsToDelete = assignLogLeads.filter(l => selectedLogIds.includes(l.id));
  const uniqueSources    = getUniqueSources();
  const employeeLeadCount = (empId) => assignedLeads.filter(l => l.assignedTo === empId).length;

  const logQuickSelectSizes = [10, 25, 50].filter(n => n < assignLogLeads.length);

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

      {/* Stats */}
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

      <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setSelectedLeadIds([]); setSelectedLogIds([]); }}>
        <TabsList>
          {isAdmin && (
            <>
              <TabsTrigger value="unassigned" className="gap-2">
                Unassigned
                {unassignedLeads.length > 0 && (
                  <Badge className="bg-orange-500 text-white text-[10px] h-4 px-1.5 ml-1">{unassignedLeads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assigned" className="gap-2">
                Assigned
                {assignedLeads.length > 0 && (
                  <Badge className="bg-blue-500 text-white text-[10px] h-4 px-1.5 ml-1">{assignedLeads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assignlog" className="gap-2">
                <History size={13} /> Assignment Log
                {reassignedCount > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px] h-4 px-1.5 ml-1">{reassignedCount} ↺</Badge>
                )}
              </TabsTrigger>
            </>
          )}
          {!isAdmin && <TabsTrigger value="unassigned">My Leads</TabsTrigger>}
          <TabsTrigger value="upload">Upload Lead</TabsTrigger>
        </TabsList>

        {/* ── UNASSIGNED TAB ── */}
        <TabsContent value="unassigned" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, phone..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <div className="p-0">
              <LeadTable leads={filteredUnassigned} onAction={handleLeadAction} onStatusChange={handleStatusChange}
                selectedIds={selectedLeadIds} onSelectLead={handleSelectLead} onSelectAll={handleSelectAll}
                type="daily" showSource={true} />
            </div>
          </Card>
        </TabsContent>

        {/* ── ASSIGNED TAB ── */}
        {isAdmin && (
          <TabsContent value="assigned" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name, phone..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by Employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees ({assignedLeads.length})</SelectItem>
                  {salesEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} <span className="ml-2 text-xs text-gray-400">({employeeLeadCount(emp.id)} leads)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLeadIds.length > 0 && (
                <Button variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50" onClick={handleUnassign}>
                  <RefreshCw size={14} /> Move to Unassigned ({selectedLeadIds.length})
                </Button>
              )}
            </div>
            {filterEmployee === 'all' && salesEmployees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {salesEmployees.map(emp => (
                  <button key={emp.id} onClick={() => setFilterEmployee(emp.id)}
                    className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {emp.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700">{emp.name}</span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">{employeeLeadCount(emp.id)}</Badge>
                  </button>
                ))}
              </div>
            )}
            <Card>
              <div className="p-0">
                <LeadTable leads={filteredAssigned} onAction={handleLeadAction} onStatusChange={handleStatusChange}
                  selectedIds={selectedLeadIds} onSelectLead={handleSelectLead} onSelectAll={handleSelectAll}
                  type="daily" showSource={true} />
              </div>
            </Card>
          </TabsContent>
        )}

        {/* ── ASSIGNMENT LOG TAB ── */}
        {isAdmin && (
          <TabsContent value="assignlog" className="space-y-4">

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filterAssignLog} onValueChange={setFilterAssignLog}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {salesEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name} ({employeeLeadCount(emp.id)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={() => setShowOnlyReassigned(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  showOnlyReassigned
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <ArrowRightLeft size={12} />
                {showOnlyReassigned ? 'Showing Reassigned Only' : 'Show Reassigned Only'}
                {reassignedCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    showOnlyReassigned ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-700'
                  }`}>{reassignedCount}</span>
                )}
              </button>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {assignLogLeads.length} leads
                  {reassignedCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {reassignedCount} reassigned</span>}
                </span>
                <Button variant="outline" size="sm" className="gap-2" onClick={exportAssignLog}>
                  <Download size={14} /> Export CSV
                </Button>
              </div>
            </div>

            {/* ── Quick-select toolbar ── */}
            {assignLogLeads.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-gray-400 font-medium mr-1 shrink-0">Quick select:</span>
                {logQuickSelectSizes.map(n => (
                  <button key={n} onClick={() => handleLogSelectN(n)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium transition-colors">
                    <CheckSquare size={11} /> {n}
                  </button>
                ))}
                <button onClick={() => handleLogSelectAll(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-800 bg-blue-100 hover:bg-blue-200 font-semibold transition-colors">
                  <CheckSquare size={11} /> All {assignLogLeads.length}
                </button>
                {selectedLogIds.length > 0 && (
                  <>
                    <button onClick={() => setSelectedLogIds([])}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 transition-colors ml-1">
                      <X size={11} /> Clear
                    </button>
                    <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      {selectedLogIds.length} selected
                    </span>
                  </>
                )}
              </div>
            )}

            {/* ── Bulk action bar (shows when something is selected) ── */}
            {selectedLogIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 h-6">
                    {selectedLogIds.length} Selected
                  </Badge>
                  <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors"
                    onClick={() => setSelectedLogIds([])}>
                    <X size={12} /> Clear
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => setIsLogAssignModalOpen(true)}>
                    <UserPlus size={14} className="mr-2" /> Assign
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={handleLogBulkStatus}>
                    <RefreshCw size={14} className="mr-2" /> Status
                  </Button>
                  <Button size="sm" variant="destructive"
                    onClick={() => setIsLogBulkDeleteModalOpen(true)}>
                    <Trash2 size={14} className="mr-2" /> Delete
                  </Button>
                </div>
              </div>
            )}

            {/* ── Assignment Log table ── */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {/* Checkbox column */}
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={allLogSelected}
                          onCheckedChange={handleLogSelectAll}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Lead</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Project</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Assigned To</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date Assigned</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Prev Assignee</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Reassigned On</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assignLogLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center">
                          <History size={32} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-gray-400 text-sm">No assigned leads yet.</p>
                        </td>
                      </tr>
                    ) : assignLogLeads.map(lead => (
                      <tr key={lead.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedLogIds.includes(lead.id)
                            ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                            : lead.prevAssignedTo ? 'bg-amber-50/50' : ''
                        }`}
                        onClick={() => handleLogSelectOne(lead.id, !selectedLogIds.includes(lead.id))}
                      >
                        {/* Checkbox cell — stop propagation so clicking checkbox doesn't double-toggle */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLogIds.includes(lead.id)}
                            onCheckedChange={(c) => handleLogSelectOne(lead.id, c)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lead.prevAssignedTo && (
                              <span title="Reassigned" className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{lead.name}</p>
                              <p className="text-xs text-gray-400">{lead.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{lead.project || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {lead.assignedToName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{lead.assignedToName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {lead.assignedAt ? (
                            <div>
                              <p className="text-sm text-gray-700 font-medium">{fmtDate(lead.assignedAt, 'dd MMM yyyy')}</p>
                              <p className="text-xs text-gray-400">{fmtDate(lead.assignedAt, 'hh:mm a')}</p>
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.prevAssignedToName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {lead.prevAssignedToName[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm text-amber-700 font-medium">{lead.prevAssignedToName}</p>
                                <p className="text-[10px] text-amber-500">was assigned</p>
                              </div>
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.reassignedOn || lead.prevAssignedAt ? (
                            <div>
                              <p className="text-sm text-gray-600">{fmtDate(lead.reassignedOn || lead.prevAssignedAt, 'dd MMM yyyy')}</p>
                              <p className="text-xs text-gray-400">{fmtDate(lead.reassignedOn || lead.prevAssignedAt, 'hh:mm a')}</p>
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            lead.status === 'Booked'   ? 'bg-green-100 text-green-800' :
                            lead.status === 'FollowUp' ? 'bg-orange-100 text-orange-700' :
                            lead.status === 'Lost'     ? 'bg-red-100 text-red-700' :
                                                         'bg-blue-100 text-blue-700'
                          }`}>{lead.status || 'Open'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* ── Modals for Unassigned / Assigned tabs ── */}
      <ImportLeadsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} employees={salesEmployees} />
      <AssignmentModal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)}
        leads={leadsToAssign} allLeads={leads} employees={salesEmployees} onAssign={handleAssignment} />
      <BulkDeleteModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)}
        leads={leadsToDelete} onDelete={handleBulkDelete} />

      {/* ── Modals for Assignment Log tab ── */}
      <AssignmentModal isOpen={isLogAssignModalOpen} onClose={() => setIsLogAssignModalOpen(false)}
        leads={logLeadsToAssign} allLeads={leads} employees={salesEmployees} onAssign={handleLogAssignment} />
      <BulkDeleteModal isOpen={isLogBulkDeleteModalOpen} onClose={() => setIsLogBulkDeleteModalOpen(false)}
        leads={logLeadsToDelete} onDelete={handleLogBulkDelete} />
    </div>
  );
};

export default LeadManagement;
