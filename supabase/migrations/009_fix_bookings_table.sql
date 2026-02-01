-- =====================================================
-- Fix Bookings Table - Add missing columns and fix trigger
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add customer_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'customer_type') THEN
        ALTER TABLE bookings ADD COLUMN customer_type TEXT DEFAULT 'first_time';
    END IF;
END $$;

-- Add payment_status column if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'payment_status') THEN
        ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Add scheduled_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'scheduled_time') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_time TEXT;
    END IF;
END $$;

-- Add cal_booking_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'cal_booking_id') THEN
        ALTER TABLE bookings ADD COLUMN cal_booking_id TEXT;
    END IF;
END $$;

-- Drop the old trigger if it exists (to recreate it safely)
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure RLS policies exist for anonymous updates (needed for payment flow)
DROP POLICY IF EXISTS "Allow anonymous booking updates by email" ON bookings;
CREATE POLICY "Allow anonymous booking updates by email" ON bookings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Ensure anonymous users can insert
DROP POLICY IF EXISTS "Allow anonymous booking inserts" ON bookings;
CREATE POLICY "Allow anonymous booking inserts" ON bookings
    FOR INSERT 
    WITH CHECK (true);

-- Ensure authenticated users can do everything
DROP POLICY IF EXISTS "Authenticated users can read bookings" ON bookings;
CREATE POLICY "Authenticated users can read bookings" ON bookings
    FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;
CREATE POLICY "Authenticated users can update bookings" ON bookings
    FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;
CREATE POLICY "Authenticated users can delete bookings" ON bookings
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
