/**
 * Willow & Water Organic Cleaning - Pricing Engine
 * 
 * Pure pricing calculation logic for the cleaning service quote generator.
 * All functions are exported for independent testing.
 */

// ============================================
// PRICING CONSTANTS
// ============================================
export const PRICING_CONSTANTS = {
  BASE_LABOR_COST: 23.34,
  SUPPLY_COST: 4.50,
  TARGET_MARGIN: 0.42,
  HOURLY_RATE: 48.50,
  ORGANIC_BUFFER: 1.10,
  EFFICIENCY_DISCOUNT: 0.15,
  EFFICIENCY_THRESHOLD_HOURS: 4,
  FIRST_CLEAN_PREMIUM: 100, // First clean costs $100 more than recurring
};

// Frequency multipliers (applied to final price for recurring discount)
export const FREQUENCY_MULTIPLIERS = {
  weekly: 0.65,    // High frequency discount
  biweekly: 0.75,  // Standard recurring
  monthly: 0.90,   // Light recurring discount
  onetime: 1.35,   // Deep clean premium
};

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate base hours from square footage
 * @param {number} sqft - Square footage of the home
 * @returns {number} Base hours
 */
export const calculateBaseHours = (sqft) => {
  if (sqft < 1000) {
    return 1.0;
  }
  return ((sqft - 1000) / 1000 * 0.5) + 1.0;
};

/**
 * Calculate room load hours from bedrooms and bathrooms
 * @param {number} bedrooms - Number of bedrooms
 * @param {number} bathrooms - Number of bathrooms
 * @returns {number} Room load hours
 */
export const calculateRoomLoad = (bedrooms, bathrooms) => {
  return (bathrooms * 0.8) + (bedrooms * 0.3);
};

/**
 * Apply organic buffer to total hours
 * @param {number} hours - Base hours before buffer
 * @returns {number} Hours with organic buffer applied
 */
export const applyOrganicBuffer = (hours) => {
  return hours * PRICING_CONSTANTS.ORGANIC_BUFFER;
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
  // Step 1: Calculate base hours from square footage
  const baseHours = calculateBaseHours(sqft);
  
  // Step 2: Calculate room load
  const roomLoad = calculateRoomLoad(bedrooms, bathrooms);
  
  // Step 3: Sum and apply organic buffer (1.10x for eco-friendly products)
  const totalHoursBeforeBuffer = baseHours + roomLoad;
  const totalHoursWithBuffer = applyOrganicBuffer(totalHoursBeforeBuffer);
  
  // Step 4: Calculate raw price (hours * hourly rate)
  const rawPrice = totalHoursWithBuffer * PRICING_CONSTANTS.HOURLY_RATE;
  
  // Step 5: Apply efficiency discount (15% off if total hours > 4)
  const efficiencyDiscountApplied = totalHoursWithBuffer > PRICING_CONSTANTS.EFFICIENCY_THRESHOLD_HOURS;
  const priceAfterEfficiency = efficiencyDiscountApplied 
    ? rawPrice * (1 - PRICING_CONSTANTS.EFFICIENCY_DISCOUNT)
    : rawPrice;
  
  // Step 6: Apply frequency multiplier (recurring discounts)
  const frequencyMultiplier = FREQUENCY_MULTIPLIERS[frequency] || FREQUENCY_MULTIPLIERS.biweekly;
  const priceAfterFrequency = priceAfterEfficiency * frequencyMultiplier;
  
  // Step 7: Round to nearest $5
  const recurringPrice = roundToNearestFive(priceAfterFrequency);
  
  // Step 8: Calculate first-time deep clean price (recurring + $100)
  const firstCleanPrice = recurringPrice + PRICING_CONSTANTS.FIRST_CLEAN_PREMIUM;

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
