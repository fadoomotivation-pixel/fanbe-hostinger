// STUB — replaced by the real Supabase client in production.
//
// The production CRM repo defines this module as:
//
//   import { createClient } from '@supabase/supabase-js';
//   export const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_ANON_KEY
//   );
//
// In THIS branch (the `crm-real-source` snapshot) the data layer is the
// static files in `src/crm/data/`, so we expose a null client. Hooks that
// depend on supabase (e.g. useNewLeadNotifications) gracefully no-op when
// `supabase` is null.

export const supabase = null;
