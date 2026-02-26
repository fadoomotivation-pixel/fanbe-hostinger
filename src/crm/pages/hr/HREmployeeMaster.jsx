// src/crm/pages/hr/HREmployeeMaster.jsx
import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Edit, Trash2, Search, Loader2, Users, IndianRupee, Building2, Eye } from 'lucide-react';

const BRANCHES   = ['Head Office', 'Ghaziabad', 'Noida', 'Delhi', 'Greater Noida'];
const DEPARTMENTS = ['Sales', 'Marketing', 'HR', 'Accounts', 'IT', 'Operations', 'Management'];
const DESIGNATIONS = [
  'Sales Executive', 'Senior Sales Executive', 'Team Leader',
  'Assistant Manager', 'Manager', 'Senior Manager',
  'HR Executive', 'Accountant', 'Developer', 'Director',
];

const emptyForm = {
  emp_id: '', name: '', father_name: '', dob: '',
  mobile: '', email: '', aadhar_no: '', pan_no: '',
  address: '', branch: '', department: '', designation: '',
  salary: '', doj: '', bank_name: '', account_no: '',
  ifsc: '', status: 'Active',
};

const HREmployeeMaster = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isViewOpen,   setIsViewOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [activeTab,    setActiveTab]    = useState('personal'); // personal | job | bank

  // ── Load ───────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from('hr_employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Error loading employees', description: error.message, variant: 'destructive' });
    else setEmployees(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Auto-generate Emp ID ──────────────────────────────────────────────
  const generateEmpId = () => {
    const next = employees.length + 1;
    return `FBG-${String(next).padStart(4, '0')}`;
  };

  // ── Filtered list ─────────────────────────────────────────────────────
  const displayed = employees.filter(e => {
    const matchSearch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.mobile?.includes(search) ||
      e.designation?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Add ───────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, emp_id: form.emp_id || generateEmpId(), created_at: new Date().toISOString() };
    const { error } = await supabaseAdmin.from('hr_employees').insert(payload);
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Employee Added', description: `${form.name} (${payload.emp_id}) added successfully.` });
    setIsAddOpen(false); setForm(emptyForm); setActiveTab('personal');
    await load();
  };

  // ── Edit ──────────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const { id, created_at, ...updates } = form;
    const { error } = await supabaseAdmin.from('hr_employees').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', selected.id);
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Employee Updated', description: `${form.name} updated successfully.` });
    setIsEditOpen(false); setSelected(null); setForm(emptyForm); setActiveTab('personal');
    await load();
  };

  // ── Toggle Status ─────────────────────────────────────────────────────
  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabaseAdmin.from('hr_employees').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', emp.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Status changed to ${newStatus}`, variant: newStatus === 'Active' ? 'default' : 'destructive' });
    await load();
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_employees').delete().eq('id', selected.id);
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '🗑️ Employee Deleted', variant: 'destructive' });
    setIsDeleteOpen(false); setSelected(null);
    await load();
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const openAdd  = () => { setForm({ ...emptyForm, emp_id: generateEmpId() }); setActiveTab('personal'); setIsAddOpen(true); };
  const openEdit = (emp) => { setSelected(emp); setForm({ ...emp }); setActiveTab('personal'); setIsEditOpen(true); };
  const openView = (emp) => { setSelected(emp); setIsViewOpen(true); };
  const openDelete = (emp) => { setSelected(emp); setIsDeleteOpen(true); };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Tab Form Sections ─────────────────────────────────────────────────
  const PersonalTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1"><Label>Emp ID</Label><Input value={form.emp_id} onChange={e=>f('emp_id',e.target.value)} placeholder="Auto-generated" /></div>
      <div className="space-y-1"><Label>Full Name *</Label><Input required value={form.name} onChange={e=>f('name',e.target.value)} /></div>
      <div className="space-y-1"><Label>Father's Name</Label><Input value={form.father_name} onChange={e=>f('father_name',e.target.value)} /></div>
      <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e=>f('dob',e.target.value)} /></div>
      <div className="space-y-1"><Label>Mobile *</Label><Input required value={form.mobile} onChange={e=>f('mobile',e.target.value)} /></div>
      <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>f('email',e.target.value)} /></div>
      <div className="space-y-1"><Label>Aadhaar No</Label><Input value={form.aadhar_no} onChange={e=>f('aadhar_no',e.target.value)} /></div>
      <div className="space-y-1"><Label>PAN No</Label><Input value={form.pan_no} onChange={e=>f('pan_no',e.target.value)} /></div>
      <div className="md:col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={e=>f('address',e.target.value)} /></div>
    </div>
  );

  const JobTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1"><Label>Branch *</Label>
        <Select value={form.branch} onValueChange={v=>f('branch',v)}>
          <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
          <SelectContent>{BRANCHES.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Department *</Label>
        <Select value={form.department} onValueChange={v=>f('department',v)}>
          <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Designation *</Label>
        <Select value={form.designation} onValueChange={v=>f('designation',v)}>
          <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
          <SelectContent>{DESIGNATIONS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Salary (₹) *</Label><Input type="number" required value={form.salary} onChange={e=>f('salary',e.target.value)} /></div>
      <div className="space-y-1"><Label>Date of Joining *</Label><Input type="date" required value={form.doj} onChange={e=>f('doj',e.target.value)} /></div>
      <div className="space-y-1"><Label>Status</Label>
        <Select value={form.status} onValueChange={v=>f('status',v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  );

  const BankTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1"><Label>Bank Name</Label><Input value={form.bank_name} onChange={e=>f('bank_name',e.target.value)} /></div>
      <div className="space-y-1"><Label>Account No</Label><Input value={form.account_no} onChange={e=>f('account_no',e.target.value)} /></div>
      <div className="space-y-1"><Label>IFSC Code</Label><Input value={form.ifsc} onChange={e=>f('ifsc',e.target.value)} /></div>
    </div>
  );

  const tabs = [
    { key: 'personal', label: '👤 Personal' },
    { key: 'job',      label: '💼 Job' },
    { key: 'bank',     label: '🏦 Bank' },
  ];

  const FormTabs = () => (
    <div>
      <div className="flex border-b mb-4">
        {tabs.map(t => (
          <button key={t.key} type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key ? 'border-[#0F3A5F] text-[#0F3A5F]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'personal' && <PersonalTab />}
      {activeTab === 'job'      && <JobTab />}
      {activeTab === 'bank'     && <BankTab />}
    </div>
  );

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalActive   = employees.filter(e => e.status === 'Active').length;
  const totalInactive = employees.filter(e => e.status === 'Inactive').length;
  const totalSalary   = employees.filter(e=>e.status==='Active').reduce((s,e)=>s+parseFloat(e.salary||0),0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Employee Master</h1>
          <p className="text-sm text-gray-500">HR Module — All employee records stored in Supabase</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0F3A5F] hover:bg-[#1a5a8f]">
          <UserPlus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-bold">{employees.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div><p className="text-xs text-gray-500 uppercase">Active</p><p className="text-2xl font-bold text-green-600">{totalActive}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-400">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-red-400" />
            <div><p className="text-xs text-gray-500 uppercase">Inactive</p><p className="text-2xl font-bold text-red-500">{totalInactive}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-orange-500" />
            <div><p className="text-xs text-gray-500 uppercase">Monthly Payroll</p><p className="text-lg font-bold text-orange-600">₹{(totalSalary/1000).toFixed(1)}K</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input placeholder="Search name, ID, mobile..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading employees...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                  {['S.N.','Emp ID','Name','Branch','Designation','Salary','Joining Date','Status','Actions'].map(h=>(
                    <TableHead key={h} className="text-white font-semibold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((emp, i) => (
                  <TableRow key={emp.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-500">{i+1}</TableCell>
                    <TableCell className="font-mono text-sm font-bold text-[#0F3A5F]">{emp.emp_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(emp.name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.mobile}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.branch}</TableCell>
                    <TableCell className="text-sm">{emp.designation}</TableCell>
                    <TableCell className="text-sm font-medium">₹{Number(emp.salary||0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm">{emp.doj ? new Date(emp.doj).toLocaleDateString('en-IN') : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={emp.status==='Active' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={()=>openView(emp)} title="View"><Eye className="h-4 w-4 text-gray-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>openEdit(emp)} title="Edit"><Edit className="h-4 w-4 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>toggleStatus(emp)} title={emp.status==='Active'?'Deactivate':'Activate'}>
                          <span className={`text-xs font-bold ${emp.status==='Active'?'text-yellow-600':'text-green-600'}`}>{emp.status==='Active'?'OFF':'ON'}</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={()=>openDelete(emp)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {displayed.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    {loading ? '' : 'No employees found. Click "Add Employee" to get started.'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add Modal ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Add New Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd}>
            <FormTabs />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={()=>setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Add Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Edit Employee — {selected?.emp_id}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit}>
            <FormTabs />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={()=>setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Employee Profile — {selected?.emp_id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-[#0F3A5F] text-white rounded-lg">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-blue-200">{selected.designation} • {selected.department}</p>
                  <p className="text-blue-200 text-sm">{selected.emp_id}</p>
                </div>
                <Badge className={`ml-auto ${selected.status==='Active'?'bg-green-500':'bg-red-500'}`}>{selected.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Mobile', selected.mobile], ['Email', selected.email],
                  ['Aadhaar', selected.aadhar_no], ['PAN', selected.pan_no],
                  ['Branch', selected.branch], ['Salary', `₹${Number(selected.salary||0).toLocaleString('en-IN')}`],
                  ['Date of Joining', selected.doj ? new Date(selected.doj).toLocaleDateString('en-IN') : '—'],
                  ['Date of Birth', selected.dob ? new Date(selected.dob).toLocaleDateString('en-IN') : '—'],
                  ['Bank', selected.bank_name], ['Account No', selected.account_no],
                  ['IFSC', selected.ifsc], ['Address', selected.address],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
                    <p className="font-medium text-gray-800 mt-0.5">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsViewOpen(false)}>Close</Button>
            <Button className="bg-[#0F3A5F]" onClick={()=>{setIsViewOpen(false);openEdit(selected);}}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete <strong>{selected?.name}</strong> ({selected?.emp_id})? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HREmployeeMaster;
