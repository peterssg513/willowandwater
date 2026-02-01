import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  RefreshCw,
  Mail,
  Phone,
  Clock,
  Archive,
  Reply,
  Inbox,
  Eye,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('unread'); // unread, all, archived
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', messageId);

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, status: 'read', read_at: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const archiveMessage = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ status: 'archived' })
        .eq('id', messageId);

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, status: 'archived' } : m
      ));
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      markAsRead(message.id);
    }
  };

  const filteredMessages = messages.filter(message => {
    // Status filter
    if (filter === 'unread' && message.status !== 'unread') return false;
    if (filter === 'archived' && message.status !== 'archived') return false;
    if (filter === 'all' && message.status === 'archived') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        message.name?.toLowerCase().includes(query) ||
        message.email?.toLowerCase().includes(query) ||
        message.message?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
            Messages
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <button onClick={fetchMessages} className="btn-secondary flex items-center gap-2 self-start">
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
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'all', label: 'All' },
              { key: 'archived', label: 'Archived' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-colors flex items-center gap-2 ${
                  filter === f.key ? 'bg-white shadow text-charcoal' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-bone border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredMessages.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleViewMessage(message)}
                className={`p-4 cursor-pointer transition-colors hover:bg-bone/50 ${
                  message.status === 'unread' ? 'bg-sage/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.status === 'unread' ? 'bg-sage/20' : 'bg-charcoal/10'
                  }`}>
                    <span className={`font-inter font-semibold ${
                      message.status === 'unread' ? 'text-sage' : 'text-charcoal/50'
                    }`}>
                      {message.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`font-inter truncate ${
                        message.status === 'unread' ? 'font-semibold text-charcoal' : 'text-charcoal'
                      }`}>
                        {message.name}
                      </p>
                      <span className="text-xs text-charcoal/50 whitespace-nowrap">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/50 truncate">{message.email}</p>
                    <p className={`text-sm mt-1 line-clamp-2 ${
                      message.status === 'unread' ? 'text-charcoal/80' : 'text-charcoal/60'
                    }`}>
                      {message.message}
                    </p>
                  </div>
                  {message.status === 'unread' && (
                    <div className="w-2 h-2 rounded-full bg-sage flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No messages</h3>
            <p className="text-charcoal/50 text-sm">
              {filter === 'unread' ? 'All messages have been read' : 
               filter === 'archived' ? 'No archived messages' :
               'Messages from your contact form will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedMessage(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-charcoal">
                    {selectedMessage.name}
                  </h2>
                  <p className="text-sm text-charcoal/50 font-inter mt-1">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="bg-bone/50 rounded-xl p-4 space-y-2">
                <a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                  <Mail className="w-4 h-4" />
                  {selectedMessage.email}
                </a>
                {selectedMessage.phone && (
                  <a href={`tel:${selectedMessage.phone}`} className="flex items-center gap-2 text-sm text-sage hover:underline">
                    <Phone className="w-4 h-4" />
                    {selectedMessage.phone}
                  </a>
                )}
              </div>

              {/* Message Content */}
              <div className="bg-white border border-charcoal/10 rounded-xl p-4">
                <p className="font-inter text-charcoal whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => archiveMessage(selectedMessage.id)}
                className="btn-secondary flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: Your message to Willow %26 Water`}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Reply className="w-4 h-4" />
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
