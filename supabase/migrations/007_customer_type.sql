-- =====================================================
-- Add customer_type field to bookings
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Add customer_type column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'first_time' 
CHECK (customer_type IN ('first_time', 'recurring', 'one_time'));

-- Create index for customer type filtering
CREATE INDEX IF NOT EXISTS idx_bookings_customer_type ON bookings(customer_type);

-- Update existing bookings based on frequency:
-- - If frequency is not 'onetime', set to 'recurring' 
-- - If they have multiple completed bookings, set to 'recurring'
-- - Otherwise keep as 'first_time'

-- First, mark recurring frequency bookings
UPDATE bookings 
SET customer_type = 'recurring' 
WHERE frequency IN ('weekly', 'biweekly', 'monthly')
AND customer_type = 'first_time';

-- Mark customers with multiple completed bookings as recurring
UPDATE bookings b1
SET customer_type = 'recurring'
WHERE customer_type = 'first_time'
AND (
    SELECT COUNT(*) 
    FROM bookings b2 
    WHERE b2.email = b1.email 
    AND b2.status = 'completed'
) > 1;
