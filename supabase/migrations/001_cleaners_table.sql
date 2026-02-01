-- =====================================================
-- Cleaners Management System
-- =====================================================

-- Cleaners table - stores team member information
CREATE TABLE IF NOT EXISTS cleaners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    -- Round robin tracking
    last_assigned_at TIMESTAMPTZ,
    total_assignments INTEGER DEFAULT 0,
    -- Availability (days they can work)
    available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    -- Service areas they cover
    service_areas TEXT[] DEFAULT ARRAY['st-charles', 'geneva', 'batavia', 'wayne', 'campton-hills', 'elburn'],
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cleaner_id to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cleaner_id UUID REFERENCES cleaners(id),
ADD COLUMN IF NOT EXISTS cleaner_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cleaning_instructions TEXT;

-- Index for efficient round-robin queries
CREATE INDEX IF NOT EXISTS idx_cleaners_active_last_assigned 
ON cleaners(status, last_assigned_at) 
WHERE status = 'active';

-- Index for cleaner's bookings lookup
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner 
ON bookings(cleaner_id, scheduled_date);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for cleaners table
DROP TRIGGER IF EXISTS update_cleaners_updated_at ON cleaners;
CREATE TRIGGER update_cleaners_updated_at
    BEFORE UPDATE ON cleaners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample cleaners (you can modify these)
-- =====================================================
INSERT INTO cleaners (name, email, phone, status, available_days) VALUES
    ('Sarah Johnson', 'sarah@willowandwater.com', '630-555-0101', 'active', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
    ('Maria Garcia', 'maria@willowandwater.com', '630-555-0102', 'active', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
    ('Jennifer Lee', 'jennifer@willowandwater.com', '630-555-0103', 'active', ARRAY['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Helper view for cleaner schedules
-- =====================================================
CREATE OR REPLACE VIEW cleaner_weekly_schedule AS
SELECT 
    c.id AS cleaner_id,
    c.name AS cleaner_name,
    c.email AS cleaner_email,
    c.phone AS cleaner_phone,
    b.id AS booking_id,
    b.name AS customer_name,
    b.address AS customer_address,
    b.phone AS customer_phone,
    b.scheduled_date,
    b.sqft,
    b.bedrooms,
    b.bathrooms,
    b.frequency,
    b.cleaning_instructions,
    b.status AS booking_status
FROM cleaners c
LEFT JOIN bookings b ON c.id = b.cleaner_id
WHERE c.status = 'active'
ORDER BY c.name, b.scheduled_date;

-- =====================================================
-- Row Level Security (RLS) Policies for Cleaners
-- =====================================================

ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all cleaners
CREATE POLICY "Authenticated users can read cleaners" ON cleaners
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Authenticated users can insert cleaners
CREATE POLICY "Authenticated users can insert cleaners" ON cleaners
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update cleaners
CREATE POLICY "Authenticated users can update cleaners" ON cleaners
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Authenticated users can delete cleaners
CREATE POLICY "Authenticated users can delete cleaners" ON cleaners
    FOR DELETE
    USING (auth.role() = 'authenticated');
