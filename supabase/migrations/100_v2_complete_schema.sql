-- =====================================================
-- Willow & Water v2.0 - Complete Database Schema
-- =====================================================
-- This migration creates the complete new schema for the
-- cleaning business operating system.
-- 
-- Run this AFTER backing up any existing data you want to keep.
-- =====================================================

-- =====================================================
-- DROP OLD TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS job_addons CASCADE;
DROP TABLE IF EXISTS addon_services CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customer_credits CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS communications_log CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS cleaner_time_off CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
-- Keep page_views for analytics, keep messages if needed
-- DROP TABLE IF EXISTS bookings CASCADE; -- Old table
-- DROP TABLE IF EXISTS expenses CASCADE;

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Contact Information
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- Address
    address TEXT,
    city TEXT,
    zip TEXT,
    service_area TEXT,
    
    -- Property Details
    sqft INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    
    -- Access Information
    access_type TEXT CHECK (access_type IN ('lockbox', 'garage_code', 'hidden_key', 'customer_home', 'other')),
    access_instructions TEXT,
    
    -- Status
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'paused', 'churned')),
    
    -- Stripe
    stripe_customer_id TEXT,
    
    -- Referral System
    referral_code TEXT UNIQUE,
    referred_by_customer_id UUID REFERENCES customers(id),
    credit_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Reviews
    google_review_requested BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_service_area ON customers(service_area);
CREATE INDEX idx_customers_referral_code ON customers(referral_code);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Frequency
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'onetime')),
    preferred_day TEXT CHECK (preferred_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
    preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon')),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- CLEANERS TABLE
-- =====================================================
CREATE TABLE cleaners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Contact
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    
    -- Service Areas (array of city names)
    service_areas TEXT[] DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    hire_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaners_status ON cleaners(status);

-- =====================================================
-- CLEANER TIME OFF TABLE
-- =====================================================
CREATE TABLE cleaner_time_off (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    
    created_by UUID, -- Admin user ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaner_time_off_cleaner ON cleaner_time_off(cleaner_id);
CREATE INDEX idx_cleaner_time_off_dates ON cleaner_time_off(start_date, end_date);

-- =====================================================
-- JOBS TABLE
-- =====================================================
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    cleaner_id UUID REFERENCES cleaners(id),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL CHECK (scheduled_time IN ('morning', 'afternoon')),
    duration_minutes INTEGER NOT NULL,
    
    -- Job Type
    job_type TEXT NOT NULL CHECK (job_type IN ('first_clean', 'recurring', 'one_time')),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    addons_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    
    -- Deposit Payment (20%)
    deposit_amount DECIMAL(10,2),
    deposit_paid_at TIMESTAMPTZ,
    deposit_payment_intent_id TEXT,
    
    -- Remaining Payment (80%)
    remaining_amount DECIMAL(10,2),
    remaining_paid_at TIMESTAMPTZ,
    remaining_payment_intent_id TEXT,
    
    -- Tip
    tip_amount DECIMAL(10,2) DEFAULT 0,
    tip_payment_intent_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending_payment' CHECK (status IN (
        'pending_payment', 'scheduled', 'confirmed', 'in_progress', 
        'completed', 'cancelled', 'no_show'
    )),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'deposit_paid', 'paid', 'failed', 'refunded'
    )),
    
    -- Cleaner Tracking
    cleaner_started_at TIMESTAMPTZ,
    cleaner_completed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    
    -- Feedback
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    google_review_sent BOOLEAN DEFAULT FALSE,
    
    -- Cancellation
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Instructions
    special_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_cleaner ON jobs(cleaner_id);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_payment_status ON jobs(payment_status);

-- =====================================================
-- ADDON SERVICES TABLE
-- =====================================================
CREATE TABLE addon_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default add-ons
INSERT INTO addon_services (name, description, price, duration_minutes, display_order) VALUES
    ('Inside Fridge Cleaning', 'Deep clean interior of refrigerator', 35.00, 30, 1),
    ('Inside Oven Cleaning', 'Deep clean interior of oven', 25.00, 20, 2),
    ('Interior Windows (per floor)', 'Clean all interior windows on one floor', 50.00, 45, 3),
    ('Laundry - Wash/Dry/Fold', 'One load of laundry washed, dried, and folded', 30.00, 60, 4),
    ('Organize Pantry', 'Organize and clean pantry shelves', 40.00, 30, 5),
    ('Organize Closet', 'Organize and clean one closet', 40.00, 30, 6),
    ('Baseboards Deep Clean', 'Detailed cleaning of all baseboards', 30.00, 30, 7),
    ('Garage Sweep', 'Sweep and tidy garage floor', 25.00, 20, 8);

-- =====================================================
-- JOB ADDONS TABLE
-- =====================================================
CREATE TABLE job_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    addon_service_id UUID NOT NULL REFERENCES addon_services(id),
    
    -- Store values at time of booking
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_addons_job ON job_addons(job_id);

-- =====================================================
-- ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    entity_type TEXT NOT NULL, -- customer, job, cleaner, subscription, etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- created, updated, status_changed, assigned, etc.
    
    actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'admin', 'system', 'cleaner')),
    actor_id UUID,
    
    details JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- =====================================================
-- CUSTOMER NOTES TABLE
-- =====================================================
CREATE TABLE customer_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    note_type TEXT DEFAULT 'internal' CHECK (note_type IN ('call', 'email', 'internal', 'complaint', 'compliment')),
    content TEXT NOT NULL,
    
    created_by UUID, -- Admin user ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);

-- =====================================================
-- COMMUNICATIONS LOG TABLE
-- =====================================================
CREATE TABLE communications_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Recipient
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'cleaner')),
    recipient_id UUID NOT NULL,
    recipient_contact TEXT NOT NULL, -- Email or phone number
    
    -- Message Details
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
    template TEXT NOT NULL, -- Template name
    subject TEXT, -- For emails
    content TEXT NOT NULL, -- Actual message content
    
    -- Status
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    external_id TEXT, -- Twilio/Resend message ID
    error_message TEXT, -- If failed
    
    -- Related Entity
    related_entity_type TEXT, -- job, customer, etc.
    related_entity_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communications_log_recipient ON communications_log(recipient_type, recipient_id);
CREATE INDEX idx_communications_log_created ON communications_log(created_at DESC);
CREATE INDEX idx_communications_log_template ON communications_log(template);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'remaining', 'recurring', 'tip', 'cancellation_fee', 'refund')),
    
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_job ON payments(job_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- =====================================================
-- CUSTOMER CREDITS TABLE
-- =====================================================
CREATE TABLE customer_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL, -- Referral bonus, Service recovery, Loyalty reward, etc.
    
    applied_to_job_id UUID REFERENCES jobs(id),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_credits_customer ON customer_credits(customer_id);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    referrer_customer_id UUID NOT NULL REFERENCES customers(id),
    referred_customer_id UUID NOT NULL REFERENCES customers(id),
    referral_code_used TEXT NOT NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'credited')),
    credit_amount DECIMAL(10,2) DEFAULT 25.00,
    credited_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_customer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_customer_id);

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    name TEXT NOT NULL,
    category TEXT DEFAULT 'supplies' CHECK (category IN ('supplies', 'equipment', 'consumables', 'other')),
    
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'units', -- bottles, packs, rolls, etc.
    
    reorder_threshold INTEGER DEFAULT 5,
    reorder_quantity INTEGER DEFAULT 10,
    purchase_url TEXT, -- Link to buy
    
    cost_per_unit DECIMAL(10,2),
    last_restock_date DATE,
    
    status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE, -- Supabase auth user ID
    
    role TEXT DEFAULT 'manager' CHECK (role IN ('owner', 'manager')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INVENTORY STATUS TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.reorder_threshold THEN
        NEW.status = 'low_stock';
    ELSE
        NEW.status = 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_status_trigger
    BEFORE INSERT OR UPDATE OF quantity ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_status();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- CUSTOMERS: Anonymous can insert (booking flow), authenticated can read/update
CREATE POLICY "Allow anonymous customer inserts" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- SUBSCRIPTIONS: Anonymous can insert, authenticated can read/update
CREATE POLICY "Allow anonymous subscription inserts" ON subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read subscriptions" ON subscriptions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update subscriptions" ON subscriptions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- CLEANERS: Only authenticated
CREATE POLICY "Authenticated can manage cleaners" ON cleaners
    FOR ALL USING (auth.role() = 'authenticated');

-- CLEANER TIME OFF: Only authenticated
CREATE POLICY "Authenticated can manage cleaner_time_off" ON cleaner_time_off
    FOR ALL USING (auth.role() = 'authenticated');

-- JOBS: Anonymous can insert, authenticated can all
CREATE POLICY "Allow anonymous job inserts" ON jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read jobs" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update jobs" ON jobs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete jobs" ON jobs
    FOR DELETE USING (auth.role() = 'authenticated');

-- ADDON SERVICES: Anyone can read, authenticated can modify
CREATE POLICY "Anyone can read addon_services" ON addon_services
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage addon_services" ON addon_services
    FOR ALL USING (auth.role() = 'authenticated');

-- JOB ADDONS: Anonymous can insert, authenticated can read
CREATE POLICY "Allow anonymous job_addons inserts" ON job_addons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read job_addons" ON job_addons
    FOR SELECT USING (auth.role() = 'authenticated');

-- ACTIVITY LOG: Anonymous can insert (for customer actions), authenticated can read
CREATE POLICY "Allow anonymous activity_log inserts" ON activity_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read activity_log" ON activity_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- CUSTOMER NOTES: Only authenticated
CREATE POLICY "Authenticated can manage customer_notes" ON customer_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- COMMUNICATIONS LOG: Anonymous can insert (for edge functions), authenticated can read
CREATE POLICY "Allow anonymous communications_log inserts" ON communications_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read communications_log" ON communications_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- PAYMENTS: Anonymous can insert (webhook), authenticated can read
CREATE POLICY "Allow anonymous payments inserts" ON payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read payments" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update payments" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- CUSTOMER CREDITS: Anonymous can insert, authenticated can read/update
CREATE POLICY "Allow anonymous customer_credits inserts" ON customer_credits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read customer_credits" ON customer_credits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update customer_credits" ON customer_credits
    FOR UPDATE USING (auth.role() = 'authenticated');

-- REFERRALS: Anonymous can insert, authenticated can read/update
CREATE POLICY "Allow anonymous referrals inserts" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read referrals" ON referrals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update referrals" ON referrals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- INVENTORY: Only authenticated
CREATE POLICY "Authenticated can manage inventory" ON inventory
    FOR ALL USING (auth.role() = 'authenticated');

-- ADMIN USERS: Only authenticated
CREATE POLICY "Authenticated can manage admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique referral code for customer
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: first 4 letters of name (uppercase) + random 4 digits
        new_code := UPPER(LEFT(REGEXP_REPLACE(NEW.name, '[^a-zA-Z]', '', 'g'), 4)) || 
                    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM customers WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_customer_referral_code
    BEFORE INSERT ON customers
    FOR EACH ROW
    WHEN (NEW.referral_code IS NULL)
    EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Customers with subscription info
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.*,
    s.frequency,
    s.preferred_day,
    s.preferred_time,
    s.base_price as subscription_price,
    s.status as subscription_status,
    (SELECT COUNT(*) FROM jobs j WHERE j.customer_id = c.id AND j.status = 'completed') as completed_jobs,
    (SELECT AVG(customer_rating) FROM jobs j WHERE j.customer_id = c.id AND customer_rating IS NOT NULL) as avg_rating
FROM customers c
LEFT JOIN subscriptions s ON s.customer_id = c.id AND s.status = 'active';

-- View: Jobs with customer and cleaner info
CREATE OR REPLACE VIEW job_details AS
SELECT 
    j.*,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    c.address as customer_address,
    c.city as customer_city,
    c.access_type,
    c.access_instructions,
    cl.name as cleaner_name,
    cl.phone as cleaner_phone
FROM jobs j
JOIN customers c ON c.id = j.customer_id
LEFT JOIN cleaners cl ON cl.id = j.cleaner_id;

-- View: Daily schedule
CREATE OR REPLACE VIEW daily_schedule AS
SELECT 
    j.scheduled_date,
    j.scheduled_time,
    j.id as job_id,
    j.status,
    j.duration_minutes,
    c.name as customer_name,
    c.address,
    c.city,
    c.service_area,
    cl.id as cleaner_id,
    cl.name as cleaner_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
LEFT JOIN cleaners cl ON cl.id = j.cleaner_id
WHERE j.status NOT IN ('cancelled', 'no_show')
ORDER BY j.scheduled_date, j.scheduled_time;

-- =====================================================
-- DONE!
-- =====================================================
