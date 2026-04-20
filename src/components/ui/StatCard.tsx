import { cn } from '@/lib/utils'
export function StatCard({title,value,icon:Icon,color='blue',sub}:any){
  const c:any={blue:'bg-blue-50 text-blue-600',green:'bg-green-50 text-green-600',yellow:'bg-yellow-50 text-yellow-600',purple:'bg-purple-50 text-purple-600',red:'bg-red-50 text-red-600',indigo:'bg-indigo-50 text-indigo-600'}
  return(
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 items-start shadow-sm">
      <div className={cn('p-3 rounded-xl',c[color])}><Icon size={20}/></div>
      <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p><p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>{sub&&<p className="text-xs text-gray-400 mt-0.5">{sub}</p>}</div>
    </div>
  )
}