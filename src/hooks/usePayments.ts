import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function usePayments(booking_id?:string){
  return useQuery({queryKey:['payments',booking_id],queryFn:async()=>{
    let q=supabase.from('bp_payments').select('*').order('payment_date',{ascending:false})
    if(booking_id)q=q.eq('booking_id',booking_id)
    const{data,error}=await q;if(error)throw error;return data
  }})
}
export function useCreatePayment(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async(p:any)=>{const{data,error}=await supabase.from('bp_payments').insert(p).select().single();if(error)throw error;return data},onSuccess:()=>{qc.invalidateQueries({queryKey:['payments']});qc.invalidateQueries({queryKey:['bookings']});toast.success('Payment recorded')},onError:(e:any)=>toast.error(e.message)})
}