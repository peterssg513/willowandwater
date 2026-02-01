-- =====================================================
-- Cleaning Checklists System
-- =====================================================
-- Checklist templates that cleaners can access via magic link

-- =====================================================
-- Checklist Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS cleaning_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    checklist_type TEXT DEFAULT 'standard' CHECK (checklist_type IN ('standard', 'deep', 'move_in_out', 'post_construction', 'custom')),
    is_default BOOLEAN DEFAULT false, -- Default checklist for this type
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Checklist Items Table
-- =====================================================
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID NOT NULL REFERENCES cleaning_checklists(id) ON DELETE CASCADE,
    room TEXT NOT NULL, -- Kitchen, Bathroom, Bedroom, Living Room, etc.
    task TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    notes TEXT, -- Extra instructions for the cleaner
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Job Checklist Progress Table
-- =====================================================
-- Tracks individual job checklist completion
CREATE TABLE IF NOT EXISTS job_checklist_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES cleaning_checklists(id),
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT, -- Cleaner can add notes about issues
    photo_url TEXT, -- Optional before/after photo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Magic Link Tokens Table
-- =====================================================
-- Secure tokens for cleaner checklist access
CREATE TABLE IF NOT EXISTS cleaner_magic_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE, -- Optional: link to specific job
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_room ON checklist_items(room);
CREATE INDEX IF NOT EXISTS idx_job_checklist_job ON job_checklist_progress(job_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_item ON job_checklist_progress(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON cleaner_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_cleaner ON cleaner_magic_links(cleaner_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE cleaning_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_magic_links ENABLE ROW LEVEL SECURITY;

-- Checklists - public read, admin write
CREATE POLICY "Anyone can read checklists" ON cleaning_checklists
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage checklists" ON cleaning_checklists
    FOR ALL USING (auth.role() = 'authenticated');

-- Checklist Items - public read, admin write
CREATE POLICY "Anyone can read checklist items" ON checklist_items
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage checklist items" ON checklist_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Job Progress - public insert/update (for magic links), authenticated full access
CREATE POLICY "Anyone can read job progress" ON job_checklist_progress
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert job progress" ON job_checklist_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update job progress" ON job_checklist_progress
    FOR UPDATE USING (true);

-- Magic Links - service role only for management
CREATE POLICY "Service role manages magic links" ON cleaner_magic_links
    FOR ALL USING (true);

-- =====================================================
-- Updated At Trigger
-- =====================================================
DROP TRIGGER IF EXISTS update_cleaning_checklists_updated_at ON cleaning_checklists;
CREATE TRIGGER update_cleaning_checklists_updated_at
    BEFORE UPDATE ON cleaning_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Default Checklist Data
-- =====================================================
INSERT INTO cleaning_checklists (name, description, checklist_type, is_default) VALUES
    ('Standard Clean', 'Our regular recurring cleaning checklist', 'standard', true),
    ('Deep Clean', 'Comprehensive deep cleaning checklist', 'deep', true),
    ('Move In/Out Clean', 'Thorough cleaning for move in or move out', 'move_in_out', true)
ON CONFLICT DO NOTHING;

-- Get the standard clean ID for inserting items
DO $$
DECLARE
    standard_id UUID;
    deep_id UUID;
BEGIN
    SELECT id INTO standard_id FROM cleaning_checklists WHERE checklist_type = 'standard' AND is_default = true LIMIT 1;
    SELECT id INTO deep_id FROM cleaning_checklists WHERE checklist_type = 'deep' AND is_default = true LIMIT 1;
    
    -- Standard Clean Items
    IF standard_id IS NOT NULL THEN
        INSERT INTO checklist_items (checklist_id, room, task, sort_order) VALUES
            -- Kitchen
            (standard_id, 'Kitchen', 'Wipe down all countertops', 1),
            (standard_id, 'Kitchen', 'Clean stovetop and control knobs', 2),
            (standard_id, 'Kitchen', 'Clean microwave inside and out', 3),
            (standard_id, 'Kitchen', 'Wipe exterior of refrigerator', 4),
            (standard_id, 'Kitchen', 'Clean sink and faucet', 5),
            (standard_id, 'Kitchen', 'Wipe cabinet fronts', 6),
            (standard_id, 'Kitchen', 'Empty trash and replace liner', 7),
            (standard_id, 'Kitchen', 'Sweep and mop floor', 8),
            -- Bathrooms
            (standard_id, 'Bathroom', 'Clean and sanitize toilet (inside and out)', 10),
            (standard_id, 'Bathroom', 'Clean shower/tub and glass doors', 11),
            (standard_id, 'Bathroom', 'Clean sink and countertop', 12),
            (standard_id, 'Bathroom', 'Clean mirrors', 13),
            (standard_id, 'Bathroom', 'Wipe cabinet fronts', 14),
            (standard_id, 'Bathroom', 'Empty trash and replace liner', 15),
            (standard_id, 'Bathroom', 'Sweep and mop floor', 16),
            -- Bedrooms
            (standard_id, 'Bedroom', 'Make beds (change linens if provided)', 20),
            (standard_id, 'Bedroom', 'Dust all surfaces and furniture', 21),
            (standard_id, 'Bedroom', 'Dust nightstands and lamps', 22),
            (standard_id, 'Bedroom', 'Vacuum floors and under bed edges', 23),
            -- Living Areas
            (standard_id, 'Living Room', 'Dust all surfaces and furniture', 30),
            (standard_id, 'Living Room', 'Dust TV and entertainment center', 31),
            (standard_id, 'Living Room', 'Fluff and arrange pillows', 32),
            (standard_id, 'Living Room', 'Vacuum floors and rugs', 33),
            -- General
            (standard_id, 'General', 'Dust ceiling fans and light fixtures', 40),
            (standard_id, 'General', 'Wipe light switches and door handles', 41),
            (standard_id, 'General', 'Dust baseboards', 42),
            (standard_id, 'General', 'Cobweb removal', 43)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Deep Clean Items (includes everything in standard plus more)
    IF deep_id IS NOT NULL THEN
        INSERT INTO checklist_items (checklist_id, room, task, sort_order) VALUES
            -- Kitchen
            (deep_id, 'Kitchen', 'Wipe down all countertops', 1),
            (deep_id, 'Kitchen', 'Clean stovetop and control knobs', 2),
            (deep_id, 'Kitchen', 'Deep clean oven interior', 3),
            (deep_id, 'Kitchen', 'Clean microwave inside and out', 4),
            (deep_id, 'Kitchen', 'Clean inside refrigerator', 5),
            (deep_id, 'Kitchen', 'Clean sink and faucet', 6),
            (deep_id, 'Kitchen', 'Clean inside cabinets', 7),
            (deep_id, 'Kitchen', 'Degrease range hood', 8),
            (deep_id, 'Kitchen', 'Clean dishwasher interior', 9),
            (deep_id, 'Kitchen', 'Empty trash and replace liner', 10),
            (deep_id, 'Kitchen', 'Sweep and mop floor (including under appliances)', 11),
            -- Bathrooms
            (deep_id, 'Bathroom', 'Deep clean and sanitize toilet', 20),
            (deep_id, 'Bathroom', 'Scrub shower/tub and grout', 21),
            (deep_id, 'Bathroom', 'Clean shower door tracks', 22),
            (deep_id, 'Bathroom', 'Clean sink and countertop', 23),
            (deep_id, 'Bathroom', 'Clean mirrors', 24),
            (deep_id, 'Bathroom', 'Clean inside cabinets and drawers', 25),
            (deep_id, 'Bathroom', 'Clean exhaust fan', 26),
            (deep_id, 'Bathroom', 'Empty trash and replace liner', 27),
            (deep_id, 'Bathroom', 'Sweep and mop floor', 28),
            -- Bedrooms
            (deep_id, 'Bedroom', 'Make beds (change linens if provided)', 30),
            (deep_id, 'Bedroom', 'Dust all surfaces including under items', 31),
            (deep_id, 'Bedroom', 'Clean inside closets', 32),
            (deep_id, 'Bedroom', 'Dust blinds/window treatments', 33),
            (deep_id, 'Bedroom', 'Clean window sills', 34),
            (deep_id, 'Bedroom', 'Vacuum floors, under bed, and closets', 35),
            -- Living Areas
            (deep_id, 'Living Room', 'Dust all surfaces and furniture', 40),
            (deep_id, 'Living Room', 'Clean under furniture cushions', 41),
            (deep_id, 'Living Room', 'Dust blinds/window treatments', 42),
            (deep_id, 'Living Room', 'Clean window sills', 43),
            (deep_id, 'Living Room', 'Dust books and shelves', 44),
            (deep_id, 'Living Room', 'Vacuum floors, rugs, and furniture', 45),
            -- General
            (deep_id, 'General', 'Clean all ceiling fans', 50),
            (deep_id, 'General', 'Clean light fixtures', 51),
            (deep_id, 'General', 'Wipe all light switches and door handles', 52),
            (deep_id, 'General', 'Deep clean baseboards', 53),
            (deep_id, 'General', 'Clean interior windows', 54),
            (deep_id, 'General', 'Clean door frames', 55),
            (deep_id, 'General', 'Cobweb removal (all corners)', 56)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Add checklist_id to jobs table if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS checklist_id UUID REFERENCES cleaning_checklists(id);
