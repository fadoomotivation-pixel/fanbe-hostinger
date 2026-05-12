import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Plus, Upload, Search, Grid3X3, List, Download, Eye, Share2, FileText, Video, Image, Presentation, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

type MaterialType = 'Brochure' | 'Video' | 'Poster' | 'Flyer' | 'Presentation'
type MaterialStatus = 'Active' | 'Draft' | 'Review'

interface Material {
  id: string
  title: string
  type: MaterialType
  status: MaterialStatus
  tag: string | null
  file_url: string | null
  downloads: number
  uploader_name: string | null
  created_at: string
  updated_at: string
}

const EMPTY = { title: '', type: 'Brochure' as MaterialType, status: 'Active' as MaterialStatus, tag: '', file_url: '' }

const TYPE_COLORS: Record<MaterialType, string> = {
  Brochure:     'bg-teal-100 text-teal-700',
  Video:        'bg-orange-100 text-orange-700',
  Poster:       'bg-purple-100 text-purple-700',
  Flyer:        'bg-green-100 text-green-700',
  Presentation: 'bg-blue-100 text-blue-700',
}

const STATUS_COLORS: Record<MaterialStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Draft:  'bg-gray-100 text-gray-500',
  Review: 'bg-yellow-100 text-yellow-700',
}

const TYPE_ICONS: Record<MaterialType, any> = {
  Brochure:     FileText,
  Video:        Video,
  Poster:       Image,
  Flyer:        Layers,
  Presentation: Presentation,
}

const TYPE_BG: Record<MaterialType, string> = {
  Brochure:     'from-teal-50 to-teal-100',
  Video:        'from-orange-50 to-orange-100',
  Poster:       'from-purple-50 to-purple-100',
  Flyer:        'from-green-50 to-green-100',
  Presentation: 'from-blue-50 to-blue-100',
}

const TYPE_ICON_COLOR: Record<MaterialType, string> = {
  Brochure:     'text-teal-500',
  Video:        'text-orange-500',
  Poster:       'text-purple-500',
  Flyer:        'text-green-500',
  Presentation: 'text-blue-500',
}

export default function PromotionMaterials() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['promotion_materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_materials')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Material[]
    },
  })

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { data, error } = await supabase.from('promotion_materials').insert(p).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotion_materials'] }); toast.success('Material added') },
    onError: (e: any) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: d, error } = await supabase
        .from('promotion_materials')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return d
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotion_materials'] }); toast.success('Material updated') },
    onError: (e: any) => toast.error(e.message),
  })

  const incrementDownload = async (m: Material) => {
    await supabase.from('promotion_materials').update({ downloads: (m.downloads || 0) + 1 }).eq('id', m.id)
    qc.invalidateQueries({ queryKey: ['promotion_materials'] })
    if (m.file_url) window.open(m.file_url, '_blank')
    else toast.success('Download tracked')
  }

  const open = (m?: Material) => {
    setEditing(m || null)
    setForm(m ? { title: m.title, type: m.type, status: m.status, tag: m.tag || '', file_url: m.file_url || '' } : EMPTY)
    setModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    const payload = { ...form, tag: form.tag || null, file_url: form.file_url || null }
    editing ? await update.mutateAsync({ id: editing.id, data: payload }) : await create.mutateAsync(payload)
    setModal(false)
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const TYPES: MaterialType[] = ['Brochure', 'Video', 'Poster', 'Flyer', 'Presentation']

  const filtered = materials.filter(m => {
    const matchType = filterType === 'all' || m.type === filterType
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.tag || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const stats = {
    total: materials.length,
    active: materials.filter(m => m.status === 'Active').length,
    downloads: materials.reduce((a, m) => a + (m.downloads || 0), 0),
    review: materials.filter(m => m.status === 'Review').length,
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promotion Materials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage brochures, videos, flyers &amp; presentations</p>
        </div>
        <Button onClick={() => open()}>
          <Plus size={14} />Add Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Materials', value: stats.total },
          { label: 'Active',          value: stats.active },
          { label: 'Total Downloads', value: stats.downloads },
          { label: 'Pending Review',  value: stats.review },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', ...TYPES] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filterType === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setView('grid')} className={`px-3 py-2 transition-colors ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Grid3X3 size={14} /></button>
            <button onClick={() => setView('list')} className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && materials.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center py-20 px-8">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-400">
            <Upload size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No promotion materials yet</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-5">Add brochures, videos, flyers or presentations to share with your sales team and brokers.</p>
          <Button onClick={() => open()}><Plus size={14} />Add First Material</Button>
        </div>
      )}

      {/* No results */}
      {!isLoading && materials.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center py-16">
          <Search size={24} className="text-gray-300 mb-3" />
          <h3 className="text-sm font-semibold text-gray-700">No results found</h3>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(m => {
            const Icon = TYPE_ICONS[m.type] || FileText
            return (
              <div key={m.id} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                {/* Thumbnail */}
                <div className={`relative h-40 bg-gradient-to-br ${TYPE_BG[m.type]} flex items-center justify-center overflow-hidden`}>
                  <Icon size={40} className={`${TYPE_ICON_COLOR[m.type]} opacity-40`} />
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type]}`}>{m.type}</span>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => m.file_url ? window.open(m.file_url, '_blank') : toast('No file URL set')} className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-800 hover:scale-110 transition-transform"><Eye size={14} /></button>
                    <button onClick={() => incrementDownload(m)} className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-800 hover:scale-110 transition-transform"><Download size={14} /></button>
                    <button onClick={() => { navigator.clipboard?.writeText(m.file_url || window.location.href); toast.success('Link copied!') }} className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-800 hover:scale-110 transition-transform"><Share2 size={14} /></button>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-800 leading-snug mb-2 line-clamp-2">{m.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>{formatDate(m.created_at)}</span>
                    {m.uploader_name && <><span>·</span><span>{m.uploader_name}</span></>}
                  </div>
                  {m.tag && <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{m.tag}</span>}
                </div>
                {/* Footer */}
                <div className="px-4 pb-3 pt-0 flex items-center justify-between border-t border-gray-50">
                  <Badge label={m.status} className={STATUS_COLORS[m.status]} />
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Download size={10} />{m.downloads || 0}</span>
                    <Button size="sm" variant="ghost" onClick={() => open(m)}>Edit</Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && filtered.length > 0 && view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Downloads</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.title}</td>
                  <td className="px-4 py-3"><Badge label={m.type} className={TYPE_COLORS[m.type]} /></td>
                  <td className="px-4 py-3"><Badge label={m.status} className={STATUS_COLORS[m.status]} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.tag || '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{m.downloads || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => incrementDownload(m)}><Download size={12} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => open(m)}>Edit</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Material' : 'Add Promotion Material'}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e: any) => set('title', e.target.value)}
            placeholder="e.g. Prestige Tower Brochure"
            className="col-span-2"
          />
          <Select label="Type" value={form.type} onChange={(e: any) => set('type', e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e: any) => set('status', e.target.value)}>
            {(['Active', 'Draft', 'Review'] as MaterialStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input
            label="Project Tag"
            value={form.tag}
            onChange={(e: any) => set('tag', e.target.value)}
            placeholder="e.g. Phase 2, Luxury Villas"
            className="col-span-2"
          />
          <Input
            label="File URL"
            value={form.file_url}
            onChange={(e: any) => set('file_url', e.target.value)}
            placeholder="https://…"
            className="col-span-2"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={save} loading={create.isPending || update.isPending}>
            {editing ? 'Save Changes' : 'Add Material'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
