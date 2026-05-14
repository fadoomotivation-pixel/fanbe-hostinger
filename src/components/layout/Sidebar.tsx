import { NavLink, useNavigate } from 'react-router-dom'
import { Phone, BarChart2, FileText, Megaphone, Settings, LogOut, ChevronLeft, ChevronRight, ClipboardList, UserPlus, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const NAV_INTERNAL = [
  { group: 'Telecaller', items: [
    { to: '/crm',      icon: Phone,          label: 'Call CRM' },
    { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tools',    icon: Megaphone,       label: 'Promo Materials' },
    { to: '/analytics',icon: BarChart2,       label: 'Analytics' },
    { to: '/reports',  icon: FileText,        label: 'Reports' },
    { to: '/settings', icon: Settings,        label: 'Settings' },
  ]},
]

// Links that go to the pre-built full-app (not in our Vite router)
const NAV_EXTERNAL = [
  { group: 'Lead Management', items: [
    { href: '/crm/sales/my-leads',  icon: ClipboardList, label: 'My Leads' },
    { href: '/crm/sales/add-lead',  icon: UserPlus,      label: 'Add Lead' },
  ]},
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const nav = useNavigate()
  const logout = async () => { await supabase.auth.signOut(); toast.success('Logged out'); nav('/login') }

  return (
    <aside className={`relative flex flex-col bg-[#0f172a] border-r border-[#1e293b] transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen z-20`}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e293b]">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">F</div>
        {!collapsed && <div><p className="text-sm font-semibold text-white">Fanbe Group</p><p className="text-xs text-slate-400">Sales CRM</p></div>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {NAV_INTERNAL.map(g => (
          <div key={g.group} className="mb-4">
            {!collapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{g.group}</p>}
            {g.items.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}>
                <Icon size={16} className="flex-shrink-0" />{!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {NAV_EXTERNAL.map(g => (
          <div key={g.group} className="mb-4">
            {!collapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{g.group}</p>}
            {g.items.map(({ href, icon: Icon, label }) => (
              <a key={href} href={href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors">
                <Icon size={16} className="flex-shrink-0" />{!collapsed && <span className="truncate">{label}</span>}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-[#1e293b] p-3">
        <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#1e293b] transition-colors">
          <LogOut size={16} />{!collapsed && 'Logout'}
        </button>
      </div>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-[#1e293b] border border-[#334155] rounded-full p-1 text-slate-400 hover:text-white">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
