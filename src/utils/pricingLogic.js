/**
 * Pricing Logic for Willow & Water
 * 
 * This file now re-exports from the profit-based pricing module
 * while maintaining backwards compatibility with existing imports.
 */

// Re-export all functions from profit-based pricing
export {
  calculateCleaningPrice,
  calculateDurationHours as calculateCleaningDuration,
  formatPrice,
  formatDuration,
  formatFrequency,
  getFrequencyBadge,
  formatPercent,
  getCleanerCount,
  calculateProfitablePricing,
  calculateJobCost,
  validatePriceProfitability,
  getCostSettings,
  COST_SETTINGS,
} from './profitPricingLogic';

// Import for internal use
import { COST_SETTINGS } from './profitPricingLogic';

// ============================================
// LEGACY EXPORTS (kept for backwards compatibility)
// ============================================

// Deposit percentage
export const DEPOSIT_PERCENTAGE = 0.20;

// Frequency discounts (updated values)
export const FREQUENCY_DISCOUNTS = {
  weekly: 0.15,     // 15% off (reduced from 35%)
  biweekly: 0.10,   // 10% off (reduced from 20%)
  monthly: 0.05,    // 5% off (reduced from 10%)
  onetime: 0,
};

// ============================================
// TIME SLOT UTILITIES (kept from original)
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
// LEGACY FUNCTIONS (for backwards compatibility)
// ============================================

/**
 * Calculate base cleaning price (legacy - uses old formula)
 * Kept for any code that still calls this directly
 */
export function calculateBasePrice({ sqft, bedrooms, bathrooms }) {
  const baseRate = 40; // $40 per 500 sqft
  let price = Math.ceil(sqft / 500) * baseRate;
  
  const extraBathrooms = Math.max(0, bathrooms - 2);
  price += extraBathrooms * 15;
  
  const extraBedrooms = Math.max(0, bedrooms - 3);
  price += extraBedrooms * 10;
  
  return price;
}

/**
 * Calculate cancellation fee based on time until job
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
      fee: 25,
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
// DEFAULT EXPORT (for backwards compatibility)
// ============================================

export default {
  calculateCleaningDuration: (params) => {
    // Import dynamically to avoid circular dependency
    const { calculateDurationHours } = require('./profitPricingLogic');
    return Math.round(calculateDurationHours(params) * 60); // Return minutes for legacy compatibility
  },
  calculateBasePrice,
  calculateCleaningPrice: (params) => {
    const { calculateCleaningPrice } = require('./profitPricingLogic');
    return calculateCleaningPrice(params);
  },
  calculateCancellationFee,
  formatPrice: (price) => {
    const { formatPrice } = require('./profitPricingLogic');
    return formatPrice(price);
  },
  formatDuration: (minutes) => {
    const { formatDuration } = require('./profitPricingLogic');
    return formatDuration(minutes); // Already takes minutes
  },
  formatFrequency: (freq) => {
    const { formatFrequency } = require('./profitPricingLogic');
    return formatFrequency(freq);
  },
  formatTimeSlot,
  formatTimeSlotShort,
  getFrequencyBadge: (freq) => {
    const { getFrequencyBadge } = require('./profitPricingLogic');
    return getFrequencyBadge(freq);
  },
  DEPOSIT_PERCENTAGE,
  FREQUENCY_DISCOUNTS,
};
