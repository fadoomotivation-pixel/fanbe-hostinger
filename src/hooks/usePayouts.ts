import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePayouts() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payouts')
      .select('*, brokers(name, phone), bookings(booking_number)')
      .order('created_at', { ascending: false })
    setPayouts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function updatePayout(id: string, payload: any) {
    const { error } = await supabase.from('payouts').update(payload).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  async function createPayout(payload: any) {
    const { error } = await supabase.from('payouts').insert(payload)
    if (!error) fetch()
    return { error }
  }

  return { payouts, loading, refetch: fetch, updatePayout, createPayout }
}