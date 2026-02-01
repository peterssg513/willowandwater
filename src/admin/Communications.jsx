import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TEMPLATES = [
  'booking_confirmed',
  'day_before_reminder',
  'remaining_charged',
  'charge_failed',
  'cleaner_on_way',
  'job_complete',
  'feedback_request',
  'google_review_request',
  'low_rating_response',
  'recurring_upsell',
  'referral_credit',
  'weekly_schedule',
  'job_assigned',
  'cleaner_day_before',
];

const Communications = () => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 50;

  useEffect(() => {
    fetchCommunications();
  }, [page, channelFilter, statusFilter, templateFilter]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('communications_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (templateFilter !== 'all') {
        query = query.eq('template', templateFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setCommunications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comm.recipient_contact?.toLowerCase().includes(query) ||
      comm.content?.toLowerCase().includes(query) ||
      comm.template?.toLowerCase().includes(query)
    );
  });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getChannelIcon = (channel) => {
    return channel === 'sms' 
      ? <Phone className="w-4 h-4 text-blue-500" />
      : <Mail className="w-4 h-4 text-purple-500" />;
  };

  const getRecipientIcon = (type) => {
    return type === 'customer'
      ? <User className="w-4 h-4 text-sage" />
      : <Users className="w-4 h-4 text-orange-500" />;
  };

  const totalPages = Math.ceil(totalCount / perPage);

  // Stats
  const todayCommunications = communications.filter(c => {
    const today = new Date().toDateString();
    return new Date(c.created_at).toDateString() === today;
  });
  const failedCount = communications.filter(c => 
    c.status === 'failed' || c.status === 'bounced'
  ).length;

  if (loading && page === 1) {
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
            Communications
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {totalCount.toLocaleString()} messages sent
          </p>
        </div>
        <button onClick={fetchCommunications} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-sage" />
            <span className="text-sm text-charcoal/60">Total Sent</span>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-charcoal/60">Today</span>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {todayCommunications.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-charcoal/60">SMS</span>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {communications.filter(c => c.channel === 'sms').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-charcoal/60">Failed</span>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {failedCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by contact or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-bone border border-charcoal/10 rounded-xl
                         font-inter focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          
          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>

          {/* Template Filter */}
          <select
            value={templateFilter}
            onChange={(e) => { setTemplateFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Templates</option>
            {TEMPLATES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredCommunications.length > 0 ? (
          <>
            <div className="divide-y divide-charcoal/5">
              {filteredCommunications.map(comm => (
                <div key={comm.id} className="p-4 hover:bg-bone/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Channel & Status Icons */}
                    <div className="flex flex-col items-center gap-1">
                      {getChannelIcon(comm.channel)}
                      {getStatusIcon(comm.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getRecipientIcon(comm.recipient_type)}
                        <span className="font-inter font-medium text-charcoal text-sm">
                          {comm.recipient_contact}
                        </span>
                        <span className="text-xs bg-charcoal/5 text-charcoal/60 px-2 py-0.5 rounded capitalize">
                          {comm.template?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      {comm.subject && (
                        <p className="text-sm font-medium text-charcoal mb-1">
                          {comm.subject}
                        </p>
                      )}
                      
                      <p className="text-sm text-charcoal/70 line-clamp-2">
                        {comm.content}
                      </p>

                      {comm.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {comm.error_message}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-charcoal/50">
                        {formatDateTime(comm.created_at)}
                      </p>
                      <p className={`text-xs mt-1 capitalize ${
                        comm.status === 'delivered' || comm.status === 'sent' 
                          ? 'text-green-600' 
                          : comm.status === 'failed' || comm.status === 'bounced'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}>
                        {comm.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-charcoal/10 flex items-center justify-between">
                <p className="text-sm text-charcoal/60">
                  Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-charcoal/5 rounded-lg text-sm font-inter 
                               disabled:opacity-50 hover:bg-charcoal/10 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-charcoal/5 rounded-lg text-sm font-inter 
                               disabled:opacity-50 hover:bg-charcoal/10 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No communications found</h3>
            <p className="text-charcoal/50 text-sm">
              {searchQuery || channelFilter !== 'all' || statusFilter !== 'all' || templateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Messages will appear here as they are sent'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communications;
