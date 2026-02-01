import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  User,
  MapPin,
  Clock,
  Home,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Sparkles,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Quick Contact Button Component
const QuickContactButton = ({ type, value, name }) => {
  if (!value) return null;
  
  const config = {
    phone: {
      icon: Phone,
      href: `tel:${value}`,
      label: 'Call',
      className: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    email: {
      icon: Mail,
      href: `mailto:${value}?subject=Your Willow %26 Water Cleaning`,
      label: 'Email',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    sms: {
      icon: MessageSquare,
      href: `sms:${value}?body=Hi ${name || ''}, this is Willow %26 Water Cleaning. `,
      label: 'Text',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
  };
  
  const { icon: Icon, href, label, className } = config[type];
  
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-colors ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </a>
  );
};

// Smart Assignment Modal
const AssignCleanerModal = ({ booking, cleaners, onClose, onAssign }) => {
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Smart suggestions - find best match based on availability and workload
  const suggestions = useMemo(() => {
    if (!cleaners.length) return [];
    
    const bookingDate = new Date(booking.scheduled_date);
    const dayName = DAYS[bookingDate.getDay()].toLowerCase();
    
    return cleaners
      .map(cleaner => {
        let score = 0;
        const reasons = [];
        
        // Check if available on this day
        const availableDays = cleaner.available_days || [];
        const dayMap = { sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday' };
        const fullDay = dayMap[dayName];
        
        if (availableDays.includes(fullDay)) {
          score += 30;
          reasons.push('Available');
        }
        
        // Check service area match
        const serviceAreas = cleaner.service_areas || [];
        const bookingArea = booking.service_area?.toLowerCase().replace(/\s+/g, '-');
        if (serviceAreas.includes(bookingArea)) {
          score += 25;
          reasons.push('Covers area');
        }
        
        // Lower assignments = higher priority (round robin fairness)
        const assignments = cleaner.total_assignments || 0;
        score += Math.max(0, 20 - assignments);
        if (assignments < 10) reasons.push('Low workload');
        
        // Recency - haven't been assigned recently
        const lastAssigned = cleaner.last_assigned_at ? new Date(cleaner.last_assigned_at) : null;
        if (!lastAssigned || (Date.now() - lastAssigned.getTime()) > 7 * 24 * 60 * 60 * 1000) {
          score += 15;
          reasons.push('Available');
        }
        
        return { ...cleaner, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [cleaners, booking]);

  const handleAssign = async () => {
    if (!selectedCleaner) return;
    setIsAssigning(true);
    await onAssign(booking.id, selectedCleaner);
    setIsAssigning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-center justify-between">
            <h2 className="font-playfair text-xl font-semibold text-charcoal">
              Assign Cleaner
            </h2>
            <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-charcoal/60 font-inter mt-1">
            {booking.name} • {new Date(booking.scheduled_date).toLocaleDateString()}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-charcoal font-inter">Recommended</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((cleaner) => (
                  <button
                    key={cleaner.id}
                    onClick={() => setSelectedCleaner(cleaner.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedCleaner === cleaner.id
                        ? 'border-sage bg-sage/5'
                        : 'border-charcoal/10 hover:border-sage/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-inter font-medium text-charcoal">{cleaner.name}</span>
                      {selectedCleaner === cleaner.id && (
                        <Check className="w-5 h-5 text-sage" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cleaner.reasons.map((reason, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-sage/10 text-sage rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Cleaners Dropdown */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 font-inter">
              Or select from all cleaners
            </label>
            <div className="relative">
              <select
                value={selectedCleaner}
                onChange={(e) => setSelectedCleaner(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl
                           font-inter focus:outline-none focus:ring-2 focus:ring-sage pr-10"
              >
                <option value="">Select a cleaner...</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-charcoal/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCleaner || isAssigning}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAssigning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Booking Detail Modal
const BookingDetailModal = ({ booking, cleaners, onClose, onAssign, onStatusChange }) => {
  const cleaner = cleaners.find(c => c.id === booking.cleaner_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal">
                {booking.name}
              </h3>
              <p className="text-sm text-charcoal/60 font-inter mt-1">
                {new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Contact Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <QuickContactButton type="phone" value={booking.phone} name={booking.name} />
            <QuickContactButton type="sms" value={booking.phone} name={booking.name} />
            <QuickContactButton type="email" value={booking.email} name={booking.name} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-xs text-charcoal/50 font-inter">Address</p>
                  <p className="text-sm text-charcoal">{booking.address || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Home className="w-4 h-4 text-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-xs text-charcoal/50 font-inter">Property</p>
                  <p className="text-sm text-charcoal">
                    {booking.sqft?.toLocaleString()} sq ft<br />
                    {booking.bedrooms} bed, {booking.bathrooms} bath
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-xs text-charcoal/50 font-inter">Frequency</p>
                  <p className="text-sm text-charcoal capitalize">{booking.frequency || 'One-time'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-xs text-charcoal/50 font-inter">Price</p>
                  <p className="text-sm text-charcoal font-semibold">
                    {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Cleaner */}
          <div className={`p-4 rounded-xl ${cleaner ? 'bg-sage/5 border border-sage/20' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  cleaner ? 'bg-sage/10' : 'bg-yellow-100'
                }`}>
                  <User className={`w-5 h-5 ${cleaner ? 'text-sage' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 font-inter">Assigned Cleaner</p>
                  <p className={`font-inter font-medium ${cleaner ? 'text-charcoal' : 'text-yellow-700'}`}>
                    {cleaner ? cleaner.name : 'Unassigned'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onAssign(booking)}
                className={`px-3 py-1.5 rounded-lg text-sm font-inter font-medium transition-colors ${
                  cleaner 
                    ? 'text-sage hover:bg-sage/10' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {cleaner ? 'Change' : 'Assign Now'}
              </button>
            </div>
            {cleaner && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-sage/20">
                <QuickContactButton type="phone" value={cleaner.phone} name={cleaner.name} />
                <QuickContactButton type="sms" value={cleaner.phone} name={cleaner.name} />
              </div>
            )}
          </div>

          {/* Instructions */}
          {booking.cleaning_instructions && (
            <div className="bg-bone/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-charcoal mb-1 font-inter">Special Instructions</p>
              <p className="text-sm text-charcoal/80">{booking.cleaning_instructions}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-t border-charcoal/10">
          <p className="text-xs font-medium text-charcoal/50 mb-3 font-inter">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {booking.status !== 'completed' && (
              <button
                onClick={() => onStatusChange(booking.id, 'completed')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-inter font-medium 
                           hover:bg-green-200 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-charcoal/5 text-charcoal rounded-lg text-sm font-inter font-medium 
                         hover:bg-charcoal/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedCleaner, setSelectedCleaner] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, cleanersRes] = await Promise.all([
        supabase.from('bookings').select('*').order('scheduled_date'),
        supabase.from('cleaners').select('*').eq('status', 'active'),
      ]);

      setBookings(bookingsRes.data || []);
      setCleaners(cleanersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings([]);
      setCleaners([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle cleaner assignment
  const handleAssignCleaner = async (bookingId, cleanerId) => {
    try {
      await supabase
        .from('bookings')
        .update({ cleaner_id: cleanerId })
        .eq('id', bookingId);

      // Update cleaner stats
      const cleaner = cleaners.find(c => c.id === cleanerId);
      if (cleaner) {
        await supabase
          .from('cleaners')
          .update({ 
            last_assigned_at: new Date().toISOString(),
            total_assignments: (cleaner.total_assignments || 0) + 1
          })
          .eq('id', cleanerId);
      }
    } catch (error) {
      console.error('Error assigning cleaner:', error);
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, cleaner_id: cleanerId } : b
    ));

    setAssigningBooking(null);
    setShowAssignModal(false);
  };

  // Handle status change
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
    } catch (error) {
      console.error('Error updating status:', error);
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: newStatus } : b
    ));
    
    setSelectedBooking(null);
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
    
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(prevYear, prevMonth, daysInPrevMonth - i), isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
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
      return matchesDate && matchesCleaner && booking.status !== 'cancelled';
    });
  };

  const getCleanerName = (cleanerId) => {
    const cleaner = cleaners.find((c) => c.id === cleanerId);
    return cleaner?.name?.split(' ')[0] || 'Unassigned';
  };

  // Get unassigned jobs count
  const unassignedJobs = useMemo(() => {
    return bookings.filter(b => !b.cleaner_id && b.scheduled_date && b.status !== 'cancelled');
  }, [bookings]);

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const isToday = (date) => date.toDateString() === new Date().toDateString();

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
            View and manage cleaning appointments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {unassignedJobs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-inter font-medium text-yellow-800">
                {unassignedJobs.length} job{unassignedJobs.length > 1 ? 's' : ''} need{unassignedJobs.length === 1 ? 's' : ''} assignment
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Click on yellow jobs in the calendar to assign a cleaner
              </p>
            </div>
            <button
              onClick={() => {
                if (unassignedJobs.length > 0) {
                  setAssigningBooking(unassignedJobs[0]);
                  setShowAssignModal(true);
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-inter font-medium 
                         hover:bg-yellow-600 transition-colors whitespace-nowrap"
            >
              Assign Now
            </button>
          </div>
        </div>
      )}

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

          <div className="flex items-center gap-3">
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
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="grid grid-cols-7 bg-bone/50 border-b border-charcoal/10">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-3 text-center font-inter text-sm font-semibold text-charcoal">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayBookings = getBookingsForDate(day.date);
            const isPast = day.date < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-charcoal/5 p-2 
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
                      className={`w-full text-left px-2 py-1.5 rounded text-xs font-inter transition-colors
                        ${booking.cleaner_id 
                          ? 'bg-sage/10 text-sage hover:bg-sage/20' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 animate-pulse'
                        }
                      `}
                    >
                      <div className="font-medium truncate">{booking.name}</div>
                      <div className="text-[10px] opacity-75 truncate">
                        {getCleanerName(booking.cleaner_id)}
                      </div>
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

      {/* Legend & Stats */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-inter">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sage/10 border border-sage/30" />
            <span className="text-charcoal/70">Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300 animate-pulse" />
            <span className="text-charcoal/70">Needs Assignment</span>
          </div>
        </div>

        {/* This Week Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-charcoal/5 p-4">
          <h3 className="font-inter text-sm font-semibold text-charcoal mb-3">This Week</h3>
          <div className="grid grid-cols-4 gap-2">
            {(() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);

              const weekBookings = bookings.filter((b) => {
                const date = new Date(b.scheduled_date);
                return date >= weekStart && date <= weekEnd && b.status !== 'cancelled';
              });

              const assigned = weekBookings.filter((b) => b.cleaner_id).length;
              const unassigned = weekBookings.filter((b) => !b.cleaner_id).length;
              const revenue = weekBookings.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);

              return (
                <>
                  <div className="text-center p-2 bg-bone/50 rounded-lg">
                    <p className="font-playfair text-lg font-semibold text-charcoal">{weekBookings.length}</p>
                    <p className="text-[10px] text-charcoal/50 font-inter">Jobs</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="font-playfair text-lg font-semibold text-green-600">{assigned}</p>
                    <p className="text-[10px] text-charcoal/50 font-inter">Ready</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <p className="font-playfair text-lg font-semibold text-yellow-600">{unassigned}</p>
                    <p className="text-[10px] text-charcoal/50 font-inter">Pending</p>
                  </div>
                  <div className="text-center p-2 bg-sage/10 rounded-lg">
                    <p className="font-playfair text-lg font-semibold text-sage">${Math.round(revenue)}</p>
                    <p className="text-[10px] text-charcoal/50 font-inter">Revenue</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          cleaners={cleaners}
          onClose={() => setSelectedBooking(null)}
          onAssign={(booking) => {
            setAssigningBooking(booking);
            setShowAssignModal(true);
            setSelectedBooking(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Assign Cleaner Modal */}
      {showAssignModal && assigningBooking && (
        <AssignCleanerModal
          booking={assigningBooking}
          cleaners={cleaners}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningBooking(null);
          }}
          onAssign={handleAssignCleaner}
        />
      )}
    </div>
  );
};

export default Schedule;
