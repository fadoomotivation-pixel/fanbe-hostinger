-- Migration: Add Token and Booking Amount fields to leads table
-- Date: 2026-02-27
-- Purpose: Track token amounts and booking amounts with dates for sales performance

-- Add token amount tracking fields
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS token_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS token_notes TEXT,
ADD COLUMN IF NOT EXISTS token_receipt_no VARCHAR(50);

-- Add booking amount tracking fields
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS booking_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS booking_notes TEXT,
ADD COLUMN IF NOT EXISTS booking_unit VARCHAR(100),
ADD COLUMN IF NOT EXISTS booking_receipt_no VARCHAR(50);

-- Add payment status tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
-- payment_status can be: pending, token_received, booking_received, partially_paid, fully_paid

-- Create index for faster queries on token and booking dates
CREATE INDEX IF NOT EXISTS idx_leads_token_date ON leads(token_date);
CREATE INDEX IF NOT EXISTS idx_leads_booking_date ON leads(booking_date);
CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON leads(payment_status);

-- Create index for sales performance queries (by assigned_to and dates)
CREATE INDEX IF NOT EXISTS idx_leads_assigned_token ON leads(assigned_to, token_date);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_booking ON leads(assigned_to, booking_date);

-- Add comments for documentation
COMMENT ON COLUMN leads.token_amount IS 'Token amount received from customer in INR';
COMMENT ON COLUMN leads.token_date IS 'Date when token was received';
COMMENT ON COLUMN leads.booking_amount IS 'Full booking amount received in INR';
COMMENT ON COLUMN leads.booking_date IS 'Date when booking was confirmed';
COMMENT ON COLUMN leads.payment_status IS 'Current payment status of the lead';
