-- =====================================================
-- Inventory Management System
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'supplies' CHECK (category IN ('supplies', 'equipment', 'chemicals', 'other')),
    sku TEXT,
    
    -- Quantities
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5, -- Reorder alert threshold
    unit TEXT DEFAULT 'units', -- units, bottles, boxes, etc.
    
    -- Pricing
    cost_per_unit DECIMAL(10, 2),
    supplier TEXT,
    supplier_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_restock_at TIMESTAMPTZ
);

-- Inventory transactions log
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('restock', 'used', 'adjustment', 'damaged')),
    quantity INTEGER NOT NULL, -- positive for restock, negative for used
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- email of user who made the change
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity, min_quantity) WHERE quantity <= min_quantity;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_id, created_at DESC);

-- Trigger to update status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.min_quantity THEN
        NEW.status = 'low_stock';
    ELSE
        NEW.status = 'in_stock';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_status_trigger ON inventory;
CREATE TRIGGER update_inventory_status_trigger
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_status();

-- RLS Policies
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage inventory" ON inventory
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inventory transactions" ON inventory_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Sample inventory items
INSERT INTO inventory (name, category, quantity, min_quantity, unit, cost_per_unit, supplier) VALUES
    ('Branch Basics Concentrate', 'chemicals', 12, 5, 'bottles', 49.00, 'Branch Basics'),
    ('Microfiber Cloths (Pack of 24)', 'supplies', 4, 2, 'packs', 24.99, 'Amazon'),
    ('Spray Bottles (32oz)', 'supplies', 15, 5, 'units', 3.50, 'Amazon'),
    ('Scrub Brushes', 'supplies', 8, 3, 'units', 5.99, 'Amazon'),
    ('Mop Heads', 'supplies', 6, 3, 'units', 12.99, 'Amazon'),
    ('Vacuum Bags', 'supplies', 20, 10, 'bags', 2.50, 'Amazon'),
    ('Rubber Gloves (Box of 100)', 'supplies', 3, 2, 'boxes', 18.99, 'Amazon'),
    ('Glass Cleaner Concentrate', 'chemicals', 8, 4, 'bottles', 15.99, 'Branch Basics')
ON CONFLICT DO NOTHING;
