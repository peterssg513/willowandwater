-- =====================================================
-- Page Views Analytics Table
-- =====================================================
-- This table tracks website visitors for the admin analytics dashboard.
-- You can either use this custom tracking or integrate Google Analytics.

CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Page information
    page_path TEXT NOT NULL,
    page_title TEXT,
    -- Visitor identification
    session_id TEXT,
    ip_address INET,
    -- User agent parsing
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser TEXT,
    os TEXT,
    -- Traffic source
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    -- Location (optional - requires IP geolocation)
    country TEXT,
    city TEXT,
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at 
ON page_views(created_at DESC);

-- Index for page analytics
CREATE INDEX IF NOT EXISTS idx_page_views_page_path 
ON page_views(page_path, created_at DESC);

-- Index for session tracking
CREATE INDEX IF NOT EXISTS idx_page_views_session 
ON page_views(session_id, created_at DESC);

-- =====================================================
-- Admin Users Setup
-- =====================================================
-- To create an admin user, run this in the Supabase SQL Editor:
--
-- 1. First, sign up using the Admin Login page at /admin/login
--    (This creates the user in Supabase Auth)
--
-- OR manually create a user:
--
-- SELECT supabase.auth.create_user(
--   '{"email": "admin@willowandwater.com", "password": "your-secure-password", "email_confirm": true}'::jsonb
-- );

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert page views (for tracking)
CREATE POLICY "Allow anonymous page view inserts" ON page_views
    FOR INSERT 
    WITH CHECK (true);

-- Only authenticated users can read page views
CREATE POLICY "Authenticated users can read page views" ON page_views
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- Optional: Cleanup old page views (run periodically)
-- =====================================================
-- DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days';
