// src/crm/pages/hr/HRDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, Building2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0F3A5F', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const HRDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseAdmin.from('hr_employees').select('*').then(({ data }) => {
      setEmployees(data || []);
      setLoading(false);
    });
  }, []);

  const active   = employees.filter(e => e.status === 'Active');
  const inactive = employees.filter(e => e.status === 'Inactive');
  const totalPayroll = active.reduce((s, e) => s + parseFloat(e.salary || 0), 0);

  // Department breakdown
  const deptData = Object.entries(
    employees.reduce((acc, e) => { acc[e.department||'Other'] = (acc[e.department||'Other']||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Branch breakdown
  const branchData = Object.entries(
    employees.reduce((acc, e) => { acc[e.branch||'Other'] = (acc[e.branch||'Other']||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Designation salary chart
  const desgSalary = Object.entries(
    employees.reduce((acc, e) => {
      if (!acc[e.designation]) acc[e.designation] = { total: 0, count: 0 };
      acc[e.designation].total += parseFloat(e.salary||0);
      acc[e.designation].count += 1;
      return acc;
    }, {})
  ).map(([name, d]) => ({ name: name?.split(' ').slice(0,2).join(' '), avg: Math.round(d.total/d.count) }))
   .sort((a,b)=>b.avg-a.avg).slice(0,8);

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'border-blue-500', iconColor: 'text-blue-500' },
    { label: 'Active',          value: active.length,    icon: Users, color: 'border-green-500', iconColor: 'text-green-500' },
    { label: 'Inactive',        value: inactive.length,  icon: Users, color: 'border-red-400',   iconColor: 'text-red-400' },
    { label: 'Monthly Payroll', value: `₹${(totalPayroll/1000).toFixed(1)}K`, icon: IndianRupee, color: 'border-orange-500', iconColor: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">HR Dashboard</h1>
        <p className="text-sm text-gray-500">Live overview from Supabase hr_employees table</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.iconColor}`} />
              <div>
                <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Department Data</CardTitle></CardHeader>
          <CardContent className="h-60">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}:${value}`}>
                    {deptData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>

        {/* Branch Bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Branch-wise Employees</CardTitle></CardHeader>
          <CardContent className="h-60">
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize:10}} />
                  <YAxis /><Tooltip />
                  <Bar dataKey="value" fill="#0F3A5F" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>

        {/* Salary by Designation */}
        <Card>
          <CardHeader><CardTitle className="text-base">Avg Salary by Designation</CardTitle></CardHeader>
          <CardContent className="h-60">
            {desgSalary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={desgSalary} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:10}} />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize:9}} />
                  <Tooltip formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="avg" fill="#10b981" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRDashboard;
