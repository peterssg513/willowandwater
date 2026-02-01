/**
 * Pricing Settings Utility
 * 
 * Fetches and caches pricing settings from the database
 * Falls back to hardcoded defaults if database is unavailable
 * 
 * Updated for Profit-Based Pricing Model
 */

import { supabase } from '../lib/supabaseClient';

// Default settings (used as fallback) - Updated for profit-based pricing
const DEFAULT_SETTINGS = {
  // Labor costs
  base_hourly_rate: 26,
  payroll_burden_percent: 0.154,       // IL taxes + workers comp (15.4%)
  loaded_hourly_rate: 30,              // base × (1 + burden)
  solo_cleaner_max_sqft: 1999,         // 2 cleaners for homes >= 2000 sqft
  
  // Weekly costs per cleaner
  weekly_supplies_cost: 24.50,         // Branch Basics ($49/2 weeks)
  weekly_gas_cost: 50,
  expected_jobs_per_week: 9,
  
  // Equipment amortization
  annual_equipment_cost: 750,
  expected_jobs_per_year: 450,
  
  // Monthly overhead
  monthly_marketing: 250,
  monthly_admin: 250,
  monthly_phone: 20,
  monthly_website: 5,
  monthly_insurance: 75,
  monthly_overhead_total: 600,
  
  // Pricing targets
  target_margin_percent: 0.45,         // 45% target margin
  minimum_price: 115,                  // Never quote below this
  first_clean_hours_multiplier: 1.5,   // First clean takes 50% longer
  
  // Duration calculation
  base_minutes_per_500_sqft: 30,
  extra_bathroom_minutes: 15,
  extra_bedroom_minutes: 10,
  included_bathrooms: 2,
  included_bedrooms: 3,
  
  // Discounts (reduced to maintain profitability)
  weekly_discount: 0.15,               // 15% off (was 35%)
  biweekly_discount: 0.10,             // 10% off (was 20%)
  monthly_discount: 0.05,              // 5% off (was 10%)
  referral_bonus: 25,
  referred_discount: 25,
  
  // Fees
  deposit_percentage: 0.20,
  cancellation_24_48h: 25,
  cancellation_under_24h: 'full',
  
  // Business
  booking_lead_days: 7,
  booking_max_days: 60,
  max_jobs_per_cleaner_per_slot: 1,
  
  // Legacy settings (kept for backwards compatibility)
  base_rate_per_500_sqft: 40,
  min_first_clean_price: 115,
  min_recurring_price: 115,
  first_clean_multiplier: 1.5,
  extra_bathroom_price: 15,
  extra_bedroom_price: 10,
};

// Cache for settings
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all pricing settings from database
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<Object>} Settings object
 */
export async function fetchPricingSettings(forceRefresh = false) {
  // Check cache first
  if (!forceRefresh && settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('key, value');

    if (error) {
      console.warn('Failed to fetch pricing settings, using defaults:', error);
      return DEFAULT_SETTINGS;
    }

    // Convert array to object
    const settings = { ...DEFAULT_SETTINGS };
    data.forEach(row => {
      // Parse value - it's stored as JSONB
      let value = row.value;
      
      // Handle numeric strings
      if (typeof value === 'string' && !isNaN(value)) {
        value = parseFloat(value);
      }
      
      settings[row.key] = value;
    });

    // Update cache
    settingsCache = settings;
    cacheTimestamp = Date.now();

    return settings;
  } catch (err) {
    console.error('Error fetching pricing settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get a single setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  const settings = await fetchPricingSettings();
  return settings[key] ?? defaultValue ?? DEFAULT_SETTINGS[key];
}

/**
 * Update a pricing setting
 * @param {string} key - Setting key
 * @param {any} value - New value
 * @returns {Promise<boolean>} Success
 */
export async function updateSetting(key, value) {
  try {
    const { error } = await supabase
      .from('pricing_settings')
      .update({ value: value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;

    // Invalidate cache
    settingsCache = null;
    cacheTimestamp = null;

    return true;
  } catch (err) {
    console.error('Error updating setting:', err);
    return false;
  }
}

/**
 * Update multiple settings at once
 * @param {Object} updates - Object with key-value pairs
 * @returns {Promise<boolean>} Success
 */
export async function updateSettings(updates) {
  try {
    const promises = Object.entries(updates).map(([key, value]) => 
      supabase
        .from('pricing_settings')
        .update({ value: value, updated_at: new Date().toISOString() })
        .eq('key', key)
    );

    await Promise.all(promises);

    // Invalidate cache
    settingsCache = null;
    cacheTimestamp = null;

    return true;
  } catch (err) {
    console.error('Error updating settings:', err);
    return false;
  }
}

/**
 * Clear the settings cache
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

/**
 * Get default settings (for reference)
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

export default {
  fetchPricingSettings,
  getSetting,
  updateSetting,
  updateSettings,
  clearSettingsCache,
  getDefaultSettings,
  DEFAULT_SETTINGS,
};
