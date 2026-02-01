/**
 * Pricing Settings Utility
 * 
 * Fetches and caches pricing settings from the database
 * Falls back to hardcoded defaults if database is unavailable
 */

import { supabase } from '../lib/supabaseClient';

// Default settings (used as fallback)
const DEFAULT_SETTINGS = {
  // Pricing
  base_rate_per_500_sqft: 40,
  min_first_clean_price: 150,
  min_recurring_price: 120,
  first_clean_multiplier: 1.25,
  extra_bathroom_price: 15,
  extra_bedroom_price: 10,
  
  // Duration
  base_minutes_per_500_sqft: 30,
  extra_bathroom_minutes: 15,
  extra_bedroom_minutes: 10,
  first_clean_duration_multiplier: 1.5,
  included_bathrooms: 2,
  included_bedrooms: 3,
  
  // Discounts
  weekly_discount: 0.35,
  biweekly_discount: 0.20,
  monthly_discount: 0.10,
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
