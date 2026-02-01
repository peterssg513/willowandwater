/**
 * Scheduling utilities for Willow & Water v2.0
 * 
 * Handles:
 * - Available date calculations
 * - Time slot availability
 * - Cleaner availability checking
 */

import { supabase } from '../lib/supabase';

// ============================================
// CONSTANTS & SETTINGS
// ============================================

// Working days (0 = Sunday, 6 = Saturday)
const WORKING_DAYS = [1, 2, 3, 4, 5]; // Monday - Friday

// Default booking window (can be overridden by database settings)
let MIN_DAYS_AHEAD = 14; // Must book at least 2 weeks out
let MAX_DAYS_AHEAD = 60; // Can book up to 2 months out
let EARLIEST_BOOKING_DATE = null; // Launch date restriction
let BOOKING_ENABLED = true;

// Settings cache
let schedulingSettings = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch scheduling settings from database
 * @returns {Promise<Object>}
 */
export async function fetchSchedulingSettings() {
  const now = Date.now();
  
  // Return cached if still valid
  if (schedulingSettings && (now - settingsCacheTime) < CACHE_DURATION) {
    return schedulingSettings;
  }
  
  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('key, value')
      .in('key', ['min_booking_days_ahead', 'max_booking_days_ahead', 'earliest_booking_date', 'booking_enabled']);
    
    if (error) throw error;
    
    // Parse settings (handle JSON-encoded values)
    const settings = {};
    data?.forEach(row => {
      // Try to parse JSON value, fall back to raw value
      try {
        settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      } catch {
        settings[row.key] = row.value;
      }
    });
    
    // Update module-level variables
    MIN_DAYS_AHEAD = parseInt(settings.min_booking_days_ahead) || 14;
    MAX_DAYS_AHEAD = parseInt(settings.max_booking_days_ahead) || 60;
    EARLIEST_BOOKING_DATE = settings.earliest_booking_date || null;
    BOOKING_ENABLED = settings.booking_enabled !== false && settings.booking_enabled !== 'false';
    
    schedulingSettings = {
      minDaysAhead: MIN_DAYS_AHEAD,
      maxDaysAhead: MAX_DAYS_AHEAD,
      earliestBookingDate: EARLIEST_BOOKING_DATE,
      bookingEnabled: BOOKING_ENABLED,
    };
    settingsCacheTime = now;
    
    return schedulingSettings;
  } catch (err) {
    console.error('Error fetching scheduling settings:', err);
    // Return defaults on error
    return {
      minDaysAhead: 14,
      maxDaysAhead: 60,
      earliestBookingDate: null,
      bookingEnabled: true,
    };
  }
}

/**
 * Get current scheduling settings (sync, uses cached values)
 * @returns {Object}
 */
export function getSchedulingSettings() {
  return {
    minDaysAhead: MIN_DAYS_AHEAD,
    maxDaysAhead: MAX_DAYS_AHEAD,
    earliestBookingDate: EARLIEST_BOOKING_DATE,
    bookingEnabled: BOOKING_ENABLED,
  };
}

/**
 * Clear settings cache (call after admin updates)
 */
export function clearSchedulingCache() {
  schedulingSettings = null;
  settingsCacheTime = 0;
}

// Time slots
export const TIME_SLOTS = {
  morning: { label: 'Morning', time: '9am - 12pm', start: 9, end: 12 },
  afternoon: { label: 'Afternoon', time: '1pm - 5pm', start: 13, end: 17 },
};

// Day names
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get the start of a day (midnight)
 * @param {Date} date 
 * @returns {Date}
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to a date
 * @param {Date} date 
 * @param {number} days 
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if a date is a working day (Mon-Fri)
 * @param {Date} date 
 * @returns {boolean}
 */
export function isWorkingDay(date) {
  return WORKING_DAYS.includes(date.getDay());
}

/**
 * Format date for display
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date for database (YYYY-MM-DD)
 * Uses local timezone to avoid UTC conversion issues
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateForDB(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get day name from date
 * @param {Date} date 
 * @returns {string}
 */
export function getDayName(date) {
  return DAY_NAMES[date.getDay()];
}

// ============================================
// AVAILABILITY CALCULATIONS
// ============================================

/**
 * Get the earliest bookable date
 * Takes into account:
 * - Minimum days ahead setting (default 2 weeks)
 * - Launch date restriction (earliest_booking_date)
 * @returns {Date}
 */
export function getEarliestBookableDate() {
  const today = startOfDay(new Date());
  let earliest = addDays(today, MIN_DAYS_AHEAD);
  
  // Check if there's a launch date restriction
  if (EARLIEST_BOOKING_DATE) {
    const launchDate = startOfDay(new Date(EARLIEST_BOOKING_DATE + 'T00:00:00'));
    if (launchDate > earliest) {
      earliest = launchDate;
    }
  }
  
  // If earliest is not a working day, find next working day
  while (!isWorkingDay(earliest)) {
    earliest = addDays(earliest, 1);
  }
  
  return earliest;
}

/**
 * Get the latest bookable date (2 months from today)
 * @returns {Date}
 */
export function getLatestBookableDate() {
  const today = startOfDay(new Date());
  return addDays(today, MAX_DAYS_AHEAD);
}

/**
 * Get all available dates for booking
 * @returns {Date[]}
 */
export function getAvailableDates() {
  const dates = [];
  const earliest = getEarliestBookableDate();
  const latest = getLatestBookableDate();
  
  let current = earliest;
  while (current <= latest) {
    if (isWorkingDay(current)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }
  
  return dates;
}

/**
 * Check if a specific date is bookable
 * @param {Date} date 
 * @returns {boolean}
 */
export function isDateBookable(date) {
  const d = startOfDay(new Date(date));
  const earliest = getEarliestBookableDate();
  const latest = getLatestBookableDate();
  
  return isWorkingDay(d) && d >= earliest && d <= latest;
}

/**
 * Get slot availability for a date
 * Based on number of cleaners and existing bookings
 * 
 * @param {Date} date - The date to check
 * @param {Array} existingJobs - Jobs already booked for this date
 * @param {Array} cleaners - Available cleaners
 * @param {Array} timeOff - Cleaner time off records
 * @returns {Object} Availability by slot
 */
export function getSlotAvailability(date, existingJobs = [], cleaners = [], timeOff = []) {
  const dateStr = formatDateForDB(date);
  
  // Count available cleaners for this date (not on PTO)
  const availableCleaners = cleaners.filter(cleaner => {
    if (cleaner.status !== 'active') return false;
    
    // Check if cleaner is on PTO
    const onPTO = timeOff.some(pto => {
      return pto.cleaner_id === cleaner.id &&
             dateStr >= pto.start_date &&
             dateStr <= pto.end_date;
    });
    
    return !onPTO;
  });
  
  const totalSlots = availableCleaners.length || 1; // Default to 1 if no cleaners
  
  // Count jobs already booked per slot
  const morningJobs = existingJobs.filter(j => 
    j.scheduled_date === dateStr && 
    j.scheduled_time === 'morning' &&
    !['cancelled', 'no_show'].includes(j.status)
  ).length;
  
  const afternoonJobs = existingJobs.filter(j => 
    j.scheduled_date === dateStr && 
    j.scheduled_time === 'afternoon' &&
    !['cancelled', 'no_show'].includes(j.status)
  ).length;
  
  return {
    morning: {
      available: morningJobs < totalSlots,
      slotsTotal: totalSlots,
      slotsBooked: morningJobs,
      slotsRemaining: Math.max(0, totalSlots - morningJobs),
    },
    afternoon: {
      available: afternoonJobs < totalSlots,
      slotsTotal: totalSlots,
      slotsBooked: afternoonJobs,
      slotsRemaining: Math.max(0, totalSlots - afternoonJobs),
    },
  };
}

/**
 * Generate calendar data for a month
 * @param {number} year 
 * @param {number} month - 0-indexed
 * @param {Array} existingJobs 
 * @param {Array} cleaners 
 * @param {Array} timeOff 
 * @returns {Array} Calendar weeks
 */
export function generateCalendarMonth(year, month, existingJobs = [], cleaners = [], timeOff = []) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let currentWeek = [];
  
  // Add empty cells for days before first of month
  const startPadding = firstDay.getDay();
  for (let i = 0; i < startPadding; i++) {
    currentWeek.push(null);
  }
  
  // Add each day of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const isBookable = isDateBookable(date);
    const availability = isBookable 
      ? getSlotAvailability(date, existingJobs, cleaners, timeOff)
      : null;
    
    currentWeek.push({
      date,
      day,
      isBookable,
      isWorkingDay: isWorkingDay(date),
      availability,
      hasAvailableSlots: availability 
        ? (availability.morning.available || availability.afternoon.available)
        : false,
    });
    
    // Start new week on Sunday
    if (date.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Add remaining days and padding
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

// ============================================
// NEXT RECURRING DATE
// ============================================

/**
 * Calculate next recurring job date
 * @param {Date} fromDate - Date to calculate from
 * @param {string} frequency - weekly, biweekly, monthly
 * @param {string} preferredDay - monday, tuesday, etc.
 * @returns {Date}
 */
export function getNextRecurringDate(fromDate, frequency, preferredDay) {
  const from = startOfDay(new Date(fromDate));
  const targetDayIndex = DAY_NAMES.indexOf(preferredDay);
  
  let nextDate;
  
  if (frequency === 'weekly') {
    nextDate = addDays(from, 7);
  } else if (frequency === 'biweekly') {
    nextDate = addDays(from, 14);
  } else if (frequency === 'monthly') {
    nextDate = new Date(from);
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    return null; // One-time jobs don't recur
  }
  
  // Adjust to preferred day of week
  if (targetDayIndex >= 0) {
    const currentDay = nextDate.getDay();
    const daysUntilTarget = (targetDayIndex - currentDay + 7) % 7;
    
    if (daysUntilTarget > 0) {
      nextDate = addDays(nextDate, daysUntilTarget);
    } else if (daysUntilTarget === 0 && nextDate <= from) {
      // If same day but in the past, go to next week
      nextDate = addDays(nextDate, 7);
    }
  }
  
  // Make sure it's at least MIN_DAYS_AHEAD from today
  const earliest = getEarliestBookableDate();
  while (nextDate < earliest) {
    if (frequency === 'weekly') {
      nextDate = addDays(nextDate, 7);
    } else if (frequency === 'biweekly') {
      nextDate = addDays(nextDate, 14);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  
  // Make sure it's a working day
  while (!isWorkingDay(nextDate)) {
    nextDate = addDays(nextDate, 1);
  }
  
  return nextDate;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  TIME_SLOTS,
  startOfDay,
  addDays,
  isWorkingDay,
  formatDate,
  formatDateForDB,
  getDayName,
  getEarliestBookableDate,
  getLatestBookableDate,
  getAvailableDates,
  isDateBookable,
  getSlotAvailability,
  generateCalendarMonth,
  getNextRecurringDate,
  fetchSchedulingSettings,
  getSchedulingSettings,
  clearSchedulingCache,
};
