-- =====================================================
-- Add payment_status column to bookings
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Add payment_status column for tracking payment state
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'deposit_paid', 'paid_in_full', 'refunded', 'failed'));

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
