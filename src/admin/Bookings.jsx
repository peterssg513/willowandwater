import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Home,
  DollarSign,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  UserPlus,
  RefreshCw,
  Download,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'lead', label: 'Leads' },
  { value: 'payment_initiated', label: 'Payment Initiated' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  lead: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  payment_initiated: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-sage/20 text-sage border-sage/30',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const BookingDetailModal = ({ booking, cleaners, onClose, onUpdate }) => {
  const [selectedCleaner, setSelectedCleaner] = useState(booking.cleaner_id || '');
  const [status, setStatus] = useState(booking.status || 'lead');
  const [notes, setNotes] = useState(booking.cleaning_instructions || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        status,
        cleaner_id: selectedCleaner || null,
        cleaning_instructions: notes,
      };

      // If assigning a cleaner, update their assignment tracking
      if (selectedCleaner && selectedCleaner !== booking.cleaner_id) {
        // Get current cleaner data to increment
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('total_assignments')
          .eq('id', selectedCleaner)
          .single();
        
        await supabase
          .from('cleaners')
          .update({ 
            last_assigned_at: new Date().toISOString(),
            total_assignments: (cleanerData?.total_assignments || 0) + 1
          })
          .eq('id', selectedCleaner);
      }

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', booking.id);

      if (error) throw error;

      onUpdate({ ...booking, ...updates });
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            Booking Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-inter font-semibold text-charcoal mb-3">Customer Information</h3>
            <div className="bg-bone/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-charcoal/50" />
                <span className="font-inter text-charcoal">{booking.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-charcoal/50" />
                <a href={`mailto:${booking.email}`} className="font-inter text-sage hover:underline">
                  {booking.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-charcoal/50" />
                <a href={`tel:${booking.phone}`} className="font-inter text-sage hover:underline">
                  {booking.phone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-charcoal/50 mt-0.5" />
                <span className="font-inter text-charcoal">{booking.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h3 className="font-inter font-semibold text-charcoal mb-3">Service Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bone/50 rounded-xl p-4">
                <p className="text-xs text-charcoal/50 font-inter mb-1">Home Size</p>
                <p className="font-inter font-medium text-charcoal">
                  {booking.sqft?.toLocaleString() || 'N/A'} sq ft
                </p>
              </div>
              <div className="bg-bone/50 rounded-xl p-4">
                <p className="text-xs text-charcoal/50 font-inter mb-1">Rooms</p>
                <p className="font-inter font-medium text-charcoal">
                  {booking.bedrooms || 0} bed, {booking.bathrooms || 0} bath
                </p>
              </div>
              <div className="bg-bone/50 rounded-xl p-4">
                <p className="text-xs text-charcoal/50 font-inter mb-1">Frequency</p>
                <p className="font-inter font-medium text-charcoal capitalize">
                  {booking.frequency || 'One-time'}
                </p>
              </div>
              <div className="bg-bone/50 rounded-xl p-4">
                <p className="text-xs text-charcoal/50 font-inter mb-1">Price</p>
                <p className="font-inter font-medium text-charcoal">
                  {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          {booking.scheduled_date && (
            <div>
              <h3 className="font-inter font-semibold text-charcoal mb-3">Schedule</h3>
              <div className="bg-sage/10 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sage" />
                <span className="font-inter text-charcoal">
                  {new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block font-inter font-semibold text-charcoal mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              {STATUS_OPTIONS.filter(s => s.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Cleaner */}
          <div>
            <label className="block font-inter font-semibold text-charcoal mb-2">
              Assigned Cleaner
            </label>
            <select
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-inter font-semibold text-charcoal mb-2">
              Cleaning Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Special instructions for the cleaning team..."
              className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         placeholder:text-charcoal/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-charcoal/10 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsResponse, cleanersResponse] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('cleaners').select('*').eq('status', 'active'),
      ]);

      setBookings(bookingsResponse.data || []);
      setCleaners(cleanersResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings([]);
      setCleaners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.email?.toLowerCase().includes(query) ||
          b.phone?.includes(query) ||
          b.address?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, searchQuery, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleUpdateBooking = (updatedBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Batch actions
  const handleBatchStatusChange = async (newStatus) => {
    const ids = Array.from(selectedIds);
    
    try {
      for (const id of ids) {
        await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
    
    setBookings(prev => prev.map(b => 
      selectedIds.has(b.id) ? { ...b, status: newStatus } : b
    ));
    
    setSelectedIds(new Set());
    setShowBatchActions(false);
  };

  const handleBatchAssign = async (cleanerId) => {
    const ids = Array.from(selectedIds);
    
    try {
      for (const id of ids) {
        await supabase.from('bookings').update({ cleaner_id: cleanerId }).eq('id', id);
      }
    } catch (error) {
      console.error('Error assigning cleaner:', error);
    }
    
    setBookings(prev => prev.map(b => 
      selectedIds.has(b.id) ? { ...b, cleaner_id: cleanerId } : b
    ));
    
    setSelectedIds(new Set());
    setShowBatchActions(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'SqFt', 'Bedrooms', 'Bathrooms', 'Frequency', 'Price', 'Status', 'Date'];
    const rows = filteredBookings.map(b => [
      b.name,
      b.email,
      b.phone,
      b.address,
      b.sqft,
      b.bedrooms,
      b.bathrooms,
      b.frequency,
      b.first_clean_price || b.recurring_price,
      b.status,
      b.scheduled_date || b.created_at,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
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
            Manage all customer bookings and leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>

        {/* Results count */}
        <p className="mt-3 text-sm text-charcoal/50 font-inter">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-sage/10 border border-sage/30 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-inter font-medium text-charcoal">
                {selectedIds.size} booking{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-charcoal/60 hover:text-charcoal font-inter"
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBatchStatusChange('confirmed')}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-inter font-medium 
                           hover:bg-green-200 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm
              </button>
              <button
                onClick={() => handleBatchStatusChange('completed')}
                className="px-3 py-1.5 bg-sage/20 text-sage rounded-lg text-sm font-inter font-medium 
                           hover:bg-sage/30 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={() => handleBatchStatusChange('cancelled')}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-inter font-medium 
                           hover:bg-red-200 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <div className="relative">
                <select
                  onChange={(e) => e.target.value && handleBatchAssign(e.target.value)}
                  defaultValue=""
                  className="appearance-none px-3 py-1.5 pr-8 bg-blue-100 text-blue-700 rounded-lg text-sm font-inter font-medium 
                             hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  <option value="">Assign to...</option>
                  {cleaners.filter(c => c.status === 'active').map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>
                  ))}
                </select>
                <UserPlus className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bone/50 border-b border-charcoal/10">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-charcoal/30 text-sage focus:ring-sage cursor-pointer"
                  />
                </th>
                <th 
                  className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal cursor-pointer hover:bg-bone"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Customer
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal hidden md:table-cell">
                  Contact
                </th>
                <th 
                  className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal cursor-pointer hover:bg-bone hidden lg:table-cell"
                  onClick={() => handleSort('sqft')}
                >
                  <div className="flex items-center gap-1">
                    Home
                    <SortIcon columnKey="sqft" />
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal cursor-pointer hover:bg-bone"
                  onClick={() => handleSort('first_clean_price')}
                >
                  <div className="flex items-center gap-1">
                    Price
                    <SortIcon columnKey="first_clean_price" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal">
                  Status
                </th>
                <th 
                  className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal cursor-pointer hover:bg-bone hidden sm:table-cell"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon columnKey="created_at" />
                  </div>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr 
                    key={booking.id} 
                    className={`border-b border-charcoal/5 hover:bg-bone/30 transition-colors cursor-pointer
                               ${selectedIds.has(booking.id) ? 'bg-sage/5' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(booking.id)}
                        onChange={() => toggleSelect(booking.id)}
                        className="w-4 h-4 rounded border-charcoal/30 text-sage focus:ring-sage cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4" onClick={() => setSelectedBooking(booking)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-inter font-semibold text-sage">
                            {booking.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-inter font-medium text-charcoal truncate">
                            {booking.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-charcoal/50 font-inter truncate md:hidden">
                            {booking.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="font-inter text-sm text-charcoal">{booking.email}</p>
                      <p className="text-xs text-charcoal/50">{booking.phone}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="font-inter text-sm text-charcoal">
                        {booking.sqft?.toLocaleString() || 'N/A'} sq ft
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {booking.bedrooms || 0} bed, {booking.bathrooms || 0} bath
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-inter font-semibold text-charcoal">
                        {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
                      </p>
                      <p className="text-xs text-charcoal/50 capitalize">
                        {booking.frequency || 'one-time'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-inter font-medium border ${
                        STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {booking.status?.replace('_', ' ') || 'lead'}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="font-inter text-sm text-charcoal/70">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-charcoal/50">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-inter">No bookings found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          cleaners={cleaners}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleUpdateBooking}
        />
      )}
    </div>
  );
};

export default Bookings;
