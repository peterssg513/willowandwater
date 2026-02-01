-- ============================================
-- Weekly Stipend Setting
-- ============================================

INSERT INTO pricing_settings (key, value, label, description, category, sort_order) VALUES
    ('weekly_stipend_per_cleaner', '0'::jsonb, 'Weekly Stipend', 'Weekly stipend per cleaner ($)', 'pricing', 23)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = NOW();
