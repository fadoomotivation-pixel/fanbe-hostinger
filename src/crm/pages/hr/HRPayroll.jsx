// src/crm/pages/hr/HRPayroll.jsx
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
  IndianRupee, PlusCircle, Loader2, Search, Download,
  Eye, Printer, CheckCircle, XCircle, Clock, Wallet
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = [2024, 2025, 2026, 2027];
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

// ────────────────────────────────────────────────────────────
const HRPayroll = () => {
  const { toast } = useToast();

  const [employees,  setEmployees]  = useState([]);
  const [payrolls,   setPayrolls]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');

  // filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear());
  const [filterEmp,   setFilterEmp]   = useState('all');
  const [filterStatus,setFilterStatus]= useState('all');

  // modals
  const [isGenOpen,    setIsGenOpen]    = useState(false);
  const [isSlipOpen,   setIsSlipOpen]   = useState(false);
  const [slipRecord,   setSlipRecord]   = useState(null);
  const [bulkLoading,  setBulkLoading]  = useState(false);

  // generate form
  const [genForm, setGenForm] = useState({
    emp_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basic_salary: '', hra: '', conveyance: '', other_allowance: '',
    pf_deduction: '', tds: '', other_deduction: '', advance: '',
    working_days: 26, present_days: 26, remarks: '',
    payment_mode: 'Bank Transfer', payment_date: today(), status: 'Paid'
  });

  // ── Load ─────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [empRes, payRes] = await Promise.all([
      supabaseAdmin.from('hr_employees').select('id,emp_id,name,department,designation,salary,bank_name,account_no,ifsc,branch').order('name'),
      supabaseAdmin.from('hr_payroll').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    ]);
    setEmployees(empRes.data || []);
    setPayrolls(payRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── When employee selected → prefill salary ──────────────
  const handleEmpSelect = (empId) => {
    const emp = employees.find(e => e.emp_id === empId);
    if (!emp) return;
    const basic  = Number(emp.salary || 0);
    const hra    = Math.round(basic * 0.4);
    const conv   = Math.round(basic * 0.1);
    const pf     = Math.round(basic * 0.12);
    setGenForm(p => ({
      ...p,
      emp_id: empId,
      basic_salary: String(basic),
      hra: String(hra),
      conveyance: String(conv),
      other_allowance: '0',
      pf_deduction: String(pf),
      tds: '0',
      other_deduction: '0',
      advance: '0',
    }));
  };

  // ── Calc gross / net ─────────────────────────────────────
  const calcPayroll = (f) => {
    const gross = (Number(f.basic_salary)||0) + (Number(f.hra)||0) + (Number(f.conveyance)||0) + (Number(f.other_allowance)||0);
    const deductions = (Number(f.pf_deduction)||0) + (Number(f.tds)||0) + (Number(f.other_deduction)||0) + (Number(f.advance)||0);
    // pro-rata if present days < working days
    const ratio = f.working_days > 0 ? (Number(f.present_days)||0) / Number(f.working_days) : 1;
    const proGross = Math.round(gross * ratio);
    const net = proGross - deductions;
    return { gross: proGross, deductions, net: Math.max(net, 0) };
  };

  const { gross: previewGross, deductions: previewDed, net: previewNet } = calcPayroll(genForm);

  // ── Save payroll ─────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    // duplicate check
    const dup = payrolls.find(p => p.emp_id === genForm.emp_id && p.month === genForm.month && p.year === genForm.year);
    if (dup) { toast({ title: 'Already exists', description: `Payroll for this employee & month already generated.`, variant: 'destructive' }); return; }
    setSaving(true);
    const { gross, deductions, net } = calcPayroll(genForm);
    const emp = employees.find(e => e.emp_id === genForm.emp_id);
    const { error } = await supabaseAdmin.from('hr_payroll').insert({
      emp_id: genForm.emp_id,
      emp_name: emp?.name || '',
      department: emp?.department || '',
      designation: emp?.designation || '',
      month: genForm.month,
      year: genForm.year,
      basic_salary: Number(genForm.basic_salary) || 0,
      hra: Number(genForm.hra) || 0,
      conveyance: Number(genForm.conveyance) || 0,
      other_allowance: Number(genForm.other_allowance) || 0,
      gross_salary: gross,
      pf_deduction: Number(genForm.pf_deduction) || 0,
      tds: Number(genForm.tds) || 0,
      other_deduction: Number(genForm.other_deduction) || 0,
      advance: Number(genForm.advance) || 0,
      total_deductions: deductions,
      net_salary: net,
      working_days: Number(genForm.working_days),
      present_days: Number(genForm.present_days),
      payment_mode: genForm.payment_mode,
      payment_date: genForm.payment_date,
      status: genForm.status,
      remarks: genForm.remarks,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Payroll generated', description: `${emp?.name} — ${SHORT_MONTHS[genForm.month-1]} ${genForm.year}` });
    setIsGenOpen(false);
    await load();
  };

  // ── Bulk generate for all active employees ────────────────
  const handleBulkGenerate = async () => {
    const activeEmps = employees.filter(e => e.status !== 'Inactive');
    if (!activeEmps.length) { toast({ title: 'No active employees' }); return; }
    setBulkLoading(true);
    let count = 0;
    for (const emp of activeEmps) {
      const dup = payrolls.find(p => p.emp_id === emp.emp_id && p.month === filterMonth && p.year === filterYear);
      if (dup) continue;
      const basic = Number(emp.salary || 0);
      const hra   = Math.round(basic * 0.4);
      const conv  = Math.round(basic * 0.1);
      const pf    = Math.round(basic * 0.12);
      const gross = basic + hra + conv;
      const net   = gross - pf;
      await supabaseAdmin.from('hr_payroll').insert({
        emp_id: emp.emp_id, emp_name: emp.name, department: emp.department,
        designation: emp.designation, month: filterMonth, year: filterYear,
        basic_salary: basic, hra, conveyance: conv, other_allowance: 0,
        gross_salary: gross, pf_deduction: pf, tds: 0,
        other_deduction: 0, advance: 0, total_deductions: pf, net_salary: net,
        working_days: 26, present_days: 26,
        payment_mode: 'Bank Transfer', payment_date: today(),
        status: 'Pending', created_at: new Date().toISOString(),
      });
      count++;
    }
    setBulkLoading(false);
    toast({ title: `✅ ${count} payroll records generated for ${SHORT_MONTHS[filterMonth-1]} ${filterYear}` });
    await load();
  };

  // ── Update status ─────────────────────────────────────────
  const updateStatus = async (id, status) => {
    const { error } = await supabaseAdmin.from('hr_payroll').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Status updated → ${status}` });
    await load();
  };

  // ── Delete ────────────────────────────────────────────────
  const deletePayroll = async (id) => {
    await supabaseAdmin.from('hr_payroll').delete().eq('id', id);
    toast({ title: '🗑️ Payroll record deleted', variant: 'destructive' });
    await load();
  };

  // ── Filter ────────────────────────────────────────────────
  const filtered = payrolls.filter(p => {
    const matchMonth  = p.month === filterMonth && p.year === filterYear;
    const matchEmp    = filterEmp === 'all' || p.emp_id === filterEmp;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSearch = !search ||
      p.emp_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.emp_id?.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchEmp && matchStatus && matchSearch;
  });

  // ── Monthly stats ─────────────────────────────────────────
  const monthPayrolls = payrolls.filter(p => p.month === filterMonth && p.year === filterYear);
  const totalGross    = monthPayrolls.reduce((s,p) => s + Number(p.gross_salary||0), 0);
  const totalNet      = monthPayrolls.reduce((s,p) => s + Number(p.net_salary||0), 0);
  const totalDed      = monthPayrolls.reduce((s,p) => s + Number(p.total_deductions||0), 0);
  const paidCount     = monthPayrolls.filter(p => p.status === 'Paid').length;
  const pendingCount  = monthPayrolls.filter(p => p.status === 'Pending').length;

  // ── Status badge ──────────────────────────────────────────
  const statusBadge = (s) => {
    const map = {
      Paid:    'bg-green-50 text-green-700 border-green-300',
      Pending: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      Hold:    'bg-red-50 text-red-700 border-red-300',
    };
    return <Badge variant="outline" className={map[s] || 'bg-gray-100'}>{s}</Badge>;
  };

  const empName = (empId) => employees.find(e => e.emp_id === empId)?.name || empId;

  // ── Salary slip view ─────────────────────────────────────
  const openSlip = (rec) => { setSlipRecord(rec); setIsSlipOpen(true); };

  // ── Print slip ───────────────────────────────────────────
  const printSlip = () => {
    const el = document.getElementById('salary-slip-print');
    const w  = window.open('', '_blank');
    w.document.write(`<html><head><title>Salary Slip</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px;font-size:12px}.head{text-align:center;margin-bottom:16px}.total-row{font-weight:bold;background:#f0f0f0}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Payroll Management</h1>
          <p className="text-sm text-gray-500">HR Module — Generate salary slips & manage monthly payroll</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsGenOpen(true)} className="bg-[#0F3A5F] hover:bg-[#1a5a8f]">
            <PlusCircle className="mr-2 h-4 w-4" /> Generate Payroll
          </Button>
          <Button onClick={handleBulkGenerate} variant="outline" className="border-[#0F3A5F] text-[#0F3A5F]" disabled={bulkLoading}>
            {bulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
            Bulk Generate
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Gross',     val: `₹${fmt(totalGross)}`, color: 'border-blue-500 text-blue-700' },
          { label: 'Total Deductions',val: `₹${fmt(totalDed)}`,   color: 'border-orange-400 text-orange-600' },
          { label: 'Net Payable',     val: `₹${fmt(totalNet)}`,   color: 'border-green-500 text-green-700' },
          { label: 'Paid',            val: paidCount,              color: 'border-emerald-400 text-emerald-600' },
          { label: 'Pending',         val: pendingCount,           color: 'border-yellow-400 text-yellow-600' },
        ].map(s => (
          <Card key={s.label} className={`border-l-4 ${s.color.split(' ')[0]}`}>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className={`text-lg font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{SHORT_MONTHS.map((m,i)=><SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
          <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterEmp} onValueChange={setFilterEmp}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e=><SelectItem key={e.emp_id} value={e.emp_id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Hold">Hold</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input placeholder="Search employee..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9" />
        </div>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                    {['#','Employee','Department','Month','Gross','Deductions','Net Salary','Status','Actions'].map(h=>
                      <TableHead key={h} className="text-white text-xs whitespace-nowrap">{h}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p,i) => (
                    <TableRow key={p.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs text-gray-400">{i+1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{p.emp_name}</p>
                        <p className="text-xs text-gray-400">{p.emp_id}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">{p.department || '—'}</p>
                        <p className="text-xs text-gray-400">{p.designation || '—'}</p>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{SHORT_MONTHS[(p.month||1)-1]} {p.year}</TableCell>
                      <TableCell className="text-sm font-semibold text-blue-700">₹{fmt(p.gross_salary)}</TableCell>
                      <TableCell className="text-sm text-red-600">₹{fmt(p.total_deductions)}</TableCell>
                      <TableCell className="text-sm font-bold text-green-700">₹{fmt(p.net_salary)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" title="View Slip" onClick={() => openSlip(p)}>
                            <Eye className="h-4 w-4 text-[#0F3A5F]" />
                          </Button>
                          {p.status !== 'Paid' && (
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(p.id, 'Paid')}>Pay</Button>
                          )}
                          {p.status === 'Pending' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-300" onClick={() => updateStatus(p.id, 'Hold')}>Hold</Button>
                          )}
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => deletePayroll(p.id)}>
                            <span className="text-red-400 text-xs font-bold">✕</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">No payroll records. Click "Generate Payroll" or "Bulk Generate".</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Generate Payroll Modal ── */}
      <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Generate Payroll</DialogTitle></DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-5">

            {/* Employee + Period */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 space-y-1">
                <Label>Employee *</Label>
                <Select value={genForm.emp_id} onValueChange={handleEmpSelect}>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e=><SelectItem key={e.emp_id} value={e.emp_id}>{e.name} — {e.designation || e.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Month *</Label>
                <Select value={String(genForm.month)} onValueChange={v=>setGenForm(p=>({...p,month:Number(v)}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m,i)=><SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year *</Label>
                <Select value={String(genForm.year)} onValueChange={v=>setGenForm(p=>({...p,year:Number(v)}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={genForm.status} onValueChange={v=>setGenForm(p=>({...p,status:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Hold">Hold</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            {/* Earnings */}
            <div>
              <p className="text-xs font-bold uppercase text-green-700 mb-2">💰 Earnings</p>
              <div className="grid grid-cols-2 gap-3">
                {[['basic_salary','Basic Salary'],['hra','HRA'],['conveyance','Conveyance'],['other_allowance','Other Allowance']].map(([k,l])=>(
                  <div key={k} className="space-y-1">
                    <Label>{l}</Label>
                    <Input type="number" min="0" value={genForm[k]} onChange={e=>setGenForm(p=>({...p,[k]:e.target.value}))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <p className="text-xs font-bold uppercase text-red-600 mb-2">➖ Deductions</p>
              <div className="grid grid-cols-2 gap-3">
                {[['pf_deduction','PF'],['tds','TDS'],['other_deduction','Other Deduction'],['advance','Advance']].map(([k,l])=>(
                  <div key={k} className="space-y-1">
                    <Label>{l}</Label>
                    <Input type="number" min="0" value={genForm[k]} onChange={e=>setGenForm(p=>({...p,[k]:e.target.value}))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Working Days</Label><Input type="number" min="1" max="31" value={genForm.working_days} onChange={e=>setGenForm(p=>({...p,working_days:e.target.value}))} /></div>
              <div className="space-y-1"><Label>Present Days</Label><Input type="number" min="0" max="31" value={genForm.present_days} onChange={e=>setGenForm(p=>({...p,present_days:e.target.value}))} /></div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Payment Mode</Label>
                <Select value={genForm.payment_mode} onValueChange={v=>setGenForm(p=>({...p,payment_mode:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Payment Date</Label><Input type="date" value={genForm.payment_date} onChange={e=>setGenForm(p=>({...p,payment_date:e.target.value}))} /></div>
            </div>

            <div className="space-y-1"><Label>Remarks</Label><Input value={genForm.remarks} onChange={e=>setGenForm(p=>({...p,remarks:e.target.value}))} placeholder="Optional" /></div>

            {/* Live Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid grid-cols-3 text-center">
              <div><p className="text-xs text-gray-500">Gross</p><p className="text-lg font-bold text-blue-700">₹{fmt(previewGross)}</p></div>
              <div><p className="text-xs text-gray-500">Deductions</p><p className="text-lg font-bold text-red-600">₹{fmt(previewDed)}</p></div>
              <div><p className="text-xs text-gray-500">Net Payable</p><p className="text-xl font-bold text-green-700">₹{fmt(previewNet)}</p></div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setIsGenOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : 'Generate & Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Salary Slip Modal ── */}
      <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0F3A5F]">Salary Slip</DialogTitle>
          </DialogHeader>

          {slipRecord && (
            <div id="salary-slip-print" className="space-y-4">
              {/* Company Header */}
              <div className="head text-center border-b pb-3">
                <h2 className="text-xl font-bold text-[#0F3A5F]">FANBE GROUP</h2>
                <p className="text-xs text-gray-500">Real Estate | Ghaziabad, UP</p>
                <p className="text-sm font-semibold mt-1">SALARY SLIP — {MONTHS[(slipRecord.month||1)-1].toUpperCase()} {slipRecord.year}</p>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Employee Name', slipRecord.emp_name],
                  ['Employee ID',   slipRecord.emp_id],
                  ['Department',    slipRecord.department || '—'],
                  ['Designation',   slipRecord.designation || '—'],
                  ['Payment Mode',  slipRecord.payment_mode || '—'],
                  ['Payment Date',  slipRecord.payment_date ? new Date(slipRecord.payment_date).toLocaleDateString('en-IN') : '—'],
                  ['Working Days',  slipRecord.working_days],
                  ['Present Days',  slipRecord.present_days],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between border-b py-1">
                    <span className="text-gray-500 text-xs">{l}</span>
                    <span className="font-medium text-xs">{v}</span>
                  </div>
                ))}
              </div>

              {/* Earnings & Deductions Table */}
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-[#0F3A5F] text-white">
                    <th className="p-2 text-left text-xs">Earnings</th>
                    <th className="p-2 text-right text-xs">Amount (₹)</th>
                    <th className="p-2 text-left text-xs">Deductions</th>
                    <th className="p-2 text-right text-xs">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [['Basic Salary', slipRecord.basic_salary], ['PF', slipRecord.pf_deduction]],
                    [['HRA', slipRecord.hra], ['TDS', slipRecord.tds]],
                    [['Conveyance', slipRecord.conveyance], ['Other Deduction', slipRecord.other_deduction]],
                    [['Other Allowance', slipRecord.other_allowance], ['Advance', slipRecord.advance]],
                  ].map(([earn, ded], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2 text-xs">{earn[0]}</td>
                      <td className="p-2 text-right text-xs">₹{fmt(earn[1])}</td>
                      <td className="p-2 text-xs">{ded[0]}</td>
                      <td className="p-2 text-right text-xs">₹{fmt(ded[1])}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td className="p-2 text-xs">Gross Salary</td>
                    <td className="p-2 text-right text-xs text-blue-700">₹{fmt(slipRecord.gross_salary)}</td>
                    <td className="p-2 text-xs">Total Deductions</td>
                    <td className="p-2 text-right text-xs text-red-600">₹{fmt(slipRecord.total_deductions)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-green-50">
                    <td colSpan={3} className="p-2 font-bold text-sm text-right text-green-800">NET PAYABLE SALARY</td>
                    <td className="p-2 text-right font-bold text-green-700 text-sm">₹{fmt(slipRecord.net_salary)}</td>
                  </tr>
                </tfoot>
              </table>

              {slipRecord.remarks && (
                <p className="text-xs text-gray-500">Remarks: {slipRecord.remarks}</p>
              )}

              <p className="text-xs text-center text-gray-400">This is a computer-generated salary slip. No signature required.</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSlipOpen(false)}>Close</Button>
            <Button className="bg-[#0F3A5F]" onClick={printSlip}>
              <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRPayroll;
