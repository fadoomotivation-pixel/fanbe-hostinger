import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reports() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'payouts'|'payments'>('payouts')

  useEffect(() => {
    setLoading(true)
    const run = async () => {
      if (type === 'payouts') {
        const { data } = await supabase.from('payouts').select('id,amount,status,created_at,broker_id,brokers(name)').order('created_at',{ascending:false}).limit(50)
        setRows(data||[])
      } else {
        const { data } = await supabase.from('payments').select('id,amount,status,created_at,booking_id,bookings(booking_number)').order('created_at',{ascending:false}).limit(50)
        setRows(data||[])
      }
      setLoading(false)
    }
    run()
  },[type])

  const fmt = (n:number) => '₹'+Number(n).toLocaleString('en-IN')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Reports</h1><p className="text-sm text-gray-500">Export and review transactions</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setType('payouts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type==='payouts'?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Payouts</button>
          <button onClick={()=>setType('payments')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type==='payments'?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Payments</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-y border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{type==='payouts'?'Broker':'Booking'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading?<tr><td colSpan={5} className="py-12 text-center text-gray-400">Loading…</td></tr>
              :!rows.length?<tr><td colSpan={5} className="py-12 text-center text-gray-400">No records</td></tr>
              :rows.map(r=>(
                <tr key={r.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.id.slice(0,8)}…</td>
                  <td className="px-4 py-3 text-gray-700">{type==='payouts'?(r.brokers as any)?.name||'—':(r.bookings as any)?.booking_number||'—'}</td>
                  <td className="px-4 py-3 font-medium">{fmt(r.amount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status==='paid'||r.status==='approved'?'bg-green-100 text-green-700':r.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}