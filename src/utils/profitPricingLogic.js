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
 */

// ============================================
// COST CONSTANTS
// ============================================

export const COST_SETTINGS = {
  // Labor
  baseHourlyRate: 26.00,           // Base pay per hour
  payrollBurdenPercent: 0.154,     // IL taxes + workers comp (15.4%)
  loadedHourlyRate: 30.00,         // baseHourlyRate × (1 + payrollBurdenPercent)
  
  // Cleaner thresholds
  soloCleanerMaxSqft: 1999,        // Solo cleaner for homes < 2000 sqft
  
  // Weekly costs per cleaner
  weeklySuppliesCost: 24.50,       // Branch Basics ($49 / 2 weeks)
  weeklyGasCost: 50.00,            // Gas allowance
  weeklyTotalPerCleaner: 74.50,    // supplies + gas
  expectedJobsPerWeek: 9,          // Target: 8-10, using 9 for calculations
  perJobSuppliesGas: 8.28,         // weeklyTotal / expectedJobsPerWeek
  
  // Equipment amortization (per cleaner per year)
  annualEquipmentCost: 750,        // SEBO + maintenance + microfiber + misc
  expectedJobsPerYear: 450,        // 9 jobs/week × 50 weeks
  perJobEquipment: 1.67,           // annualEquipmentCost / expectedJobsPerYear
  
  // Monthly overhead
  monthlyMarketing: 250,
  monthlyAdmin: 250,
  monthlyPhone: 20,
  monthlyWebsite: 5,
  monthlyInsurance: 75,
  monthlyOverheadTotal: 600,       // Sum of above
  
  // Pricing
  targetMarginPercent: 0.45,       // 45% target (range: 40-50%)
  minimumPrice: 115,               // Never quote below this
  firstCleanHoursMultiplier: 1.5,  // First clean takes 50% longer
  
  // Duration calculation
  baseMinutesPer500Sqft: 30,
  extraBathroomMinutes: 15,
  extraBedroomMinutes: 10,
  includedBathrooms: 2,
  includedBedrooms: 3,
  
  // Frequency discounts (applied AFTER ensuring profitability)
  frequencyDiscounts: {
    weekly: 0.15,      // 15% off recurring (reduced from 35% to maintain margin)
    biweekly: 0.10,    // 10% off recurring (reduced from 20%)
    monthly: 0.05,     // 5% off recurring (reduced from 10%)
    onetime: 0,        // No discount
  },
};

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate cleaning duration in hours
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {boolean} params.isFirstClean - Whether this is first/deep clean
 * @returns {number} Duration in hours
 */
export function calculateDurationHours({ sqft, bedrooms, bathrooms, isFirstClean = false }) {
  const settings = COST_SETTINGS;
  
  // Base time from square footage
  const sqftUnits = Math.ceil(sqft / 500);
  let minutes = sqftUnits * settings.baseMinutesPer500Sqft;
  
  // Extra time for additional bathrooms (over 2)
  const extraBathrooms = Math.max(0, bathrooms - settings.includedBathrooms);
  minutes += extraBathrooms * settings.extraBathroomMinutes;
  
  // Extra time for additional bedrooms (over 3)
  const extraBedrooms = Math.max(0, bedrooms - settings.includedBedrooms);
  minutes += extraBedrooms * settings.extraBedroomMinutes;
  
  // First clean takes longer
  if (isFirstClean) {
    minutes = Math.ceil(minutes * settings.firstCleanHoursMultiplier);
  }
  
  // Round to nearest 15 minutes for scheduling
  minutes = Math.ceil(minutes / 15) * 15;
  
  return minutes / 60; // Return hours
}

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes (for backwards compatibility)
 * @returns {string}
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
 * @param {number} hours 
 * @returns {string}
 */
export function formatDurationHours(hours) {
  return formatDuration(hours * 60);
}

// ============================================
// NUMBER OF CLEANERS
// ============================================

/**
 * Determine number of cleaners needed
 * @param {number} sqft - Square footage
 * @returns {number} Number of cleaners (1 or 2)
 */
export function getCleanerCount(sqft) {
  return sqft > COST_SETTINGS.soloCleanerMaxSqft ? 2 : 1;
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Calculate total job cost breakdown
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {boolean} params.isFirstClean - Whether this is first clean
 * @param {number} params.overheadJobsPerMonth - Jobs per month for overhead allocation
 * @returns {Object} Cost breakdown
 */
export function calculateJobCost({ 
  sqft, 
  bedrooms, 
  bathrooms, 
  isFirstClean = false,
  overheadJobsPerMonth = 36 // Default: 1 cleaner × 9 jobs/week × 4 weeks
}) {
  const settings = COST_SETTINGS;
  const cleanerCount = getCleanerCount(sqft);
  const durationHours = calculateDurationHours({ sqft, bedrooms, bathrooms, isFirstClean });
  
  // Labor cost
  const laborCost = durationHours * settings.loadedHourlyRate * cleanerCount;
  
  // Supplies & Gas allocation (per cleaner)
  const suppliesGasCost = settings.perJobSuppliesGas * cleanerCount;
  
  // Equipment allocation (per cleaner)
  const equipmentCost = settings.perJobEquipment * cleanerCount;
  
  // Overhead allocation (fixed monthly / jobs)
  const overheadCost = settings.monthlyOverheadTotal / Math.max(overheadJobsPerMonth, 1);
  
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
 * 
 * @param {number} totalCost - Total job cost
 * @param {number} targetMargin - Target profit margin (0-1)
 * @returns {number} Minimum profitable price
 */
export function calculatePriceFromCost(totalCost, targetMargin = COST_SETTINGS.targetMarginPercent) {
  // Price = Cost / (1 - Margin)
  // At 45% margin: Price = Cost / 0.55 = Cost × 1.818
  const price = totalCost / (1 - targetMargin);
  return Math.ceil(price); // Round up to whole dollars
}

/**
 * Calculate complete pricing with cost breakdown
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {string} params.frequency - Cleaning frequency
 * @param {number} params.overheadJobsPerMonth - For overhead allocation
 * @param {number} params.targetMargin - Target profit margin
 * @returns {Object} Complete pricing breakdown
 */
export function calculateProfitablePricing({
  sqft,
  bedrooms,
  bathrooms,
  frequency = 'onetime',
  overheadJobsPerMonth = 36,
  targetMargin = COST_SETTINGS.targetMarginPercent,
}) {
  const settings = COST_SETTINGS;
  
  // Calculate first clean (deep clean)
  const firstCleanCost = calculateJobCost({
    sqft,
    bedrooms,
    bathrooms,
    isFirstClean: true,
    overheadJobsPerMonth,
  });
  
  // Calculate recurring clean
  const recurringCost = calculateJobCost({
    sqft,
    bedrooms,
    bathrooms,
    isFirstClean: false,
    overheadJobsPerMonth,
  });
  
  // Calculate minimum profitable prices
  let firstCleanPrice = calculatePriceFromCost(firstCleanCost.totalCost, targetMargin);
  let recurringBasePrice = calculatePriceFromCost(recurringCost.totalCost, targetMargin);
  
  // Apply frequency discount to recurring (NOT first clean)
  const frequencyDiscount = settings.frequencyDiscounts[frequency] || 0;
  let recurringPrice = Math.ceil(recurringBasePrice * (1 - frequencyDiscount));
  
  // Enforce minimum price floor
  firstCleanPrice = Math.max(firstCleanPrice, settings.minimumPrice);
  recurringPrice = Math.max(recurringPrice, settings.minimumPrice);
  
  // Calculate actual margins achieved
  const firstCleanProfit = firstCleanPrice - firstCleanCost.totalCost;
  const firstCleanMargin = firstCleanProfit / firstCleanPrice;
  
  const recurringProfit = recurringPrice - recurringCost.totalCost;
  const recurringMargin = recurringProfit / recurringPrice;
  
  return {
    // First clean
    firstClean: {
      price: firstCleanPrice,
      ...firstCleanCost,
      profit: round2(firstCleanProfit),
      margin: round2(firstCleanMargin * 100), // As percentage
    },
    
    // Recurring clean
    recurring: {
      price: recurringPrice,
      basePrice: recurringBasePrice,
      frequencyDiscount: round2(frequencyDiscount * 100), // As percentage
      ...recurringCost,
      profit: round2(recurringProfit),
      margin: round2(recurringMargin * 100), // As percentage
    },
    
    // Summary
    frequency,
    cleanerCount: firstCleanCost.cleanerCount,
    targetMargin: round2(targetMargin * 100),
    minimumPrice: settings.minimumPrice,
    
    // For display compatibility with old calculator
    firstCleanPrice,
    recurringPrice,
    firstCleanDuration: Math.round(firstCleanCost.durationHours * 60), // Minutes for display
    recurringDuration: Math.round(recurringCost.durationHours * 60),
  };
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Drop-in replacement for old calculateCleaningPrice function
 * Maintains same interface but uses profit-based logic
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
  // Get profit-based pricing
  const pricing = calculateProfitablePricing({
    sqft,
    bedrooms,
    bathrooms,
    frequency,
  });
  
  // Handle add-ons (keep same logic)
  const addonsPrice = addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  
  // First clean total with add-ons
  const firstCleanTotal = pricing.firstCleanPrice + addonsPrice;
  
  // Apply discounts
  const totalDiscounts = referralDiscount + Math.min(creditBalance, firstCleanTotal);
  const finalFirstCleanPrice = Math.max(COST_SETTINGS.minimumPrice, firstCleanTotal - totalDiscounts);
  
  // Deposit calculation (20%)
  const depositPercentage = 0.20;
  const depositAmount = Math.round(finalFirstCleanPrice * depositPercentage);
  const remainingAmount = finalFirstCleanPrice - depositAmount;
  
  return {
    // Base prices (for reference)
    basePrice: pricing.recurring.basePrice,
    
    // Final prices
    firstCleanPrice: pricing.firstCleanPrice,
    recurringPrice: pricing.recurringPrice,
    
    // Add-ons
    addonsPrice,
    addons,
    
    // First clean breakdown
    firstCleanTotal,
    referralDiscount,
    creditApplied: Math.min(creditBalance, firstCleanTotal - referralDiscount),
    totalDiscounts,
    finalFirstCleanPrice,
    
    // Payment breakdown
    depositAmount,
    remainingAmount,
    
    // Durations
    firstCleanDuration: pricing.firstCleanDuration,
    recurringDuration: pricing.recurringDuration,
    
    // Frequency info
    frequency,
    frequencyDiscount: pricing.recurring.frequencyDiscount / 100,
    frequencyDiscountPercent: pricing.recurring.frequencyDiscount,
    
    // Savings info
    savingsPerVisit: pricing.firstCleanPrice - pricing.recurringPrice,
    
    // NEW: Cost breakdown for admin
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

/**
 * Round to 2 decimal places
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Format price as currency
 */
export function formatPrice(price) {
  if (price === null || price === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

/**
 * Get frequency badge text (updated for new discounts)
 */
export function getFrequencyBadge(frequency) {
  const badges = {
    weekly: '15% off',
    biweekly: 'Most Popular',
    monthly: '5% off',
    onetime: 'Deep Clean',
  };
  return badges[frequency] || '';
}

/**
 * Format frequency for display
 */
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

/**
 * Calculate overhead allocation based on actual job volume
 * Call this periodically to update overhead per job
 * 
 * @param {number} jobsLastMonth - Actual jobs completed last month
 * @returns {number} Overhead cost per job
 */
export function calculateOverheadPerJob(jobsLastMonth) {
  const overhead = COST_SETTINGS.monthlyOverheadTotal;
  return round2(overhead / Math.max(jobsLastMonth, 1));
}

/**
 * Get current cost settings for admin display
 */
export function getCostSettings() {
  return { ...COST_SETTINGS };
}

/**
 * Validate that a price is profitable
 * 
 * @param {number} price - Proposed price
 * @param {Object} jobParams - Job parameters
 * @returns {Object} Validation result
 */
export function validatePriceProfitability(price, jobParams) {
  const cost = calculateJobCost(jobParams);
  const profit = price - cost.totalCost;
  const margin = profit / price;
  
  return {
    isValid: margin >= 0.40, // Minimum 40% margin
    isProfitable: profit > 0,
    cost: cost.totalCost,
    profit: round2(profit),
    margin: round2(margin * 100),
    minimumPrice: calculatePriceFromCost(cost.totalCost, 0.40),
    recommendedPrice: calculatePriceFromCost(cost.totalCost, 0.45),
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Core functions
  calculateDurationHours,
  calculateJobCost,
  calculatePriceFromCost,
  calculateProfitablePricing,
  calculateCleaningPrice,
  
  // Utilities
  getCleanerCount,
  formatDuration,
  formatPrice,
  formatPercent,
  formatFrequency,
  getFrequencyBadge,
  
  // Admin
  calculateOverheadPerJob,
  getCostSettings,
  validatePriceProfitability,
  
  // Constants
  COST_SETTINGS,
};
