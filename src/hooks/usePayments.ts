import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, bookings(booking_number)')
      .order('created_at', { ascending: false })
    setPayments(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { payments, loading, refetch: fetch }
}