/**
 * Willow & Water Organic Cleaning - Pricing Engine
 * 
 * Pure pricing calculation logic for the cleaning service quote generator.
 * All functions are exported for independent testing.
 * 
 * Settings can be customized via the Admin Portal (/admin/pricing)
 * and are stored in localStorage under 'pricingSettings'.
 */

// ============================================
// DEFAULT PRICING CONSTANTS
// ============================================
const DEFAULT_PRICING_CONSTANTS = {
  BASE_LABOR_COST: 23.34,
  SUPPLY_COST: 4.50,
  TARGET_MARGIN: 0.42,
  HOURLY_RATE: 48.50,
  ORGANIC_BUFFER: 1.10,
  EFFICIENCY_DISCOUNT: 0.15,
  EFFICIENCY_THRESHOLD_HOURS: 4,
  FIRST_CLEAN_PREMIUM: 100,
  SQFT_BASE_HOURS: 1.0,
  SQFT_PER_THOUSAND: 0.5,
  BATHROOM_HOURS: 0.8,
  BEDROOM_HOURS: 0.3,
};

const DEFAULT_FREQUENCY_MULTIPLIERS = {
  weekly: 0.65,
  biweekly: 0.75,
  monthly: 0.90,
  onetime: 1.35,
};

// ============================================
// LOAD CUSTOM SETTINGS FROM LOCALSTORAGE
// ============================================
const getCustomSettings = () => {
  try {
    const saved = localStorage.getItem('pricingSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom pricing settings:', e);
  }
  return null;
};

// Get current pricing constants (custom or default)
export const getPricingConstants = () => {
  const custom = getCustomSettings();
  if (custom) {
    return {
      BASE_LABOR_COST: custom.baseLaborCost ?? DEFAULT_PRICING_CONSTANTS.BASE_LABOR_COST,
      SUPPLY_COST: custom.supplyCost ?? DEFAULT_PRICING_CONSTANTS.SUPPLY_COST,
      TARGET_MARGIN: custom.targetMargin ?? DEFAULT_PRICING_CONSTANTS.TARGET_MARGIN,
      HOURLY_RATE: custom.hourlyRate ?? DEFAULT_PRICING_CONSTANTS.HOURLY_RATE,
      ORGANIC_BUFFER: custom.organicBuffer ?? DEFAULT_PRICING_CONSTANTS.ORGANIC_BUFFER,
      EFFICIENCY_DISCOUNT: custom.efficiencyDiscount ?? DEFAULT_PRICING_CONSTANTS.EFFICIENCY_DISCOUNT,
      EFFICIENCY_THRESHOLD_HOURS: custom.efficiencyThresholdHours ?? DEFAULT_PRICING_CONSTANTS.EFFICIENCY_THRESHOLD_HOURS,
      FIRST_CLEAN_PREMIUM: custom.firstCleanPremium ?? DEFAULT_PRICING_CONSTANTS.FIRST_CLEAN_PREMIUM,
      SQFT_BASE_HOURS: custom.sqftBaseHours ?? DEFAULT_PRICING_CONSTANTS.SQFT_BASE_HOURS,
      SQFT_PER_THOUSAND: custom.sqftPerThousand ?? DEFAULT_PRICING_CONSTANTS.SQFT_PER_THOUSAND,
      BATHROOM_HOURS: custom.bathroomHours ?? DEFAULT_PRICING_CONSTANTS.BATHROOM_HOURS,
      BEDROOM_HOURS: custom.bedroomHours ?? DEFAULT_PRICING_CONSTANTS.BEDROOM_HOURS,
    };
  }
  return DEFAULT_PRICING_CONSTANTS;
};

// Get current frequency multipliers (custom or default)
export const getFrequencyMultipliers = () => {
  const custom = getCustomSettings();
  if (custom?.frequencyMultipliers) {
    return { ...DEFAULT_FREQUENCY_MULTIPLIERS, ...custom.frequencyMultipliers };
  }
  return DEFAULT_FREQUENCY_MULTIPLIERS;
};

// Export for backward compatibility
export const PRICING_CONSTANTS = getPricingConstants();
export const FREQUENCY_MULTIPLIERS = getFrequencyMultipliers();

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate base hours from square footage
 * @param {number} sqft - Square footage of the home
 * @returns {number} Base hours
 */
export const calculateBaseHours = (sqft) => {
  const settings = getPricingConstants();
  if (sqft < 1000) {
    return settings.SQFT_BASE_HOURS;
  }
  return ((sqft - 1000) / 1000 * settings.SQFT_PER_THOUSAND) + settings.SQFT_BASE_HOURS;
};

/**
 * Calculate room load hours from bedrooms and bathrooms
 * @param {number} bedrooms - Number of bedrooms
 * @param {number} bathrooms - Number of bathrooms
 * @returns {number} Room load hours
 */
export const calculateRoomLoad = (bedrooms, bathrooms) => {
  const settings = getPricingConstants();
  return (bathrooms * settings.BATHROOM_HOURS) + (bedrooms * settings.BEDROOM_HOURS);
};

/**
 * Apply organic buffer to total hours
 * @param {number} hours - Base hours before buffer
 * @returns {number} Hours with organic buffer applied
 */
export const applyOrganicBuffer = (hours) => {
  const settings = getPricingConstants();
  return hours * settings.ORGANIC_BUFFER;
};

/**
 * Round price to nearest $5
 * @param {number} price - Raw price
 * @returns {number} Price rounded to nearest $5
 */
export const roundToNearestFive = (price) => {
  return Math.round(price / 5) * 5;
};

/**
 * Format price as USD currency string
 * @param {number} price - Price in dollars
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate cleaning price based on home specifications
 * 
 * Calculation Order:
 * 1. Base Hours (from sqft)
 * 2. Room Load (beds + baths)
 * 3. Organic Buffer (1.10x)
 * 4. Calculate raw price (hours * rate)
 * 5. Apply Efficiency Discount (15% off if hours > 4)
 * 6. Apply Frequency Multiplier (recurring discounts)
 * 7. Round to nearest $5
 * 
 * @param {Object} params - Cleaning parameters
 * @param {number} params.sqft - Square footage (500-5000)
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {string} params.frequency - 'weekly' | 'biweekly' | 'monthly' | 'onetime'
 * @returns {Object} Pricing breakdown
 */
export const calculateCleaningPrice = ({ sqft, bedrooms, bathrooms, frequency }) => {
  // Get current settings (may be customized via admin)
  const settings = getPricingConstants();
  const freqMultipliers = getFrequencyMultipliers();
  
  // Step 1: Calculate base hours from square footage
  const baseHours = calculateBaseHours(sqft);
  
  // Step 2: Calculate room load
  const roomLoad = calculateRoomLoad(bedrooms, bathrooms);
  
  // Step 3: Sum and apply organic buffer (1.10x for eco-friendly products)
  const totalHoursBeforeBuffer = baseHours + roomLoad;
  const totalHoursWithBuffer = applyOrganicBuffer(totalHoursBeforeBuffer);
  
  // Step 4: Calculate raw price (hours * hourly rate)
  const rawPrice = totalHoursWithBuffer * settings.HOURLY_RATE;
  
  // Step 5: Apply efficiency discount (15% off if total hours > threshold)
  const efficiencyDiscountApplied = totalHoursWithBuffer > settings.EFFICIENCY_THRESHOLD_HOURS;
  const priceAfterEfficiency = efficiencyDiscountApplied 
    ? rawPrice * (1 - settings.EFFICIENCY_DISCOUNT)
    : rawPrice;
  
  // Step 6: Apply frequency multiplier (recurring discounts)
  const frequencyMultiplier = freqMultipliers[frequency] || freqMultipliers.biweekly;
  const priceAfterFrequency = priceAfterEfficiency * frequencyMultiplier;
  
  // Step 7: Round to nearest $5
  const recurringPrice = roundToNearestFive(priceAfterFrequency);
  
  // Step 8: Calculate first-time deep clean price (recurring + premium)
  const firstCleanPrice = recurringPrice + settings.FIRST_CLEAN_PREMIUM;

  // Debug logging for price breakdown
  console.log('=== Willow & Water Pricing Breakdown ===');
  console.log(`Input: ${sqft} sqft, ${bedrooms} bed, ${bathrooms} bath, ${frequency}`);
  console.log('─────────────────────────────────────────');
  console.log(`Base Hours (sqft):     ${baseHours.toFixed(2)} hrs`);
  console.log(`Room Load (bed/bath):  ${roomLoad.toFixed(2)} hrs`);
  console.log(`Total Before Buffer:   ${totalHoursBeforeBuffer.toFixed(2)} hrs`);
  console.log(`After Buffer (×1.10):  ${totalHoursWithBuffer.toFixed(2)} hrs`);
  console.log('─────────────────────────────────────────');
  console.log(`Raw Price:             $${rawPrice.toFixed(2)}`);
  console.log(`Efficiency Discount:   ${efficiencyDiscountApplied ? '-15% → $' + priceAfterEfficiency.toFixed(2) : 'N/A (hours ≤ 4)'}`);
  console.log(`Frequency (×${frequencyMultiplier}):    $${priceAfterFrequency.toFixed(2)}`);
  console.log(`Final (rounded):       $${recurringPrice}`);
  console.log(`First Clean (+$100):   $${firstCleanPrice}`);
  console.log('=========================================\n');

  return {
    recurringPrice,
    firstCleanPrice,
    // Breakdown for transparency/debugging
    breakdown: {
      baseHours: Math.round(baseHours * 100) / 100,
      roomLoad: Math.round(roomLoad * 100) / 100,
      totalHoursBeforeBuffer: Math.round(totalHoursBeforeBuffer * 100) / 100,
      totalHoursWithBuffer: Math.round(totalHoursWithBuffer * 100) / 100,
      rawPrice: Math.round(rawPrice * 100) / 100,
      efficiencyDiscountApplied,
      priceAfterEfficiency: Math.round(priceAfterEfficiency * 100) / 100,
      frequencyMultiplier,
      priceAfterFrequency: Math.round(priceAfterFrequency * 100) / 100,
    },
  };
};
