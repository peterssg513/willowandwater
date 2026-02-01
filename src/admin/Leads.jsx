import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  DollarSign,
  ExternalLink,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'lead')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToBooking = async (leadId) => {
    try {
      // First try with customer_type
      let result = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          customer_type: 'first_time'
        })
        .eq('id', leadId)
        .select();

      // If that fails (customer_type column might not exist), try without it
      if (result.error && result.error.message.includes('customer_type')) {
        console.log('Retrying without customer_type field');
        result = await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', leadId)
          .select();
      }

      // If still failing due to updated_at trigger, try a simpler update
      if (result.error && result.error.message.includes('updated_at')) {
        console.log('Trigger error, trying direct status update');
        result = await supabase.rpc('update_booking_status', {
          booking_id: leadId,
          new_status: 'confirmed'
        });
        
        // If RPC doesn't exist, just do basic update
        if (result.error) {
          result = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', leadId);
        }
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        alert(`Failed to convert lead: ${result.error.message}\n\nPlease run the migration in supabase/migrations/009_fix_bookings_table.sql`);
        return;
      }

      console.log('Lead converted successfully:', result.data);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
      alert('Lead converted to booking successfully!');
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead. Please try again.');
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await supabase
        .from('bookings')
        .delete()
        .eq('id', leadId);

      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(query) ||
      lead.address?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
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
            Leads
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {leads.length} potential customers waiting to book
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
          <button onClick={fetchLeads} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                       font-inter focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredLeads.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-4 hover:bg-bone/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-inter font-semibold text-charcoal">{lead.name}</h3>
                        <p className="text-sm text-charcoal/50">{lead.email}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <Home className="w-4 h-4" />
                        <span>{lead.sqft?.toLocaleString() || '?'} sqft • {lead.bedrooms || '?'}bd/{lead.bathrooms || '?'}ba</span>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatPrice(lead.first_clean_price)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-charcoal/30" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No leads found</h3>
            <p className="text-charcoal/50 text-sm mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Leads will appear here when customers request quotes'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead Manually
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newLead) => {
            setLeads(prev => [newLead, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedLead(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10">
              <h2 className="font-playfair text-xl font-semibold text-charcoal">Lead Details</h2>
              <p className="text-sm text-charcoal/50 font-inter mt-1">
                Created {formatDate(selectedLead.created_at)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-inter font-semibold text-charcoal text-sm">Contact Information</h3>
                <div className="bg-bone/50 rounded-xl p-4 space-y-2">
                  <p className="font-inter text-charcoal font-medium">{selectedLead.name}</p>
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                    <Mail className="w-4 h-4" />
                    {selectedLead.email}
                  </a>
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                      <Phone className="w-4 h-4" />
                      {selectedLead.phone}
                    </a>
                  )}
                  {selectedLead.address && (
                    <p className="flex items-center gap-2 text-sm text-charcoal/70">
                      <MapPin className="w-4 h-4" />
                      {selectedLead.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-3">
                <h3 className="font-inter font-semibold text-charcoal text-sm">Property Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bone/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-charcoal">{selectedLead.sqft?.toLocaleString() || '—'}</p>
                    <p className="text-xs text-charcoal/50">Sq Ft</p>
                  </div>
                  <div className="bg-bone/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-charcoal">{selectedLead.bedrooms || '—'}</p>
                    <p className="text-xs text-charcoal/50">Bedrooms</p>
                  </div>
                  <div className="bg-bone/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-charcoal">{selectedLead.bathrooms || '—'}</p>
                    <p className="text-xs text-charcoal/50">Bathrooms</p>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="space-y-3">
                <h3 className="font-inter font-semibold text-charcoal text-sm">Quote</h3>
                <div className="bg-sage/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-charcoal/70">First Clean</span>
                    <span className="font-semibold text-charcoal">{formatPrice(selectedLead.first_clean_price)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-charcoal/70">Recurring ({selectedLead.frequency || 'One-time'})</span>
                    <span className="font-semibold text-charcoal">{formatPrice(selectedLead.recurring_price)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => deleteLead(selectedLead.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-inter text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setSelectedLead(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => convertToBooking(selectedLead.id)}
                className="btn-primary flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Convert to Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Lead Modal Component
const AddLeadModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    sqft: '',
    bedrooms: '',
    bathrooms: '',
    frequency: 'onetime',
    first_clean_price: '',
    recurring_price: '',
    notes: '',
    source: 'manual'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate required fields
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      setSaving(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert({
          name: formData.name,
          email: formData.email.toLowerCase(),
          phone: formData.phone || null,
          address: formData.address || null,
          sqft: formData.sqft ? parseInt(formData.sqft) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          frequency: formData.frequency,
          first_clean_price: formData.first_clean_price ? parseFloat(formData.first_clean_price) : null,
          recurring_price: formData.recurring_price ? parseFloat(formData.recurring_price) : null,
          notes: formData.notes || null,
          source: formData.source,
          status: 'lead',
          customer_type: 'first_time'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      onAdd(data);
    } catch (err) {
      console.error('Error adding lead:', err);
      setError(err.message || 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Add New Lead</h2>
          <p className="text-sm text-charcoal/50 font-inter mt-1">
            Manually add a potential customer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="font-inter font-semibold text-charcoal text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-sage" />
              Contact Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="(630) 555-1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="123 Main St, St. Charles, IL 60174"
              />
            </div>
          </div>

          {/* Property Details Section */}
          <div className="space-y-4 pt-4 border-t border-charcoal/10">
            <h3 className="font-inter font-semibold text-charcoal text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-sage" />
              Property Details
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Sq Ft</label>
                <input
                  type="number"
                  value={formData.sqft}
                  onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Beds</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Baths</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="2.5"
                />
              </div>
            </div>
          </div>

          {/* Service & Pricing Section */}
          <div className="space-y-4 pt-4 border-t border-charcoal/10">
            <h3 className="font-inter font-semibold text-charcoal text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-sage" />
              Service & Pricing
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="onetime">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">First Clean Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.first_clean_price}
                    onChange={(e) => setFormData({ ...formData, first_clean_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                               focus:outline-none focus:ring-2 focus:ring-sage"
                    placeholder="200.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Recurring Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.recurring_price}
                    onChange={(e) => setFormData({ ...formData, recurring_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                               focus:outline-none focus:ring-2 focus:ring-sage"
                    placeholder="150.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="pt-4 border-t border-charcoal/10">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              placeholder="Any special notes about this lead..."
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Lead Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="manual">Manual Entry</option>
              <option value="phone">Phone Call</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Leads;
