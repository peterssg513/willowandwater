import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Calendar,
  User,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  UserPlus,
  CalendarCheck,
  CreditCard,
  Users,
  Edit2,
  Trash2,
  Mail,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const ACTIVITY_TYPES = {
  booking_created: { icon: CalendarCheck, color: 'bg-blue-100 text-blue-600', label: 'New Booking' },
  booking_confirmed: { icon: CheckCircle2, color: 'bg-green-100 text-green-600', label: 'Booking Confirmed' },
  booking_completed: { icon: CheckCircle2, color: 'bg-sage/20 text-sage', label: 'Cleaning Completed' },
  booking_cancelled: { icon: XCircle, color: 'bg-red-100 text-red-600', label: 'Booking Cancelled' },
  payment_received: { icon: CreditCard, color: 'bg-green-100 text-green-600', label: 'Payment Received' },
  cleaner_assigned: { icon: User, color: 'bg-purple-100 text-purple-600', label: 'Cleaner Assigned' },
  cleaner_added: { icon: UserPlus, color: 'bg-blue-100 text-blue-600', label: 'Team Member Added' },
  cleaner_updated: { icon: Edit2, color: 'bg-yellow-100 text-yellow-600', label: 'Team Member Updated' },
  customer_note: { icon: Edit2, color: 'bg-gray-100 text-gray-600', label: 'Note Added' },
  email_sent: { icon: Mail, color: 'bg-indigo-100 text-indigo-600', label: 'Email Sent' },
  reminder_sent: { icon: Bell, color: 'bg-yellow-100 text-yellow-600', label: 'Reminder Sent' },
};

const ActivityLog = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, cleanersRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('cleaners').select('*').order('created_at', { ascending: false }),
      ]);

      let bookingsData = bookingsRes.data || [];
      let cleanersData = cleanersRes.data || [];
      
      if (bookingsData.length === 0) {
        bookingsData = JSON.parse(localStorage.getItem('bookings') || '[]');
      }
      if (cleanersData.length === 0) {
        cleanersData = JSON.parse(localStorage.getItem('cleaners') || '[]');
      }
      
      setBookings(bookingsData);
      setCleaners(cleanersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings(JSON.parse(localStorage.getItem('bookings') || '[]'));
      setCleaners(JSON.parse(localStorage.getItem('cleaners') || '[]'));
    } finally {
      setLoading(false);
    }
  };

  // Generate activity log from bookings and cleaners
  const activities = useMemo(() => {
    const logs = [];
    
    // Get date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1d': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(0);
    }

    // Add booking activities
    bookings.forEach(booking => {
      const createdAt = new Date(booking.created_at);
      if (createdAt < startDate) return;

      // Created
      logs.push({
        id: `${booking.id}-created`,
        type: 'booking_created',
        title: `New booking from ${booking.name}`,
        description: `${booking.sqft?.toLocaleString() || 'N/A'} sq ft • ${booking.frequency || 'one-time'}`,
        amount: booking.first_clean_price,
        timestamp: booking.created_at,
        relatedId: booking.id,
        relatedType: 'booking',
      });

      // Status changes (simulated based on status)
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        logs.push({
          id: `${booking.id}-confirmed`,
          type: 'booking_confirmed',
          title: `Booking confirmed for ${booking.name}`,
          description: booking.address,
          timestamp: booking.updated_at || booking.created_at,
          relatedId: booking.id,
          relatedType: 'booking',
        });
      }

      if (booking.status === 'completed') {
        logs.push({
          id: `${booking.id}-completed`,
          type: 'booking_completed',
          title: `Cleaning completed for ${booking.name}`,
          description: booking.address,
          timestamp: booking.updated_at || booking.created_at,
          relatedId: booking.id,
          relatedType: 'booking',
        });
      }

      if (booking.status === 'cancelled') {
        logs.push({
          id: `${booking.id}-cancelled`,
          type: 'booking_cancelled',
          title: `Booking cancelled for ${booking.name}`,
          description: booking.address,
          timestamp: booking.updated_at || booking.created_at,
          relatedId: booking.id,
          relatedType: 'booking',
        });
      }

      // Cleaner assigned
      if (booking.cleaner_id) {
        const cleaner = cleaners.find(c => c.id === booking.cleaner_id);
        logs.push({
          id: `${booking.id}-assigned`,
          type: 'cleaner_assigned',
          title: `${cleaner?.name || 'Cleaner'} assigned to ${booking.name}`,
          description: booking.scheduled_date 
            ? new Date(booking.scheduled_date).toLocaleDateString() 
            : 'Not scheduled',
          timestamp: booking.cleaner_notified_at || booking.updated_at || booking.created_at,
          relatedId: booking.id,
          relatedType: 'booking',
        });
      }

      // Payment (if confirmed)
      if (['confirmed', 'completed'].includes(booking.status) && booking.deposit_amount) {
        logs.push({
          id: `${booking.id}-payment`,
          type: 'payment_received',
          title: `Deposit received from ${booking.name}`,
          description: `20% deposit`,
          amount: booking.deposit_amount,
          timestamp: booking.updated_at || booking.created_at,
          relatedId: booking.id,
          relatedType: 'booking',
        });
      }
    });

    // Add cleaner activities
    cleaners.forEach(cleaner => {
      const createdAt = new Date(cleaner.created_at);
      if (createdAt < startDate) return;

      logs.push({
        id: `cleaner-${cleaner.id}-created`,
        type: 'cleaner_added',
        title: `${cleaner.name} added to team`,
        description: cleaner.email,
        timestamp: cleaner.created_at,
        relatedId: cleaner.id,
        relatedType: 'cleaner',
      });
    });

    // Sort by timestamp descending
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [bookings, cleaners, timeRange]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activities, filterType, searchQuery]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return groups;
  }, [filteredActivities]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
            Activity Log
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Track all actions and events in your business
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
          <p className="text-sm text-charcoal/50 font-inter mb-1">Total Activities</p>
          <p className="font-playfair text-2xl font-semibold text-charcoal">{filteredActivities.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <p className="text-sm text-charcoal/50 font-inter mb-1">New Bookings</p>
          <p className="font-playfair text-2xl font-semibold text-blue-600">
            {activities.filter(a => a.type === 'booking_created').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <p className="text-sm text-charcoal/50 font-inter mb-1">Completions</p>
          <p className="font-playfair text-2xl font-semibold text-green-600">
            {activities.filter(a => a.type === 'booking_completed').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <p className="text-sm text-charcoal/50 font-inter mb-1">Payments</p>
          <p className="font-playfair text-2xl font-semibold text-sage">
            {formatPrice(activities.filter(a => a.type === 'payment_received').reduce((sum, a) => sum + (a.amount || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter text-sm"
          >
            <option value="all">All Activities</option>
            <option value="booking_created">New Bookings</option>
            <option value="booking_confirmed">Confirmations</option>
            <option value="booking_completed">Completions</option>
            <option value="booking_cancelled">Cancellations</option>
            <option value="payment_received">Payments</option>
            <option value="cleaner_assigned">Assignments</option>
            <option value="cleaner_added">Team Updates</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date}>
            <h3 className="font-inter font-semibold text-charcoal mb-4 sticky top-0 bg-bone py-2">
              {date}
            </h3>
            <div className="space-y-3">
              {dayActivities.map((activity) => {
                const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.customer_note;
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl shadow-sm border border-charcoal/5 p-4 flex items-start gap-4"
                  >
                    <div className={`p-2.5 rounded-xl ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-inter font-medium text-charcoal">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-charcoal/60 mt-0.5">{activity.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {activity.amount && (
                            <p className="font-inter font-semibold text-sage">{formatPrice(activity.amount)}</p>
                          )}
                          <p className="text-xs text-charcoal/50">{formatTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <Activity className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            No activities found
          </h3>
          <p className="text-charcoal/60 font-inter">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Activities will appear here as you use the system'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
