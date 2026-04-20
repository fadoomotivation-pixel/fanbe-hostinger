import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Settings() {
  const [user, setUser] = useState<User|null>(null)
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)) },[])
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-lg">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email||'—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">Admin</span></div>
          <div className="flex justify-between"><span className="text-gray-500">User ID</span><span className="font-mono text-xs text-gray-400">{user?.id?.slice(0,16)||'—'}…</span></div>
        </div>
      </div>
    </div>
  )
}