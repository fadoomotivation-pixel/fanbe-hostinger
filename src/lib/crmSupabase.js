// src/lib/crmSupabase.js
// ✅ Fixed: addCall now saves employee_name column
// ✅ Fixed: addCall now saves major_objection column
// ✅ Fixed: getSiteVisits orders by created_at (fallback for NULL visit_date rows)
// ✅ Fixed: addSiteVisit now saves interest_level as its own column
// ✅ Added: follow_up_date to addEmployeeLead
import { supabase } from './supabase';
import { supabaseAdmin } from './supabase';

// ==========================================
// CALLS
// ==========================================

export const addCall = async (callData) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        employee_id:      callData.employeeId     || callData.employee_id,
        employee_name:    callData.employeeName   || callData.employee_name   || null,
        lead_id:          callData.leadId         || callData.lead_id         || null,
        lead_name:        callData.leadName       || callData.lead_name       || null,
        project_name:     callData.projectName    || callData.project_name    || '',
        call_type:        callData.type           || callData.call_type       || 'outbound',
        status:           callData.status,
        duration:         parseInt(callData.duration) || 0,
        notes:            callData.notes          || '',
        // ✅ Client objection / reason captured from call log form
        major_objection:  callData.majorObjection || callData.major_objection || null,
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
        employee_id:    visitData.employeeId   || visitData.employee_id,
        lead_id:        visitData.leadId       || visitData.lead_id       || null,
        lead_name:      visitData.leadName     || visitData.lead_name     || null,
        project_name:   visitData.projectName  || visitData.project_name  || '',
        visit_date:     visitData.visitDate    || visitData.visit_date    || visitData.date || null,
        visit_time:     visitData.visitTime    || visitData.visit_time    || null,
        status:         visitData.status       || 'Completed',
        location:       visitData.location     || '',
        duration:       parseInt(visitData.duration) || null,
        notes:          visitData.notes        || '',
        feedback:       visitData.feedback     || '',
        interest_level: visitData.interestLevel || visitData.interest_level || null,
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

export const getSiteVisits = async (employeeId = null) => {
  try {
    let query = supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false });
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
        token_amount:          parseFloat(bookingData.tokenAmount || 0),
        partial_payment:       parseFloat(bookingData.partialPayment || 0),
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
// EMPLOYEE LEADS (submitted by employees for admin review)
// ==========================================

export const addEmployeeLead = async (leadData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_leads')
      .insert([{
        submitted_by:        leadData.submitted_by,
        submitted_by_name:   leadData.submitted_by_name,
        customer_name:       leadData.customer_name,
        phone:               leadData.phone,
        email:               leadData.email || null,
        alternate_phone:     leadData.alternate_phone || null,
        occupation:          leadData.occupation || null,
        city:                leadData.city || null,
        locality:            leadData.locality || null,
        pincode:             leadData.pincode || null,
        source:              leadData.source || 'Employee Referral',
        interest_level:      leadData.interest_level || 'warm',
        project_interested:  leadData.project_interested || null,
        budget_range:        leadData.budget_range || null,
        property_type:       leadData.property_type || null,
        preferred_size:      leadData.preferred_size || null,
        purpose:             leadData.purpose || null,
        possession_timeline: leadData.possession_timeline || null,
        financing:           leadData.financing || null,
        follow_up_date:      leadData.follow_up_date || null,
        how_they_know:       leadData.how_they_know || null,
        customer_remarks:    leadData.customer_remarks || null,
        employee_remarks:    leadData.employee_remarks || null,
        site_visit_interest: leadData.site_visit_interest || false,
        preferred_visit_date: leadData.preferred_visit_date || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Add employee lead error:', error);
    return { success: false, message: error.message };
  }
};

export const getEmployeeLeads = async (submittedBy = null) => {
  try {
    let query = supabaseAdmin
      .from('employee_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (submittedBy) query = query.eq('submitted_by', submittedBy);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CRM] Get employee leads error:', error);
    return [];
  }
};

export const updateEmployeeLead = async (id, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[CRM] Update employee lead error:', error);
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
    return {
      calls:      callsCount          || 0,
      siteVisits: visitsCount         || 0,
      bookings:   bookingsData?.length || 0,
      revenue:    totalRevenue,
    };
  } catch (error) {
    console.error('[CRM] Get employee stats error:', error);
    return { calls: 0, siteVisits: 0, bookings: 0, revenue: 0 };
  }
};
