import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    const {
      data: { user: actor },
      error: actorError
    } = await userClient.auth.getUser();

    if (actorError || !actor) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: actorProfile, error: actorProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', actor.id)
      .maybeSingle();

    if (actorProfileError || actorProfile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ success: false, message: 'Only super admins can create employees' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = await req.json();
    const role = ['super_admin', 'sales_manager', 'sales_executive'].includes(payload.role)
      ? payload.role
      : 'sales_executive';

    const email = (payload.email || `${payload.username}@fanbegroup.com`).toLowerCase();
    const username = payload.username.toLowerCase();
    const temporaryPassword = payload.password;

    const { data: authCreated, error: authCreateError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role,
        username,
        name: payload.name
      }
    });

    if (authCreateError || !authCreated.user) {
      return new Response(JSON.stringify({ success: false, message: authCreateError?.message || 'Auth user creation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const profileData = {
      id: authCreated.user.id,
      username,
      email,
      name: payload.name,
      role,
      phone: payload.phone || '',
      department: payload.department || 'Sales',
      status: 'Active',
      permissions: payload.permissions || [],
      joining_date: new Date().toISOString(),
      last_login: null,
      created_at: new Date().toISOString(),
      created_by: actor.id,
      metrics: {
        totalLeads: 0,
        connectedCalls: 0,
        siteVisits: 0,
        bookings: 0,
        revenue: 0
      }
    };

    const { error: profileError } = await adminClient.from('profiles').insert(profileData);

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authCreated.user.id);
      return new Response(JSON.stringify({ success: false, message: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      userId: authCreated.user.id,
      email,
      username,
      temporaryPassword
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
