import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function usePlots(project_id?:string){
  return useQuery({queryKey:['plots',project_id],queryFn:async()=>{
    let q=supabase.from('bp_plots').select('*,bp_projects(name)').order('plot_no')
    if(project_id)q=q.eq('project_id',project_id)
    const{data,error}=await q;if(error)throw error;return data
  }})
}
export function useUpdatePlot(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async({id,data}:{id:string,data:any})=>{const{data:d,error}=await supabase.from('bp_plots').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return d},onSuccess:()=>{qc.invalidateQueries({queryKey:['plots']});toast.success('Plot updated')},onError:(e:any)=>toast.error(e.message)})
}