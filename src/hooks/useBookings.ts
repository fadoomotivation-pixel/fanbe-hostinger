import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, plots(plot_number, projects(name)), brokers(name), customers(name)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createBooking(payload: any) {
    const { error } = await supabase.from('bookings').insert(payload)
    if (!error) fetch()
    return { error }
  }

  async function updateBooking(id: string, payload: any) {
    const { error } = await supabase.from('bookings').update(payload).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { bookings, loading, refetch: fetch, createBooking, updateBooking }
}