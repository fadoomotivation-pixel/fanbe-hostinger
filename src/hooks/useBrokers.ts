import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function useBrokers(){
  return useQuery({queryKey:['brokers'],queryFn:async()=>{
    const{data,error}=await supabase.from('brokers').select('*').order('created_at',{ascending:false})
    if(error)throw error;return data
  }})
}
export function useBroker(id?:string){
  return useQuery({queryKey:['broker',id],enabled:!!id,queryFn:async()=>{
    const{data,error}=await supabase.from('brokers').select('*').eq('id',id!).single()
    if(error)throw error;return data
  }})
}
export function useCreateBroker(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async(p:any)=>{const{data,error}=await supabase.from('brokers').insert(p).select().single();if(error)throw error;return data},onSuccess:()=>{qc.invalidateQueries({queryKey:['brokers']});toast.success('Broker added')},onError:(e:any)=>toast.error(e.message)})
}
export function useUpdateBroker(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async({id,data}:{id:string,data:any})=>{const{data:d,error}=await supabase.from('brokers').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return d},onSuccess:(_,v)=>{qc.invalidateQueries({queryKey:['brokers']});qc.invalidateQueries({queryKey:['broker',v.id]});toast.success('Broker updated')},onError:(e:any)=>toast.error(e.message)})
}