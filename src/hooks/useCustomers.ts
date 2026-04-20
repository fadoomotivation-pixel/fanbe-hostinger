import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { customers, loading, refetch: fetch }
}