-- =====================================================
-- SMS Consent Fields & Communications Log Table
-- =====================================================
-- Adds Twilio compliance fields and communications tracking

-- Add SMS consent fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_review_requested BOOLEAN DEFAULT false;

-- Add feedback fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_feedback TEXT,
ADD COLUMN IF NOT EXISTS google_review_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cleaner_completed_at TIMESTAMPTZ;

-- =====================================================
-- Communications Log Table
-- =====================================================
-- Tracks all SMS and email communications

CREATE TABLE IF NOT EXISTS communications_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Recipient info
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'cleaner')),
    recipient_id UUID,
    recipient_contact TEXT NOT NULL, -- email or phone
    
    -- Communication details
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    template TEXT, -- template name for tracking
    subject TEXT, -- for emails
    content TEXT, -- message content (truncated for emails)
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    external_id TEXT, -- Twilio SID or Resend ID
    error_message TEXT,
    
    -- Related entity (optional)
    related_entity_type TEXT, -- 'job', 'subscription', etc
    related_entity_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comms_log_recipient ON communications_log(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_comms_log_channel ON communications_log(channel);
CREATE INDEX IF NOT EXISTS idx_comms_log_status ON communications_log(status);
CREATE INDEX IF NOT EXISTS idx_comms_log_template ON communications_log(template);
CREATE INDEX IF NOT EXISTS idx_comms_log_created ON communications_log(created_at DESC);

-- =====================================================
-- Customer Notes Table (for low rating follow-ups etc)
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'complaint', 'followup', 'preference')),
    content TEXT NOT NULL,
    created_by UUID, -- admin user who created it (null for system)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_type ON customer_notes(note_type);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE communications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Communications log - only authenticated users
CREATE POLICY "Authenticated can read communications" ON communications_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert communications" ON communications_log
    FOR INSERT WITH CHECK (true);

-- Customer notes - authenticated users
CREATE POLICY "Authenticated can manage customer notes" ON customer_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow Edge Functions (service role) to insert notes
CREATE POLICY "Service role can insert customer notes" ON customer_notes
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- Update timestamp trigger for communications_log
-- =====================================================

CREATE OR REPLACE FUNCTION update_comms_sent_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
        NEW.sent_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comms_sent_at ON communications_log;
CREATE TRIGGER trigger_comms_sent_at
    BEFORE UPDATE ON communications_log
    FOR EACH ROW
    EXECUTE FUNCTION update_comms_sent_at();
