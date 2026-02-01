import { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  User,
  Mail,
  Phone,
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle2,
  Plus,
  X,
  RefreshCw,
  Calendar,
  Bell,
  MessageCircle,
  Inbox,
  Archive,
  Reply,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MESSAGE_TEMPLATES = [
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Your Willow & Water Cleaning is Confirmed!',
    body: `Hi {{name}},

Thank you for booking with Willow & Water Organic Cleaning!

Your cleaning is scheduled for {{date}}.

Address: {{address}}
Service: {{frequency}} cleaning

We'll send you a reminder 24 hours before your appointment.

If you need to reschedule, please let us know at least 24 hours in advance.

Thank you for choosing organic cleaning!

Best,
Willow & Water Team`,
  },
  {
    id: 'reminder_24h',
    name: '24-Hour Reminder',
    subject: 'Reminder: Your Cleaning is Tomorrow!',
    body: `Hi {{name}},

This is a friendly reminder that your Willow & Water cleaning is scheduled for tomorrow, {{date}}.

Our team will arrive between {{time_window}}.

Please ensure:
- Access to your home is available
- Any special instructions are noted
- Pets are secured if needed

See you tomorrow!

Willow & Water Team`,
  },
  {
    id: 'thank_you',
    name: 'Thank You / Follow Up',
    subject: 'Thank You for Choosing Willow & Water!',
    body: `Hi {{name}},

Thank you for having us clean your home today!

We hope you love your freshly cleaned space. Our team takes pride in using only organic, eco-friendly products that are safe for your family and pets.

If you have any feedback or would like to schedule your next cleaning, please let us know.

Refer a friend and you both get $25 off!

Best,
Willow & Water Team`,
  },
  {
    id: 'reschedule',
    name: 'Reschedule Request',
    subject: 'Reschedule Your Cleaning',
    body: `Hi {{name}},

We need to reschedule your upcoming cleaning originally scheduled for {{date}}.

Please reply to this email or call us at (630) 267-0096 to find a new time that works for you.

We apologize for any inconvenience.

Willow & Water Team`,
  },
];

const ComposeModal = ({ recipient, template, onClose, onSend }) => {
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (template && recipient) {
      let processedSubject = template.subject;
      let processedBody = template.body;
      
      // Replace placeholders
      const replacements = {
        '{{name}}': recipient.name?.split(' ')[0] || 'there',
        '{{full_name}}': recipient.name || '',
        '{{email}}': recipient.email || '',
        '{{date}}': recipient.scheduled_date 
          ? new Date(recipient.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          : '[Date]',
        '{{address}}': recipient.address || '[Address]',
        '{{frequency}}': recipient.frequency || 'one-time',
        '{{time_window}}': '9:00 AM - 12:00 PM',
      };

      Object.entries(replacements).forEach(([key, value]) => {
        processedSubject = processedSubject.replace(new RegExp(key, 'g'), value);
        processedBody = processedBody.replace(new RegExp(key, 'g'), value);
      });

      setSubject(processedSubject);
      setBody(processedBody);
    }
  }, [template, recipient]);

  const handleSend = async () => {
    setSending(true);
    try {
      // In production, this would send via email service
      console.log('Sending email:', { to: recipient?.email, subject, body });
      
      // Simulate send
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSend({ recipient, subject, body });
      onClose();
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Compose Message</h2>
          <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">To</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-bone/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center">
                <span className="font-inter font-semibold text-sage text-sm">
                  {recipient?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-inter text-charcoal">{recipient?.name}</p>
                <p className="text-xs text-charcoal/50">{recipient?.email}</p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-charcoal/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button 
            onClick={handleSend} 
            disabled={sending || !subject || !body}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Message Detail Modal
const MessageDetailModal = ({ message, onClose, onUpdateStatus }) => {
  const [replying, setReplying] = useState(false);

  const handleMarkRead = async () => {
    await onUpdateStatus(message.id, 'read');
  };

  const handleArchive = async () => {
    await onUpdateStatus(message.id, 'archived');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-charcoal">Message from {message.name}</h2>
            <p className="text-sm text-charcoal/50 font-inter">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-bone/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
              <span className="font-inter font-semibold text-sage text-lg">
                {message.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-inter font-semibold text-charcoal">{message.name}</p>
              <a href={`mailto:${message.email}`} className="text-sm text-sage hover:underline">{message.email}</a>
              {message.phone && (
                <p className="text-sm text-charcoal/50">{message.phone}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-charcoal/10 rounded-xl p-4">
            <p className="font-inter text-charcoal whitespace-pre-wrap">{message.message}</p>
          </div>
        </div>

        <div className="p-4 border-t border-charcoal/10 flex gap-3">
          <button 
            onClick={handleArchive}
            className="btn-secondary flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
          <a 
            href={`mailto:${message.email}?subject=Re: Your message to Willow %26 Water`}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Reply className="w-4 h-4" />
            Reply via Email
          </a>
        </div>
      </div>
    </div>
  );
};

const Communications = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [recipientType, setRecipientType] = useState('customers'); // customers | cleaners
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // inbox | compose

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, cleanersRes, messagesRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('cleaners').select('*').eq('status', 'active'),
        supabase.from('messages').select('*').neq('status', 'archived').order('created_at', { ascending: false }),
      ]);

      setBookings(bookingsRes.data || []);
      setCleaners(cleanersRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBookings([]);
      setCleaners([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessageStatus = async (messageId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'read') updates.read_at = new Date().toISOString();
      if (newStatus === 'replied') updates.replied_at = new Date().toISOString();

      await supabase.from('messages').update(updates).eq('id', messageId);
      
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, ...updates } : m
      ).filter(m => newStatus !== 'archived' || m.id !== messageId));
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      await handleUpdateMessageStatus(message.id, 'read');
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  // Get unique customers
  const customers = useMemo(() => {
    const customerMap = new Map();
    bookings.forEach(b => {
      if (!b.email) return;
      if (!customerMap.has(b.email)) {
        customerMap.set(b.email, b);
      }
    });
    return Array.from(customerMap.values());
  }, [bookings]);

  const filteredRecipients = useMemo(() => {
    const list = recipientType === 'customers' ? customers : cleaners;
    if (!searchQuery) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter(r => 
      r.name?.toLowerCase().includes(query) ||
      r.email?.toLowerCase().includes(query)
    );
  }, [customers, cleaners, recipientType, searchQuery]);

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setShowCompose(true);
  };

  const handleSendMessage = (message) => {
    console.log('Message sent:', message);
    // In production, log this to a messages table
  };

  // Get upcoming bookings for quick actions
  const upcomingBookings = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    return bookings.filter(b => {
      if (!b.scheduled_date) return false;
      const date = new Date(b.scheduled_date);
      return date >= tomorrow && date < dayAfter && b.status !== 'cancelled';
    });
  }, [bookings]);

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
            View messages from customers and send communications
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-charcoal/10 pb-0">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 font-inter text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            activeTab === 'inbox'
              ? 'border-sage text-sage'
              : 'border-transparent text-charcoal/60 hover:text-charcoal'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 font-inter text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
            activeTab === 'compose'
              ? 'border-sage text-sage'
              : 'border-transparent text-charcoal/60 hover:text-charcoal'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Message
        </button>
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <>
          {/* Messages List */}
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
            <div className="p-4 border-b border-charcoal/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                             font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
            </div>

            <div className="divide-y divide-charcoal/5">
              {messages.length > 0 ? (
                messages
                  .filter(m => !searchQuery || 
                    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.message?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleViewMessage(message)}
                      className={`p-4 cursor-pointer hover:bg-bone/30 transition-colors ${
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
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-inter truncate ${
                              message.status === 'unread' ? 'font-semibold text-charcoal' : 'text-charcoal'
                            }`}>
                              {message.name}
                            </p>
                            <span className="text-xs text-charcoal/50 whitespace-nowrap">
                              {new Date(message.created_at).toLocaleDateString()}
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
                  ))
              ) : (
                <div className="p-12 text-center">
                  <Inbox className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
                  <p className="font-inter text-charcoal/50">No messages yet</p>
                  <p className="text-sm text-charcoal/40 mt-1">
                    Messages from your website contact form will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <>
          {/* Quick Actions */}
          {upcomingBookings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h3 className="font-inter font-semibold text-yellow-800">
                  {upcomingBookings.length} cleaning{upcomingBookings.length > 1 ? 's' : ''} tomorrow
                </h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Send reminders to customers with cleanings scheduled for tomorrow.
              </p>
              <button
                onClick={() => {
                  // In production, this would batch send reminders
                  alert('Reminder emails would be sent to all customers with cleanings tomorrow');
                }}
                className="text-yellow-700 hover:text-yellow-900 font-inter text-sm font-medium"
              >
                Send All Reminders →
              </button>
            </div>
          )}

          {/* Message Templates */}
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
            <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
              Quick Templates
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MESSAGE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-sage bg-sage/5'
                      : 'border-charcoal/10 hover:border-sage/50 hover:bg-bone/50'
                  }`}
                >
                  <p className="font-inter font-medium text-charcoal mb-1">{template.name}</p>
                  <p className="text-xs text-charcoal/50 line-clamp-2">{template.subject}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
            <div className="p-4 border-b border-charcoal/10">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Type Toggle */}
                <div className="flex bg-bone/50 rounded-lg p-1">
                  <button
                    onClick={() => setRecipientType('customers')}
                    className={`flex-1 px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                      recipientType === 'customers' ? 'bg-white shadow text-charcoal' : 'text-charcoal/60'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Customers ({customers.length})
                  </button>
                  <button
                    onClick={() => setRecipientType('cleaners')}
                    className={`flex-1 px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                      recipientType === 'cleaners' ? 'bg-white shadow text-charcoal' : 'text-charcoal/60'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Team ({cleaners.length})
                  </button>
                </div>

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                               font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>
              </div>
            </div>

            {/* Recipient List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredRecipients.length > 0 ? (
                filteredRecipients.map((recipient) => (
                  <div
                    key={recipient.email || recipient.id}
                    className="flex items-center justify-between p-4 border-b border-charcoal/5 hover:bg-bone/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                        <span className="font-inter font-semibold text-sage">
                          {recipient.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-inter font-medium text-charcoal">{recipient.name}</p>
                        <p className="text-xs text-charcoal/50">{recipient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${recipient.email}`}
                        className="p-2 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg"
                        title="Email directly"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      {recipient.phone && (
                        <a
                          href={`tel:${recipient.phone}`}
                          className="p-2 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleSelectRecipient(recipient)}
                        className="btn-primary text-sm px-3 py-1.5"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
                  <p className="text-charcoal/50 font-inter">No recipients found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Compose Modal */}
      {showCompose && selectedRecipient && (
        <ComposeModal
          recipient={selectedRecipient}
          template={selectedTemplate}
          onClose={() => { setShowCompose(false); setSelectedRecipient(null); }}
          onSend={handleSendMessage}
        />
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onUpdateStatus={handleUpdateMessageStatus}
        />
      )}
    </div>
  );
};

export default Communications;
