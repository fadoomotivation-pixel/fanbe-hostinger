// src/lib/authUtilsSupabase.js
// Supabase auth & user management — all admin writes use supabaseAdmin (service_role)
import { supabase, supabaseAdmin } from './supabase';

// ==========================================
// AUTH FUNCTIONS
// ==========================================

export const login = async (usernameOrEmail, password) => {
  try {
    console.log(`[Auth] Attempting login for: ${usernameOrEmail}`);

    let email = usernameOrEmail;

    if (!usernameOrEmail.includes('@')) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail.toLowerCase())
        .single();

      if (error || !data) {
        return { success: false, message: 'Username not found' };
      }
      email = data.email;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials') || authError.message.includes('invalid_credentials')) {
        return { success: false, message: 'Invalid username or password' };
      }
      if (authError.message.includes('Email not confirmed')) {
        return { success: false, message: 'Account not confirmed. Contact admin.' };
      }
      return { success: false, message: authError.message };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { success: false, message: 'User profile not found. Contact admin.' };
    }

    if (profile.status !== 'Active') {
      await supabase.auth.signOut();
      return { success: false, message: 'Account is suspended. Contact admin.' };
    }

    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    console.log(`[Auth] Login successful for ${profile.name} (${profile.role})`);

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
    console.error('[Auth] Login error:', error);
    return { success: false, message: 'Login failed. Please try again.' };
  }
};

export const logout = async () => {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getUserDetails = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return { id: data.id, ...data };
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = () => supabase.auth.getUser();

export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

// ==========================================
// USER MANAGEMENT (Admin only)
// ALL operations use supabaseAdmin (service_role key)
// ==========================================

export const addUser = async (userData) => {
  try {
    console.log('[Supabase] Creating user:', userData.username);

    const { data: existingUsername } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', userData.username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      return { success: false, message: 'Username already exists' };
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userData.email.toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      return { success: false, message: 'Email already in use' };
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email.toLowerCase(),
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        username: userData.username.toLowerCase(),
        name: userData.name,
      },
    });

    if (createError) {
      console.error('[Supabase] auth.admin.createUser error:', createError);
      return { success: false, message: createError.message };
    }

    if (!authData?.user?.id) {
      return { success: false, message: 'Auth user creation returned no ID' };
    }

    console.log('[Supabase] Auth user created with ID:', authData.user.id);

    const profileDoc = {
      id: authData.user.id,
      username: userData.username.toLowerCase(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      phone: userData.phone || '',
      department: userData.department || 'Sales',
      status: 'Active',
      permissions: getDefaultPermissions(userData.role),
      joining_date: new Date().toISOString(),
      last_login: null,
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileDoc);

    if (profileError) {
      console.error('[Supabase] Profile insert error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: `Profile creation failed: ${profileError.message}` };
    }

    console.log('[Supabase] Profile inserted successfully for:', userData.username);

    return {
      success: true,
      user: profileDoc,
      userId: authData.user.id,
      plainPassword: userData.password,
    };
  } catch (error) {
    console.error('[Supabase] addUser unexpected error:', error);
    return { success: false, message: error.message || 'Failed to create user' };
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('joining_date', { ascending: false });
    if (error) {
      console.error('[Supabase] getAllUsers error:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[Supabase] getAllUsers error:', error);
    return [];
  }
};

// Get users by specific role
export const getUsersByRole = async (role) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('joining_date', { ascending: false });
    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const { password, email, id, ...safeUpdates } = updates;
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) console.warn('[Supabase] Auth user delete warning:', authError.message);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const toggleUserStatus = async (userId) => {
  try {
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) return { success: false, message: 'User not found' };

    const newStatus = profile.status === 'Active' ? 'Suspended' : 'Active';

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, status: newStatus };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%';
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
    super_admin:     ['all'],
    sub_admin:       ['view_reports', 'view_leads', 'view_staff', 'view_hr_summary'],
    hr_manager:      ['manage_hr', 'mark_attendance', 'approve_leaves', 'generate_payroll', 'upload_documents', 'manage_hr_employees'],
    manager:         ['manage_team', 'assign_leads', 'view_reports', 'manage_properties'],
    team_lead:       ['assign_leads', 'view_reports', 'manage_leads', 'schedule_visits'],
    sales_executive: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    telecaller:      ['make_calls', 'schedule_appointments'],
  };
  return permissions[role] || [];
};
