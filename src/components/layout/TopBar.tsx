import { Bell, LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import type { User as SupaUser } from '@supabase/supabase-js'

export default function TopBar() {
  const navigate = useNavigate()
  const [user, setUser] = useState<SupaUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={20} />
      </button>
      <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900 leading-none">{user?.email?.split('@')[0] || 'Admin'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email || ''}</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}