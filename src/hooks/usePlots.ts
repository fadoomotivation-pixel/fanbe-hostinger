import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePlots(projectId?: string) {
  const [plots, setPlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('plots').select('*, projects(name)').order('created_at', { ascending: false })
    if (projectId) q = q.eq('project_id', projectId)
    const { data } = await q
    setPlots(data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetch() }, [fetch])

  return { plots, loading, refetch: fetch }
}