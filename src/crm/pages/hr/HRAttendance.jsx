// src/crm/pages/hr/HRAttendance.jsx
// Reads from 'profiles' table (same source as EmployeeManagement)
// SelfAttendanceWidget — every employee can mark their own attendance
import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
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
  CalendarCheck, Loader2, Search, Clock,
  CalendarX, Calendar, Eye, CheckCircle, XCircle, Timer
} from 'lucide-react';

const ATTENDANCE_STATUS = ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'];
const LEAVE_TYPES       = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Other'];
const MONTHS            = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS             = [2024, 2025, 2026, 2027];

const todayStr = () => new Date().toISOString().split('T')[0];
const nowTime  = () => new Date().toTimeString().slice(0, 5);
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtTime  = (t) => t ? new Date(`1970-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

// ── Self-Attendance Widget ────────────────────────────────────────────────────
const SelfAttendanceWidget = ({ user, onMarked }) => {
  const { toast }   = useToast();
  const [saving,    setSaving]   = useState(false);
  const [todayRec,  setTodayRec] = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [showLeave, setShowLeave]= useState(false);
  const [leaveForm, setLeaveForm]= useState({
    leave_type: 'Casual Leave', from_date: todayStr(), to_date: todayStr(), reason: ''
  });

  const myId = user?.id;

  const loadToday = async () => {
    if (!myId) { setLoading(false); return; }
    const { data } = await supabaseAdmin
      .from('hr_attendance')
      .select('*')
      .eq('emp_id', myId)
      .eq('att_date', todayStr())
      .maybeSingle();
    setTodayRec(data || null);
    setLoading(false);
  };
  useEffect(() => { loadToday(); }, []);

  const markAttendance = async (status) => {
    if (!myId) return;
    setSaving(true);
    const now = nowTime();
    const payload = {
      emp_id:     myId,
      att_date:   todayStr(),
      status,
      in_time:    (status === 'Present' || status === 'Half Day') ? now : null,
      out_time:   null,
      work_hours: null,
      remarks:    'Self-marked via CRM',
      created_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from('hr_attendance')
      .upsert(payload, { onConflict: 'emp_id,att_date' });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `✅ Marked as ${status}`, description: new Date().toLocaleTimeString('en-IN') });
    await loadToday();
    onMarked?.();
  };

  const handleCheckOut = async () => {
    if (!todayRec) return;
    setSaving(true);
    const now = nowTime();
    const [ih, im] = (todayRec.in_time || '09:00').split(':').map(Number);
    const [oh, om] = now.split(':').map(Number);
    const wh = (((oh * 60 + om) - (ih * 60 + im)) / 60).toFixed(1);
    const { error } = await supabaseAdmin
      .from('hr_attendance')
      .update({ out_time: now, work_hours: wh })
      .eq('id', todayRec.id);
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `✅ Checked out — ${wh}h worked` });
    await loadToday();
    onMarked?.();
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_leaves').insert({
      emp_id: myId, ...leaveForm,
      status: 'Pending', created_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Leave request submitted', description: 'Pending admin approval.' });
    setShowLeave(false);
    onMarked?.();
  };

  if (loading) return null;

  const statusColors = {
    Present:    'bg-green-50 border-green-200 text-green-700',
    Absent:     'bg-red-50 border-red-200 text-red-700',
    'Half Day': 'bg-yellow-50 border-yellow-200 text-yellow-700',
    Leave:      'bg-blue-50 border-blue-200 text-blue-700',
    Holiday:    'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <>
      <Card className="border-2 border-[#0F3A5F]/20 bg-gradient-to-br from-[#0F3A5F]/5 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0F3A5F] flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            My Attendance — Today {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayRec ? (
            <div className={`rounded-lg border p-4 ${statusColors[todayRec.status] || 'bg-gray-50'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-lg">{todayRec.status}</p>
                  <p className="text-xs mt-0.5">
                    In: {fmtTime(todayRec.in_time)}
                    {todayRec.out_time  && <> &nbsp;•&nbsp; Out: {fmtTime(todayRec.out_time)}</>}
                    {todayRec.work_hours && <> &nbsp;•&nbsp; <strong>{todayRec.work_hours}h worked</strong></>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {todayRec.status === 'Present' && !todayRec.out_time && (
                    <Button size="sm" variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50" onClick={handleCheckOut} disabled={saving}>
                      <Timer className="mr-1 h-3.5 w-3.5" /> Check Out
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-blue-400 text-blue-600 hover:bg-blue-50" onClick={() => setShowLeave(true)}>
                    <CalendarX className="mr-1 h-3.5 w-3.5" /> Apply Leave
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">You haven't marked attendance yet today.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markAttendance('Present')} disabled={saving}>
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Mark Present
                </Button>
                <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={() => markAttendance('Half Day')} disabled={saving}>
                  <Clock className="mr-1.5 h-4 w-4" /> Half Day
                </Button>
                <Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-50" onClick={() => setShowLeave(true)}>
                  <CalendarX className="mr-1.5 h-4 w-4" /> Apply Leave
                </Button>
                <Button size="sm" variant="destructive" onClick={() => markAttendance('Absent')} disabled={saving}>
                  <XCircle className="mr-1.5 h-4 w-4" /> Mark Absent
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Apply Modal */}
      <Dialog open={showLeave} onOpenChange={setShowLeave}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Leave Type</Label>
              <Select value={leaveForm.leave_type} onValueChange={v => setLeaveForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>From Date</Label><Input type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(p => ({ ...p, from_date: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>To Date</Label><Input type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(p => ({ ...p, to_date: e.target.value }))} required /></div>
            </div>
            <div className="space-y-1"><Label>Reason</Label>
              <Input value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Brief reason for leave" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeave(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Main HRAttendance Page ────────────────────────────────────────────────────
const HRAttendance = () => {
  const { toast } = useToast();
  const { user }  = useAuth();
  const isAdmin   = ['super_admin', 'sub_admin', 'manager'].includes(user?.role);

  const [profiles,   setProfiles]   = useState([]);  // from 'profiles' table
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [holidays,   setHolidays]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear());
  const [filterEmp,   setFilterEmp]   = useState('all');

  const [isAddAttOpen,   setIsAddAttOpen]   = useState(false);
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [isAddHolOpen,   setIsAddHolOpen]   = useState(false);
  const [isViewOpen,     setIsViewOpen]     = useState(false);
  const [viewRecord,     setViewRecord]     = useState(null);

  const [attForm,   setAttForm]   = useState({ emp_id: '', att_date: todayStr(), status: 'Present', in_time: '09:00', out_time: '18:00', work_hours: '', remarks: '' });
  const [leaveForm, setLeaveForm] = useState({ emp_id: '', leave_type: 'Casual Leave', from_date: todayStr(), to_date: todayStr(), reason: '', status: 'Pending' });
  const [holForm,   setHolForm]   = useState({ holiday_name: '', holiday_date: todayStr(), description: '' });

  // ── Load from 'profiles' table ────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [profRes, attRes, leaveRes, holRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id,name,email,role').neq('role', 'super_admin').order('name'),
      supabaseAdmin.from('hr_attendance').select('*').order('att_date', { ascending: false }),
      supabaseAdmin.from('hr_leaves').select('*').order('from_date', { ascending: false }),
      supabaseAdmin.from('hr_holidays').select('*').order('holiday_date', { ascending: false }),
    ]);
    setProfiles(profRes.data  || []);
    setAttendance(attRes.data || []);
    setLeaves(leaveRes.data   || []);
    setHolidays(holRes.data   || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const empName = (id) => profiles.find(p => p.id === id)?.name || id;

  // ── Filtered Attendance ───────────────────────────────────────────────
  const filteredAtt = attendance.filter(a => {
    const d          = new Date(a.att_date);
    const matchMonth = d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
    const matchEmp   = filterEmp === 'all' || a.emp_id === filterEmp;
    const matchSearch= !search ||
      empName(a.emp_id).toLowerCase().includes(search.toLowerCase()) ||
      a.emp_id?.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchEmp && matchSearch;
  });

  const myAtt = attendance.filter(a => {
    const d = new Date(a.att_date);
    return a.emp_id === user?.id &&
      d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  const monthAtt  = attendance.filter(a => { const d = new Date(a.att_date); return d.getMonth()+1===filterMonth && d.getFullYear()===filterYear; });
  const totalP    = monthAtt.filter(a => a.status === 'Present').length;
  const totalA    = monthAtt.filter(a => a.status === 'Absent').length;
  const totalL    = monthAtt.filter(a => a.status === 'Leave').length;
  const totalHD   = monthAtt.filter(a => a.status === 'Half Day').length;
  const pendingLv = leaves.filter(l => l.status === 'Pending').length;

  // ── Add Attendance (Admin) ────────────────────────────────────────────
  const handleAddAtt = async (e) => {
    e.preventDefault();
    if (!attForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    setSaving(true);
    let wh = attForm.work_hours;
    if (!wh && attForm.in_time && attForm.out_time) {
      const [ih, im] = attForm.in_time.split(':').map(Number);
      const [oh, om] = attForm.out_time.split(':').map(Number);
      wh = (((oh * 60 + om) - (ih * 60 + im)) / 60).toFixed(1);
    }
    const { error } = await supabaseAdmin.from('hr_attendance').upsert(
      { ...attForm, work_hours: wh, created_at: new Date().toISOString() },
      { onConflict: 'emp_id,att_date' }
    );
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Attendance marked', description: `${empName(attForm.emp_id)} — ${attForm.att_date}` });
    setIsAddAttOpen(false);
    setAttForm({ emp_id: '', att_date: todayStr(), status: 'Present', in_time: '09:00', out_time: '18:00', work_hours: '', remarks: '' });
    await load();
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_leaves').insert({ ...leaveForm, created_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Leave added' });
    setIsAddLeaveOpen(false);
    setLeaveForm({ emp_id: '', leave_type: 'Casual Leave', from_date: todayStr(), to_date: todayStr(), reason: '', status: 'Pending' });
    await load();
  };

  const updateLeaveStatus = async (id, newStatus) => {
    const { error } = await supabaseAdmin.from('hr_leaves').update({ status: newStatus }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Leave ${newStatus}` });
    await load();
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabaseAdmin.from('hr_holidays').insert({ ...holForm, created_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Holiday added' });
    setIsAddHolOpen(false);
    setHolForm({ holiday_name: '', holiday_date: todayStr(), description: '' });
    await load();
  };

  const deleteHoliday = async (id) => {
    await supabaseAdmin.from('hr_holidays').delete().eq('id', id);
    toast({ title: '🗑️ Holiday deleted', variant: 'destructive' });
    await load();
  };

  const statusBadge = (s) => {
    const map = {
      Present:    'bg-green-50 text-green-700 border-green-300',
      Absent:     'bg-red-50 text-red-700 border-red-300',
      'Half Day': 'bg-yellow-50 text-yellow-700 border-yellow-300',
      Leave:      'bg-blue-50 text-blue-700 border-blue-300',
      Holiday:    'bg-purple-50 text-purple-700 border-purple-300',
    };
    return <Badge variant="outline" className={map[s] || 'bg-gray-100'}>{s}</Badge>;
  };

  const leaveBadge = (s) => {
    const map = { Approved: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700', Pending: 'bg-yellow-100 text-yellow-700' };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Attendance Management</h1>
          <p className="text-sm text-gray-500">HR Module — Mark attendance, manage leaves & holidays</p>
        </div>
        {isAdmin && (
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
        )}
      </div>

      {/* ✅ Self-Attendance Widget — ALL roles */}
      <SelfAttendanceWidget user={user} onMarked={load} />

      {/* My Monthly Summary (non-admin) */}
      {!isAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">
              My Attendance — {MONTHS[filterMonth - 1]} {filterYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              {[
                { label: 'Present',  val: myAtt.filter(a => a.status === 'Present').length,  color: 'text-green-600' },
                { label: 'Absent',   val: myAtt.filter(a => a.status === 'Absent').length,   color: 'text-red-500' },
                { label: 'Half Day', val: myAtt.filter(a => a.status === 'Half Day').length, color: 'text-yellow-600' },
                { label: 'Leave',    val: myAtt.filter(a => a.status === 'Leave').length,    color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Present',       val: totalP,    color: 'border-green-500 text-green-600' },
            { label: 'Absent',        val: totalA,    color: 'border-red-400 text-red-600' },
            { label: 'Half Day',      val: totalHD,   color: 'border-yellow-400 text-yellow-600' },
            { label: 'On Leave',      val: totalL,    color: 'border-blue-400 text-blue-600' },
            { label: 'Leave Pending', val: pendingLv, color: 'border-orange-400 text-orange-600' },
          ].map(s => (
            <Card key={s.label} className={`border-l-4 ${s.color.split(' ')[0]}`}>
              <CardContent className="p-3">
                <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Tabs — Admin only */}
      {isAdmin && (
        <Tabs defaultValue="attendance">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="attendance">📋 Attendance Log</TabsTrigger>
            <TabsTrigger value="leaves">📅 Leave Requests</TabsTrigger>
            <TabsTrigger value="holidays">🏖️ Holidays</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="flex flex-wrap gap-3 mt-4 mb-3">
              <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
                <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filterEmp} onValueChange={setFilterEmp}>
                <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Employees" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                          {['#', 'Employee', 'Date', 'Status', 'In Time', 'Out Time', 'Hours', 'Remarks', ''].map(h =>
                            <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAtt.map((a, i) => (
                          <TableRow key={a.id} className="hover:bg-gray-50">
                            <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{empName(a.emp_id)}</p>
                              <p className="text-xs text-gray-400 font-mono">{a.emp_id?.slice(0, 8)}...</p>
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
                          <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">No records for this period.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leaves">
            <Card className="mt-4">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                        {['#', 'Employee', 'Type', 'From', 'To', 'Reason', 'Status', 'Action'].map(h =>
                          <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((l, i) => (
                        <TableRow key={l.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{empName(l.emp_id)}</p>
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
                      {leaves.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">No leave records.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <Card className="mt-4">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                      {['#', 'Holiday Name', 'Date', 'Description', 'Action'].map(h =>
                        <TableHead key={h} className="text-white text-xs">{h}</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((h, i) => (
                      <TableRow key={h.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
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
                    {holidays.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No holidays added yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* My Leave Requests (non-admin) */}
      {!isAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">📅 My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {['Type', 'From', 'To', 'Reason', 'Status'].map(h =>
                    <TableHead key={h} className="text-xs text-gray-500">{h}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.filter(l => l.emp_id === user?.id).slice(0, 10).map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.leave_type}</TableCell>
                    <TableCell className="text-sm">{fmtDate(l.from_date)}</TableCell>
                    <TableCell className="text-sm">{fmtDate(l.to_date)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{l.reason || '—'}</TableCell>
                    <TableCell>{leaveBadge(l.status)}</TableCell>
                  </TableRow>
                ))}
                {leaves.filter(l => l.emp_id === user?.id).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-400 text-sm">No leave requests yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Admin Modals ── */}
      {isAdmin && (
        <>
          {/* Mark Attendance Modal */}
          <Dialog open={isAddAttOpen} onOpenChange={setIsAddAttOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="text-[#0F3A5F]">Mark Attendance</DialogTitle></DialogHeader>
              <form onSubmit={handleAddAtt} className="space-y-4">
                <div className="space-y-1"><Label>Employee *</Label>
                  <Select value={attForm.emp_id} onValueChange={v => setAttForm(p => ({ ...p, emp_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Date *</Label><Input type="date" value={attForm.att_date} onChange={e => setAttForm(p => ({ ...p, att_date: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Status *</Label>
                    <Select value={attForm.status} onValueChange={v => setAttForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ATTENDANCE_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>In Time</Label><Input type="time" value={attForm.in_time} onChange={e => setAttForm(p => ({ ...p, in_time: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Out Time</Label><Input type="time" value={attForm.out_time} onChange={e => setAttForm(p => ({ ...p, out_time: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Remarks</Label><Input value={attForm.remarks} onChange={e => setAttForm(p => ({ ...p, remarks: e.target.value }))} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddAttOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Mark Attendance'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Leave Modal */}
          <Dialog open={isAddLeaveOpen} onOpenChange={setIsAddLeaveOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="text-[#0F3A5F]">Add Leave Request</DialogTitle></DialogHeader>
              <form onSubmit={handleAddLeave} className="space-y-4">
                <div className="space-y-1"><Label>Employee *</Label>
                  <Select value={leaveForm.emp_id} onValueChange={v => setLeaveForm(p => ({ ...p, emp_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Leave Type</Label>
                    <Select value={leaveForm.leave_type} onValueChange={v => setLeaveForm(p => ({ ...p, leave_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Status</Label>
                    <Select value={leaveForm.status} onValueChange={v => setLeaveForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>From</Label><Input type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(p => ({ ...p, from_date: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>To</Label><Input type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(p => ({ ...p, to_date: e.target.value }))} required /></div>
                </div>
                <div className="space-y-1"><Label>Reason</Label><Input value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddLeaveOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Submit Leave'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Holiday Modal */}
          <Dialog open={isAddHolOpen} onOpenChange={setIsAddHolOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="text-[#0F3A5F]">Add Holiday</DialogTitle></DialogHeader>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div className="space-y-1"><Label>Holiday Name *</Label><Input required value={holForm.holiday_name} onChange={e => setHolForm(p => ({ ...p, holiday_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" required value={holForm.holiday_date} onChange={e => setHolForm(p => ({ ...p, holiday_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Description</Label><Input value={holForm.description} onChange={e => setHolForm(p => ({ ...p, description: e.target.value }))} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddHolOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Add Holiday'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Record Modal */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Attendance Detail</DialogTitle></DialogHeader>
              {viewRecord && (
                <div className="space-y-3">
                  {[
                    ['Employee',   empName(viewRecord.emp_id)],
                    ['Date',       fmtDate(viewRecord.att_date)],
                    ['Status',     viewRecord.status],
                    ['In Time',    fmtTime(viewRecord.in_time)],
                    ['Out Time',   fmtTime(viewRecord.out_time)],
                    ['Work Hours', viewRecord.work_hours ? `${viewRecord.work_hours}h` : '—'],
                    ['Remarks',    viewRecord.remarks || '—'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between border-b pb-2 last:border-0">
                      <span className="text-sm text-gray-500">{l}</span>
                      <span className="text-sm font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default HRAttendance;
