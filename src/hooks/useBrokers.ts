import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useBrokers() {
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: false })
    setBrokers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createBroker(payload: any) {
    const { error } = await supabase.from('brokers').insert(payload)
    if (!error) fetch()
    return { error }
  }

  async function updateBroker(id: string, payload: any) {
    const { error } = await supabase.from('brokers').update(payload).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { brokers, loading, refetch: fetch, createBroker, updateBroker }
}