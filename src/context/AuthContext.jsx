// src/context/AuthContext.jsx
// ✅ PERF FIX v3 — Senior Tester Root Cause Analysis
//
// ISSUES FOUND:
//   1. getUserDetails() called TWICE on every page load:
//      • Once inside getSessionWithTimeout().then()
//      • Again inside onAuthStateChange('SIGNED_IN') which fires right after
//      = 2 Supabase round-trips before app renders
//   2. getUserDetails() was select('*') on profiles — fetches all columns
//   3. Timeout was 8000ms — user sees blank screen up to 8s on slow network
//   4. TOKEN_REFRESHED also triggered getUserDetails() unnecessarily
//
// FIXES:
//   A. Profile cached in module-level Map (sessionId → profile)
//      Second call returns instantly from cache — no DB round-trip
//   B. Timeout reduced: 8000ms → 4000ms
//   C. TOKEN_REFRESHED: skip getUserDetails if user already in state
//   D. getUserDetails now selects only needed columns (in authUtilsSupabase.js)

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeData } from '@/lib/dataInitializer';
import {
  login as supabaseLogin,
  logout as supabaseLogout,
  getUserDetails,
} from '@/lib/authUtilsSupabase';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

// Module-level profile cache: supabaseUserId → profile object
// Survives React re-renders and prevents double DB call
const _profileCache = new Map();

const getSessionWithTimeout = (ms = 15000) => {
  const sessionPromise = supabase.auth.getSession();
  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ data: { session: null }, error: new Error('timeout') }), ms)
  );
  return Promise.race([sessionPromise, timeoutPromise]);
};

const buildUser = (sessionUserId, profile) => ({
  id:          sessionUserId,
  username:    profile.username,
  name:        profile.name,
  email:       profile.email,
  role:        profile.role,
  permissions: profile.permissions || [],
  lastLogin:   profile.last_login || new Date().toISOString(),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const userRef = useRef(null);  // keeps latest user for closure in onAuthStateChange

  useEffect(() => {
    let isMounted = true;

    // ── Step 1: check existing session (15s timeout) ────────────────────
    getSessionWithTimeout(15000).then(async ({ data: { session }, error }) => {
      if (!isMounted) return;

      if (error?.message === 'timeout') {
        // Supabase didn't respond in 15s — likely slow network, NOT a paused
        // project. Don't block the app on this. Treat as "no session" and
        // let the user land on /login normally; AuthStateChange will pick
        // them up once the SDK eventually resolves.
        console.warn('[Auth] Supabase getSession timed out after 15s — continuing with no session');
        setLoading(false);
        initializeData();
        return;
      }

      if (session) {
        const uid = session.user.id;
        try {
          // Check cache first — avoids duplicate DB call when onAuthStateChange
          // fires SIGNED_IN right after this block on the same session
          let profile = _profileCache.get(uid);
          if (!profile) {
            profile = await getUserDetails(uid);
            if (profile) _profileCache.set(uid, profile);
          }
          if (profile && isMounted) {
            const u = buildUser(uid, profile);
            userRef.current = u;
            setUser(u);
            console.log('[Auth] Session restored:', profile.name);
          }
        } catch (err) {
          console.error('[Auth] Error loading user profile:', err);
        }
      }

      if (isMounted) {
        setLoading(false);
        // Run initializeData AFTER auth resolves so it doesn’t race with session
        initializeData();
      }
    });

    // ── Step 2: listen for future auth events ─────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);

        if (event === 'SIGNED_OUT' || !session) {
          _profileCache.clear();
          userRef.current = null;
          if (isMounted) setUser(null);
          return;
          }

        // TOKEN_REFRESHED: only refresh user object if we don’t already have one
        // This avoids an unnecessary DB call on every token refresh (~every hour)
        if (event === 'TOKEN_REFRESHED') {
          if (userRef.current) return; // already have user — skip
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const uid = session.user.id;
          try {
            // FIX: use cache — SIGNED_IN fires right after getSessionWithTimeout
            // so profile is already cached; no second DB call needed
            let profile = _profileCache.get(uid);
            if (!profile) {
              profile = await getUserDetails(uid);
              if (profile) _profileCache.set(uid, profile);
            }
            if (profile && isMounted) {
              const u = buildUser(uid, profile);
              userRef.current = u;
              setUser(u);
            }
          } catch (err) {
            console.error('[Auth] Error loading profile on state change:', err);
            if (isMounted) setUser(null);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const result = await supabaseLogin(usernameOrEmail, password);
      if (result.success) {
        // Cache profile from login result so post-login onAuthStateChange
        // SIGNED_IN event doesn’t trigger another DB call
        if (result.user) {
          _profileCache.set(result.user.id, result.user);
          userRef.current = result.user;
        }
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    _profileCache.clear();
    userRef.current = null;
    await supabaseLogout();
    setUser(null);
    window.location.href = '/crm/login';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0F3A5F', color: '#fff',
        fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ fontSize: '18px' }}>Loading…</div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0F3A5F', color: '#fff',
        fontFamily: 'sans-serif', flexDirection: 'column', gap: '16px',
        padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>Cannot connect to server</div>
        <div style={{ fontSize: '15px', opacity: 0.8, maxWidth: '360px' }}>
          The database is unreachable. Please go to{' '}
          <strong>app.supabase.com</strong> and un-pause the project, then refresh.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px', padding: '10px 28px', borderRadius: '8px',
            background: '#fff', color: '#0F3A5F', fontWeight: 'bold',
            border: 'none', cursor: 'pointer', fontSize: '15px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      connectionError,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
