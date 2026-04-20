import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [pay, pyt] = await Promise.all([
        supabase.from('payments').select('amount,status,created_at'),
        supabase.from('payouts').select('amount,status,created_at'),
      ])
      const payments = pay.data || []
      const payouts = pyt.data || []
      const totalRevenue = payments.filter(p=>p.status==='paid').reduce((s:number,p:any)=>s+Number(p.amount),0)
      const totalPayouts = payouts.filter(p=>p.status==='paid').reduce((s:number,p:any)=>s+Number(p.amount),0)
      const pending = payouts.filter(p=>p.status==='pending').reduce((s:number,p:any)=>s+Number(p.amount),0)
      setData({ totalRevenue, totalPayouts, pending, margin: totalRevenue - totalPayouts })
      setLoading(false)
    }
    load()
  },[])

  const fmt = (n:number) => '₹'+n.toLocaleString('en-IN')
  const cards = data ? [
    { label:'Total Revenue', value:fmt(data.totalRevenue), color:'text-green-600' },
    { label:'Total Payouts', value:fmt(data.totalPayouts), color:'text-blue-600' },
    { label:'Pending Payouts', value:fmt(data.pending), color:'text-yellow-600' },
    { label:'Net Margin', value:fmt(data.margin), color: data.margin>=0?'text-green-600':'text-red-600' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Financial summary and performance metrics</p>
      </div>
      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div> : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map(c=>(
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}