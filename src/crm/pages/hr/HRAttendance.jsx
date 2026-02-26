// src/crm/pages/hr/HRAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CalendarCheck, PlusCircle, Loader2, Search, Clock,
  UserCheck, UserX, CalendarX, Calendar, Download, Eye
} from 'lucide-react';

const ATTENDANCE_STATUS = ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'];
const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Other'];

const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtTime = (t) => t ? new Date(`1970-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const HRAttendance = () => {
  const { toast } = useToast();

  // -- Employees list for dropdown
  const [employees, setEmployees]   = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves]         = useState([]);
  const [holidays, setHolidays]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');

  // -- Filter
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear());
  const [filterEmp,   setFilterEmp]   = useState('all');

  // -- Modals
  const [isAddAttOpen,  setIsAddAttOpen]  = useState(false);
  const [isAddLeaveOpen,setIsAddLeaveOpen]= useState(false);
  const [isAddHolOpen,  setIsAddHolOpen]  = useState(false);
  const [isViewOpen,    setIsViewOpen]    = useState(false);
  const [viewRecord,    setViewRecord]    = useState(null);

  // -- Forms
  const [attForm, setAttForm] = useState({ emp_id: '', att_date: today(), status: 'Present', in_time: '09:00', out_time: '18:00', work_hours: '', remarks: '' });
  const [leaveForm, setLeaveForm] = useState({ emp_id: '', leave_type: 'Casual Leave', from_date: today(), to_date: today(), reason: '', status: 'Pending' });
  const [holForm, setHolForm]   = useState({ holiday_name: '', holiday_date: today(), description: '' });

  // ── Load all data ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [empRes, attRes, leaveRes, holRes] = await Promise.all([
      supabaseAdmin.from('hr_employees').select('id,emp_id,name,department,designation').order('name'),
      supabaseAdmin.from('hr_attendance').select('*').order('att_date', { ascending: false }),
      supabaseAdmin.from('hr_leaves').select('*').order('from_date', { ascending: false }),
      supabaseAdmin.from('hr_holidays').select('*').order('holiday_date', { ascending: false }),
    ]);
    setEmployees(empRes.data || []);
    setAttendance(attRes.data || []);
    setLeaves(leaveRes.data || []);
    setHolidays(holRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Helper: get employee name ─────────────────────────────────────────────
  const empName = (empId) => employees.find(e => e.emp_id === empId)?.name || empId;

  // ── Filtered Attendance ───────────────────────────────────────────────────
  const filteredAtt = attendance.filter(a => {
    const d = new Date(a.att_date);
    const matchMonth = d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
    const matchEmp   = filterEmp === 'all' || a.emp_id === filterEmp;
    const matchSearch = !search || empName(a.emp_id).toLowerCase().includes(search.toLowerCase()) || a.emp_id.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchEmp && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const monthAtt  = attendance.filter(a => { const d = new Date(a.att_date); return d.getMonth()+1===filterMonth && d.getFullYear()===filterYear; });
  const totalP    = monthAtt.filter(a => a.status === 'Present').length;
  const totalA    = monthAtt.filter(a => a.status === 'Absent').length;
  const totalL    = monthAtt.filter(a => a.status === 'Leave').length;
  const totalHD   = monthAtt.filter(a => a.status === 'Half Day').length;
  const pendingLv = leaves.filter(l => l.status === 'Pending').length;

  // ── Add Attendance ────────────────────────────────────────────────────────
  const handleAddAtt = async (e) => {
    e.preventDefault();
    if (!attForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    setSaving(true);
    // auto calc work hours
    let wh = attForm.work_hours;
    if (!wh && attForm.in_time && attForm.out_time) {
      const [ih,im] = attForm.in_time.split(':').map(Number);
      const [oh,om] = attForm.out_time.split(':').map(Number);
      wh = ((oh*60+om)-(ih*60+im)/60).toFixed(1);
    }
    const { error } = await supabaseAdmin.from('hr_attendance').insert({
      ...attForm, work_hours: wh, created_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Attendance marked', description: `${empName(attForm.emp_id)} — ${attForm.att_date}` });
    setIsAddAttOpen(false);
    setAttForm({ emp_id: '', att_date: today(), status: 'Present', in_time: '09:00', out_time: '18:00', work_hours: '', remarks: '' });
    await load();
  };

  // ── Add Leave ─────────────────────────────────────────────────────────────
  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_leaves').insert({
      ...leaveForm, created_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Leave added' });
    setIsAddLeaveOpen(false);
    setLeaveForm({ emp_id: '', leave_type: 'Casual Leave', from_date: today(), to_date: today(), reason: '', status: 'Pending' });
    await load();
  };

  // ── Update Leave Status ───────────────────────────────────────────────────
  const updateLeaveStatus = async (id, newStatus) => {
    const { error } = await supabaseAdmin.from('hr_leaves').update({ status: newStatus }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Leave ${newStatus}` });
    await load();
  };

  // ── Add Holiday ───────────────────────────────────────────────────────────
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_holidays').insert({ ...holForm, created_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Holiday added' });
    setIsAddHolOpen(false);
    setHolForm({ holiday_name: '', holiday_date: today(), description: '' });
    await load();
  };

  const deleteHoliday = async (id) => {
    await supabaseAdmin.from('hr_holidays').delete().eq('id', id);
    toast({ title: '🗑️ Holiday deleted', variant: 'destructive' });
    await load();
  };

  const statusBadge = (s) => {
    const map = {
      Present:  'bg-green-50 text-green-700 border-green-300',
      Absent:   'bg-red-50 text-red-700 border-red-300',
      'Half Day':'bg-yellow-50 text-yellow-700 border-yellow-300',
      Leave:    'bg-blue-50 text-blue-700 border-blue-300',
      Holiday:  'bg-purple-50 text-purple-700 border-purple-300',
    };
    return <Badge variant="outline" className={map[s] || 'bg-gray-100'}>{s}</Badge>;
  };

  const leaveBadge = (s) => {
    const map = { Approved: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700', Pending: 'bg-yellow-100 text-yellow-700' };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[s] || ''}`}>{s}</span>;
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const YEARS  = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Attendance Management</h1>
          <p className="text-sm text-gray-500">HR Module — Mark attendance, manage leaves & holidays</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddAttOpen(true)} className="bg-[#0F3A5F] hover:bg-[#1a5a8f]">
            <CalendarCheck className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
          <Button onClick={() => setIsAddLeaveOpen(true)} variant="outline" className="border-[#0F3A5F] text-[#0F3A5F]">
            <CalendarX className="mr-2 h-4 w-4" /> Add Leave
          </Button>
          <Button onClick={() => setIsAddHolOpen(true)} variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Present',      val: totalP,    color: 'border-green-500 text-green-600' },
          { label: 'Absent',       val: totalA,    color: 'border-red-400 text-red-600' },
          { label: 'Half Day',     val: totalHD,   color: 'border-yellow-400 text-yellow-600' },
          { label: 'On Leave',     val: totalL,    color: 'border-blue-400 text-blue-600' },
          { label: 'Leave Pending',val: pendingLv, color: 'border-orange-400 text-orange-600' },
        ].map(s => (
          <Card key={s.label} className={`border-l-4 ${s.color.split(' ')[0]}`}>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="attendance">📋 Attendance Log</TabsTrigger>
          <TabsTrigger value="leaves">📅 Leave Requests</TabsTrigger>
          <TabsTrigger value="holidays">🏖️ Holidays</TabsTrigger>
        </TabsList>

        {/* ── Attendance Tab ── */}
        <TabsContent value="attendance">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4 mb-3">
            <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m,i)=><SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
              <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterEmp} onValueChange={setFilterEmp}>
              <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e=><SelectItem key={e.emp_id} value={e.emp_id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <Input placeholder="Search employee..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9" />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                      {['#','Employee','Date','Status','In Time','Out Time','Hours','Remarks','Action'].map(h=>
                        <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtt.map((a,i) => (
                      <TableRow key={a.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs text-gray-400">{i+1}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{empName(a.emp_id)}</p>
                          <p className="text-xs text-gray-400">{a.emp_id}</p>
                        </TableCell>
                        <TableCell className="text-sm">{fmtDate(a.att_date)}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                        <TableCell className="text-sm">{fmtTime(a.in_time)}</TableCell>
                        <TableCell className="text-sm">{fmtTime(a.out_time)}</TableCell>
                        <TableCell className="text-sm">{a.work_hours ? `${a.work_hours}h` : '—'}</TableCell>
                        <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">{a.remarks || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => { setViewRecord(a); setIsViewOpen(true); }}>
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAtt.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">No attendance records for this period.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leave Tab ── */}
        <TabsContent value="leaves">
          <Card className="mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                    {['#','Employee','Type','From','To','Reason','Status','Action'].map(h=>
                      <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l,i) => (
                    <TableRow key={l.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs text-gray-400">{i+1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{empName(l.emp_id)}</p>
                        <p className="text-xs text-gray-400">{l.emp_id}</p>
                      </TableCell>
                      <TableCell className="text-sm">{l.leave_type}</TableCell>
                      <TableCell className="text-sm">{fmtDate(l.from_date)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(l.to_date)}</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</TableCell>
                      <TableCell>{leaveBadge(l.status)}</TableCell>
                      <TableCell>
                        {l.status === 'Pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateLeaveStatus(l.id, 'Approved')}>✓</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateLeaveStatus(l.id, 'Rejected')}>✗</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">No leave records.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Holidays Tab ── */}
        <TabsContent value="holidays">
          <Card className="mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                    {['#','Holiday Name','Date','Description','Action'].map(h=>
                      <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((h,i) => (
                    <TableRow key={h.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs text-gray-400">{i+1}</TableCell>
                      <TableCell className="font-medium text-sm">{h.holiday_name}</TableCell>
                      <TableCell className="text-sm">{fmtDate(h.holiday_date)}</TableCell>
                      <TableCell className="text-xs text-gray-500">{h.description || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteHoliday(h.id)}>
                          <span className="text-red-500 text-xs font-bold">DEL</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {holidays.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No holidays added yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Mark Attendance Modal ── */}
      <Dialog open={isAddAttOpen} onOpenChange={setIsAddAttOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Mark Attendance</DialogTitle></DialogHeader>
          <form onSubmit={handleAddAtt} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={attForm.emp_id} onValueChange={v => setAttForm(p=>({...p, emp_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>{employees.map(e=><SelectItem key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={attForm.att_date} onChange={e=>setAttForm(p=>({...p,att_date:e.target.value}))} required /></div>
              <div className="space-y-1"><Label>Status *</Label>
                <Select value={attForm.status} onValueChange={v=>setAttForm(p=>({...p,status:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTENDANCE_STATUS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>In Time</Label><Input type="time" value={attForm.in_time} onChange={e=>setAttForm(p=>({...p,in_time:e.target.value}))} /></div>
              <div className="space-y-1"><Label>Out Time</Label><Input type="time" value={attForm.out_time} onChange={e=>setAttForm(p=>({...p,out_time:e.target.value}))} /></div>
            </div>
            <div className="space-y-1"><Label>Remarks</Label><Input value={attForm.remarks} onChange={e=>setAttForm(p=>({...p,remarks:e.target.value}))} placeholder="Optional note" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setIsAddAttOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Mark Attendance'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Leave Modal ── */}
      <Dialog open={isAddLeaveOpen} onOpenChange={setIsAddLeaveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Add Leave Request</DialogTitle></DialogHeader>
          <form onSubmit={handleAddLeave} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={leaveForm.emp_id} onValueChange={v=>setLeaveForm(p=>({...p,emp_id:v}))}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>{employees.map(e=><SelectItem key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Leave Type</Label>
                <Select value={leaveForm.leave_type} onValueChange={v=>setLeaveForm(p=>({...p,leave_type:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Status</Label>
                <Select value={leaveForm.status} onValueChange={v=>setLeaveForm(p=>({...p,status:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>From Date *</Label><Input type="date" value={leaveForm.from_date} onChange={e=>setLeaveForm(p=>({...p,from_date:e.target.value}))} required /></div>
              <div className="space-y-1"><Label>To Date *</Label><Input type="date" value={leaveForm.to_date} onChange={e=>setLeaveForm(p=>({...p,to_date:e.target.value}))} required /></div>
            </div>
            <div className="space-y-1"><Label>Reason</Label><Input value={leaveForm.reason} onChange={e=>setLeaveForm(p=>({...p,reason:e.target.value}))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setIsAddLeaveOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Submit Leave'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Holiday Modal ── */}
      <Dialog open={isAddHolOpen} onOpenChange={setIsAddHolOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Add Holiday</DialogTitle></DialogHeader>
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <div className="space-y-1"><Label>Holiday Name *</Label><Input required value={holForm.holiday_name} onChange={e=>setHolForm(p=>({...p,holiday_name:e.target.value}))} /></div>
            <div className="space-y-1"><Label>Date *</Label><Input type="date" required value={holForm.holiday_date} onChange={e=>setHolForm(p=>({...p,holiday_date:e.target.value}))} /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={holForm.description} onChange={e=>setHolForm(p=>({...p,description:e.target.value}))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setIsAddHolOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Add Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Record Modal ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Attendance Detail</DialogTitle></DialogHeader>
          {viewRecord && (
            <div className="space-y-3">
              {[
                ['Employee', empName(viewRecord.emp_id)],
                ['Emp ID', viewRecord.emp_id],
                ['Date', fmtDate(viewRecord.att_date)],
                ['Status', viewRecord.status],
                ['In Time', fmtTime(viewRecord.in_time)],
                ['Out Time', fmtTime(viewRecord.out_time)],
                ['Work Hours', viewRecord.work_hours ? `${viewRecord.work_hours}h` : '—'],
                ['Remarks', viewRecord.remarks || '—'],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={()=>setIsViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRAttendance;
