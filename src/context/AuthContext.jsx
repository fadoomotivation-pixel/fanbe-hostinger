import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

/**
 * AuthProvider — real Supabase auth (replaces the old localStorage-only
 * `authUtils` flow). Session is persisted to localStorage by Supabase
 * itself under the `fanbe-crm-auth` key. We map the auth user → public.profiles
 * row to recover {role, name, username, etc.} that the rest of the app expects.
 *
 * Login accepts username OR email. If the input contains '@' we use it as
 * email directly; otherwise we look up the email from profiles by username.
 */
export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);   // raw supabase.auth.User
  const [profile, setProfile]   = useState(null);   // public.profiles row
  const [loading, setLoading]   = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, name, role, phone, department, status, permissions, last_login, metrics')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[Auth] Failed to load profile:', error.message);
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Initial session restore
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      const u = data.session?.user ?? null;
      setAuthUser(u);
      if (u) await loadProfile(u.id);
      setLoading(false);
    });

    // Subscribe to auth state changes (login, logout, refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setAuthUser(u);
      if (u) await loadProfile(u.id);
      else setProfile(null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    window.location.href = '/crm/login';
  }, []);

  // Idle-timeout — 30 min, matches previous behavior
  useEffect(() => {
    if (!authUser) return;
    let timeoutId;
    const reset = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Session expired due to inactivity');
        logout();
      }, 30 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, reset));
    };
  }, [authUser, logout]);

  const login = async (usernameOrEmail, password) => {
    const input = (usernameOrEmail || '').trim();
    if (!input) return { success: false, message: 'Enter your username or email' };
    if (!password) return { success: false, message: 'Enter your password' };

    // Resolve to an email — Supabase auth signs in by email
    let email = input;
    if (!input.includes('@')) {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('email, status')
        .eq('username', input)
        .maybeSingle();
      if (error || !prof) {
        return { success: false, message: 'Username/ID not found.' };
      }
      if (prof.status && prof.status !== 'Active') {
        return { success: false, message: 'Account Suspended. Contact Admin.' };
      }
      email = prof.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        success: false,
        message: error.message.includes('Invalid') ? 'Incorrect password' : error.message,
      };
    }

    if (data.user) {
      const prof = await loadProfile(data.user.id);
      // Best-effort last_login update (RLS allows users to update own profile)
      supabase.from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(({ error: e }) => e && console.warn('[Auth] last_login update:', e.message));
      return { success: true, role: prof?.role };
    }
    return { success: true };
  };

  // Compose the `user` shape that the rest of the app expects.
  // Old shape: { id, username, name, email, role, lastLogin, permissions }
  const user = authUser && profile
    ? {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        email: profile.email || authUser.email,
        role: profile.role,
        phone: profile.phone,
        department: profile.department,
        permissions: profile.permissions || (profile.role === 'super_admin' ? ['all'] : ['limited']),
        lastLogin: profile.last_login,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!authUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
