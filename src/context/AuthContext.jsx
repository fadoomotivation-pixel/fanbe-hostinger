// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeData } from '@/lib/dataInitializer';
import { 
  login as firebaseLogin, 
  logout as firebaseLogout,
  getCurrentUser,
  isAuthenticated as checkAuth
} from '@/lib/authUtilsFirebase';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Data & Listen to Auth State
  useEffect(() => {
    // Ensure basic data exists
    initializeData();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('[Auth] Firebase user detected:', firebaseUser.email);
        
        // Get user details from Firestore
        try {
          const userDetails = await import('@/lib/authUtilsFirebase').then(m => 
            m.getUserDetails(firebaseUser.uid)
          );
          
          if (userDetails) {
            const sessionUser = {
              id: firebaseUser.uid,
              username: userDetails.username,
              name: userDetails.name,
              email: userDetails.email,
              role: userDetails.role,
              permissions: userDetails.permissions || [],
              lastLogin: new Date().toISOString()
            };
            
            setUser(sessionUser);
            console.log('[Auth] User session restored:', sessionUser.name);
          }
        } catch (error) {
          console.error('[Auth] Error loading user details:', error);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
        console.log('[Auth] No user signed in');
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Session Timeout Logic (optional, keep for extra security)
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

  const login = async (usernameOrEmail, password) => {
    console.log(`[Auth] Attempting Firebase login for: ${usernameOrEmail}`);
    
    try {
      const result = await firebaseLogin(usernameOrEmail, password);
      
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
    await firebaseLogout();
    setUser(null);
    window.location.href = '/crm/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isAuthenticated: !!user 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
