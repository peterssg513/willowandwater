import { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  ChevronRight,
  Pause,
  Play,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const FREQUENCY_OPTIONS = [
  { value: 'all', label: 'All Frequencies' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  onetime: 'One-Time',
};

const FREQUENCY_COLORS = {
  weekly: 'bg-green-100 text-green-700 border-green-200',
  biweekly: 'bg-blue-100 text-blue-700 border-blue-200',
  monthly: 'bg-purple-100 text-purple-700 border-purple-200',
};

const RecurringJobCard = ({ booking, cleaners, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const cleaner = cleaners.find(c => c.id === booking.cleaner_id);
  
  const nextCleaningDate = () => {
    if (!booking.scheduled_date) return 'Not scheduled';
    
    const date = new Date(booking.scheduled_date);
    const now = new Date();
    
    // If scheduled date is in the past, calculate next occurrence
    if (date < now) {
      const frequency = booking.frequency;
      let nextDate = new Date(date);
      
      while (nextDate < now) {
        if (frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (frequency === 'biweekly') {
          nextDate.setDate(nextDate.getDate() + 14);
        } else if (frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          break;
        }
      }
      
      return nextDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePauseResume = async () => {
    const newStatus = booking.status === 'paused' ? 'confirmed' : 'paused';
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);
      
      if (error) throw error;
      onUpdate({ ...booking, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
      {/* Main Card */}
      <div 
        className="p-5 cursor-pointer hover:bg-bone/30 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
              <span className="font-inter font-semibold text-sage">
                {booking.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-inter font-semibold text-charcoal">{booking.name}</h3>
              <p className="text-xs text-charcoal/50 font-inter">{booking.email}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-inter font-medium border ${
            FREQUENCY_COLORS[booking.frequency] || 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {FREQUENCY_LABELS[booking.frequency] || 'Unknown'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-charcoal/40" />
            <span className="text-charcoal/70">{nextCleaningDate()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-charcoal/40" />
            <span className="text-charcoal/70">{formatPrice(booking.recurring_price || 0)}/visit</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-charcoal/40" />
            <span className={cleaner ? 'text-charcoal/70' : 'text-yellow-600'}>
              {cleaner?.name || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-charcoal/40" />
            <span className="text-charcoal/70 truncate">{booking.service_area || 'Unknown'}</span>
          </div>
        </div>

        {/* Status indicator */}
        {booking.status === 'paused' && (
          <div className="mt-3 flex items-center gap-2 text-yellow-600 text-sm font-inter">
            <Pause className="w-4 h-4" />
            <span>Paused</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button 
            className="text-sage hover:text-charcoal font-inter text-sm flex items-center gap-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? 'Hide details' : 'View details'}
            <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-charcoal/10 bg-bone/30 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-charcoal/50 font-inter mb-1">Address</p>
              <p className="text-sm text-charcoal">{booking.address || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 font-inter mb-1">Phone</p>
              <p className="text-sm text-charcoal">{booking.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 font-inter mb-1">Home Size</p>
              <p className="text-sm text-charcoal">
                {booking.sqft?.toLocaleString()} sq ft • {booking.bedrooms} bed, {booking.bathrooms} bath
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 font-inter mb-1">Started</p>
              <p className="text-sm text-charcoal">
                {new Date(booking.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {booking.cleaning_instructions && (
            <div>
              <p className="text-xs text-charcoal/50 font-inter mb-1">Instructions</p>
              <p className="text-sm text-charcoal bg-white p-3 rounded-lg">
                {booking.cleaning_instructions}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePauseResume();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-inter text-sm transition-colors ${
                booking.status === 'paused'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              {booking.status === 'paused' ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume Service
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Service
                </>
              )}
            </button>
            <a
              href={`/admin/bookings?search=${encodeURIComponent(booking.email)}`}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal/10 text-charcoal rounded-xl font-inter text-sm hover:bg-charcoal/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Full Booking
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const Recurring = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

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
          .neq('frequency', 'onetime')
          .in('status', ['confirmed', 'completed', 'paused'])
          .order('created_at', { ascending: false }),
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

  const handleUpdateBooking = (updatedBooking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.email?.toLowerCase().includes(query) ||
          b.address?.toLowerCase().includes(query)
      );
    }

    if (frequencyFilter !== 'all') {
      filtered = filtered.filter((b) => b.frequency === frequencyFilter);
    }

    return filtered;
  }, [bookings, searchQuery, frequencyFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = bookings.filter(b => b.status !== 'paused');
    const paused = bookings.filter(b => b.status === 'paused');
    
    const monthlyRecurring = active.reduce((sum, b) => {
      const price = b.recurring_price || 0;
      if (b.frequency === 'weekly') return sum + (price * 4);
      if (b.frequency === 'biweekly') return sum + (price * 2);
      if (b.frequency === 'monthly') return sum + price;
      return sum;
    }, 0);

    return {
      total: bookings.length,
      active: active.length,
      paused: paused.length,
      monthlyRecurring,
    };
  }, [bookings]);

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
            Recurring Jobs
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Manage your regular cleaning customers
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sage/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-sage" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-charcoal">{stats.total}</p>
          <p className="text-sm text-charcoal/50 font-inter">Total Recurring</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-green-600">{stats.active}</p>
          <p className="text-sm text-charcoal/50 font-inter">Active</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Pause className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-yellow-600">{stats.paused}</p>
          <p className="text-sm text-charcoal/50 font-inter">Paused</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-blue-600">
            {formatPrice(stats.monthlyRecurring)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Est. Monthly</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by name, email, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div className="relative">
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>
        <p className="mt-3 text-sm text-charcoal/50 font-inter">
          Showing {filteredBookings.length} of {bookings.length} recurring jobs
        </p>
      </div>

      {/* Jobs Grid */}
      {filteredBookings.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => (
            <RecurringJobCard
              key={booking.id}
              booking={booking}
              cleaners={cleaners}
              onUpdate={handleUpdateBooking}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-sage" />
          </div>
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            No recurring jobs found
          </h3>
          <p className="text-charcoal/60 font-inter">
            {searchQuery || frequencyFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Recurring jobs will appear here when customers sign up for regular cleanings'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Recurring;
