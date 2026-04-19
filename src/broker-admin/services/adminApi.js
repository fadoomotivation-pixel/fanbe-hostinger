import { supabase } from '@/lib/supabase';

const safe = async (promise, fallback = null) => {
  const { data, error, count } = await promise;
  if (error) throw error;
  return { data, count };
};

export const adminApi = {
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getDashboardMetrics: async () => {
    const [
      projects,
      plots,
      bookings,
      payments,
      payouts,
      brokers,
      brokerBank,
      holds,
    ] = await Promise.all([
      safe(supabase.from('bp_projects').select('id,name,status', { count: 'exact' })),
      safe(supabase.from('bp_plots').select('id,project_id,status,total_price', { count: 'exact' })),
      safe(supabase.from('bp_bookings').select('id,stage,token_amount,booking_amount,full_payment_amount,total_collected,balance_due,created_at,booking_no,commission_status', { count: 'exact' }).order('created_at', { ascending: false }).limit(8)),
      safe(supabase.from('bp_payments').select('id,payment_type,amount,payment_date', { count: 'exact' })),
      safe(supabase.from('bp_payout_transactions').select('id,status,amount,paid_date,updated_at', { count: 'exact' }).order('updated_at', { ascending: false }).limit(8)),
      safe(supabase.from('brokers').select('id,status,kyc_status', { count: 'exact' })),
      safe(supabase.from('bp_broker_bank').select('id,verified', { count: 'exact' })),
      safe(supabase.from('bp_plot_hold_log').select('id,status,hold_until,released_at', { count: 'exact' })),
    ]);

    return { projects, plots, bookings, payments, payouts, brokers, brokerBank, holds };
  },

  listTable: async (table, select = '*', match = {}) => {
    let query = supabase.from(table).select(select).order('created_at', { ascending: false }).limit(100);
    Object.entries(match).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  upsert: async (table, payload, onConflict = 'id') => {
    const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select().single();
    if (error) throw error;
    return data;
  },

  update: async (table, id, payload) => {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};
