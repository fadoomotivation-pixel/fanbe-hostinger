import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeData } from '@/lib/dataInitializer';
import { login as appLogin, logout as appLogout, getUserDetails } from '@/lib/authUtilsSupabase';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (sessionUser) {
        const profile = await getUserDetails(sessionUser.id);
        if (profile) {
          setUser({
            id: profile.id,
            username: profile.username,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            permissions: profile.permissions || [],
            lastLogin: profile.last_login || null
          });
        }
      }

      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user;
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await getUserDetails(sessionUser.id);
      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          permissions: profile.permissions || [],
          lastLogin: profile.last_login || null
        });
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (usernameOrEmail, password) => {
    const result = await appLogin(usernameOrEmail, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await appLogout();
    setUser(null);
    window.location.href = '/crm/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
