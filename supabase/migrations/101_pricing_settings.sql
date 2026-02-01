-- ============================================
-- Pricing Settings Table
-- ============================================
-- Stores all configurable pricing and duration parameters
-- These can be managed through the admin portal

CREATE TABLE IF NOT EXISTS pricing_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('pricing', 'duration', 'discounts', 'fees', 'business')),
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER set_pricing_settings_updated_at
    BEFORE UPDATE ON pricing_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing settings (values must be valid JSON)
INSERT INTO pricing_settings (key, value, label, description, category, sort_order) VALUES
    -- Pricing settings
    ('base_rate_per_500_sqft', '40'::jsonb, 'Base Rate per 500 sqft', 'Base cleaning rate for every 500 square feet', 'pricing', 1),
    ('min_first_clean_price', '150'::jsonb, 'Minimum First Clean Price', 'Minimum price for initial deep cleaning', 'pricing', 2),
    ('min_recurring_price', '120'::jsonb, 'Minimum Recurring Price', 'Minimum price for recurring cleanings', 'pricing', 3),
    ('first_clean_multiplier', '1.25'::jsonb, 'First Clean Multiplier', 'Price multiplier for first/deep clean (1.25 = 25% more)', 'pricing', 4),
    ('extra_bathroom_price', '15'::jsonb, 'Extra Bathroom Price', 'Additional price per bathroom over 2', 'pricing', 5),
    ('extra_bedroom_price', '10'::jsonb, 'Extra Bedroom Price', 'Additional price per bedroom over 3', 'pricing', 6),
    
    -- Duration settings
    ('base_minutes_per_500_sqft', '30'::jsonb, 'Base Minutes per 500 sqft', 'Base cleaning time for every 500 square feet', 'duration', 1),
    ('extra_bathroom_minutes', '15'::jsonb, 'Extra Bathroom Minutes', 'Additional minutes per bathroom over 2', 'duration', 2),
    ('extra_bedroom_minutes', '10'::jsonb, 'Extra Bedroom Minutes', 'Additional minutes per bedroom over 3', 'duration', 3),
    ('first_clean_duration_multiplier', '1.5'::jsonb, 'First Clean Duration Multiplier', 'Duration multiplier for first clean (1.5 = 50% longer)', 'duration', 4),
    ('included_bathrooms', '2'::jsonb, 'Included Bathrooms', 'Number of bathrooms included in base price', 'duration', 5),
    ('included_bedrooms', '3'::jsonb, 'Included Bedrooms', 'Number of bedrooms included in base price', 'duration', 6),
    
    -- Discount settings
    ('weekly_discount', '0.35'::jsonb, 'Weekly Discount', 'Discount percentage for weekly service (0.35 = 35%)', 'discounts', 1),
    ('biweekly_discount', '0.20'::jsonb, 'Bi-Weekly Discount', 'Discount percentage for bi-weekly service (0.20 = 20%)', 'discounts', 2),
    ('monthly_discount', '0.10'::jsonb, 'Monthly Discount', 'Discount percentage for monthly service (0.10 = 10%)', 'discounts', 3),
    ('referral_bonus', '25'::jsonb, 'Referral Bonus', 'Credit given to referrer when their referral books ($)', 'discounts', 4),
    ('referred_discount', '25'::jsonb, 'Referred Customer Discount', 'Discount for new customers using a referral code ($)', 'discounts', 5),
    
    -- Fee settings
    ('deposit_percentage', '0.20'::jsonb, 'Deposit Percentage', 'Percentage of first clean due as deposit (0.20 = 20%)', 'fees', 1),
    ('cancellation_24_48h', '25'::jsonb, 'Cancellation Fee (24-48h)', 'Fee for cancellations 24-48 hours before appointment ($)', 'fees', 2),
    ('cancellation_under_24h', '"full"'::jsonb, 'Cancellation Fee (Under 24h)', 'Fee for cancellations under 24 hours (full = full charge)', 'fees', 3),
    
    -- Business settings
    ('booking_lead_days', '7'::jsonb, 'Booking Lead Days', 'Minimum days in advance customers can book', 'business', 1),
    ('booking_max_days', '60'::jsonb, 'Booking Max Days', 'Maximum days in advance customers can book', 'business', 2),
    ('max_jobs_per_cleaner_per_slot', '1'::jsonb, 'Max Jobs Per Cleaner Per Slot', 'How many jobs a cleaner can do per time slot', 'business', 3)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for pricing calculator)
CREATE POLICY "Allow public read pricing_settings"
    ON pricing_settings FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only owners can update
CREATE POLICY "Allow owner update pricing_settings"
    ON pricing_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Create index for key lookups
CREATE INDEX IF NOT EXISTS idx_pricing_settings_key ON pricing_settings(key);
CREATE INDEX IF NOT EXISTS idx_pricing_settings_category ON pricing_settings(category);
