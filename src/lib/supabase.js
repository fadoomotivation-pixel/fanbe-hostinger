const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ACCESS_TOKEN_KEY = 'sb_access_token';
const USER_KEY = 'sb_user';

const listeners = new Set();

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

const setSession = (payload) => {
  if (!payload?.access_token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user || null));
  listeners.forEach((cb) => cb('SIGNED_IN', { user: payload.user }));
};

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((cb) => cb('SIGNED_OUT', null));
};

const authHeaders = (withAuth = true, extra = {}) => {
  const headers = {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
    ...extra
  };

  if (withAuth && getAccessToken()) {
    headers.Authorization = `Bearer ${getAccessToken()}`;
  }

  return headers;
};

const request = async (path, { method = 'GET', body, withAuth = true, headers } = {}) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: authHeaders(withAuth, headers),
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    return { data: null, error: { message: data?.message || response.statusText, status: response.status } };
  }

  return { data, error: null };
};

const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    joiningDate: row.joining_date
  };
};

const mapUpdateKeys = (updates) => {
  const mapped = { ...updates };
  if ('lastLogin' in mapped) {
    mapped.last_login = mapped.lastLogin;
    delete mapped.lastLogin;
  }
  if ('updatedAt' in mapped) {
    mapped.updated_at = mapped.updatedAt;
    delete mapped.updatedAt;
  }
  return mapped;
};

const buildQuery = ({ selectColumns, filters, orderBy }) => {
  const params = new URLSearchParams();
  params.set('select', selectColumns || '*');
  filters.forEach(({ column, value }) => params.set(column, `eq.${value}`));
  if (orderBy) {
    params.set('order', `${orderBy.column}.${orderBy.ascending ? 'asc' : 'desc'}`);
  }
  return params.toString();
};

const createQueryBuilder = (table) => {
  const state = {
    selectColumns: '*',
    filters: [],
    orderBy: null,
    updatePayload: null
  };

  const builder = {
    select(columns = '*') {
      state.selectColumns = columns;
      return this;
    },
    eq(column, value) {
      state.filters.push({ column, value });
      if (state.updatePayload) {
        return this._execUpdate();
      }
      return this;
    },
    order(column, options = {}) {
      state.orderBy = { column, ascending: options.ascending !== false };
      return this;
    },
    async maybeSingle() {
      const query = buildQuery(state);
      const { data, error } = await request(`/rest/v1/${table}?${query}`, {
        headers: { Prefer: 'return=representation' }
      });
      if (error) return { data: null, error };
      return { data: normalizeRow(Array.isArray(data) ? data[0] || null : data), error: null };
    },
    async then(resolve, reject) {
      const query = buildQuery(state);
      const result = await request(`/rest/v1/${table}?${query}`);
      const normalized = {
        data: Array.isArray(result.data) ? result.data.map(normalizeRow) : result.data,
        error: result.error
      };
      return Promise.resolve(normalized).then(resolve, reject);
    },
    update(payload) {
      state.updatePayload = mapUpdateKeys(payload);
      return this;
    },
    async _execUpdate() {
      const query = buildQuery(state);
      const { data, error } = await request(`/rest/v1/${table}?${query}`, {
        method: 'PATCH',
        body: state.updatePayload,
        headers: { Prefer: 'return=representation' }
      });
      return { data: Array.isArray(data) ? data.map(normalizeRow) : data, error };
    }
  };

  return builder;
};

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      const { data, error } = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        withAuth: false,
        body: { email, password }
      });

      if (error) return { data: null, error };
      setSession(data);
      return { data: { user: data.user, session: data }, error: null };
    },
    async signOut() {
      await request('/auth/v1/logout', { method: 'POST' });
      clearSession();
      return { error: null };
    },
    async getSession() {
      const user = getStoredUser();
      const accessToken = getAccessToken();
      return {
        data: {
          session: accessToken ? { access_token: accessToken, user } : null
        }
      };
    },
    async getUser() {
      const { data, error } = await request('/auth/v1/user');
      if (error) return { data: { user: null }, error };
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return { data: { user: data }, error: null };
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            }
          }
        }
      };
    }
  },
  from(table) {
    return createQueryBuilder(table);
  },
  functions: {
    async invoke(functionName, { body } = {}) {
      const { data, error } = await request(`/functions/v1/${functionName}`, {
        method: 'POST',
        body,
        withAuth: true
      });
      return { data, error };
    }
  }
};

console.log('[Supabase] REST client initialized');
