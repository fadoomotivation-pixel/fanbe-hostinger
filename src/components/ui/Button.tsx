import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
type V='primary'|'secondary'|'ghost'|'danger'; type S='sm'|'md'|'lg'
const V:Record<V,string>={primary:'bg-blue-600 text-white hover:bg-blue-700',secondary:'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',ghost:'text-gray-600 hover:bg-gray-100',danger:'bg-red-600 text-white hover:bg-red-700'}
const S:Record<S,string>={sm:'px-3 py-1.5 text-xs',md:'px-4 py-2 text-sm',lg:'px-5 py-2.5 text-base'}
export function Button({variant='primary',size='md',loading,className,children,...p}:any) {
  return <button disabled={loading||p.disabled} className={cn('inline-flex items-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',V[variant as V||'primary'],S[size as S||'md'],className)} {...p}>{loading&&<Loader2 size={14} className="animate-spin"/>}{children}</button>
}