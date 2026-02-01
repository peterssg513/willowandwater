/**
 * Pricing Logic for Willow & Water v2.0
 * 
 * Handles all price calculations including:
 * - Base cleaning price
 * - Cleaning duration estimation
 * - Add-ons
 * - First clean vs recurring pricing
 * - Deposit calculations
 * - Discounts and credits
 */

// ============================================
// CONSTANTS
// ============================================

// Base rate per 500 sqft
const BASE_RATE_PER_500_SQFT = 40;

// Minimum prices
const MIN_FIRST_CLEAN_PRICE = 150;
const MIN_RECURRING_PRICE = 120;

// First clean multiplier (deep clean)
const FIRST_CLEAN_MULTIPLIER = 1.25;

// Frequency discounts
const FREQUENCY_DISCOUNTS = {
  weekly: 0.35,     // 35% off
  biweekly: 0.20,   // 20% off
  monthly: 0.10,    // 10% off
  onetime: 0,       // No discount
};

// Deposit percentage
export const DEPOSIT_PERCENTAGE = 0.20; // 20%

// Cancellation fees
const CANCELLATION_FEES = {
  over_48h: 0,
  '24_to_48h': 25,
  under_24h: 'full', // Special value meaning full charge
};

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate estimated cleaning duration in minutes
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {boolean} params.isFirstClean - Whether this is a first/deep clean
 * @param {Array} [params.addons] - Array of addon objects with duration_minutes
 * @returns {number} Duration in minutes
 */
export function calculateCleaningDuration({ sqft, bedrooms, bathrooms, isFirstClean, addons = [] }) {
  // Base time: 30 minutes per 500 sqft
  let minutes = Math.ceil(sqft / 500) * 30;
  
  // Add 15 minutes per bathroom over 2
  const extraBathrooms = Math.max(0, bathrooms - 2);
  minutes += extraBathrooms * 15;
  
  // Add 10 minutes per bedroom over 3
  const extraBedrooms = Math.max(0, bedrooms - 3);
  minutes += extraBedrooms * 10;
  
  // First clean takes 1.5x longer
  if (isFirstClean) {
    minutes = Math.ceil(minutes * 1.5);
  }
  
  // Add addon durations
  const addonMinutes = addons.reduce((sum, addon) => sum + (addon.duration_minutes || 0), 0);
  minutes += addonMinutes;
  
  // Round to nearest 30 minutes
  return Math.ceil(minutes / 30) * 30;
}

/**
 * Format duration for display
 * @param {number} minutes 
 * @returns {string}
 */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

// ============================================
// PRICE CALCULATION
// ============================================

/**
 * Calculate base cleaning price (before discounts)
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @returns {number} Base price
 */
export function calculateBasePrice({ sqft, bedrooms, bathrooms }) {
  // Price based on sqft
  let price = Math.ceil(sqft / 500) * BASE_RATE_PER_500_SQFT;
  
  // Add $15 per bathroom over 2
  const extraBathrooms = Math.max(0, bathrooms - 2);
  price += extraBathrooms * 15;
  
  // Add $10 per bedroom over 3
  const extraBedrooms = Math.max(0, bedrooms - 3);
  price += extraBedrooms * 10;
  
  return price;
}

/**
 * Calculate complete pricing breakdown
 * 
 * @param {Object} params
 * @param {number} params.sqft - Square footage
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {string} params.frequency - Cleaning frequency
 * @param {Array} [params.addons] - Selected add-on services
 * @param {number} [params.creditBalance] - Customer credit balance to apply
 * @param {number} [params.referralDiscount] - Referral discount amount
 * @returns {Object} Complete pricing breakdown
 */
export function calculateCleaningPrice({ 
  sqft, 
  bedrooms, 
  bathrooms, 
  frequency,
  addons = [],
  creditBalance = 0,
  referralDiscount = 0
}) {
  // Base price for recurring
  const basePrice = calculateBasePrice({ sqft, bedrooms, bathrooms });
  
  // Apply frequency discount for recurring price
  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  let recurringPrice = Math.round(basePrice * (1 - discount));
  
  // Enforce minimum
  recurringPrice = Math.max(recurringPrice, MIN_RECURRING_PRICE);
  
  // First clean price (base price * multiplier, no frequency discount)
  let firstCleanPrice = Math.round(basePrice * FIRST_CLEAN_MULTIPLIER);
  firstCleanPrice = Math.max(firstCleanPrice, MIN_FIRST_CLEAN_PRICE);
  
  // Calculate add-ons total
  const addonsPrice = addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  
  // First clean total (before discounts)
  const firstCleanTotal = firstCleanPrice + addonsPrice;
  
  // Calculate discounts
  const totalDiscounts = referralDiscount + Math.min(creditBalance, firstCleanTotal);
  
  // Final first clean price
  const finalFirstCleanPrice = Math.max(0, firstCleanTotal - totalDiscounts);
  
  // Deposit and remaining
  const depositAmount = Math.round(finalFirstCleanPrice * DEPOSIT_PERCENTAGE);
  const remainingAmount = finalFirstCleanPrice - depositAmount;
  
  // Duration estimates
  const firstCleanDuration = calculateCleaningDuration({ 
    sqft, bedrooms, bathrooms, isFirstClean: true, addons 
  });
  const recurringDuration = calculateCleaningDuration({ 
    sqft, bedrooms, bathrooms, isFirstClean: false 
  });
  
  return {
    // Base prices
    basePrice,
    recurringPrice,
    firstCleanPrice,
    
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
    firstCleanDuration,
    recurringDuration,
    
    // Frequency info
    frequency,
    frequencyDiscount: discount,
    frequencyDiscountPercent: Math.round(discount * 100),
    
    // Savings info
    savingsPerVisit: firstCleanPrice - recurringPrice,
  };
}

// ============================================
// CANCELLATION FEE CALCULATION
// ============================================

/**
 * Calculate cancellation fee based on time until job
 * 
 * @param {Date|string} scheduledDate - Scheduled job date
 * @param {number} jobPrice - Full job price
 * @returns {Object} Fee info
 */
export function calculateCancellationFee(scheduledDate, jobPrice) {
  const now = new Date();
  const jobDate = new Date(scheduledDate);
  const hoursUntilJob = (jobDate - now) / (1000 * 60 * 60);
  
  if (hoursUntilJob >= 48) {
    return {
      fee: 0,
      reason: 'Free cancellation (48+ hours notice)',
      canCancel: true,
    };
  } else if (hoursUntilJob >= 24) {
    return {
      fee: CANCELLATION_FEES['24_to_48h'],
      reason: '$25 late cancellation fee (24-48 hours notice)',
      canCancel: true,
    };
  } else {
    return {
      fee: jobPrice,
      reason: 'Full charge (less than 24 hours notice)',
      canCancel: true,
    };
  }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format price as currency
 * @param {number} price 
 * @returns {string}
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
 * Format frequency for display
 * @param {string} frequency 
 * @returns {string}
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

/**
 * Get frequency badge text
 * @param {string} frequency 
 * @returns {string}
 */
export function getFrequencyBadge(frequency) {
  const badges = {
    weekly: '35% off',
    biweekly: 'Most Popular',
    monthly: '10% off',
    onetime: 'Deep Clean',
  };
  return badges[frequency] || '';
}

// ============================================
// TIME SLOT UTILITIES
// ============================================

/**
 * Get time slot display text
 * @param {string} slot - 'morning' or 'afternoon'
 * @returns {string}
 */
export function formatTimeSlot(slot) {
  const slots = {
    morning: 'Morning (9am - 12pm)',
    afternoon: 'Afternoon (1pm - 5pm)',
  };
  return slots[slot] || slot;
}

/**
 * Get short time slot text
 * @param {string} slot 
 * @returns {string}
 */
export function formatTimeSlotShort(slot) {
  const slots = {
    morning: '9am - 12pm',
    afternoon: '1pm - 5pm',
  };
  return slots[slot] || slot;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  calculateCleaningDuration,
  calculateBasePrice,
  calculateCleaningPrice,
  calculateCancellationFee,
  formatPrice,
  formatDuration,
  formatFrequency,
  formatTimeSlot,
  formatTimeSlotShort,
  getFrequencyBadge,
  DEPOSIT_PERCENTAGE,
  FREQUENCY_DISCOUNTS,
};
