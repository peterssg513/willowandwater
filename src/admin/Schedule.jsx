import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
  User,
  Clock,
  Printer,
  Filter,
  Phone
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCleaner, setSelectedCleaner] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, cleanersRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .in('status', ['confirmed', 'payment_initiated'])
          .order('scheduled_date'),
        supabase
          .from('cleaners')
          .select('*')
          .eq('status', 'active')
      ]);

      setBookings(bookingsRes.data || []);
      setCleaners(cleanersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Previous month padding
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(prevYear, prevMonth, daysInPrevMonth - i), isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({ date: new Date(nextYear, nextMonth, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((booking) => {
      const bookingDate = booking.scheduled_date?.split('T')[0];
      const matchesDate = bookingDate === dateStr;
      const matchesCleaner = selectedCleaner === 'all' || booking.cleaner_id === selectedCleaner;
      return matchesDate && matchesCleaner;
    });
  };

  const getCleanerName = (cleanerId) => {
    const cleaner = cleaners.find((c) => c.id === cleanerId);
    return cleaner?.name?.split(' ')[0] || 'Unassigned';
  };

  const assignCleaner = async (bookingId, cleanerId) => {
    try {
      await supabase
        .from('bookings')
        .update({ cleaner_id: cleanerId })
        .eq('id', bookingId);

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, cleaner_id: cleanerId } : b
      ));
      setShowAssignModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error assigning cleaner:', error);
    }
  };

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const isToday = (date) => date.toDateString() === new Date().toDateString();

  // Print schedule for a week
  const handlePrint = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekBookings = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayBookings = getBookingsForDate(day);
      if (dayBookings.length > 0) {
        weekBookings.push({ date: day, bookings: dayBookings });
      }
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Weekly Schedule - Willow & Water</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #36454F; margin-bottom: 5px; }
          h2 { color: #71797E; font-size: 14px; margin-top: 0; }
          .day { margin-bottom: 20px; page-break-inside: avoid; }
          .day-header { background: #71797E; color: white; padding: 8px 12px; font-weight: bold; }
          .booking { border: 1px solid #ddd; padding: 10px; margin-top: 5px; }
          .booking-name { font-weight: bold; color: #36454F; }
          .booking-details { font-size: 12px; color: #666; margin-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Willow & Water - Weekly Schedule</h1>
        <h2>Week of ${startOfWeek.toLocaleDateString()}</h2>
        ${weekBookings.map(({ date, bookings }) => `
          <div class="day">
            <div class="day-header">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            ${bookings.map(b => `
              <div class="booking">
                <div class="booking-name">${b.name}</div>
                <div class="booking-details">
                  📍 ${b.address || 'No address'}<br>
                  📞 ${b.phone || 'No phone'}<br>
                  🏠 ${b.sqft} sqft • ${b.bedrooms}bd/${b.bathrooms}ba<br>
                  👤 Cleaner: ${getCleanerName(b.cleaner_id)}
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
        ${weekBookings.length === 0 ? '<p>No bookings scheduled for this week.</p>' : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Schedule
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Calendar view of all bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Week
          </button>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-bone rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-charcoal" />
            </button>
            <h2 className="font-playfair text-xl font-semibold text-charcoal min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-bone rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-charcoal" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-inter text-sage hover:bg-sage/10 rounded-lg transition-colors">
              Today
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="all">All Cleaners</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-bone/50 border-b border-charcoal/10">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-3 text-center font-inter text-sm font-semibold text-charcoal">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayBookings = getBookingsForDate(day.date);
            const isPast = day.date < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={index}
                className={`min-h-[100px] border-b border-r border-charcoal/5 p-2 
                  ${!day.isCurrentMonth ? 'bg-bone/30' : ''}
                  ${isToday(day.date) ? 'bg-sage/5' : ''}
                  ${isPast && day.isCurrentMonth ? 'opacity-60' : ''}
                `}
              >
                <div className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full font-inter text-sm mb-1
                  ${isToday(day.date) ? 'bg-sage text-white font-semibold' : ''}
                  ${!day.isCurrentMonth ? 'text-charcoal/30' : 'text-charcoal'}
                `}>
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-inter transition-colors
                        ${booking.cleaner_id 
                          ? 'bg-sage/10 text-sage hover:bg-sage/20' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }
                      `}
                    >
                      <div className="font-medium truncate">{booking.name}</div>
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <p className="text-xs text-charcoal/50 font-inter px-2">
                      +{dayBookings.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm font-inter">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sage/10 border border-sage/30" />
          <span className="text-charcoal/70">Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-charcoal/70">Needs Assignment</span>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-charcoal/10">
              <h2 className="font-playfair text-lg font-semibold text-charcoal">{selectedBooking.name}</h2>
              <p className="text-sm text-charcoal/50">
                {new Date(selectedBooking.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-charcoal/40" />
                <span className="text-charcoal">{selectedBooking.address || 'No address'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-charcoal/40" />
                <a href={`tel:${selectedBooking.phone}`} className="text-sage hover:underline">
                  {selectedBooking.phone || 'No phone'}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-charcoal/40" />
                <span className={selectedBooking.cleaner_id ? 'text-charcoal' : 'text-yellow-600'}>
                  {getCleanerName(selectedBooking.cleaner_id)}
                </span>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-sage text-xs hover:underline ml-auto"
                >
                  {selectedBooking.cleaner_id ? 'Change' : 'Assign'}
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-charcoal/10">
              <button onClick={() => setSelectedBooking(null)} className="btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-charcoal/10">
              <h2 className="font-playfair text-lg font-semibold text-charcoal">Assign Cleaner</h2>
            </div>
            <div className="p-6 space-y-2">
              {cleaners.map((cleaner) => (
                <button
                  key={cleaner.id}
                  onClick={() => assignCleaner(selectedBooking.id, cleaner.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    selectedBooking.cleaner_id === cleaner.id
                      ? 'border-sage bg-sage/5'
                      : 'border-charcoal/10 hover:border-sage/50'
                  }`}
                >
                  <p className="font-inter font-medium text-charcoal">{cleaner.name}</p>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-charcoal/10">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary w-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
