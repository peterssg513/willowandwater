-- ============================================
-- Cost-Based Pricing Settings
-- ============================================
-- Stores all cost parameters for profit-based pricing
-- These can be managed through the admin portal

-- Add new cost-related settings to pricing_settings table
INSERT INTO pricing_settings (key, value, label, description, category, sort_order) VALUES
    -- Labor costs
    ('base_hourly_rate', '26'::jsonb, 'Base Hourly Rate', 'Base pay per hour for cleaners ($)', 'pricing', 10),
    ('payroll_burden_percent', '0.154'::jsonb, 'Payroll Burden', 'IL taxes + workers comp (15.4%)', 'pricing', 11),
    ('loaded_hourly_rate', '30'::jsonb, 'Loaded Hourly Rate', 'Effective cost per hour including burden ($)', 'pricing', 12),
    ('solo_cleaner_max_sqft', '1999'::jsonb, 'Solo Cleaner Max Sqft', 'Max sqft for single cleaner (2+ above this)', 'pricing', 13),
    
    -- Weekly costs per cleaner
    ('weekly_supplies_cost', '24.50'::jsonb, 'Weekly Supplies Cost', 'Branch Basics per cleaner per week ($)', 'pricing', 20),
    ('weekly_gas_cost', '50'::jsonb, 'Weekly Gas Cost', 'Gas allowance per cleaner per week ($)', 'pricing', 21),
    ('expected_jobs_per_week', '9'::jsonb, 'Expected Jobs Per Week', 'Target jobs per cleaner per week', 'pricing', 22),
    
    -- Equipment amortization
    ('annual_equipment_cost', '750'::jsonb, 'Annual Equipment Cost', 'Yearly equipment cost per cleaner ($)', 'pricing', 30),
    ('expected_jobs_per_year', '450'::jsonb, 'Expected Jobs Per Year', 'Expected jobs per cleaner per year', 'pricing', 31),
    
    -- Monthly overhead
    ('monthly_marketing', '250'::jsonb, 'Monthly Marketing', 'Marketing budget per month ($)', 'fees', 10),
    ('monthly_admin', '250'::jsonb, 'Monthly Admin', 'Admin costs per month ($)', 'fees', 11),
    ('monthly_phone', '20'::jsonb, 'Monthly Phone', 'Phone costs per month ($)', 'fees', 12),
    ('monthly_website', '5'::jsonb, 'Monthly Website', 'Website costs per month ($)', 'fees', 13),
    ('monthly_insurance', '75'::jsonb, 'Monthly Insurance', 'Insurance costs per month ($)', 'fees', 14),
    ('monthly_overhead_total', '600'::jsonb, 'Monthly Overhead Total', 'Total monthly fixed costs ($)', 'fees', 15),
    
    -- Profit settings
    ('target_margin_percent', '0.45'::jsonb, 'Target Margin', 'Target profit margin (0.45 = 45%)', 'pricing', 40),
    ('minimum_price', '115'::jsonb, 'Minimum Price', 'Never quote below this amount ($)', 'pricing', 41),
    ('first_clean_hours_multiplier', '1.5'::jsonb, 'First Clean Multiplier', 'Hours multiplier for first clean (1.5 = 50% longer)', 'pricing', 42)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Update existing frequency discounts (reduced to maintain profitability)
UPDATE pricing_settings SET value = '0.15'::jsonb, description = 'Discount for weekly service (0.15 = 15%)', updated_at = NOW() WHERE key = 'weekly_discount';
UPDATE pricing_settings SET value = '0.10'::jsonb, description = 'Discount for bi-weekly service (0.10 = 10%)', updated_at = NOW() WHERE key = 'biweekly_discount';
UPDATE pricing_settings SET value = '0.05'::jsonb, description = 'Discount for monthly service (0.05 = 5%)', updated_at = NOW() WHERE key = 'monthly_discount';

-- Update minimum prices
UPDATE pricing_settings SET value = '115'::jsonb, updated_at = NOW() WHERE key = 'min_first_clean_price';
UPDATE pricing_settings SET value = '115'::jsonb, updated_at = NOW() WHERE key = 'min_recurring_price';

-- ============================================
-- Job Volume Tracking (for overhead allocation)
-- ============================================

CREATE TABLE IF NOT EXISTS job_volume_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year TEXT NOT NULL UNIQUE, -- Format: '2026-02'
    total_jobs INTEGER DEFAULT 0,
    total_cleaners INTEGER DEFAULT 1,
    jobs_per_cleaner DECIMAL(10, 2) DEFAULT 0,
    overhead_per_job DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_job_volume_month ON job_volume_stats(month_year DESC);

-- RLS for job volume stats
ALTER TABLE job_volume_stats ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then recreate
DROP POLICY IF EXISTS "Authenticated users can read job_volume_stats" ON job_volume_stats;
DROP POLICY IF EXISTS "Authenticated users can manage job_volume_stats" ON job_volume_stats;

CREATE POLICY "Authenticated users can read job_volume_stats" ON job_volume_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage job_volume_stats" ON job_volume_stats
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to update job volume stats
CREATE OR REPLACE FUNCTION update_job_volume_stats()
RETURNS void AS $$
DECLARE
    current_month TEXT;
    job_count INTEGER;
    cleaner_count INTEGER;
    monthly_overhead DECIMAL;
BEGIN
    current_month := to_char(NOW(), 'YYYY-MM');
    
    -- Count completed jobs this month
    SELECT COUNT(*) INTO job_count
    FROM bookings
    WHERE status IN ('completed', 'confirmed')
    AND to_char(scheduled_date, 'YYYY-MM') = current_month;
    
    -- Count active cleaners
    SELECT COUNT(*) INTO cleaner_count
    FROM cleaners
    WHERE status = 'active';
    
    -- Get monthly overhead from settings
    SELECT COALESCE((value)::decimal, 600) INTO monthly_overhead
    FROM pricing_settings
    WHERE key = 'monthly_overhead_total';
    
    -- Upsert the stats
    INSERT INTO job_volume_stats (month_year, total_jobs, total_cleaners, jobs_per_cleaner, overhead_per_job)
    VALUES (
        current_month,
        GREATEST(job_count, 1),
        GREATEST(cleaner_count, 1),
        GREATEST(job_count, 1)::decimal / GREATEST(cleaner_count, 1),
        monthly_overhead / GREATEST(job_count, 1)
    )
    ON CONFLICT (month_year) DO UPDATE SET
        total_jobs = GREATEST(EXCLUDED.total_jobs, 1),
        total_cleaners = GREATEST(EXCLUDED.total_cleaners, 1),
        jobs_per_cleaner = GREATEST(EXCLUDED.total_jobs, 1)::decimal / GREATEST(EXCLUDED.total_cleaners, 1),
        overhead_per_job = monthly_overhead / GREATEST(EXCLUDED.total_jobs, 1),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Initial stats entry
SELECT update_job_volume_stats();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE job_volume_stats IS 'Tracks monthly job volume for dynamic overhead allocation';
COMMENT ON COLUMN job_volume_stats.overhead_per_job IS 'Calculated: monthly_overhead / total_jobs';
