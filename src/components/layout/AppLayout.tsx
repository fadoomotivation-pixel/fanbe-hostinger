import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function AppLayout(){
  const { data: overdueCount = 0 } = useQuery({
    queryKey: ['crm_overdue_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .lt('next_follow_up_at', new Date().toISOString())
        .not('status', 'in', '(lost,booked)')
      return count ?? 0
    },
    refetchInterval: 60_000,
  })

  return(
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar/>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100" title={overdueCount > 0 ? `${overdueCount} overdue calls` : 'Notifications'}>
              <Bell size={16} className={overdueCount > 0 ? 'text-rose-500' : 'text-gray-500'}/>
              {overdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center px-1 font-medium">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto"><Outlet/></main>
      </div>
    </div>
  )
}
