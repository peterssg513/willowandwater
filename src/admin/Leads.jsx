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
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

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
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', leadId);

      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error converting lead:', error);
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
        <button onClick={fetchLeads} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
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
            <p className="text-charcoal/50 text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Leads will appear here when customers request quotes'}
            </p>
          </div>
        )}
      </div>

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

export default Leads;
