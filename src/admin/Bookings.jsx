import { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  RefreshCw,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  ChevronDown,
  Filter,
  UserPlus
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

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
          .in('status', ['confirmed', 'completed', 'payment_initiated'])
          .order('scheduled_date', { ascending: true }),
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by time
    if (filter === 'upcoming') {
      result = result.filter(b => {
        if (!b.scheduled_date) return true;
        return new Date(b.scheduled_date) >= today;
      });
    } else if (filter === 'past') {
      result = result.filter(b => {
        if (!b.scheduled_date) return false;
        return new Date(b.scheduled_date) < today;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.phone?.includes(query) ||
        b.address?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookings, filter, searchQuery, today]);

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
    } catch (error) {
      console.error('Error assigning cleaner:', error);
    }
  };

  const updateStatus = async (bookingId, status) => {
    try {
      await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status } : b
      ));
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getCleanerName = (cleanerId) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    return cleaner?.name || 'Unassigned';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      payment_initiated: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
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
            Bookings
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {filteredBookings.length} {filter} booking{filteredBookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter Tabs */}
          <div className="flex bg-bone rounded-lg p-1">
            {['upcoming', 'past', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-inter text-sm capitalize transition-colors ${
                  filter === f ? 'bg-white shadow text-charcoal' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-bone border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="p-4 hover:bg-bone/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-inter font-semibold text-charcoal">{booking.name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatDate(booking.scheduled_date)}</span>
                        {booking.scheduled_time && (
                          <span className="text-charcoal/40">@ {booking.scheduled_time}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{booking.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatPrice(booking.first_clean_price)}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${booking.cleaner_id ? 'text-sage' : 'text-yellow-600'}`}>
                        <User className="w-4 h-4" />
                        <span>{getCleanerName(booking.cleaner_id)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CalendarDays className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No bookings found</h3>
            <p className="text-charcoal/50 text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Bookings will appear here once customers complete payment'}
            </p>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10">
              <div className="flex items-center justify-between">
                <h2 className="font-playfair text-xl font-semibold text-charcoal">{selectedBooking.name}</h2>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact */}
              <div className="bg-bone/50 rounded-xl p-4 space-y-2">
                <a href={`mailto:${selectedBooking.email}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                  <Mail className="w-4 h-4" />
                  {selectedBooking.email}
                </a>
                {selectedBooking.phone && (
                  <a href={`tel:${selectedBooking.phone}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                    <Phone className="w-4 h-4" />
                    {selectedBooking.phone}
                  </a>
                )}
                {selectedBooking.address && (
                  <p className="flex items-center gap-2 text-sm text-charcoal/70">
                    <MapPin className="w-4 h-4" />
                    {selectedBooking.address}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Scheduled Date</p>
                  <p className="font-inter font-medium text-charcoal">{formatDate(selectedBooking.scheduled_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Scheduled Time</p>
                  <p className="font-inter font-medium text-charcoal">
                    {selectedBooking.scheduled_time || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Frequency</p>
                  <p className="font-inter font-medium text-charcoal capitalize">{selectedBooking.frequency || 'One-time'}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Property</p>
                  <p className="font-inter font-medium text-charcoal">
                    {selectedBooking.sqft?.toLocaleString()} sqft • {selectedBooking.bedrooms}bd/{selectedBooking.bathrooms}ba
                  </p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Price</p>
                  <p className="font-inter font-medium text-charcoal">{formatPrice(selectedBooking.first_clean_price)}</p>
                </div>
                {selectedBooking.cal_booking_id && (
                  <div>
                    <p className="text-xs text-charcoal/50 mb-1">Cal.com Booking</p>
                    <p className="font-inter text-sm text-sage">{selectedBooking.cal_booking_id}</p>
                  </div>
                )}
              </div>

              {/* Cleaner Assignment */}
              <div className="bg-sage/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-charcoal/50 mb-1">Assigned Cleaner</p>
                    <p className={`font-inter font-medium ${selectedBooking.cleaner_id ? 'text-charcoal' : 'text-yellow-600'}`}>
                      {getCleanerName(selectedBooking.cleaner_id)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="btn-secondary text-sm"
                  >
                    {selectedBooking.cleaner_id ? 'Change' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.cleaning_instructions && (
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Special Instructions</p>
                  <p className="text-sm text-charcoal/70 bg-bone/50 rounded-xl p-3">
                    {selectedBooking.cleaning_instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus(selectedBooking.id, 'completed')}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Cleaner Modal */}
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
                  <p className="text-xs text-charcoal/50">{cleaner.phone}</p>
                </button>
              ))}
              {cleaners.length === 0 && (
                <p className="text-center text-charcoal/50 py-4">No active cleaners found</p>
              )}
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

export default Bookings;
