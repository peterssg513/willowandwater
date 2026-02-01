import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  Star,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Home,
  Clock,
  ChevronRight,
  RefreshCw,
  Download,
  MessageSquare,
  X,
  User,
  Send,
  Plus,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

// Quick Contact Button for Customer view
const QuickContactBtn = ({ type, value, name, label = true }) => {
  if (!value) return null;
  
  const config = {
    phone: { icon: Phone, href: `tel:${value}`, text: 'Call', className: 'bg-green-100 text-green-700 hover:bg-green-200' },
    email: { icon: Mail, href: `mailto:${value}`, text: 'Email', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    sms: { icon: MessageSquare, href: `sms:${value}?body=Hi ${name || ''}, this is Willow %26 Water Cleaning. `, text: 'Text', className: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  };
  
  const { icon: Icon, href, text, className } = config[type];
  
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-inter font-medium transition-colors ${className}`}
    >
      <Icon className="w-4 h-4" />
      {label && text}
    </a>
  );
};

const CustomerDetailModal = ({ customer, bookings, onClose, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(customer.notes ? JSON.parse(customer.notes) : []);
  const [activeTab, setActiveTab] = useState('overview');

  const customerBookings = bookings.filter(b => b.email === customer.email);
  const completedBookings = customerBookings.filter(b => b.status === 'completed');
  const upcomingBookings = customerBookings.filter(b => 
    b.scheduled_date && new Date(b.scheduled_date) > new Date() && b.status !== 'cancelled'
  );
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);
  const avgBookingValue = completedBookings.length > 0 ? totalSpent / completedBookings.length : 0;
  
  // Calculate estimated annual value
  const annualValue = customer.frequency === 'weekly' ? avgBookingValue * 52 :
                      customer.frequency === 'biweekly' ? avgBookingValue * 26 :
                      customer.frequency === 'monthly' ? avgBookingValue * 12 : 0;
  
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note = {
      id: Date.now(),
      text: newNote,
      date: new Date().toISOString(),
      author: 'Admin',
    };
    
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setNewNote('');
    onAddNote(customer.id, JSON.stringify(updatedNotes));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center">
                <span className="font-playfair text-2xl font-semibold text-sage">
                  {customer.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h2 className="font-playfair text-xl font-semibold text-charcoal">
                  {customer.name}
                </h2>
                <p className="text-sm text-charcoal/60 font-inter">{customer.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-inter ${
                    customer.frequency && customer.frequency !== 'onetime'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-charcoal/10 text-charcoal/70'
                  }`}>
                    {customer.frequency === 'weekly' ? 'Weekly' :
                     customer.frequency === 'biweekly' ? 'Bi-Weekly' :
                     customer.frequency === 'monthly' ? 'Monthly' : 'One-Time'}
                  </span>
                  <span className="text-xs text-charcoal/50">
                    Customer since {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Contact Buttons */}
          <div className="flex gap-2 mt-4">
            <QuickContactBtn type="phone" value={customer.phone} name={customer.name} />
            <QuickContactBtn type="sms" value={customer.phone} name={customer.name} />
            <QuickContactBtn type="email" value={customer.email} name={customer.name} />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-charcoal/10 px-6">
          <div className="flex gap-6">
            {['overview', 'history', 'notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-inter font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-sage text-sage'
                    : 'border-transparent text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <p className="font-playfair text-2xl font-semibold text-charcoal">
                    {completedBookings.length}
                  </p>
                  <p className="text-xs text-charcoal/50 font-inter">Cleanings</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <p className="font-playfair text-2xl font-semibold text-sage">
                    {formatPrice(totalSpent)}
                  </p>
                  <p className="text-xs text-charcoal/50 font-inter">Total Spent</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <p className="font-playfair text-2xl font-semibold text-charcoal">
                    {formatPrice(avgBookingValue)}
                  </p>
                  <p className="text-xs text-charcoal/50 font-inter">Avg. Value</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <p className="font-playfair text-2xl font-semibold text-purple-600">
                    {annualValue > 0 ? formatPrice(annualValue) : 'N/A'}
                  </p>
                  <p className="text-xs text-charcoal/50 font-inter">Est. Annual</p>
                </div>
              </div>

              {/* Upcoming Appointment Alert */}
              {upcomingBookings.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-inter font-medium text-blue-800">
                        Next cleaning: {new Date(upcomingBookings[0].scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-blue-600">
                        {upcomingBookings.length > 1 ? `+${upcomingBookings.length - 1} more scheduled` : 'Upcoming appointment'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Property Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-charcoal/10 rounded-xl p-4">
                  <h3 className="font-inter font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-sage" />
                    Contact Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-charcoal/40" />
                        <span className="text-charcoal">{customer.phone || 'No phone'}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex gap-1">
                          <a href={`tel:${customer.phone}`} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a href={`sms:${customer.phone}`} className="p-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-charcoal/40" />
                        <span className="text-charcoal truncate">{customer.email}</span>
                      </div>
                      <a href={`mailto:${customer.email}`} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-charcoal/10">
                      <MapPin className="w-4 h-4 text-charcoal/40 mt-0.5" />
                      <span className="text-charcoal">{customer.address || 'No address'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-charcoal/10 rounded-xl p-4">
                  <h3 className="font-inter font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-sage" />
                    Property Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Size</span>
                      <span className="text-charcoal font-medium">{customer.sqft?.toLocaleString() || 'N/A'} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Bedrooms</span>
                      <span className="text-charcoal font-medium">{customer.bedrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Bathrooms</span>
                      <span className="text-charcoal font-medium">{customer.bathrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Service Area</span>
                      <span className="text-charcoal font-medium">{customer.service_area || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-charcoal/10">
                      <span className="text-charcoal/60">Frequency</span>
                      <span className="text-charcoal font-medium capitalize">{customer.frequency || 'One-time'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Regular Price</span>
                      <span className="text-sage font-semibold">{formatPrice(customer.recurring_price || customer.first_clean_price || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {customer.cleaning_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <h3 className="font-inter font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Special Instructions
                  </h3>
                  <p className="text-sm text-yellow-900">{customer.cleaning_instructions}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="font-inter font-semibold text-charcoal mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-sage" />
                Service History ({customerBookings.length} bookings)
              </h3>
              {customerBookings.length > 0 ? (
                <div className="space-y-2">
                  {customerBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-bone/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'confirmed' ? 'bg-blue-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-inter font-medium text-charcoal">
                            {booking.scheduled_date 
                              ? new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Not scheduled'}
                          </p>
                          <p className="text-xs text-charcoal/50 capitalize">
                            {booking.status?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span className="font-inter font-semibold text-charcoal">
                        {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-charcoal/50 py-8 bg-bone/50 rounded-xl">
                  No booking history
                </p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="font-inter font-semibold text-charcoal mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sage" />
                Internal Notes
              </h3>
              <div className="space-y-3 mb-4">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-bone/50 rounded-xl p-4">
                      <p className="text-sm text-charcoal">{note.text}</p>
                      <p className="text-xs text-charcoal/50 mt-2">
                        {note.author} • {new Date(note.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-charcoal/50 py-8 bg-bone/50 rounded-xl">
                    No notes yet. Add notes to track important customer information.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this customer..."
                  className="flex-1 px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="btn-primary px-4 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-charcoal/10 flex gap-3">
          <a
            href={`mailto:${customer.email}`}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          <a
            href={`tel:${customer.phone}`}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        </div>
      </div>
    </div>
  );
};

const Customers = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, recurring, onetime
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setBookings(data);
      } else {
        const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        setBookings(localBookings);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      setBookings(localBookings);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate customers from bookings (by email)
  const customers = useMemo(() => {
    const customerMap = new Map();
    
    bookings.forEach((booking) => {
      if (!booking.email) return;
      
      const existing = customerMap.get(booking.email);
      if (!existing || new Date(booking.created_at) > new Date(existing.created_at)) {
        customerMap.set(booking.email, {
          ...booking,
          bookingCount: (existing?.bookingCount || 0) + 1,
          totalSpent: (existing?.totalSpent || 0) + (booking.first_clean_price || 0),
        });
      } else {
        customerMap.set(booking.email, {
          ...existing,
          bookingCount: existing.bookingCount + 1,
          totalSpent: existing.totalSpent + (booking.first_clean_price || 0),
        });
      }
    });
    
    return Array.from(customerMap.values());
  }, [bookings]);

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query) ||
          c.address?.toLowerCase().includes(query)
      );
    }

    if (typeFilter === 'recurring') {
      filtered = filtered.filter(c => c.frequency && c.frequency !== 'onetime');
    } else if (typeFilter === 'onetime') {
      filtered = filtered.filter(c => !c.frequency || c.frequency === 'onetime');
    }

    return filtered.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, searchQuery, typeFilter]);

  const handleAddNote = async (customerId, notes) => {
    try {
      await supabase
        .from('bookings')
        .update({ notes })
        .eq('id', customerId);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const recurring = customers.filter(c => c.frequency && c.frequency !== 'onetime');
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgValue = customers.length > 0 ? totalRevenue / customers.length : 0;
    
    return {
      total: customers.length,
      recurring: recurring.length,
      totalRevenue,
      avgValue,
    };
  }, [customers]);

  const exportCustomers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Frequency', 'Bookings', 'Total Spent'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email,
      c.phone,
      c.address,
      c.frequency,
      c.bookingCount,
      c.totalSpent,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportCustomers} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-charcoal">{stats.total}</p>
          <p className="text-sm text-charcoal/50 font-inter">Total Customers</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-green-600">{stats.recurring}</p>
          <p className="text-sm text-charcoal/50 font-inter">Recurring</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sage/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-sage" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-sage">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Total Revenue</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-purple-600">
            {formatPrice(stats.avgValue)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Avg. Customer Value</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="all">All Customers</option>
              <option value="recurring">Recurring Only</option>
              <option value="onetime">One-Time Only</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>
        <p className="mt-3 text-sm text-charcoal/50 font-inter">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>

      {/* Customer List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.email}
            onClick={() => setSelectedCustomer(customer)}
            className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-5 cursor-pointer
                       hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                  <span className="font-inter font-semibold text-sage">
                    {customer.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-inter font-semibold text-charcoal">{customer.name}</h3>
                  <p className="text-xs text-charcoal/50">{customer.email}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-inter ${
                customer.frequency && customer.frequency !== 'onetime'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-charcoal/10 text-charcoal/60'
              }`}>
                {customer.frequency && customer.frequency !== 'onetime' ? 'Recurring' : 'One-Time'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-charcoal/50">Bookings</p>
                <p className="font-inter font-medium text-charcoal">{customer.bookingCount}</p>
              </div>
              <div>
                <p className="text-charcoal/50">Total Spent</p>
                <p className="font-inter font-medium text-sage">{formatPrice(customer.totalSpent)}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-charcoal/10 flex items-center justify-between">
              <span className="text-xs text-charcoal/50">
                {customer.service_area || 'Fox Valley'}
              </span>
              <ChevronRight className="w-4 h-4 text-charcoal/30" />
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <Users className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            No customers found
          </h3>
          <p className="text-charcoal/60 font-inter">
            {searchQuery ? 'Try adjusting your search' : 'Customers will appear here when they book'}
          </p>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          bookings={bookings}
          onClose={() => setSelectedCustomer(null)}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
};

export default Customers;
