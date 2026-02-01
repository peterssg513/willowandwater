-- =====================================================
-- Bookings Table - Core booking/lead management
-- =====================================================
-- Run this FIRST before other migrations

CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    service_area TEXT,
    
    -- Property Details
    sqft INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    
    -- Service Details
    frequency TEXT DEFAULT 'onetime' CHECK (frequency IN ('onetime', 'weekly', 'biweekly', 'monthly')),
    cleaning_instructions TEXT,
    
    -- Pricing
    recurring_price DECIMAL(10, 2),
    first_clean_price DECIMAL(10, 2),
    deposit_amount DECIMAL(10, 2),
    remaining_amount DECIMAL(10, 2),
    
    -- Scheduling
    scheduled_date DATE,
    scheduled_time TEXT,
    cal_booking_id TEXT,
    
    -- Assignment
    cleaner_id UUID,
    cleaner_notified_at TIMESTAMPTZ,
    
    -- Payment
    stripe_customer_id TEXT,
    stripe_payment_intent_id TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'payment_initiated', 'confirmed', 'completed', 'cancelled', 'paused')),
    source TEXT DEFAULT 'website',
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_frequency ON bookings(frequency) WHERE frequency != 'onetime';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert bookings (for website booking form)
CREATE POLICY "Allow anonymous booking inserts" ON bookings
    FOR INSERT 
    WITH CHECK (true);

-- Only authenticated users can read/update bookings
CREATE POLICY "Authenticated users can read bookings" ON bookings
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bookings" ON bookings
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- =====================================================
-- Sample Data (optional - for testing)
-- =====================================================
-- Uncomment to add test data

-- INSERT INTO bookings (name, email, phone, address, sqft, bedrooms, bathrooms, frequency, recurring_price, first_clean_price, status, service_area) VALUES
--     ('John Smith', 'john@example.com', '630-555-1001', '123 Main St, St. Charles, IL 60174', 2000, 3, 2, 'biweekly', 180, 220, 'confirmed', 'St. Charles'),
--     ('Jane Doe', 'jane@example.com', '630-555-1002', '456 Oak Ave, Geneva, IL 60134', 2500, 4, 3, 'weekly', 220, 270, 'confirmed', 'Geneva'),
--     ('Bob Wilson', 'bob@example.com', '630-555-1003', '789 Elm Rd, Batavia, IL 60510', 1800, 3, 2, 'monthly', 160, 200, 'lead', 'Batavia');
