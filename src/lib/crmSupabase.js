// src/lib/crmSupabase.js
// Supabase functions for CRM activities (calls, site visits, bookings)
import { supabase } from './supabase';

// ==========================================
// CALLS FUNCTIONS
// ==========================================

export const addCall = async (callData) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        employee_id: callData.employeeId,
        lead_id: callData.leadId || null,
        lead_name: callData.leadName,
        project_name: callData.projectName || '',
        call_type: callData.type,
        status: callData.status,
        duration: parseInt(callData.duration) || 0,
        notes: callData.notes || ''
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

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

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
// SITE VISITS FUNCTIONS
// ==========================================

export const addSiteVisit = async (visitData) => {
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .insert([{
        employee_id: visitData.employeeId,
        lead_id: visitData.leadId || null,
        lead_name: visitData.leadName,
        project_name: visitData.projectName || '',
        visit_date: visitData.visitDate,
        visit_time: visitData.visitTime || null,
        status: visitData.status || 'Completed',
        location: visitData.location || '',
        duration: parseInt(visitData.duration) || null,
        notes: visitData.notes || '',
        feedback: visitData.feedback || ''
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Add site visit error:', error);
    return { success: false, message: error.message };
  }
};

export const getSiteVisits = async (employeeId = null) => {
  try {
    let query = supabase
      .from('site_visits')
      .select('*')
      .order('visit_date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

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
      .from('site_visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Update site visit error:', error);
    return { success: false, message: error.message };
  }
};

// ==========================================
// BOOKINGS FUNCTIONS
// ==========================================

export const addBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        employee_id: bookingData.employeeId,
        lead_id: bookingData.leadId || null,
        lead_name: bookingData.leadName,
        project_name: bookingData.projectName,
        unit_type: bookingData.unitType || '',
        unit_number: bookingData.unitNumber || '',
        booking_amount: parseFloat(bookingData.amount || bookingData.bookingAmount || 0),
        payment_mode: bookingData.paymentMode || 'Bank Transfer',
        payment_status: bookingData.paymentStatus || 'Pending',
        booking_date: bookingData.bookingDate || new Date().toISOString().split('T')[0],
        expected_closure_date: bookingData.expectedClosureDate || null,
        notes: bookingData.notes || ''
      }])
      .select()
      .single();

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

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

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
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Update booking error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteBooking = async (id) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[CRM] Delete booking error:', error);
    return { success: false, message: error.message };
  }
};

// ==========================================
// ANALYTICS / AGGREGATION FUNCTIONS
// ==========================================

export const getEmployeeStats = async (employeeId, startDate, endDate) => {
  try {
    // Get calls count
    const { count: callsCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get site visits count
    const { count: visitsCount } = await supabase
      .from('site_visits')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate);

    // Get bookings and total revenue
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('booking_amount')
      .eq('employee_id', employeeId)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate);

    const totalRevenue = bookingsData?.reduce((sum, b) => sum + parseFloat(b.booking_amount || 0), 0) || 0;

    return {
      calls: callsCount || 0,
      siteVisits: visitsCount || 0,
      bookings: bookingsData?.length || 0,
      revenue: totalRevenue
    };
  } catch (error) {
    console.error('[CRM] Get employee stats error:', error);
    return { calls: 0, siteVisits: 0, bookings: 0, revenue: 0 };
  }
};
