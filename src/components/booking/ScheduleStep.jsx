import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { 
  generateCalendarMonth, 
  formatDate, 
  formatDateForDB,
  TIME_SLOTS,
  getEarliestBookableDate,
  getLatestBookableDate,
  getDayName
} from '../../utils/scheduling';
import { formatDuration } from '../../utils/pricingLogic';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PREFERRED_DAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
];

/**
 * ScheduleStep - Date and time selection
 */
const ScheduleStep = ({ data, onBack, onComplete }) => {
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const earliest = getEarliestBookableDate();
    return { year: earliest.getFullYear(), month: earliest.getMonth() };
  });
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState(data.selectedDate || null);
  const [selectedTime, setSelectedTime] = useState(data.selectedTime || null);
  const [preferredDay, setPreferredDay] = useState(data.preferredDay || 'tuesday');
  const [preferredTime, setPreferredTime] = useState(data.preferredTime || 'morning');
  
  // Data state
  const [existingJobs, setExistingJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing bookings and cleaners
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const earliest = getEarliestBookableDate();
        const latest = getLatestBookableDate();
        
        // Fetch jobs, cleaners, and time off in parallel
        const [jobsRes, cleanersRes, timeOffRes] = await Promise.all([
          supabase
            .from('jobs')
            .select('id, scheduled_date, scheduled_time, status')
            .gte('scheduled_date', formatDateForDB(earliest))
            .lte('scheduled_date', formatDateForDB(latest))
            .not('status', 'in', '("cancelled","no_show")'),
          supabase
            .from('cleaners')
            .select('*')
            .eq('status', 'active'),
          supabase
            .from('cleaner_time_off')
            .select('*')
            .gte('end_date', formatDateForDB(earliest))
        ]);
        
        setExistingJobs(jobsRes.data || []);
        setCleaners(cleanersRes.data || []);
        setTimeOff(timeOffRes.data || []);
      } catch (err) {
        console.error('Error fetching schedule data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate calendar data
  const calendarWeeks = useMemo(() => {
    return generateCalendarMonth(
      currentMonth.year,
      currentMonth.month,
      existingJobs,
      cleaners,
      timeOff
    );
  }, [currentMonth, existingJobs, cleaners, timeOff]);

  // Get availability for selected date
  const selectedDateAvailability = useMemo(() => {
    if (!selectedDate) return null;
    
    for (const week of calendarWeeks) {
      for (const day of week) {
        if (day && day.date && formatDateForDB(day.date) === formatDateForDB(selectedDate)) {
          return day.availability;
        }
      }
    }
    return null;
  }, [selectedDate, calendarWeeks]);

  // Month navigation
  const earliest = getEarliestBookableDate();
  const latest = getLatestBookableDate();
  
  const canGoPrev = new Date(currentMonth.year, currentMonth.month) > 
                    new Date(earliest.getFullYear(), earliest.getMonth());
  const canGoNext = new Date(currentMonth.year, currentMonth.month) < 
                    new Date(latest.getFullYear(), latest.getMonth());

  const goToPrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(prev => {
        const newMonth = prev.month - 1;
        if (newMonth < 0) {
          return { year: prev.year - 1, month: 11 };
        }
        return { ...prev, month: newMonth };
      });
    }
  };

  const goToNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(prev => {
        const newMonth = prev.month + 1;
        if (newMonth > 11) {
          return { year: prev.year + 1, month: 0 };
        }
        return { ...prev, month: newMonth };
      });
    }
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    if (!day || !day.isBookable || !day.hasAvailableSlots) return;
    setSelectedDate(day.date);
    setSelectedTime(null); // Reset time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (slot) => {
    if (!selectedDateAvailability?.[slot]?.available) return;
    setSelectedTime(slot);
  };

  // Handle continue
  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    
    onComplete({
      selectedDate,
      selectedTime,
      preferredDay: data.frequency !== 'onetime' ? preferredDay : null,
      preferredTime: data.frequency !== 'onetime' ? preferredTime : null,
    });
  };

  // Month/Year label
  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const isRecurring = data.frequency !== 'onetime';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-playfair font-semibold text-charcoal mb-2">
          Schedule Your First Clean
        </h3>
        <p className="text-charcoal/60 font-inter">
          Select a date and time that works for you
        </p>
        <p className="text-sm text-sage font-inter mt-1">
          Estimated duration: {formatDuration(data.pricing?.firstCleanDuration || 180)}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sage" />
        </div>
      ) : (
        <>
          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-charcoal/10 p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPrevMonth}
                disabled={!canGoPrev}
                className="p-2 rounded-lg hover:bg-charcoal/5 disabled:opacity-30 
                           disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-charcoal" />
              </button>
              <h4 className="font-playfair text-lg font-semibold text-charcoal">
                {monthLabel}
              </h4>
              <button
                onClick={goToNextMonth}
                disabled={!canGoNext}
                className="p-2 rounded-lg hover:bg-charcoal/5 disabled:opacity-30 
                           disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-charcoal" />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_LABELS.map(day => (
                <div key={day} className="text-center text-xs font-inter font-medium text-charcoal/50 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarWeeks.flat().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="p-2" />;
                }

                const isSelected = selectedDate && 
                  formatDateForDB(day.date) === formatDateForDB(selectedDate);
                const isAvailable = day.isBookable && day.hasAvailableSlots;

                return (
                  <button
                    key={formatDateForDB(day.date)}
                    onClick={() => handleDateSelect(day)}
                    disabled={!isAvailable}
                    className={`
                      relative p-2 sm:p-3 rounded-xl text-center transition-all
                      ${isSelected 
                        ? 'bg-sage text-white ring-2 ring-sage ring-offset-2' 
                        : isAvailable
                          ? 'hover:bg-sage/10 text-charcoal'
                          : 'text-charcoal/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="font-inter text-sm sm:text-base">{day.day}</span>
                    {isAvailable && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 
                                       bg-sage rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-charcoal/50">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-sage rounded-full" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-charcoal/20 rounded-full" />
                <span>Unavailable</span>
              </div>
            </div>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="space-y-4">
              <h4 className="font-inter font-medium text-charcoal">
                Select Time for {formatDate(selectedDate)}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Morning */}
                <button
                  onClick={() => handleTimeSelect('morning')}
                  disabled={!selectedDateAvailability?.morning?.available}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${selectedTime === 'morning'
                      ? 'border-sage bg-sage/10'
                      : selectedDateAvailability?.morning?.available
                        ? 'border-charcoal/10 hover:border-sage/50'
                        : 'border-charcoal/5 bg-charcoal/5 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sun className={`w-5 h-5 ${
                      selectedTime === 'morning' ? 'text-sage' : 'text-yellow-500'
                    }`} />
                    <span className="font-inter font-medium text-charcoal">Morning</span>
                  </div>
                  <p className="text-sm text-charcoal/60">9am - 12pm</p>
                  {selectedDateAvailability?.morning?.available ? (
                    <p className="text-xs text-sage mt-1">
                      {selectedDateAvailability.morning.slotsRemaining} slot{selectedDateAvailability.morning.slotsRemaining !== 1 ? 's' : ''} available
                    </p>
                  ) : (
                    <p className="text-xs text-charcoal/40 mt-1">Fully booked</p>
                  )}
                </button>

                {/* Afternoon */}
                <button
                  onClick={() => handleTimeSelect('afternoon')}
                  disabled={!selectedDateAvailability?.afternoon?.available}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${selectedTime === 'afternoon'
                      ? 'border-sage bg-sage/10'
                      : selectedDateAvailability?.afternoon?.available
                        ? 'border-charcoal/10 hover:border-sage/50'
                        : 'border-charcoal/5 bg-charcoal/5 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Moon className={`w-5 h-5 ${
                      selectedTime === 'afternoon' ? 'text-sage' : 'text-indigo-500'
                    }`} />
                    <span className="font-inter font-medium text-charcoal">Afternoon</span>
                  </div>
                  <p className="text-sm text-charcoal/60">1pm - 5pm</p>
                  {selectedDateAvailability?.afternoon?.available ? (
                    <p className="text-xs text-sage mt-1">
                      {selectedDateAvailability.afternoon.slotsRemaining} slot{selectedDateAvailability.afternoon.slotsRemaining !== 1 ? 's' : ''} available
                    </p>
                  ) : (
                    <p className="text-xs text-charcoal/40 mt-1">Fully booked</p>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Recurring Preferences */}
          {isRecurring && selectedDate && selectedTime && (
            <div className="space-y-4 pt-4 border-t border-charcoal/10">
              <h4 className="font-inter font-medium text-charcoal">
                Preferred Day & Time for Future Cleanings
              </h4>
              <p className="text-sm text-charcoal/60">
                We'll try to schedule your {data.frequency} cleanings on this day and time
              </p>

              {/* Preferred Day */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Preferred Day
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREFERRED_DAYS.map(day => (
                    <button
                      key={day.id}
                      onClick={() => setPreferredDay(day.id)}
                      className={`
                        px-4 py-2 rounded-xl border-2 text-sm font-inter transition-all
                        ${preferredDay === day.id
                          ? 'border-sage bg-sage/10 text-charcoal'
                          : 'border-charcoal/10 hover:border-sage/50 text-charcoal/70'
                        }
                      `}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Preferred Time
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreferredTime('morning')}
                    className={`
                      flex-1 p-3 rounded-xl border-2 text-center transition-all
                      ${preferredTime === 'morning'
                        ? 'border-sage bg-sage/10'
                        : 'border-charcoal/10 hover:border-sage/50'
                      }
                    `}
                  >
                    <Sun className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <span className="text-sm font-inter">Morning</span>
                  </button>
                  <button
                    onClick={() => setPreferredTime('afternoon')}
                    className={`
                      flex-1 p-3 rounded-xl border-2 text-center transition-all
                      ${preferredTime === 'afternoon'
                        ? 'border-sage bg-sage/10'
                        : 'border-charcoal/10 hover:border-sage/50'
                      }
                    `}
                  >
                    <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                    <span className="text-sm font-inter">Afternoon</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 rounded-xl
                     font-inter font-medium text-charcoal hover:bg-charcoal/5
                     transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default ScheduleStep;
