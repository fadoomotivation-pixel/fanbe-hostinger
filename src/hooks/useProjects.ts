import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createProject(payload: any) {
    const { error } = await supabase.from('projects').insert(payload)
    if (!error) fetch()
    return { error }
  }

  async function updateProject(id: string, payload: any) {
    const { error } = await supabase.from('projects').update(payload).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { projects, loading, refetch: fetch, createProject, updateProject }
}