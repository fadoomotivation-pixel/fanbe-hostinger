import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/StatCard'
import { Users, Building2, CreditCard, Banknote, TrendingUp, Clock } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ brokers:0, projects:0, bookings:0, pendingPayouts:0, totalRevenue:0, pendingKYC:0 })
  const [loading, setLoading] = useState(true)
  const [recentPayouts, setRecentPayouts] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [b, p, bk, py, kyc] = await Promise.all([
        supabase.from('brokers').select('id',{count:'exact',head:true}),
        supabase.from('projects').select('id',{count:'exact',head:true}),
        supabase.from('bookings').select('id',{count:'exact',head:true}),
        supabase.from('bp_payout_transactions').select('id,amount,status').eq('status','pending'),
        supabase.from('brokers').select('id',{count:'exact',head:true}).eq('kyc_status','pending'),
      ])
      const totalRevenue = await supabase.from('bp_payments').select('amount')
      const rev = totalRevenue.data?.reduce((s:number,r:any)=>s+(Number(r.amount)||0),0)||0
      const pendingAmt = py.data?.reduce((s:number,r:any)=>s+(Number(r.amount)||0),0)||0
      setStats({ brokers:b.count||0, projects:p.count||0, bookings:bk.count||0, pendingPayouts:pendingAmt, totalRevenue:rev, pendingKYC:kyc.count||0 })
      const recent = await supabase.from('bp_payout_transactions').select('id,amount,status,created_at,broker_id,brokers(name)').order('created_at',{ascending:false}).limit(5)
      setRecentPayouts(recent.data||[])
      setLoading(false)
    }
    load()
  },[])

  const fmt = (n:number) => '₹'+n.toLocaleString('en-IN')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of Fanbe Group operations</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Brokers" value={loading?'—':stats.brokers} icon={Users} color="blue"/>
        <StatCard title="Projects" value={loading?'—':stats.projects} icon={Building2} color="indigo"/>
        <StatCard title="Total Bookings" value={loading?'—':stats.bookings} icon={CreditCard} color="green"/>
        <StatCard title="Pending Payouts" value={loading?'—':fmt(stats.pendingPayouts)} icon={Banknote} color="yellow" sub="awaiting approval"/>
        <StatCard title="Revenue Collected" value={loading?'—':fmt(stats.totalRevenue)} icon={TrendingUp} color="green"/>
        <StatCard title="Pending KYC" value={loading?'—':stats.pendingKYC} icon={Clock} color="red" sub="needs review"/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payouts</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentPayouts.length===0&&<div className="py-8 text-center text-gray-400 text-sm">{loading?'Loading…':'No payouts yet'}</div>}
          {recentPayouts.map(p=>(
            <div key={p.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{(p.brokers as any)?.name||'—'}</p>
                <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{fmt(Number(p.amount))}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ p.status==='paid'?'bg-green-100 text-green-700':p.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600' }`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
