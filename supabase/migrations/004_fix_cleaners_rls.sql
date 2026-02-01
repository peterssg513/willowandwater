-- =====================================================
-- FIX: Add missing RLS policies for cleaners table
-- =====================================================
-- Run this if you're getting permission errors on the cleaners table

-- Enable RLS on cleaners (if not already enabled)
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can read cleaners" ON cleaners;
DROP POLICY IF EXISTS "Authenticated users can insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Authenticated users can update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Authenticated users can delete cleaners" ON cleaners;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read cleaners" ON cleaners
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cleaners" ON cleaners
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cleaners" ON cleaners
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete cleaners" ON cleaners
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Verify policies were created
-- You can run this to check: SELECT * FROM pg_policies WHERE tablename = 'cleaners';
