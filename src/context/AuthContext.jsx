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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize local data & listen to Supabase auth state changes
  useEffect(() => {
    initializeData();

    // Check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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

  // 30-minute inactivity session timeout
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const timeoutDuration = 30 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Session expired due to inactivity');
        logout();
      }, timeoutDuration);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]);

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

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
