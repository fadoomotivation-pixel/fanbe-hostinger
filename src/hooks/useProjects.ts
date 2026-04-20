import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function useProjects(){
  return useQuery({queryKey:['projects'],queryFn:async()=>{
    const{data,error}=await supabase.from('bp_projects').select('*').order('created_at',{ascending:false})
    if(error)throw error;return data
  }})
}
export function useCreateProject(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async(p:any)=>{const{data,error}=await supabase.from('bp_projects').insert(p).select().single();if(error)throw error;return data},onSuccess:()=>{qc.invalidateQueries({queryKey:['projects']});toast.success('Project created')},onError:(e:any)=>toast.error(e.message)})
}
export function useUpdateProject(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async({id,data}:{id:string,data:any})=>{const{data:d,error}=await supabase.from('bp_projects').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return d},onSuccess:()=>{qc.invalidateQueries({queryKey:['projects']});toast.success('Project updated')},onError:(e:any)=>toast.error(e.message)})
}