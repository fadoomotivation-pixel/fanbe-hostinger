import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function usePayouts(filters?:any){
  return useQuery({queryKey:['payouts',filters],queryFn:async()=>{
    let q=supabase.from('bp_payout_transactions').select('*,brokers(name,broker_id,pan_no,tds_applicable),bp_bookings(booking_no,bp_plots(plot_no,bp_projects(name)))').order('created_at',{ascending:false})
    if(filters?.status)q=q.eq('status',filters.status)
    if(filters?.broker_id)q=q.eq('broker_id',filters.broker_id)
    const{data,error}=await q;if(error)throw error;return data
  }})
}
export function useUpdatePayout(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async({id,data}:{id:string,data:any})=>{const{data:d,error}=await supabase.from('bp_payout_transactions').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return d},onSuccess:()=>{qc.invalidateQueries({queryKey:['payouts']});toast.success('Payout updated')},onError:(e:any)=>toast.error(e.message)})
}
export function useCreatePayout(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async(p:any)=>{const{data,error}=await supabase.from('bp_payout_transactions').insert(p).select().single();if(error)throw error;return data},onSuccess:()=>{qc.invalidateQueries({queryKey:['payouts']});toast.success('Payout created')},onError:(e:any)=>toast.error(e.message)})
}