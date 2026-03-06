// src/lib/crmSupabase.js
// ✅ Fixed: getSiteVisits orders by created_at (fallback for NULL visit_date rows)
import { supabase } from './supabase';

// ==========================================
// CALLS
// ==========================================

export const addCall = async (callData) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        employee_id:  callData.employeeId  || callData.employee_id,
        lead_id:      callData.leadId      || callData.lead_id      || null,
        lead_name:    callData.leadName    || callData.lead_name    || null,
        project_name: callData.projectName || callData.project_name || '',
        call_type:    callData.type        || callData.call_type    || 'outbound',
        status:       callData.status,
        duration:     parseInt(callData.duration) || 0,
        notes:        callData.notes       || ''
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Add call error:', error);
    return { success: false, message: error.message };
  }
};

export const getCalls = async (employeeId = null) => {
  try {
    let query = supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false });
    if (employeeId) query = query.eq('employee_id', employeeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CRM] Get calls error:', error);
    return [];
  }
};

export const getCallsByDateRange = async (employeeId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CRM] Get calls by date error:', error);
    return [];
  }
};

// ==========================================
// SITE VISITS
// ==========================================

export const addSiteVisit = async (visitData) => {
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .insert([{
        employee_id:  visitData.employeeId  || visitData.employee_id,
        lead_id:      visitData.leadId      || visitData.lead_id      || null,
        lead_name:    visitData.leadName    || visitData.lead_name    || null,
        project_name: visitData.projectName || visitData.project_name || '',
        // ✅ FIXED: Accept both camelCase (visitDate) and snake_case (visit_date)
        visit_date:   visitData.visitDate   || visitData.visit_date   || visitData.date || null,
        visit_time:   visitData.visitTime   || visitData.visit_time   || null,
        status:       visitData.status      || 'Completed',
        location:     visitData.location    || '',
        duration:     parseInt(visitData.duration) || null,
        notes:        visitData.notes       || '',
        feedback:     visitData.feedback    || ''
      }])
      .select()
      .single();

    if (error) {
      console.error('[CRM] addSiteVisit Supabase error:', error);
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Add site visit error:', error);
    return { success: false, message: error.message };
  }
};

// ✅ FIXED: order by created_at DESC so NULL visit_date rows still appear at top
export const getSiteVisits = async (employeeId = null) => {
  try {
    let query = supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false });  // was: visit_date (NULL = invisible)
    if (employeeId) query = query.eq('employee_id', employeeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CRM] Get site visits error:', error);
    return [];
  }
};

export const updateSiteVisit = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('site_visits').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Update site visit error:', error);
    return { success: false, message: error.message };
  }
};

// ==========================================
// BOOKINGS
// ==========================================

export const addBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        employee_id:           bookingData.employeeId,
        lead_id:               bookingData.leadId               || null,
        lead_name:             bookingData.leadName,
        project_name:          bookingData.projectName,
        unit_type:             bookingData.unitType             || '',
        unit_number:           bookingData.unitNumber           || '',
        booking_amount:        parseFloat(bookingData.amount   || bookingData.bookingAmount || 0),
        payment_mode:          bookingData.paymentMode         || 'Bank Transfer',
        payment_status:        bookingData.paymentStatus       || 'Pending',
        booking_date:          bookingData.bookingDate         || new Date().toISOString().split('T')[0],
        expected_closure_date: bookingData.expectedClosureDate || null,
        notes:                 bookingData.notes               || ''
      }])
      .select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Add booking error:', error);
    return { success: false, message: error.message };
  }
};

export const getBookings = async (employeeId = null) => {
  try {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false });
    if (employeeId) query = query.eq('employee_id', employeeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CRM] Get bookings error:', error);
    return [];
  }
};

export const updateBooking = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('bookings').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Update booking error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteBooking = async (id) => {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[CRM] Delete booking error:', error);
    return { success: false, message: error.message };
  }
};

// ==========================================
// ANALYTICS
// ==========================================

export const getEmployeeStats = async (employeeId, startDate, endDate) => {
  try {
    const { count: callsCount } = await supabase
      .from('calls').select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId).gte('created_at', startDate).lte('created_at', endDate);

    const { count: visitsCount } = await supabase
      .from('site_visits').select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId).gte('created_at', startDate).lte('created_at', endDate);

    const { data: bookingsData } = await supabase
      .from('bookings').select('booking_amount')
      .eq('employee_id', employeeId).gte('booking_date', startDate).lte('booking_date', endDate);

    const totalRevenue = bookingsData?.reduce((sum, b) => sum + parseFloat(b.booking_amount || 0), 0) || 0;
    return { calls: callsCount || 0, siteVisits: visitsCount || 0, bookings: bookingsData?.length || 0, revenue: totalRevenue };
  } catch (error) {
    console.error('[CRM] Get employee stats error:', error);
    return { calls: 0, siteVisits: 0, bookings: 0, revenue: 0 };
  }
};
