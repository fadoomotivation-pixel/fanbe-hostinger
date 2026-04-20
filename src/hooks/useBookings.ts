import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
export function useBookings(filters?:any){
  return useQuery({queryKey:['bookings',filters],queryFn:async()=>{
    let q=supabase.from('bp_bookings').select('*,bp_plots(plot_no,size_sqyd,bp_projects(name)),bp_customers(name,phone),brokers(name,broker_id),bp_projects(name)').order('created_at',{ascending:false})
    if(filters?.stage)q=q.eq('stage',filters.stage)
    if(filters?.project_id)q=q.eq('project_id',filters.project_id)
    if(filters?.broker_id)q=q.eq('broker_id',filters.broker_id)
    const{data,error}=await q;if(error)throw error;return data
  }})
}
export function useBooking(id?:string){
  return useQuery({queryKey:['booking',id],enabled:!!id,queryFn:async()=>{
    const{data,error}=await supabase.from('bp_bookings').select('*,bp_plots(*,bp_projects(*)),bp_customers(*),brokers(*),bp_projects(*)').eq('id',id!).single()
    if(error)throw error;return data
  }})
}
export function useCreateBooking(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async(p:any)=>{const{data,error}=await supabase.from('bp_bookings').insert(p).select().single();if(error)throw error;return data},onSuccess:()=>{qc.invalidateQueries({queryKey:['bookings']});qc.invalidateQueries({queryKey:['plots']});toast.success('Booking created')},onError:(e:any)=>toast.error(e.message)})
}
export function useUpdateBooking(){
  const qc=useQueryClient()
  return useMutation({mutationFn:async({id,data}:{id:string,data:any})=>{const{data:d,error}=await supabase.from('bp_bookings').update({...data,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return d},onSuccess:()=>{qc.invalidateQueries({queryKey:['bookings']});toast.success('Booking updated')},onError:(e:any)=>toast.error(e.message)})
}