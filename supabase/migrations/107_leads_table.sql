-- Leads table for capturing prospect information from landing pages
-- Used for validating market demand before full business launch

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT,
  
  -- Quote details (stored as JSON)
  quote_details JSONB DEFAULT '{}'::jsonb,
  
  -- Notes from prospect
  notes TEXT,
  
  -- Lead source tracking
  source TEXT DEFAULT 'landing_page',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Lead status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  
  -- Follow-up tracking
  contacted_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for landing page form submissions)
DROP POLICY IF EXISTS "Allow public lead submission" ON leads;
CREATE POLICY "Allow public lead submission" ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read/update/delete leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
CREATE POLICY "Authenticated users can view leads" ON leads
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete leads" ON leads;
CREATE POLICY "Authenticated users can delete leads" ON leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
