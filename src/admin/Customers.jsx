import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  RefreshCw,
  DollarSign,
  Repeat,
  Star,
  Clock,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Customers = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recurring, one-time

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build unique customers from bookings
  const customers = useMemo(() => {
    const customerMap = new Map();

    bookings.forEach(booking => {
      const key = booking.email?.toLowerCase();
      if (!key) return;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          email: booking.email,
          name: booking.name,
          phone: booking.phone,
          address: booking.address,
          frequency: booking.frequency,
          sqft: booking.sqft,
          bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms,
          bookings: [],
          totalSpent: 0,
          firstBooking: booking.created_at,
          lastBooking: booking.scheduled_date || booking.created_at,
        });
      }

      const customer = customerMap.get(key);
      customer.bookings.push(booking);
      customer.totalSpent += booking.first_clean_price || booking.recurring_price || 0;
      
      // Update to most recent booking info
      if (booking.scheduled_date > customer.lastBooking) {
        customer.lastBooking = booking.scheduled_date;
      }
      if (booking.name) customer.name = booking.name;
      if (booking.phone) customer.phone = booking.phone;
      if (booking.address) customer.address = booking.address;
      if (booking.frequency && booking.frequency !== 'onetime') {
        customer.frequency = booking.frequency;
        customer.isRecurring = true;
      }
    });

    return Array.from(customerMap.values());
  }, [bookings]);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Filter by type
    if (filter === 'recurring') {
      result = result.filter(c => c.isRecurring);
    } else if (filter === 'one-time') {
      result = result.filter(c => !c.isRecurring);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.address?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking));
  }, [customers, filter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0);
  };

  // Generate next booking for recurring customer
  const scheduleNextBooking = async (customer) => {
    if (!customer.isRecurring) return;

    const lastBookingDate = new Date(customer.lastBooking);
    let nextDate = new Date(lastBookingDate);

    // Calculate next date based on frequency
    switch (customer.frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return;
    }

    const lastBooking = customer.bookings[0]; // Most recent booking

    try {
      const { error } = await supabase.from('bookings').insert({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        sqft: customer.sqft,
        bedrooms: customer.bedrooms,
        bathrooms: customer.bathrooms,
        frequency: customer.frequency,
        recurring_price: lastBooking.recurring_price,
        first_clean_price: lastBooking.recurring_price, // Use recurring price
        scheduled_date: nextDate.toISOString().split('T')[0],
        status: 'confirmed',
        cleaner_id: lastBooking.cleaner_id,
      });

      if (error) throw error;
      
      alert(`Next cleaning scheduled for ${formatDate(nextDate)}`);
      fetchBookings();
    } catch (error) {
      console.error('Error scheduling booking:', error);
      alert('Failed to schedule next booking');
    }
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
            Customers
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {customers.length} total customers • {customers.filter(c => c.isRecurring).length} recurring
          </p>
        </div>
        <button onClick={fetchBookings} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter Tabs */}
          <div className="flex bg-bone rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'recurring', label: 'Recurring' },
              { key: 'one-time', label: 'One-time' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                  filter === f.key ? 'bg-white shadow text-charcoal' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-bone border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredCustomers.map((customer, index) => (
              <div
                key={customer.email}
                onClick={() => setSelectedCustomer(customer)}
                className="p-4 hover:bg-bone/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                        <span className="font-inter font-semibold text-sage">
                          {customer.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-inter font-semibold text-charcoal">{customer.name}</h3>
                        <p className="text-sm text-charcoal/50">{customer.email}</p>
                      </div>
                      {customer.isRecurring && (
                        <span className="px-2 py-1 bg-sage/10 text-sage rounded-full text-xs font-inter font-medium flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {customer.frequency}
                        </span>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <Calendar className="w-4 h-4" />
                        <span>{customer.bookings.length} booking{customer.bookings.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatPrice(customer.totalSpent)} total</span>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <Clock className="w-4 h-4" />
                        <span>Last: {formatDate(customer.lastBooking)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No customers found</h3>
            <p className="text-charcoal/50 text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Customers will appear here once bookings are completed'}
            </p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center">
                  <span className="font-playfair text-2xl font-semibold text-sage">
                    {selectedCustomer.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-charcoal">{selectedCustomer.name}</h2>
                  {selectedCustomer.isRecurring && (
                    <span className="px-2 py-1 bg-sage/10 text-sage rounded-full text-xs font-inter font-medium inline-flex items-center gap-1 mt-1">
                      <Repeat className="w-3 h-3" />
                      {selectedCustomer.frequency} customer
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="bg-bone/50 rounded-xl p-4 space-y-2">
                <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                  <Mail className="w-4 h-4" />
                  {selectedCustomer.email}
                </a>
                {selectedCustomer.phone && (
                  <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                    <Phone className="w-4 h-4" />
                    {selectedCustomer.phone}
                  </a>
                )}
                {selectedCustomer.address && (
                  <p className="flex items-center gap-2 text-sm text-charcoal/70">
                    <MapPin className="w-4 h-4" />
                    {selectedCustomer.address}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-sage/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-charcoal">{selectedCustomer.bookings.length}</p>
                  <p className="text-xs text-charcoal/50">Bookings</p>
                </div>
                <div className="bg-sage/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-charcoal">{formatPrice(selectedCustomer.totalSpent)}</p>
                  <p className="text-xs text-charcoal/50">Total Spent</p>
                </div>
                <div className="bg-sage/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-charcoal">
                    {selectedCustomer.sqft?.toLocaleString() || '—'}
                  </p>
                  <p className="text-xs text-charcoal/50">Sq Ft</p>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h3 className="font-inter font-semibold text-charcoal text-sm mb-3">Booking History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.bookings.slice(0, 10).map((booking, i) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-bone/50 rounded-lg">
                      <div>
                        <p className="text-sm font-inter text-charcoal">{formatDate(booking.scheduled_date)}</p>
                        <p className="text-xs text-charcoal/50">{booking.status}</p>
                      </div>
                      <p className="font-inter font-medium text-charcoal">{formatPrice(booking.first_clean_price || booking.recurring_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              {selectedCustomer.isRecurring && (
                <button
                  onClick={() => scheduleNextBooking(selectedCustomer)}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Next
                </button>
              )}
              <button onClick={() => setSelectedCustomer(null)} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
