-- Migration: Create CRM Activity Tables
-- Purpose: Move calls, site_visits, and bookings from localStorage to Supabase
-- Date: 2026-02-25

-- =============================================
-- CALLS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    project_name TEXT,
    call_type TEXT NOT NULL CHECK (call_type IN ('Outgoing', 'Incoming')),
    status TEXT NOT NULL CHECK (status IN ('Connected', 'Not Connected', 'Busy', 'Voicemail')),
    duration INTEGER DEFAULT 0, -- in minutes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_employee ON public.calls(employee_id);
CREATE INDEX idx_calls_lead ON public.calls(lead_id);
CREATE INDEX idx_calls_created ON public.calls(created_at DESC);

-- RLS Policies for calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Employees can view their own calls
CREATE POLICY "Users can view own calls"
    ON public.calls FOR SELECT
    USING (auth.uid() = employee_id);

-- Employees can insert their own calls
CREATE POLICY "Users can insert own calls"
    ON public.calls FOR INSERT
    WITH CHECK (auth.uid() = employee_id);

-- Admins can view all calls
CREATE POLICY "Admins can view all calls"
    ON public.calls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'manager', 'sub_admin')
        )
    );

-- =============================================
-- SITE VISITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    project_name TEXT,
    visit_date DATE NOT NULL,
    visit_time TIME,
    status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
    location TEXT,
    duration INTEGER, -- in minutes
    notes TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_visits_employee ON public.site_visits(employee_id);
CREATE INDEX idx_site_visits_lead ON public.site_visits(lead_id);
CREATE INDEX idx_site_visits_date ON public.site_visits(visit_date DESC);

-- RLS Policies for site_visits
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site visits"
    ON public.site_visits FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own site visits"
    ON public.site_visits FOR INSERT
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own site visits"
    ON public.site_visits FOR UPDATE
    USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all site visits"
    ON public.site_visits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'manager', 'sub_admin')
        )
    );

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    unit_type TEXT,
    unit_number TEXT,
    booking_amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card')),
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Completed')),
    booking_date DATE NOT NULL,
    expected_closure_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_employee ON public.bookings(employee_id);
CREATE INDEX idx_bookings_lead ON public.bookings(lead_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date DESC);

-- RLS Policies for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all bookings"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'manager', 'sub_admin')
        )
    );

CREATE POLICY "Admins can update all bookings"
    ON public.bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'manager')
        )
    );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON public.site_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
