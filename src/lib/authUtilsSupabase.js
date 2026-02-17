import { supabase } from './supabase';

const normalizeRole = (role) => {
  if (!role) return 'sales_executive';
  const value = role.toLowerCase();
  if (value === 'super_admin' || value === 'admin') return 'super_admin';
  if (value === 'sales_manager' || value === 'manager' || value === 'sub_admin' || value === 'team lead') return 'sales_manager';
  return 'sales_executive';
};

const getDefaultPermissions = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'super_admin') return ['all'];
  if (normalizedRole === 'sales_manager') return ['manage_team', 'assign_leads', 'view_team_performance', 'approve_bookings'];
  return ['manage_own_leads', 'log_followups', 'schedule_site_visits', 'create_bookings'];
};

const resolveLoginEmail = async (identifier) => {
  const cleanValue = identifier.trim().toLowerCase();
  if (cleanValue.includes('@')) {
    return cleanValue;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', cleanValue)
      .maybeSingle();

    if (!error && data?.email) {
      return data.email.toLowerCase();
    }
  } catch (error) {
    console.warn('[Supabase] Username lookup failed, using fallback email', error?.message);
  }

  return `${cleanValue}@fanbegroup.com`;
};

export const login = async (usernameOrEmail, password) => {
  try {
    const email = await resolveLoginEmail(usernameOrEmail);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, message: error.message || 'Invalid credentials' };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { success: false, message: 'Unable to identify authenticated user' };
    }

    const profile = await getUserDetails(userId);
    if (!profile) {
      return { success: false, message: 'User profile not found' };
    }

    if (profile.status && profile.status !== 'Active') {
      await supabase.auth.signOut();
      return { success: false, message: 'Account is suspended. Contact admin.' };
    }

    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    return {
      success: true,
      role: profile.role,
      user: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        permissions: profile.permissions || [],
        lastLogin: new Date().toISOString()
      }
    };
  } catch (error) {
    return { success: false, message: error.message || 'Login failed' };
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, message: error.message };
  return { success: true };
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
};

export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const getUserDetails = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] getUserDetails failed:', error.message);
    return null;
  }

  return data;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getAllUsers failed:', error.message);
    return [];
  }

  return data || [];
};

export const toggleUserStatus = async (userId) => {
  const user = await getUserDetails(userId);
  if (!user) return { success: false, message: 'User not found' };

  const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
  const { error } = await supabase
    .from('profiles')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, message: error.message };
  return { success: true, status: nextStatus };
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
};

export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const createEmployee = async (userData) => {
  const payload = {
    ...userData,
    role: normalizeRole(userData.role),
    username: userData.username.toLowerCase(),
    permissions: userData.permissions || getDefaultPermissions(userData.role)
  };

  const { data, error } = await supabase.functions.invoke('create_employee', {
    body: payload
  });

  if (error) {
    return { success: false, message: error.message || 'Failed to create employee' };
  }

  return { success: !!data?.success, ...data };
};
