// src/crm/pages/hr/HREmployeeMaster.jsx
// Reads from 'profiles' table (same source as EmployeeManagement)
// HR-specific fields stored in hr_employee_meta linked by emp_id (profiles.id)
import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Search, Loader2, Users, IndianRupee, Eye, RefreshCw } from 'lucide-react';

const BRANCHES     = ['Head Office', 'Ghaziabad', 'Noida', 'Delhi', 'Greater Noida'];
const DEPARTMENTS  = ['Sales', 'Marketing', 'HR', 'Accounts', 'IT', 'Operations', 'Management'];
const DESIGNATIONS = [
  'Sales Executive', 'Senior Sales Executive', 'Team Leader',
  'Assistant Manager', 'Manager', 'Senior Manager',
  'HR Executive', 'Accountant', 'Developer', 'Director',
];

const emptyMeta = {
  department: '', designation: '', salary: '',
  doj: '', branch: '', bank_name: '', account_no: '',
  ifsc: '', father_name: '', dob: '', aadhar_no: '',
  pan_no: '', address: '',
};

const HREmployeeMaster = () => {
  const { toast } = useToast();
  const [profiles,  setProfiles]  = useState([]);  // from 'profiles' table
  const [metaMap,   setMetaMap]   = useState({});  // id -> hr_employee_meta row
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected,   setSelected]  = useState(null);
  const [metaForm,   setMetaForm]  = useState(emptyMeta);

  // ── Load ──────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [profRes, metaRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').neq('role', 'super_admin').order('name'),
      supabaseAdmin.from('hr_employee_meta').select('*'),
    ]);
    if (profRes.error) toast({ title: 'Error loading profiles', description: profRes.error.message, variant: 'destructive' });
    setProfiles(profRes.data || []);
    const map = {};
    (metaRes.data || []).forEach(m => { map[m.emp_id] = m; });
    setMetaMap(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Filtered list ─────────────────────────────────────────────────────
  const displayed = profiles.filter(p => {
    const matchS =
      statusFilter === 'All' ||
      (statusFilter === 'Active'   && p.status === 'Active') ||
      (statusFilter === 'Inactive' && p.status !== 'Active');
    const matchQ =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.role?.toLowerCase().includes(search.toLowerCase()) ||
      p.username?.toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  // ── Save HR Meta ───────────────────────────────────────────────────────
  const handleSaveMeta = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const empId    = selected.id;
    const existing = metaMap[empId];
    const payload  = { ...metaForm, emp_id: empId, updated_at: new Date().toISOString() };
    let error;
    if (existing) {
      ({ error } = await supabaseAdmin.from('hr_employee_meta').update(payload).eq('emp_id', empId));
    } else {
      ({ error } = await supabaseAdmin.from('hr_employee_meta').insert({ ...payload, created_at: new Date().toISOString() }));
    }
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ HR Profile Saved', description: `${selected.name} HR details updated.` });
    setIsMetaOpen(false);
    await load();
  };

  const openMeta = (profile) => {
    setSelected(profile);
    const existing = metaMap[profile.id] || {};
    setMetaForm({ ...emptyMeta, ...existing });
    setIsMetaOpen(true);
  };
  const openView = (profile) => { setSelected(profile); setIsViewOpen(true); };
  const f = (k, v) => setMetaForm(p => ({ ...p, [k]: v }));

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalActive = profiles.filter(p => p.status === 'Active').length;
  const totalSalary = Object.values(metaMap).reduce((s, m) => s + Number(m.salary || 0), 0);

  const roleLabel = (role) => ({
    super_admin:     'Super Admin',
    sub_admin:       'Sub Admin',
    sales_executive: 'Sales Exec',
    manager:         'Manager',
    team_lead:       'Team Lead',
    telecaller:      'Telecaller',
  }[role] || role || '—');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Employee Master</h1>
          <p className="text-sm text-gray-500">HR view of all CRM employees — click ✏️ to fill HR details</p>
        </div>
        <Button onClick={load} variant="outline" className="border-[#0F3A5F] text-[#0F3A5F]">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-bold">{profiles.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div><p className="text-xs text-gray-500 uppercase">Active</p><p className="text-2xl font-bold text-green-600">{totalActive}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-400">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-400" />
            <div><p className="text-xs text-gray-500 uppercase">HR Profiles</p><p className="text-2xl font-bold text-orange-600">{Object.keys(metaMap).length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-violet-500" />
            <div><p className="text-xs text-gray-500 uppercase">Monthly Payroll</p><p className="text-lg font-bold text-violet-600">₹{(totalSalary / 1000).toFixed(1)}K</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input placeholder="Search name, email, role..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
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
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                    {['#', 'Name', 'Role', 'Dept', 'Designation', 'Salary', 'DOJ', 'HR Profile', 'Actions'].map(h => (
                      <TableHead key={h} className="text-white font-semibold text-xs whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((p, i) => {
                    const meta       = metaMap[p.id] || {};
                    const hasProfile = !!metaMap[p.id];
                    return (
                      <TableRow key={p.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm text-gray-500">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(p.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{roleLabel(p.role)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{meta.department || <span className="text-gray-300">—</span>}</TableCell>
                        <TableCell className="text-sm">{meta.designation || <span className="text-gray-300">—</span>}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {meta.salary ? `₹${Number(meta.salary).toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {meta.doj ? new Date(meta.doj).toLocaleDateString('en-IN') : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {hasProfile
                            ? <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">✓ Filled</Badge>
                            : <Badge variant="outline" className="text-gray-400 border-dashed text-xs">Not filled</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openView(p)} title="View">
                              <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openMeta(p)} title="Edit HR Profile">
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {displayed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-400">No employees found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── HR Meta Edit Modal ── */}
      <Dialog open={isMetaOpen} onOpenChange={setIsMetaOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0F3A5F]">
              HR Profile — {selected?.name}
              <span className="ml-2 text-sm font-normal text-gray-400">({selected?.role})</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMeta}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Branch</Label>
                <Select value={metaForm.branch} onValueChange={v => f('branch', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Department</Label>
                <Select value={metaForm.department} onValueChange={v => f('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Designation</Label>
                <Select value={metaForm.designation} onValueChange={v => f('designation', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                  <SelectContent>{DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Salary (₹)</Label>
                <Input type="number" value={metaForm.salary} onChange={e => f('salary', e.target.value)} placeholder="Monthly CTC" />
              </div>
              <div className="space-y-1"><Label>Date of Joining</Label>
                <Input type="date" value={metaForm.doj} onChange={e => f('doj', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>Date of Birth</Label>
                <Input type="date" value={metaForm.dob} onChange={e => f('dob', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>Father's Name</Label>
                <Input value={metaForm.father_name} onChange={e => f('father_name', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>Aadhaar No</Label>
                <Input value={metaForm.aadhar_no} onChange={e => f('aadhar_no', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>PAN No</Label>
                <Input value={metaForm.pan_no} onChange={e => f('pan_no', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>Bank Name</Label>
                <Input value={metaForm.bank_name} onChange={e => f('bank_name', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>Account No</Label>
                <Input value={metaForm.account_no} onChange={e => f('account_no', e.target.value)} />
              </div>
              <div className="space-y-1"><Label>IFSC Code</Label>
                <Input value={metaForm.ifsc} onChange={e => f('ifsc', e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-1"><Label>Address</Label>
                <Input value={metaForm.address} onChange={e => f('address', e.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsMetaOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save HR Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Employee — {selected?.name}</DialogTitle></DialogHeader>
          {selected && (() => {
            const meta = metaMap[selected.id] || {};
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#0F3A5F] text-white rounded-lg">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {selected.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <p className="text-blue-200 text-sm">{meta.designation || roleLabel(selected.role)} • {meta.department || '—'}</p>
                    <p className="text-blue-200 text-xs">{selected.email}</p>
                  </div>
                  <Badge className={`ml-auto ${selected.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {selected.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Username',    selected.username],
                    ['Phone',       selected.phone || '—'],
                    ['Role',        roleLabel(selected.role)],
                    ['Branch',      meta.branch || '—'],
                    ['Department',  meta.department || '—'],
                    ['Designation', meta.designation || '—'],
                    ['Salary',      meta.salary ? `₹${Number(meta.salary).toLocaleString('en-IN')}` : '—'],
                    ['Joining Date',meta.doj ? new Date(meta.doj).toLocaleDateString('en-IN') : '—'],
                    ['Aadhaar',     meta.aadhar_no || '—'],
                    ['PAN',         meta.pan_no || '—'],
                    ['Bank',        meta.bank_name || '—'],
                    ['Account No',  meta.account_no || '—'],
                    ['IFSC',        meta.ifsc || '—'],
                    ['Address',     meta.address || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-400 uppercase">{label}</p>
                      <p className="font-medium text-gray-800 mt-0.5 truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            <Button className="bg-[#0F3A5F]" onClick={() => { setIsViewOpen(false); openMeta(selected); }}>Edit HR Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HREmployeeMaster;
