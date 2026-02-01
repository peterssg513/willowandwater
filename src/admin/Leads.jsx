import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MessageSquare,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  UserPlus
} from 'lucide-react';
import { formatPrice } from '../utils/pricingLogic';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: UserPlus },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        new: data?.filter(l => l.status === 'new').length || 0,
        contacted: data?.filter(l => l.status === 'contacted').length || 0,
        qualified: data?.filter(l => l.status === 'qualified').length || 0,
        converted: data?.filter(l => l.status === 'converted').length || 0
      };
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'contacted' && !leads.find(l => l.id === leadId)?.contacted_at) {
        updates.contacted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  const updateFollowUpNotes = async (leadId, notes) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ follow_up_notes: notes })
        .eq('id', leadId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating notes:', err);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = search === '' || 
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search);
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-semibold text-charcoal">Leads</h1>
          <p className="text-charcoal/60 font-inter text-sm">
            Track and manage prospects from your landing page
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage/90 transition-colors font-inter text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-charcoal/60 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-inter">Total</span>
          </div>
          <p className="text-2xl font-semibold text-charcoal">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-inter">New</span>
          </div>
          <p className="text-2xl font-semibold text-blue-600">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-inter">Contacted</span>
          </div>
          <p className="text-2xl font-semibold text-yellow-600">{stats.contacted}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-inter">Qualified</span>
          </div>
          <p className="text-2xl font-semibold text-purple-600">{stats.qualified}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-inter">Converted</span>
          </div>
          <p className="text-2xl font-semibold text-green-600">{stats.converted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-charcoal/10 rounded-lg font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-charcoal/40" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-charcoal/10 rounded-lg font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-sage/30 border-t-sage rounded-full animate-spin mx-auto mb-2" />
            <p className="text-charcoal/60 font-inter text-sm">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-semibold text-charcoal mb-1">No leads yet</h3>
            <p className="text-charcoal/60 font-inter text-sm">
              Leads will appear here when people submit the form on your landing page.
            </p>
            <p className="text-charcoal/40 font-inter text-xs mt-4">
              Share your landing page: <code className="bg-charcoal/5 px-2 py-1 rounded">www.willowandwaterorganiccleaning.com/get-quote</code>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal/5">
            {filteredLeads.map((lead) => {
              const StatusIcon = STATUS_CONFIG[lead.status]?.icon || Clock;
              const isExpanded = expandedLead === lead.id;

              return (
                <div key={lead.id} className="hover:bg-bone/50 transition-colors">
                  {/* Main Row */}
                  <div 
                    className="p-4 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-inter font-semibold text-charcoal truncate">{lead.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[lead.status]?.color}`}>
                          {STATUS_CONFIG[lead.status]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal/60">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.zip_code && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lead.zip_code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quote Preview */}
                    {lead.quote_details?.firstCleanPrice && (
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-sage">
                          {formatPrice(lead.quote_details.firstCleanPrice)}
                        </p>
                        <p className="text-xs text-charcoal/50">
                          {lead.quote_details.sqft?.toLocaleString()} sqft
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-right">
                      <p className="text-xs text-charcoal/50">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-charcoal/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-charcoal/40" />
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-charcoal/5 bg-bone/30">
                      <div className="grid sm:grid-cols-2 gap-6 pt-4">
                        {/* Quote Details */}
                        <div>
                          <h4 className="font-inter font-semibold text-charcoal text-sm mb-3">Quote Details</h4>
                          {lead.quote_details ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Square Feet</span>
                                <span className="font-medium">{lead.quote_details.sqft?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Bedrooms</span>
                                <span className="font-medium">{lead.quote_details.bedrooms}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Bathrooms</span>
                                <span className="font-medium">{lead.quote_details.bathrooms}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Frequency</span>
                                <span className="font-medium capitalize">{lead.quote_details.frequency}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-charcoal/10">
                                <span className="text-charcoal/60">First Clean</span>
                                <span className="font-semibold text-sage">{formatPrice(lead.quote_details.firstCleanPrice)}</span>
                              </div>
                              {lead.quote_details.frequency !== 'onetime' && (
                                <div className="flex justify-between">
                                  <span className="text-charcoal/60">Recurring</span>
                                  <span className="font-semibold">{formatPrice(lead.quote_details.recurringPrice)}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-charcoal/40 text-sm">No quote details</p>
                          )}

                          {/* Notes from prospect */}
                          {lead.notes && (
                            <div className="mt-4">
                              <h5 className="text-xs font-semibold text-charcoal/60 mb-1">Their Notes</h5>
                              <p className="text-sm text-charcoal bg-white p-2 rounded border border-charcoal/10">
                                {lead.notes}
                              </p>
                            </div>
                          )}

                          {/* UTM tracking */}
                          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                            <div className="mt-4 text-xs text-charcoal/50">
                              <span className="font-medium">Source:</span> {lead.utm_source || 'direct'} / {lead.utm_medium || 'none'} / {lead.utm_campaign || 'none'}
                            </div>
                          )}
                        </div>

                        {/* Actions & Notes */}
                        <div>
                          <h4 className="font-inter font-semibold text-charcoal text-sm mb-3">Actions</h4>
                          
                          {/* Status Change */}
                          <div className="mb-4">
                            <label className="block text-xs text-charcoal/60 mb-1">Update Status</label>
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              className="w-full px-3 py-2 border border-charcoal/10 rounded-lg font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>

                          {/* Contact buttons */}
                          <div className="flex gap-2 mb-4">
                            <a
                              href={`mailto:${lead.email}`}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sage text-white rounded-lg text-sm font-inter hover:bg-sage/90 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Email
                            </a>
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone.replace(/\D/g, '')}`}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-charcoal text-white rounded-lg text-sm font-inter hover:bg-charcoal/90 transition-colors"
                              >
                                <Phone className="w-4 h-4" />
                                Call
                              </a>
                            )}
                          </div>

                          {/* Follow-up notes */}
                          <div>
                            <label className="block text-xs text-charcoal/60 mb-1">Follow-up Notes</label>
                            <textarea
                              defaultValue={lead.follow_up_notes || ''}
                              onBlur={(e) => updateFollowUpNotes(lead.id, e.target.value)}
                              placeholder="Add notes about your conversation..."
                              rows={3}
                              className="w-full px-3 py-2 border border-charcoal/10 rounded-lg font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                            />
                          </div>

                          {lead.contacted_at && (
                            <p className="text-xs text-charcoal/40 mt-2">
                              First contacted: {formatDate(lead.contacted_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
