import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAsyncData } from '../hooks/useAsyncData';
import { adminApi } from '../services/adminApi';
import { formatINR } from '../lib/formatters';
import { ErrorState, LoadingState } from '../components/StateViews';
import AdminTable from '../components/AdminTable';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

const DashboardPage = () => {
  const { data, loading, error, refresh } = useAsyncData(() => adminApi.getDashboardMetrics(), []);

  const computed = useMemo(() => {
    if (!data) return null;
    const plots = data.plots.data || [];
    const bookings = data.bookings.data || [];
    const payouts = data.payouts.data || [];
    const payments = data.payments.data || [];
    const brokers = data.brokers.data || [];
    const banks = data.brokerBank.data || [];
    const now = new Date();

    const byStatus = (list, key = 'status') => list.reduce((acc, item) => ({ ...acc, [item[key] || 'unknown']: (acc[item[key] || 'unknown'] || 0) + 1 }), {});
    const payoutAmount = (status) => payouts.filter((p) => p.status === status).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalProjects: data.projects.count || 0,
      totalPlots: plots.length,
      availablePlots: plots.filter((p) => p.status === 'available').length,
      tokenPlots: plots.filter((p) => p.status === 'token').length,
      bookedPlots: plots.filter((p) => p.status === 'booked').length,
      registryDonePlots: plots.filter((p) => p.status === 'registry_done').length,
      totalBookings: data.bookings.count || 0,
      totalTokenCollected: payments.filter((p) => p.payment_type === 'token').reduce((a, b) => a + Number(b.amount || 0), 0),
      totalBookingCollected: payments.filter((p) => p.payment_type === 'booking_amount').reduce((a, b) => a + Number(b.amount || 0), 0),
      totalFullCollected: payments.filter((p) => p.payment_type === 'full_payment').reduce((a, b) => a + Number(b.amount || 0), 0),
      pendingPayout: payoutAmount('pending'),
      approvedPayout: payoutAmount('approved'),
      paidPayout: payoutAmount('paid'),
      pendingKyc: brokers.filter((b) => b.kyc_status !== 'verified').length,
      pendingBrokerApprovals: brokers.filter((b) => b.status !== 'approved').length,
      bookingStageSummary: Object.entries(byStatus(bookings, 'stage')).map(([name, value]) => ({ name, value })),
      payoutStatusSummary: Object.entries(byStatus(payouts)).map(([name, value]) => ({ name, value })),
      expiredHolds: (data.holds.data || []).filter((h) => h.status === 'active' && h.hold_until && new Date(h.hold_until) < now && !h.released_at).length,
      unverifiedBanks: banks.filter((b) => !b.verified).length,
      highBalanceDue: bookings.filter((b) => Number(b.balance_due || 0) > 0).length,
      recentBookings: bookings,
      recentPayouts: payouts,
    };
  }, [data]);

  if (loading) return <LoadingState label="Loading dashboard metrics..." />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const cards = [
    ['Total Projects', computed.totalProjects],
    ['Total Plots', computed.totalPlots],
    ['Available Plots', computed.availablePlots],
    ['Token Plots', computed.tokenPlots],
    ['Booked Plots', computed.bookedPlots],
    ['Registry Done Plots', computed.registryDonePlots],
    ['Total Bookings', computed.totalBookings],
    ['Total Token Collected', formatINR(computed.totalTokenCollected)],
    ['Total Booking Collected', formatINR(computed.totalBookingCollected)],
    ['Total Full Payment Collected', formatINR(computed.totalFullCollected)],
    ['Pending Payout Amount', formatINR(computed.pendingPayout)],
    ['Approved Payout Amount', formatINR(computed.approvedPayout)],
    ['Paid Payout Amount', formatINR(computed.paidPayout)],
    ['Pending KYC Count', computed.pendingKyc],
    ['Pending Broker Approvals', computed.pendingBrokerApprovals],
  ];

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Broker Payout Operations Dashboard</h2>
        <p className="text-sm text-slate-500">Real-time overview built on bp_* tables + brokers.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">{cards.map(([l, v]) => <StatCard key={l} label={l} value={v} />)}</div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-semibold">Booking Stage Summary</h3>
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={computed.bookingStageSummary} dataKey="value" nameKey="name" outerRadius={90}>{computed.bookingStageSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-semibold">Payout Status Summary</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={computed.payoutStatusSummary}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#4338ca" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border bg-amber-50 p-4 xl:col-span-1">
          <h3 className="font-semibold">Alerts</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>KYC pending: <strong>{computed.pendingKyc}</strong></li>
            <li>Bank verification pending: <strong>{computed.unverifiedBanks}</strong></li>
            <li>Payout pending approval: <strong>{computed.payoutStatusSummary.find((i) => i.name === 'pending')?.value || 0}</strong></li>
            <li>Full payment / balance due cases: <strong>{computed.highBalanceDue}</strong></li>
            <li>Expired holds: <strong>{computed.expiredHolds}</strong></li>
          </ul>
        </div>
        <div className="xl:col-span-2">
          <h3 className="mb-2 font-semibold">Recent Bookings</h3>
          <AdminTable columns={[{key:'booking_no',label:'Booking No'},{key:'stage',label:'Stage'},{key:'total_collected',label:'Collected',render:(v)=>formatINR(v)},{key:'balance_due',label:'Balance Due',render:(v)=>formatINR(v)}]} rows={computed.recentBookings} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Recent Payout Approvals / Payments</h3>
        <AdminTable columns={[{key:'status',label:'Status'},{key:'amount',label:'Amount',render:(v)=>formatINR(v)},{key:'paid_date',label:'Paid Date'}]} rows={computed.recentPayouts} />
      </div>
    </section>
  );
};

export default DashboardPage;
