-- ============================================
-- Organic Cleaning Add-on Setting
-- ============================================

INSERT INTO pricing_settings (key, value, label, description, category, sort_order) VALUES
    ('organic_cleaning_addon', '20'::jsonb, 'Organic Cleaning Add-on', 'Price for organic/non-toxic cleaning upgrade ($)', 'pricing', 50)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = NOW();
