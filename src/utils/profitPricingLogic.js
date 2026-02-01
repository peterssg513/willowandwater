/**
 * Profit-Based Pricing Logic for Willow & Water
 * 
 * Ensures every quote is profitable by calculating true costs:
 * - Labor (loaded hourly rate × hours × cleaners)
 * - Supplies & Gas (weekly allocation per cleaner)
 * - Equipment (amortized per job)
 * - Overhead (monthly fixed costs / job volume)
 * 
 * Price = Total Cost / (1 - Target Margin)
 * 
 * Settings are loaded from database and cached for performance.
 */

import { supabase } from '../lib/supabaseClient';

// ============================================
// DEFAULT COST SETTINGS (fallback if DB unavailable)
// ============================================

const DEFAULT_COST_SETTINGS = {
  // Labor
  base_hourly_rate: 26.00,
  payroll_burden_percent: 0.154,
  loaded_hourly_rate: 30.00,
  solo_cleaner_max_sqft: 1999,
  
  // Weekly costs per cleaner
  weekly_supplies_cost: 24.50,
  weekly_gas_cost: 50.00,
  weekly_stipend_per_cleaner: 0,
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
  
  // Pricing
  target_margin_percent: 0.45,
  minimum_price: 115,
  first_clean_hours_multiplier: 1.5,
  organic_cleaning_addon: 20,
  
  // Duration calculation
  base_minutes_per_500_sqft: 30,
  extra_bathroom_minutes: 15,
  extra_bedroom_minutes: 10,
  included_bathrooms: 2,
  included_bedrooms: 3,
  
  // Frequency discounts
  weekly_discount: 0.15,
  biweekly_discount: 0.10,
  monthly_discount: 0.05,
};

// ============================================
// SETTINGS CACHE
// ============================================

let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache (short for admin responsiveness)

/**
 * Fetch cost settings from database
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<Object>} Settings object
 */
export async function fetchCostSettings(forceRefresh = false) {
  // Return cache if valid
  if (!forceRefresh && settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('key, value');

    if (error) {
      console.warn('Failed to fetch cost settings, using defaults:', error);
      return buildSettingsObject(DEFAULT_COST_SETTINGS);
    }

    // Convert array to object
    const dbSettings = {};
    data.forEach(row => {
      let value = row.value;
      // Parse numeric strings
      if (typeof value === 'string' && !isNaN(value)) {
        value = parseFloat(value);
      }
      dbSettings[row.key] = value;
    });

    // Merge with defaults
    const settings = { ...DEFAULT_COST_SETTINGS, ...dbSettings };
    
    // Build computed settings
    const computed = buildSettingsObject(settings);

    // Update cache
    settingsCache = computed;
    cacheTimestamp = Date.now();

    return computed;
  } catch (err) {
    console.error('Error fetching cost settings:', err);
    return buildSettingsObject(DEFAULT_COST_SETTINGS);
  }
}

/**
 * Build settings object with computed values
 */
function buildSettingsObject(raw) {
  const weeklySupplies = raw.weekly_supplies_cost || 24.50;
  const weeklyGas = raw.weekly_gas_cost || 50;
  const weeklyStipend = raw.weekly_stipend_per_cleaner || 0;
  const weeklyTotal = weeklySupplies + weeklyGas + weeklyStipend;
  const expectedJobsPerWeek = raw.expected_jobs_per_week || 9;
  const expectedJobsPerYear = raw.expected_jobs_per_year || 450;
  const annualEquipment = raw.annual_equipment_cost || 750;
  
  const overheadTotal = (raw.monthly_marketing || 250) + 
                        (raw.monthly_admin || 250) + 
                        (raw.monthly_phone || 20) + 
                        (raw.monthly_website || 5) + 
                        (raw.monthly_insurance || 75);

  return {
    // Labor
    baseHourlyRate: raw.base_hourly_rate || 26,
    payrollBurdenPercent: raw.payroll_burden_percent || 0.154,
    loadedHourlyRate: raw.loaded_hourly_rate || 30,
    soloCleanerMaxSqft: raw.solo_cleaner_max_sqft || 1999,
    
    // Weekly costs
    weeklySuppliesCost: weeklySupplies,
    weeklyGasCost: weeklyGas,
    weeklyStipendPerCleaner: weeklyStipend,
    weeklyTotalPerCleaner: weeklyTotal,
    expectedJobsPerWeek: expectedJobsPerWeek,
    perJobSuppliesGas: round2(weeklyTotal / expectedJobsPerWeek),
    
    // Equipment
    annualEquipmentCost: annualEquipment,
    expectedJobsPerYear: expectedJobsPerYear,
    perJobEquipment: round2(annualEquipment / expectedJobsPerYear),
    
    // Overhead
    monthlyMarketing: raw.monthly_marketing || 250,
    monthlyAdmin: raw.monthly_admin || 250,
    monthlyPhone: raw.monthly_phone || 20,
    monthlyWebsite: raw.monthly_website || 5,
    monthlyInsurance: raw.monthly_insurance || 75,
    monthlyOverheadTotal: raw.monthly_overhead_total || overheadTotal,
    
    // Pricing
    targetMarginPercent: raw.target_margin_percent || 0.45,
    minimumPrice: raw.minimum_price || 115,
    firstCleanHoursMultiplier: raw.first_clean_hours_multiplier || 1.5,
    organicCleaningAddon: raw.organic_cleaning_addon || 20,
    
    // Duration
    baseMinutesPer500Sqft: raw.base_minutes_per_500_sqft || 30,
    extraBathroomMinutes: raw.extra_bathroom_minutes || 15,
    extraBedroomMinutes: raw.extra_bedroom_minutes || 10,
    includedBathrooms: raw.included_bathrooms || 2,
    includedBedrooms: raw.included_bedrooms || 3,
    
    // Frequency discounts
    frequencyDiscounts: {
      weekly: raw.weekly_discount || 0.15,
      biweekly: raw.biweekly_discount || 0.10,
      monthly: raw.monthly_discount || 0.05,
      onetime: 0,
    },
  };
}

/**
 * Clear settings cache (call after admin updates settings)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

/**
 * Get current cached settings (sync, for display)
 * Returns defaults if cache is empty
 */
export function getCostSettings() {
  return settingsCache || buildSettingsObject(DEFAULT_COST_SETTINGS);
}

// Legacy export for backwards compatibility
export const COST_SETTINGS = buildSettingsObject(DEFAULT_COST_SETTINGS);

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate cleaning duration in hours
 */
export function calculateDurationHours({ sqft, bedrooms, bathrooms, isFirstClean = false }, settings = null) {
  const s = settings || getCostSettings();
  
  // Base time from square footage
  const sqftUnits = Math.ceil(sqft / 500);
  let minutes = sqftUnits * s.baseMinutesPer500Sqft;
  
  // Extra time for additional bathrooms
  const extraBathrooms = Math.max(0, bathrooms - s.includedBathrooms);
  minutes += extraBathrooms * s.extraBathroomMinutes;
  
  // Extra time for additional bedrooms
  const extraBedrooms = Math.max(0, bedrooms - s.includedBedrooms);
  minutes += extraBedrooms * s.extraBedroomMinutes;
  
  // First clean takes longer
  if (isFirstClean) {
    minutes = Math.ceil(minutes * s.firstCleanHoursMultiplier);
  }
  
  // Round to nearest 15 minutes
  minutes = Math.ceil(minutes / 15) * 15;
  
  return minutes / 60;
}

/**
 * Format duration for display (takes minutes for backwards compatibility)
 */
export function formatDuration(minutes) {
  const totalMinutes = Math.round(minutes);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

/**
 * Format duration from hours
 */
export function formatDurationHours(hours) {
  return formatDuration(hours * 60);
}

// ============================================
// NUMBER OF CLEANERS
// ============================================

/**
 * Determine number of cleaners needed
 */
export function getCleanerCount(sqft, settings = null) {
  const s = settings || getCostSettings();
  return sqft > s.soloCleanerMaxSqft ? 2 : 1;
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Calculate total job cost breakdown
 */
export function calculateJobCost({ 
  sqft, 
  bedrooms, 
  bathrooms, 
  isFirstClean = false,
  overheadJobsPerMonth = 36,
  settings = null
}) {
  const s = settings || getCostSettings();
  const cleanerCount = getCleanerCount(sqft, s);
  const durationHours = calculateDurationHours({ sqft, bedrooms, bathrooms, isFirstClean }, s);
  
  // Labor cost
  const laborCost = durationHours * s.loadedHourlyRate * cleanerCount;
  
  // Supplies & Gas allocation
  const suppliesGasCost = s.perJobSuppliesGas * cleanerCount;
  
  // Equipment allocation
  const equipmentCost = s.perJobEquipment * cleanerCount;
  
  // Overhead allocation
  const overheadCost = s.monthlyOverheadTotal / Math.max(overheadJobsPerMonth, 1);
  
  // Total cost
  const totalCost = laborCost + suppliesGasCost + equipmentCost + overheadCost;
  
  return {
    durationHours,
    cleanerCount,
    laborCost: round2(laborCost),
    suppliesGasCost: round2(suppliesGasCost),
    equipmentCost: round2(equipmentCost),
    overheadCost: round2(overheadCost),
    totalCost: round2(totalCost),
  };
}

// ============================================
// PRICE CALCULATION
// ============================================

/**
 * Calculate profitable price from cost
 */
export function calculatePriceFromCost(totalCost, targetMargin = null, settings = null) {
  const s = settings || getCostSettings();
  const margin = targetMargin ?? s.targetMarginPercent;
  const price = totalCost / (1 - margin);
  return Math.ceil(price);
}

/**
 * Calculate complete pricing with cost breakdown
 */
export function calculateProfitablePricing({
  sqft,
  bedrooms,
  bathrooms,
  frequency = 'onetime',
  overheadJobsPerMonth = 36,
  targetMargin = null,
  settings = null,
}) {
  const s = settings || getCostSettings();
  const margin = targetMargin ?? s.targetMarginPercent;
  
  // Calculate first clean
  const firstCleanCost = calculateJobCost({
    sqft, bedrooms, bathrooms,
    isFirstClean: true,
    overheadJobsPerMonth,
    settings: s,
  });
  
  // Calculate recurring clean
  const recurringCost = calculateJobCost({
    sqft, bedrooms, bathrooms,
    isFirstClean: false,
    overheadJobsPerMonth,
    settings: s,
  });
  
  // Calculate minimum profitable prices
  let firstCleanPrice = calculatePriceFromCost(firstCleanCost.totalCost, margin, s);
  let recurringBasePrice = calculatePriceFromCost(recurringCost.totalCost, margin, s);
  
  // Apply frequency discount to recurring
  const frequencyDiscount = s.frequencyDiscounts[frequency] || 0;
  let recurringPrice = Math.ceil(recurringBasePrice * (1 - frequencyDiscount));
  
  // Enforce minimum price floor
  firstCleanPrice = Math.max(firstCleanPrice, s.minimumPrice);
  recurringPrice = Math.max(recurringPrice, s.minimumPrice);
  
  // Calculate actual margins
  const firstCleanProfit = firstCleanPrice - firstCleanCost.totalCost;
  const firstCleanMargin = firstCleanProfit / firstCleanPrice;
  
  const recurringProfit = recurringPrice - recurringCost.totalCost;
  const recurringMargin = recurringProfit / recurringPrice;
  
  return {
    firstClean: {
      price: firstCleanPrice,
      ...firstCleanCost,
      profit: round2(firstCleanProfit),
      margin: round2(firstCleanMargin * 100),
    },
    recurring: {
      price: recurringPrice,
      basePrice: recurringBasePrice,
      frequencyDiscount: round2(frequencyDiscount * 100),
      ...recurringCost,
      profit: round2(recurringProfit),
      margin: round2(recurringMargin * 100),
    },
    frequency,
    cleanerCount: firstCleanCost.cleanerCount,
    targetMargin: round2(margin * 100),
    minimumPrice: s.minimumPrice,
    firstCleanPrice,
    recurringPrice,
    firstCleanDuration: Math.round(firstCleanCost.durationHours * 60),
    recurringDuration: Math.round(recurringCost.durationHours * 60),
  };
}

// ============================================
// ASYNC PRICING (fetches latest settings)
// ============================================

/**
 * Calculate pricing with fresh settings from database
 * Use this for actual quotes/bookings
 */
export async function calculateProfitablePricingAsync(params) {
  const settings = await fetchCostSettings();
  return calculateProfitablePricing({ ...params, settings });
}

/**
 * Calculate job cost with fresh settings
 */
export async function calculateJobCostAsync(params) {
  const settings = await fetchCostSettings();
  return calculateJobCost({ ...params, settings });
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Drop-in replacement for old calculateCleaningPrice function
 */
export function calculateCleaningPrice({
  sqft,
  bedrooms,
  bathrooms,
  frequency,
  addons = [],
  creditBalance = 0,
  referralDiscount = 0,
}) {
  const settings = getCostSettings();
  const pricing = calculateProfitablePricing({
    sqft, bedrooms, bathrooms, frequency, settings,
  });
  
  // Handle add-ons
  const addonsPrice = addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  const firstCleanTotal = pricing.firstCleanPrice + addonsPrice;
  
  // Apply discounts
  const totalDiscounts = referralDiscount + Math.min(creditBalance, firstCleanTotal);
  const finalFirstCleanPrice = Math.max(settings.minimumPrice, firstCleanTotal - totalDiscounts);
  
  // Deposit calculation
  const depositPercentage = 0.20;
  const depositAmount = Math.round(finalFirstCleanPrice * depositPercentage);
  const remainingAmount = finalFirstCleanPrice - depositAmount;
  
  return {
    basePrice: pricing.recurring.basePrice,
    firstCleanPrice: pricing.firstCleanPrice,
    recurringPrice: pricing.recurringPrice,
    addonsPrice,
    addons,
    firstCleanTotal,
    referralDiscount,
    creditApplied: Math.min(creditBalance, firstCleanTotal - referralDiscount),
    totalDiscounts,
    finalFirstCleanPrice,
    depositAmount,
    remainingAmount,
    firstCleanDuration: pricing.firstCleanDuration,
    recurringDuration: pricing.recurringDuration,
    frequency,
    frequencyDiscount: pricing.recurring.frequencyDiscount / 100,
    frequencyDiscountPercent: pricing.recurring.frequencyDiscount,
    savingsPerVisit: pricing.firstCleanPrice - pricing.recurringPrice,
    costBreakdown: {
      firstClean: pricing.firstClean,
      recurring: pricing.recurring,
      cleanerCount: pricing.cleanerCount,
      targetMargin: pricing.targetMargin,
    },
  };
}

// ============================================
// UTILITIES
// ============================================

function round2(num) {
  return Math.round(num * 100) / 100;
}

export function formatPrice(price) {
  if (price === null || price === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function getFrequencyBadge(frequency) {
  const settings = getCostSettings();
  const badges = {
    weekly: `${Math.round(settings.frequencyDiscounts.weekly * 100)}% off`,
    biweekly: 'Most Popular',
    monthly: `${Math.round(settings.frequencyDiscounts.monthly * 100)}% off`,
    onetime: 'Deep Clean',
  };
  return badges[frequency] || '';
}

export function formatFrequency(frequency) {
  const labels = {
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    monthly: 'Monthly',
    onetime: 'One-Time',
  };
  return labels[frequency] || frequency;
}

// ============================================
// ADMIN UTILITIES
// ============================================

export function calculateOverheadPerJob(jobsLastMonth) {
  const settings = getCostSettings();
  return round2(settings.monthlyOverheadTotal / Math.max(jobsLastMonth, 1));
}

export function validatePriceProfitability(price, jobParams) {
  const settings = getCostSettings();
  const cost = calculateJobCost({ ...jobParams, settings });
  const profit = price - cost.totalCost;
  const margin = profit / price;
  
  return {
    isValid: margin >= 0.40,
    isProfitable: profit > 0,
    cost: cost.totalCost,
    profit: round2(profit),
    margin: round2(margin * 100),
    minimumPrice: calculatePriceFromCost(cost.totalCost, 0.40, settings),
    recommendedPrice: calculatePriceFromCost(cost.totalCost, 0.45, settings),
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Async (use for real quotes)
  fetchCostSettings,
  calculateProfitablePricingAsync,
  calculateJobCostAsync,
  
  // Sync (use for UI previews)
  calculateDurationHours,
  calculateJobCost,
  calculatePriceFromCost,
  calculateProfitablePricing,
  calculateCleaningPrice,
  
  // Utilities
  getCleanerCount,
  formatDuration,
  formatDurationHours,
  formatPrice,
  formatPercent,
  formatFrequency,
  getFrequencyBadge,
  clearSettingsCache,
  
  // Admin
  calculateOverheadPerJob,
  getCostSettings,
  validatePriceProfitability,
  
  // Constants
  COST_SETTINGS,
  DEFAULT_COST_SETTINGS,
};
