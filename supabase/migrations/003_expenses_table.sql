-- =====================================================
-- Expenses Tracking Table
-- =====================================================
-- Track business expenses for profit/loss reporting

CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'other' 
        CHECK (category IN ('supplies', 'equipment', 'vehicle', 'labor', 'insurance', 'marketing', 'software', 'other')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor TEXT,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_date 
ON expenses(date DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_expenses_category 
ON expenses(category, date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read expenses
CREATE POLICY "Authenticated users can manage expenses" ON expenses
    FOR ALL
    USING (auth.role() = 'authenticated');

-- =====================================================
-- Activity Log Table (Optional)
-- =====================================================
-- Uncomment if you want to store activity logs in the database

-- CREATE TABLE IF NOT EXISTS activity_logs (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     activity_type TEXT NOT NULL,
--     title TEXT NOT NULL,
--     description TEXT,
--     related_id UUID,
--     related_type TEXT,
--     amount DECIMAL(10, 2),
--     user_id UUID REFERENCES auth.users(id),
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
-- ON activity_logs(created_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_activity_logs_type 
-- ON activity_logs(activity_type, created_at DESC);
