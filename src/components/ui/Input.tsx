import { cn } from '@/lib/utils'
export function Input({label,error,className,...p}:any) {
  return (
    <div className="flex flex-col gap-1">
      {label&&<label className="text-sm font-medium text-gray-700">{label}</label>}
      <input className={cn('w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',error&&'border-red-400',className)} {...p}/>
      {error&&<p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
export function Select({label,error,className,children,...p}:any) {
  return (
    <div className="flex flex-col gap-1">
      {label&&<label className="text-sm font-medium text-gray-700">{label}</label>}
      <select className={cn('w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',error&&'border-red-400',className)} {...p}>{children}</select>
      {error&&<p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
export function Textarea({label,error,className,...p}:any) {
  return (
    <div className="flex flex-col gap-1">
      {label&&<label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea className={cn('w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',error&&'border-red-400',className)} {...p}/>
      {error&&<p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}