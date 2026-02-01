-- Scheduling settings for booking window control
-- Allows admin to configure minimum booking lead time and launch date

-- First, add 'scheduling' to the allowed categories
ALTER TABLE pricing_settings DROP CONSTRAINT IF EXISTS pricing_settings_category_check;
ALTER TABLE pricing_settings ADD CONSTRAINT pricing_settings_category_check 
  CHECK (category IN ('pricing', 'duration', 'discounts', 'fees', 'business', 'scheduling', 'labor', 'supplies', 'equipment', 'overhead'));

-- Minimum days ahead for booking (default 14 = 2 weeks)
INSERT INTO pricing_settings (key, value, label, description, category, sort_order)
VALUES (
  'min_booking_days_ahead',
  '14',
  'Minimum Days Ahead',
  'Minimum days in advance customers must book (e.g., 14 = 2 weeks ahead)',
  'scheduling',
  1
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Maximum days ahead for booking (default 60 = 2 months)
INSERT INTO pricing_settings (key, value, label, description, category, sort_order)
VALUES (
  'max_booking_days_ahead',
  '60',
  'Maximum Days Ahead',
  'Maximum days in advance customers can book (e.g., 60 = 2 months ahead)',
  'scheduling',
  2
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Earliest booking date (launch date) - no bookings before this date
-- Format: YYYY-MM-DD, empty string means no restriction
INSERT INTO pricing_settings (key, value, label, description, category, sort_order)
VALUES (
  'earliest_booking_date',
  '"2026-03-15"',
  'Launch Date',
  'Earliest date customers can book (YYYY-MM-DD format). Leave empty for no restriction.',
  'scheduling',
  3
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Booking enabled toggle
INSERT INTO pricing_settings (key, value, label, description, category, sort_order)
VALUES (
  'booking_enabled',
  'true',
  'Booking Enabled',
  'Whether customers can book online (true/false)',
  'scheduling',
  4
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;
