// src/lib/authUtilsSupabase.js
// Supabase equivalents of all Firebase auth & user management functions.
import { supabase, supabaseSecondary } from './supabase';

// ==========================================
// AUTH FUNCTIONS
// ==========================================

/**
 * Login with username or email + password.
 * Mirrors Firebase: getUserByUsername → signInWithEmailAndPassword → Firestore profile load.
 */
export const login = async (usernameOrEmail, password) => {
  try {
    console.log(`[Supabase] Login attempt for: ${usernameOrEmail}`);

    let email = usernameOrEmail;

    if (!usernameOrEmail.includes('@')) {
      // It's a username — look up the email in profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail.toLowerCase())
        .single();

      if (error || !data) {
        return { success: false, message: 'Username not found' };
      }
      email = data.email;
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('[Supabase] Auth error:', authError.message);
      if (
        authError.message.includes('Invalid login credentials') ||
        authError.message.includes('invalid_credentials')
      ) {
        return { success: false, message: 'Invalid email or password' };
      }
      if (authError.message.includes('Email not confirmed')) {
        return { success: false, message: 'Email not confirmed. Contact admin.' };
      }
      return { success: false, message: authError.message };
    }

    // Load profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Supabase] Profile not found:', profileError);
      return { success: false, message: 'User profile not found. Contact admin.' };
    }

    if (profile.status !== 'Active') {
      await supabase.auth.signOut();
      return { success: false, message: 'Account is suspended. Contact admin.' };
    }

    // Update last_login timestamp
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    console.log(`[Supabase] Login successful for ${profile.name}`);

    return {
      success: true,
      user: {
        id: authData.user.id,
        username: profile.username,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        permissions: profile.permissions || [],
        lastLogin: new Date().toISOString(),
      },
      role: profile.role,
    };
  } catch (error) {
    console.error('[Supabase] Login error:', error);
    return { success: false, message: 'Login failed. Please try again.' };
  }
};

/**
 * Logout current user.
 */
export const logout = async () => {
  try {
    await supabase.auth.signOut();
    console.log('[Supabase] User logged out');
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Logout error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get user profile from Supabase by user ID.
 */
export const getUserDetails = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return { id: data.id, ...data };
  } catch (error) {
    console.error('[Supabase] Error getting user details:', error);
    return null;
  }
};

/**
 * Get current Supabase auth user.
 */
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

/**
 * Check if a user is authenticated.
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

// ==========================================
// USER MANAGEMENT FUNCTIONS (Admin only)
// ==========================================

/**
 * Add a new user.
 * Uses a secondary Supabase client so the admin session is preserved,
 * because signUp() auto-signs-in the newly created user.
 */
export const addUser = async (userData) => {
  try {
    console.log('[Supabase] Creating user:', userData.username);

    // Check if username already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', userData.username.toLowerCase())
      .single();

    if (existing) {
      return { success: false, message: 'Username already exists' };
    }

    // Step 1: Create the auth user via the SECONDARY client
    // This keeps the admin's primary session untouched.
    const { data: authData, error: signUpError } = await supabaseSecondary.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        // Skip email confirmation so the account is immediately usable
        data: { username: userData.username.toLowerCase() },
      },
    });

    if (signUpError) {
      console.error('[Supabase] SignUp error:', signUpError);
      if (signUpError.message.includes('already registered')) {
        return { success: false, message: 'Email already in use' };
      }
      return { success: false, message: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, message: 'Failed to create auth user' };
    }

    console.log('[Supabase] Auth user created:', authData.user.id);

    // Step 2: Create the profile record using the PRIMARY client (admin session)
    const permissions = getDefaultPermissions(userData.role);

    const profileDoc = {
      id: authData.user.id,
      username: userData.username.toLowerCase(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      phone: userData.phone || '',
      department: userData.department || 'Sales',
      status: 'Active',
      permissions: permissions,
      joining_date: new Date().toISOString(),
      last_login: null,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileDoc);

    if (profileError) {
      console.error('[Supabase] Profile insert error:', profileError);
      return { success: false, message: profileError.message };
    }

    // Step 3: Sign out from the secondary client
    await supabaseSecondary.auth.signOut();
    console.log('[Supabase] New user signed out from secondary client');
    console.log('[Supabase] Admin session preserved on primary client');

    return {
      success: true,
      user: profileDoc,
      plainPassword: userData.password,
      userId: authData.user.id,
    };
  } catch (error) {
    console.error('[Supabase] Error creating user:', error);
    try { await supabaseSecondary.auth.signOut(); } catch (_) { /* ignore */ }

    if (error.message?.includes('already registered')) {
      return { success: false, message: 'Email already in use' };
    }
    return { success: false, message: error.message || 'Failed to create user' };
  }
};

/**
 * Get all users (Admin only).
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('joining_date', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Supabase] Error getting users:', error);
    return [];
  }
};

/**
 * Update user profile fields.
 */
export const updateUser = async (userId, updates) => {
  try {
    // Strip fields that should not be updated here
    const { password, email, id, ...safeUpdates } = updates;

    const { error } = await supabase
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Error updating user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete a user profile (soft: removes from profiles table).
 * Note: Removing from Supabase Auth requires a service-role key / Edge Function.
 */
export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Error deleting user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Toggle user status between Active and Suspended.
 */
export const toggleUserStatus = async (userId) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return { success: false, message: 'User not found' };
    }

    const newStatus = profile.status === 'Active' ? 'Suspended' : 'Active';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, status: newStatus };
  } catch (error) {
    console.error('[Supabase] Error toggling status:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Generate a random secure password.
 */
export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ==========================================
// HELPERS
// ==========================================

const getDefaultPermissions = (role) => {
  const permissions = {
    super_admin: ['all'],
    manager: ['manage_team', 'assign_leads', 'view_reports', 'manage_properties'],
    sub_admin: ['view_reports', 'view_leads', 'view_staff'],
    sales_executive: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    telecaller: ['call_leads', 'update_status', 'schedule_appointments'],
  };
  return permissions[role] || [];
};
