// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeData } from '@/lib/dataInitializer';
import {
  login as supabaseLogin,
  logout as supabaseLogout,
  getUserDetails,
} from '@/lib/authUtilsSupabase';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

// Resolve with null session after `ms` milliseconds so the app never hangs blank
const getSessionWithTimeout = (ms = 8000) => {
  const sessionPromise = supabase.auth.getSession();
  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ data: { session: null }, error: new Error('timeout') }), ms)
  );
  return Promise.race([sessionPromise, timeoutPromise]);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Initialize local data & listen to Supabase auth state changes
  useEffect(() => {
    initializeData();

    // Check for an existing session on mount (8 s timeout so we never show blank forever)
    getSessionWithTimeout(8000).then(async ({ data: { session }, error }) => {
      if (error?.message === 'timeout') {
        console.warn('[Auth] Supabase timed out — cannot reach server');
        setConnectionError(true);
        setLoading(false);
        return;
      }
      if (session) {
        console.log('[Auth] Existing session found:', session.user.email);
        try {
          const profile = await getUserDetails(session.user.id);
          if (profile) {
            setUser({
              id: session.user.id,
              username: profile.username,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              permissions: profile.permissions || [],
              lastLogin: profile.last_login || new Date().toISOString(),
            });
            console.log('[Auth] Session restored:', profile.name);
          }
        } catch (error) {
          console.error('[Auth] Error loading user profile:', error);
          setUser(null);
        }
      }
      setLoading(false);
    });

    // Listen to future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const profile = await getUserDetails(session.user.id);
            if (profile) {
              setUser({
                id: session.user.id,
                username: profile.username,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                permissions: profile.permissions || [],
                lastLogin: profile.last_login || new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('[Auth] Error loading profile on state change:', error);
            setUser(null);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // NOTE: Inactivity auto sign-out has been intentionally removed.
  // Supabase handles token refresh automatically - session stays active.

  const login = async (usernameOrEmail, password) => {
    console.log(`[Auth] Attempting Supabase login for: ${usernameOrEmail}`);
    try {
      const result = await supabaseLogin(usernameOrEmail, password);
      if (result.success) {
        setUser(result.user);
        console.log(`[Auth] Login successful for ${result.user.name} (${result.user.role})`);
      }
      return result;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    console.log('[Auth] Logging out user');
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
          The database is unreachable. This usually means the Supabase project is paused.
          Please go to <strong>app.supabase.com</strong> and un-pause the project, then refresh this page.
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
