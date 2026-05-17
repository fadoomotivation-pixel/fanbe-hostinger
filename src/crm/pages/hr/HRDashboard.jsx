// src/crm/pages/hr/HRDashboard.jsx  —  Phase 5: Full HR Analytics
import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Users, IndianRupee, ClipboardList, FileText,
  FolderOpen, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, UserCheck, UserX, CalendarDays, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const COLORS    = ['#0F3A5F','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const ATT_COLORS = { Present:'#10b981', Absent:'#ef4444', 'Half Day':'#f59e0b', Leave:'#8b5cf6', Holiday:'#3b82f6' };
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt    = (n) => Number(n||0).toLocaleString('en-IN');
const fmtK   = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${fmt(n)}`;
const today  = new Date();

// ────────────────────────────────────────────────────────────
const HRDashboard = () => {
  const navigate = useNavigate();

  // raw data
  const [employees,  setEmployees]  = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [payrolls,   setPayrolls]   = useState([]);
  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  // ── Fetch all HR tables ───────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      const [eRes, aRes, lRes, pRes, dRes] = await Promise.all([
        supabaseAdmin.from('hr_employees').select('*'),
        supabaseAdmin.from('hr_attendance').select('emp_id,att_date,status'),
        supabaseAdmin.from('hr_leaves').select('emp_id,status,from_date,to_date,leave_type'),
        supabaseAdmin.from('hr_payroll').select('emp_id,month,year,gross_salary,net_salary,total_deductions,status'),
        supabaseAdmin.from('hr_documents').select('emp_id,expiry_date,category,created_at'),
      ]);
      setEmployees(eRes.data  || []);
      setAttendance(aRes.data || []);
      setLeaves(lRes.data     || []);
      setPayrolls(pRes.data   || []);
      setDocuments(dRes.data  || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // EMPLOYEE STATS
  // ────────────────────────────────────────────────────────────
  const activeEmps   = employees.filter(e => e.status === 'Active');
  const inactiveEmps = employees.filter(e => e.status === 'Inactive');
  const totalSalary  = activeEmps.reduce((s,e) => s + Number(e.salary||0), 0);

  // Dept breakdown
  const deptMap = employees.reduce((acc, e) => {
    const k = e.department || 'Other';
    acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // Branch breakdown
  const branchMap = employees.reduce((acc, e) => {
    const k = e.branch || 'Other';
    acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  const branchData = Object.entries(branchMap).map(([name, value]) => ({ name, value }));

  // Joining trend (last 8 months)
  const joiningTrend = (() => {
    const map = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      map[`${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }
    employees.forEach(e => {
      if (!e.doj) return;
      const d  = new Date(e.doj);
      const k  = `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (map[k] !== undefined) map[k]++;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count }));
  })();

  // Avg salary by designation (top 8)
  const desgSalary = Object.entries(
    employees.reduce((acc, e) => {
      if (!e.designation) return acc;
      if (!acc[e.designation]) acc[e.designation] = { total: 0, count: 0 };
      acc[e.designation].total += Number(e.salary || 0);
      acc[e.designation].count += 1;
      return acc;
    }, {})
  ).map(([name, d]) => ({ name: name.split(' ').slice(0, 2).join(' '), avg: Math.round(d.total / d.count) }))
   .sort((a, b) => b.avg - a.avg).slice(0, 8);

  // ────────────────────────────────────────────────────────────
  // ATTENDANCE STATS (current month)
  // ────────────────────────────────────────────────────────────
  const thisMonthAtt = attendance.filter(a => {
    const d = new Date(a.att_date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const attStatusCount = thisMonthAtt.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1; return acc;
  }, {});
  const attPieData = Object.entries(attStatusCount).map(([name, value]) => ({ name, value }));

  // Daily attendance trend (last 14 days)
  const attTrend = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayAtt = attendance.filter(a => a.att_date === key);
      days.push({
        date: `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`,
        Present: dayAtt.filter(a => a.status === 'Present').length,
        Absent:  dayAtt.filter(a => a.status === 'Absent').length,
        Leave:   dayAtt.filter(a => a.status === 'Leave' || a.status === 'Half Day').length,
      });
    }
    return days;
  })();

  // ────────────────────────────────────────────────────────────
  // LEAVE STATS
  // ────────────────────────────────────────────────────────────
  const pendingLeaves  = leaves.filter(l => l.status === 'Pending');
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const leaveTypeData  = Object.entries(
    leaves.reduce((acc, l) => { acc[l.leave_type||'Other'] = (acc[l.leave_type||'Other']||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // ────────────────────────────────────────────────────────────
  // PAYROLL STATS
  // ────────────────────────────────────────────────────────────
  const currentMonthPayrolls = payrolls.filter(
    p => p.month === today.getMonth()+1 && p.year === today.getFullYear()
  );
  const currGross     = currentMonthPayrolls.reduce((s,p) => s+Number(p.gross_salary||0),0);
  const currNet       = currentMonthPayrolls.reduce((s,p) => s+Number(p.net_salary||0),0);
  const currPaid      = currentMonthPayrolls.filter(p=>p.status==='Paid').length;
  const currPending   = currentMonthPayrolls.filter(p=>p.status==='Pending').length;

  // Payroll trend (last 6 months)
  const payrollTrend = (() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(today.getFullYear(), today.getMonth()-i, 1);
      const mon = d.getMonth()+1, yr = d.getFullYear();
      const recs = payrolls.filter(p => p.month===mon && p.year===yr);
      arr.push({
        month: SHORT_MONTHS[d.getMonth()],
        Gross:  recs.reduce((s,p)=>s+Number(p.gross_salary||0),0),
        Net:    recs.reduce((s,p)=>s+Number(p.net_salary||0),0),
        Deductions: recs.reduce((s,p)=>s+Number(p.total_deductions||0),0),
      });
    }
    return arr;
  })();

  // ────────────────────────────────────────────────────────────
  // DOCUMENT STATS
  // ────────────────────────────────────────────────────────────
  const expiredDocs    = documents.filter(d => d.expiry_date && new Date(d.expiry_date) < today);
  const expiringSoon   = documents.filter(d => {
    if (!d.expiry_date) return false;
    const diff = (new Date(d.expiry_date)-today)/(1000*60*60*24);
    return diff>=0 && diff<=30;
  });

  // Recently joined (last 30 days)
  const recentJoins = employees
    .filter(e => e.doj && (today - new Date(e.doj))/(1000*60*60*24) <= 30)
    .sort((a,b) => new Date(b.doj)-new Date(a.doj))
    .slice(0,5);

  // Top earners
  const topEarners = [...employees]
    .filter(e=>e.status==='Active')
    .sort((a,b)=>Number(b.salary||0)-Number(a.salary||0))
    .slice(0,5);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">HR Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">Live data — Employees · Attendance · Payroll · Leaves · Documents</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={()=>navigate('/crm/admin/hr/attendance')}>Attendance</Button>
          <Button variant="outline" size="sm" onClick={()=>navigate('/crm/admin/hr/payroll')}>Payroll</Button>
          <Button variant="outline" size="sm" onClick={()=>navigate('/crm/admin/hr/documents')}>Documents</Button>
        </div>
      </div>

      {/* ── KPI Row 1: Headcount & Payroll ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label:'Total Staff',     val: employees.length,   icon: Users,       border:'border-blue-500',   text:'text-blue-700' },
          { label:'Active',          val: activeEmps.length,  icon: UserCheck,   border:'border-green-500',  text:'text-green-700' },
          { label:'Inactive',        val: inactiveEmps.length,icon: UserX,       border:'border-red-400',    text:'text-red-600' },
          { label:'Monthly Salary',  val: fmtK(totalSalary),  icon: IndianRupee, border:'border-orange-400', text:'text-orange-600' },
          { label:'This Month Gross',val: fmtK(currGross),    icon: TrendingUp,  border:'border-violet-400', text:'text-violet-700' },
          { label:'Paid Slips',      val: currPaid,           icon: CheckCircle, border:'border-emerald-400',text:'text-emerald-600' },
          { label:'Pending Slips',   val: currPending,        icon: Clock,       border:'border-yellow-400', text:'text-yellow-700' },
          { label:'Pending Leaves',  val: pendingLeaves.length,icon:CalendarDays, border:'border-pink-400',   text:'text-pink-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border-l-4 ${s.border}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-3.5 w-3.5 ${s.text}`} />
                  <p className="text-[10px] text-gray-500 uppercase leading-tight">{s.label}</p>
                </div>
                <p className={`text-xl font-bold ${s.text}`}>{s.val}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Alerts row ── */}
      {(expiredDocs.length > 0 || expiringSoon.length > 0 || pendingLeaves.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredDocs.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 cursor-pointer" onClick={()=>navigate('/crm/admin/hr/documents')}>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">{expiredDocs.length} Expired Document{expiredDocs.length>1?'s':''}</span>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 cursor-pointer" onClick={()=>navigate('/crm/admin/hr/documents')}>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700 font-medium">{expiringSoon.length} Doc{expiringSoon.length>1?'s':''} Expiring in 30 days</span>
            </div>
          )}
          {pendingLeaves.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 cursor-pointer" onClick={()=>navigate('/crm/admin/hr/attendance')}>
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">{pendingLeaves.length} Leave Request{pendingLeaves.length>1?'s':''} Pending</span>
            </div>
          )}
        </div>
      )}

      {/* ── Row 1: Attendance Trend + Payroll Burn ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Daily Attendance Trend — 14 days */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Daily Attendance — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attTrend} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" tick={{fontSize:9}} interval={1}/>
                  <YAxis tick={{fontSize:9}} allowDecimals={false}/>
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize:'11px'}}/>
                  <Area type="monotone" dataKey="Present" stroke="#10b981" fill="url(#gPresent)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="Absent"  stroke="#ef4444" fill="url(#gAbsent)"  strokeWidth={2}/>
                  <Area type="monotone" dataKey="Leave"   stroke="#8b5cf6" fill="none"           strokeWidth={1.5} strokeDasharray="4 2"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Mark attendance to see trends" />}
          </CardContent>
        </Card>

        {/* Payroll Burn — 6 months */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Payroll Burn — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {payrolls.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollTrend} margin={{top:5,right:10,left:-10,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:9}} tickFormatter={v=>fmtK(v)}/>
                  <Tooltip formatter={v=>`₹${fmt(v)}`}/>
                  <Legend wrapperStyle={{fontSize:'11px'}}/>
                  <Bar dataKey="Gross"      fill="#3b82f6" radius={[3,3,0,0]}/>
                  <Bar dataKey="Net"        fill="#10b981" radius={[3,3,0,0]}/>
                  <Bar dataKey="Deductions" fill="#ef4444" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Generate payrolls to see burn trend" />}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Dept Pie + Attendance Pie + Leave Types ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Department Headcount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Dept. Headcount</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({name,value})=>`${name.split(' ')[0]}:${value}`} labelLine={false}>
                    {deptData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Add employees with departments" />}
          </CardContent>
        </Card>

        {/* This Month Attendance Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Attendance This Month</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {attPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={30} outerRadius={70}
                    label={({name,value})=>`${name}:${value}`} labelLine={false}>
                    {attPieData.map((entry,i)=>(
                      <Cell key={i} fill={ATT_COLORS[entry.name] || COLORS[i%COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No attendance for this month yet" />}
          </CardContent>
        </Card>

        {/* Leave Types Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Leave Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {leaveTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveTypeData} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9}} allowDecimals={false}/>
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize:9}}/>
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No leave records yet" />}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Branch Bar + Salary Distribution + Joining Trend ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Branch-wise Headcount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Branch-wise Headcount</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{top:0,right:10,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="name" tick={{fontSize:9}}/>
                  <YAxis tick={{fontSize:9}} allowDecimals={false}/>
                  <Tooltip />
                  <Bar dataKey="value" fill="#0F3A5F" radius={[4,4,0,0]}>
                    {branchData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Add employees with branches" />}
          </CardContent>
        </Card>

        {/* Avg Salary by Designation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Avg Salary by Designation</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {desgSalary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={desgSalary} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9}} tickFormatter={v=>fmtK(v)}/>
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize:9}}/>
                  <Tooltip formatter={v=>`₹${fmt(v)}`}/>
                  <Bar dataKey="avg" fill="#10b981" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No salary data yet" />}
          </CardContent>
        </Card>

        {/* Employee Joining Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Joining Trend — 8 Months</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={joiningTrend} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{fontSize:9}}/>
                <YAxis tick={{fontSize:9}} allowDecimals={false}/>
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2}
                  dot={{r:4,fill:'#f59e0b'}} activeDot={{r:6}} name="Joinings"/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Recent Joins + Top Earners + Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Recently Joined */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Recently Joined (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentJoins.length > 0 ? recentJoins.map(e => (
              <div key={e.emp_id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {e.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.designation || e.department || '—'} &middot; {e.doj}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 bg-green-50 text-green-700 border-green-200">New</Badge>
              </div>
            )) : (
              <p className="text-sm text-gray-400 py-4 text-center">No joinings in last 30 days</p>
            )}
          </CardContent>
        </Card>

        {/* Top Earners */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Top 5 Earners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topEarners.length > 0 ? topEarners.map((e,i) => (
              <div key={e.emp_id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-white':'bg-gray-100 text-gray-500'}`}>
                  {i+1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <p className="text-xs text-gray-400 truncate">{e.designation || '—'}</p>
                </div>
                <span className="text-sm font-bold text-green-700 shrink-0">{fmtK(e.salary)}</span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 py-4 text-center">No salary data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label:'Add Employee',      path:'/crm/admin/hr/employees',  icon: UserCheck,     color:'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label:'Mark Attendance',   path:'/crm/admin/hr/attendance', icon: ClipboardList,  color:'bg-green-50 text-green-700 hover:bg-green-100' },
              { label:'Generate Payroll',  path:'/crm/admin/hr/payroll',    icon: IndianRupee,   color:'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              { label:'Upload Document',   path:'/crm/admin/hr/documents',  icon: FolderOpen,    color:'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label} onClick={()=>navigate(a.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${a.color}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {a.label}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ── Empty state helper ───────────────────────────────────────────────
const EmptyChart = ({ label }) => (
  <div className="flex items-center justify-center h-full">
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

export default HRDashboard;
