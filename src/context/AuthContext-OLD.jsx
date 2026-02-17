
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeData } from '@/lib/dataInitializer';
import { initializeUserDatabase, findUser, verifyPassword } from '@/lib/authUtils';
import { logLoginAttempt } from '@/lib/loginLogger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Data & Load Session
  useEffect(() => {
    // Ensure basic data exists
    initializeData();
    // Ensure user DB exists
    initializeUserDatabase();

    // Restore session from localStorage
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verify token validity or session expiry here if needed
        // For now, assume stored user is valid
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('crm_user');
      }
    }
    setLoading(false);
  }, []);

  // Session Timeout Logic
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const timeoutDuration = 30 * 60 * 1000; // 30 minutes

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

  const login = (usernameOrId, password) => {
    console.log(`[Auth] Attempting login for: ${usernameOrId}`);
    
    // 1. Normalize input
    const cleanInput = usernameOrId.trim();

    // 2. Find employee
    const employee = findUser(cleanInput);

    // 3. Validate
    if (!employee) {
      console.warn(`[Auth] Login failed: User ${cleanInput} not found.`);
      logLoginAttempt({ username: cleanInput, status: 'Failed', reason: 'User not found' });
      return { success: false, message: 'Username/ID not found.' };
    }

    // 4. Verify Password
    if (!verifyPassword(password, employee.password)) {
      console.warn(`[Auth] Login failed: Incorrect password for ${cleanInput}.`);
      logLoginAttempt({ username: cleanInput, status: 'Failed', reason: 'Incorrect Password' });
      return { success: false, message: 'Incorrect password' };
    }

    if (employee.status !== 'Active') {
       console.warn(`[Auth] Login failed: User ${cleanInput} is suspended.`);
       logLoginAttempt({ username: cleanInput, status: 'Failed', reason: 'Account Suspended' });
       return { success: false, message: 'Account Suspended. Contact Admin.' };
    }

    // 5. Create Session
    const sessionUser = {
      id: employee.id,
      username: employee.username,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      lastLogin: new Date().toISOString(),
      permissions: employee.role === 'super_admin' ? ['all'] : ['limited'] 
    };

    // Store in localStorage for persistence
    localStorage.setItem('crm_user', JSON.stringify(sessionUser));
    
    // Update State
    setUser(sessionUser);
    
    logLoginAttempt({ username: cleanInput, status: 'Success' });
    console.log(`[Auth] Login successful for ${sessionUser.name} (${sessionUser.role})`);
    
    return { success: true, role: employee.role };
  };

  const logout = () => {
    console.log('[Auth] Logging out user');
    localStorage.removeItem('crm_user');
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
