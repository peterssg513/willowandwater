import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Home,
  Calendar,
  Star,
  DollarSign,
  Key,
  Edit2,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  Gift,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Loader2,
  X,
  UserX,
  CalendarPlus,
  Repeat,
  Settings,
  CalendarDays
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice, formatFrequency, calculateCleaningPrice, calculateCleaningDuration } from '../utils/pricingLogic';
import { formatDateForDB } from '../utils/scheduling';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, jobsRes, notesRes, paymentsRes] = await Promise.all([
        supabase
          .from('customers')
          .select(`
            *,
            subscriptions (*)
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('jobs')
          .select('*, cleaners(name)')
          .eq('customer_id', id)
          .order('scheduled_date', { ascending: false }),
        supabase
          .from('customer_notes')
          .select('*')
          .eq('customer_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('customer_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (customerRes.error) throw customerRes.error;
      
      setCustomer(customerRes.data);
      setJobs(jobsRes.data || []);
      setNotes(notesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerStatus = async (newStatus) => {
    try {
      // If changing to churned, cancel all future jobs
      if (newStatus === 'churned') {
        const today = new Date().toISOString().split('T')[0];
        
        // Cancel all future scheduled/confirmed jobs
        const { data: cancelledJobs } = await supabase
          .from('jobs')
          .update({ status: 'cancelled' })
          .eq('customer_id', id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('scheduled_date', today)
          .select();

        // Cancel active subscriptions
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('customer_id', id)
          .eq('status', 'active');

        // Log cancelled jobs
        if (cancelledJobs?.length > 0) {
          await supabase.from('activity_log').insert({
            entity_type: 'customer',
            entity_id: id,
            action: 'future_jobs_cancelled',
            actor_type: 'admin',
            details: { 
              cancelled_count: cancelledJobs.length, 
              reason: 'customer_churned'
            }
          });
        }
      }

      await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', id);
      
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: id,
        action: 'status_changed',
        actor_type: 'admin',
        details: { old_status: customer.status, new_status: newStatus }
      });

      setCustomer(prev => ({ ...prev, status: newStatus }));
      
      // Refresh data to show updated jobs
      if (newStatus === 'churned') {
        fetchCustomerData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getJobStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-red-100 text-red-700',
      pending_payment: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  // Calculate stats
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const ratings = completedJobs.map(j => j.customer_rating).filter(Boolean);
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
    : null;
  const totalSpent = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);
  const activeSubscription = customer?.subscriptions?.find(s => s.status === 'active');
  const upcomingJobs = jobs.filter(j => 
    ['scheduled', 'confirmed'].includes(j.status) && 
    new Date(j.scheduled_date) >= new Date()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal/60">Customer not found</p>
        <Link to="/admin/customers" className="text-sage hover:underline mt-2 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/customers')}
          className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </button>
        <div className="flex-1">
          <h1 className="font-playfair text-2xl font-semibold text-charcoal">
            {customer.name}
          </h1>
          <p className="text-charcoal/60 font-inter text-sm">
            Customer since {formatDate(customer.created_at)}
          </p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Status & Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`
          px-3 py-1.5 rounded-full text-sm font-medium
          ${customer.status === 'active' ? 'bg-green-100 text-green-700' :
            customer.status === 'prospect' ? 'bg-yellow-100 text-yellow-700' :
            customer.status === 'paused' ? 'bg-gray-100 text-gray-700' :
            'bg-red-100 text-red-700'
          }
        `}>
          {customer.status}
        </span>
        
        {/* Status change dropdown */}
        <div className="relative group">
          <button className="text-sm text-charcoal/60 hover:text-charcoal flex items-center gap-1 px-2 py-1 rounded hover:bg-charcoal/5">
            Change Status
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-charcoal/10 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[150px]">
            {customer.status !== 'active' && (
              <button
                onClick={() => updateCustomerStatus('active')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sage/10 text-charcoal flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                Active
              </button>
            )}
            {customer.status !== 'prospect' && (
              <button
                onClick={() => updateCustomerStatus('prospect')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sage/10 text-charcoal flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-yellow-600" />
                Prospect
              </button>
            )}
            {customer.status !== 'paused' && (
              <button
                onClick={() => updateCustomerStatus('paused')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sage/10 text-charcoal flex items-center gap-2"
              >
                <Pause className="w-4 h-4 text-gray-600" />
                Paused
              </button>
            )}
            {customer.status !== 'churned' && (
              <button
                onClick={() => updateCustomerStatus('churned')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sage/10 text-charcoal flex items-center gap-2"
              >
                <UserX className="w-4 h-4 text-red-600" />
                Churned
              </button>
            )}
          </div>
        </div>

        <div className="border-l border-charcoal/20 h-6 mx-2" />
        
        {/* Add Job Button */}
        <button
          onClick={() => setShowAddJobModal(true)}
          className="text-sm text-sage hover:text-sage/80 flex items-center gap-1 px-3 py-1.5 bg-sage/10 rounded-lg hover:bg-sage/20 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <h3 className="font-inter font-semibold text-charcoal mb-4">Contact</h3>
          <div className="space-y-3">
            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-sage hover:underline">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{customer.email}</span>
            </a>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-sage hover:underline">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{customer.phone}</span>
              </a>
            )}
            {customer.address && (
              <div className="flex items-start gap-3 text-charcoal/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="text-sm">
                  {customer.address}<br />
                  {customer.city}, IL {customer.zip}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Property Info */}
        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <h3 className="font-inter font-semibold text-charcoal mb-4">Property</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-bone/50 rounded-xl p-3">
              <p className="text-lg font-semibold text-charcoal">{customer.sqft?.toLocaleString() || '—'}</p>
              <p className="text-xs text-charcoal/50">Sq Ft</p>
            </div>
            <div className="bg-bone/50 rounded-xl p-3">
              <p className="text-lg font-semibold text-charcoal">{customer.bedrooms || '—'}</p>
              <p className="text-xs text-charcoal/50">Beds</p>
            </div>
            <div className="bg-bone/50 rounded-xl p-3">
              <p className="text-lg font-semibold text-charcoal">{customer.bathrooms || '—'}</p>
              <p className="text-xs text-charcoal/50">Baths</p>
            </div>
          </div>
          
          {customer.access_type && (
            <div className="mt-4 pt-4 border-t border-charcoal/10">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-sage mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-charcoal capitalize">
                    {customer.access_type.replace('_', ' ')}
                  </p>
                  {customer.access_instructions && (
                    <p className="text-xs text-charcoal/60 mt-1">
                      {customer.access_instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <h3 className="font-inter font-semibold text-charcoal mb-4">Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal/60">Completed Jobs</span>
              <span className="font-semibold text-charcoal">{completedJobs.length}</span>
            </div>
            {avgRating && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal/60">Avg Rating</span>
                <span className="font-semibold text-charcoal flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {avgRating}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal/60">Total Spent</span>
              <span className="font-semibold text-charcoal">{formatPrice(totalSpent)}</span>
            </div>
            {customer.credit_balance > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal/60">Credit Balance</span>
                <span className="font-semibold text-sage">{formatPrice(customer.credit_balance)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recurring Service Card */}
      <div className={`rounded-2xl border p-5 ${activeSubscription ? 'bg-sage/5 border-sage/20' : 'bg-bone/50 border-charcoal/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeSubscription ? 'bg-sage/20' : 'bg-charcoal/10'}`}>
              <Repeat className={`w-5 h-5 ${activeSubscription ? 'text-sage' : 'text-charcoal/40'}`} />
            </div>
            <div>
              <h3 className="font-inter font-semibold text-charcoal">
                {activeSubscription ? 'Recurring Service' : 'No Recurring Service'}
              </h3>
              {activeSubscription ? (
                <>
                  <p className="text-sm text-charcoal/60 mt-0.5">
                    {formatFrequency(activeSubscription.frequency)} • {formatPrice(activeSubscription.base_price)}/visit
                  </p>
                  {activeSubscription.preferred_day && (
                    <p className="text-xs text-sage mt-1 capitalize flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {activeSubscription.preferred_day}s, {activeSubscription.preferred_time}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-charcoal/50 mt-0.5">
                  Set up recurring cleaning schedule
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowRecurringModal(true)}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium flex items-center gap-2 transition-colors ${
              activeSubscription 
                ? 'bg-sage/10 text-sage hover:bg-sage/20' 
                : 'bg-sage text-white hover:bg-sage/90'
            }`}
          >
            <Settings className="w-4 h-4" />
            {activeSubscription ? 'Manage' : 'Set Up'}
          </button>
        </div>
        
        {/* Show upcoming recurring jobs count */}
        {activeSubscription && upcomingJobs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-sage/20">
            <p className="text-sm text-charcoal/60">
              <span className="font-medium text-charcoal">{upcomingJobs.length}</span> upcoming job{upcomingJobs.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        )}
      </div>

      {/* Referral Code */}
      {customer.referral_code && (
        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-sage" />
              <div>
                <p className="font-inter font-semibold text-charcoal">Referral Code</p>
                <p className="text-sm text-charcoal/60">{customer.referral_code}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-charcoal/10">
        <div className="flex gap-6">
          {['jobs', 'payments', 'notes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                pb-3 px-1 font-inter text-sm font-medium capitalize transition-colors
                border-b-2 -mb-px
                ${activeTab === tab 
                  ? 'text-sage border-sage' 
                  : 'text-charcoal/50 border-transparent hover:text-charcoal'
                }
              `}
            >
              {tab} ({tab === 'jobs' ? jobs.length : tab === 'payments' ? payments.length : notes.length})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden">
        {activeTab === 'jobs' && (
          <>
            {jobs.length > 0 ? (
              <div className="divide-y divide-charcoal/5">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 hover:bg-bone/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-inter font-medium text-charcoal">
                            {formatDate(job.scheduled_date)}
                          </p>
                          {getJobStatusBadge(job.status)}
                        </div>
                        <p className="text-sm text-charcoal/50 mt-1">
                          {job.job_type?.replace('_', ' ')} • {job.scheduled_time}
                          {job.cleaners?.name && ` • ${job.cleaners.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-inter font-semibold text-charcoal">
                          {formatPrice(job.final_price)}
                        </p>
                        {job.customer_rating && (
                          <p className="text-sm text-yellow-500 flex items-center justify-end gap-1">
                            <Star className="w-4 h-4" />
                            {job.customer_rating}/5
                          </p>
                        )}
                      </div>
                    </div>
                    {job.customer_feedback && (
                      <p className="text-sm text-charcoal/60 mt-2 italic">
                        "{job.customer_feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-charcoal/50">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No jobs yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'payments' && (
          <>
            {payments.length > 0 ? (
              <div className="divide-y divide-charcoal/5">
                {payments.map(payment => (
                  <div key={payment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-inter font-medium text-charcoal capitalize">
                          {payment.payment_type?.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-charcoal/50">
                          {formatDateTime(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-inter font-semibold text-charcoal">
                          {formatPrice(payment.amount)}
                        </p>
                        <p className={`text-xs ${
                          payment.status === 'succeeded' ? 'text-green-600' :
                          payment.status === 'failed' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-charcoal/50">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payments yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'notes' && (
          <>
            <div className="p-4 border-b border-charcoal/10">
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
            {notes.length > 0 ? (
              <div className="divide-y divide-charcoal/5">
                {notes.map(note => (
                  <div key={note.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${note.note_type === 'complaint' ? 'bg-red-100' :
                          note.note_type === 'compliment' ? 'bg-green-100' :
                          'bg-blue-100'
                        }
                      `}>
                        <MessageSquare className={`w-4 h-4 
                          ${note.note_type === 'complaint' ? 'text-red-600' :
                            note.note_type === 'compliment' ? 'text-green-600' :
                            'text-blue-600'
                          }`} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-charcoal/50 capitalize">
                            {note.note_type}
                          </span>
                          <span className="text-xs text-charcoal/30">•</span>
                          <span className="text-xs text-charcoal/50">
                            {formatDateTime(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-charcoal/50">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes yet</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <AddNoteModal
          customerId={id}
          onClose={() => setShowAddNoteModal(false)}
          onAdd={(note) => {
            setNotes(prev => [note, ...prev]);
            setShowAddNoteModal(false);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedCustomer) => {
            setCustomer(updatedCustomer);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Add Job Modal */}
      {showAddJobModal && (
        <AddJobModal
          customer={customer}
          onClose={() => setShowAddJobModal(false)}
          onAdd={(job) => {
            setJobs(prev => [job, ...prev]);
            setShowAddJobModal(false);
            // Refresh data to get cleaner info
            fetchCustomerData();
          }}
        />
      )}

      {/* Recurring Service Modal */}
      {showRecurringModal && (
        <RecurringServiceModal
          customer={customer}
          subscription={activeSubscription}
          onClose={() => setShowRecurringModal(false)}
          onSave={() => {
            setShowRecurringModal(false);
            fetchCustomerData();
          }}
        />
      )}
    </div>
  );
};

// Add Note Modal
const AddNoteModal = ({ customerId, onClose, onAdd }) => {
  const [noteType, setNoteType] = useState('internal');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          note_type: noteType,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      onAdd(data);
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Add Note</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Type</label>
            <div className="flex gap-2">
              {['internal', 'call', 'email', 'complaint', 'compliment'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoteType(type)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-inter capitalize transition-all
                    ${noteType === type 
                      ? 'bg-sage text-white' 
                      : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Note</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              placeholder="Add your note here..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving || !content.trim()} 
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Customer Modal
const EditCustomerModal = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    zip: customer.zip || '',
    sqft: customer.sqft || '',
    bedrooms: customer.bedrooms || '',
    bathrooms: customer.bathrooms || '',
    access_type: customer.access_type || '',
    access_instructions: customer.access_instructions || '',
    status: customer.status || 'prospect',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Name, email, and phone are required');
      }

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        zip: formData.zip.trim() || null,
        sqft: formData.sqft ? parseInt(formData.sqft) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        access_type: formData.access_type || null,
        access_instructions: formData.access_instructions.trim() || null,
        status: formData.status,
      };

      const { data, error: updateError } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customer.id)
        .select(`*, subscriptions (*)`)
        .single();

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: customer.id,
        action: 'updated',
        actor_type: 'admin',
        details: { updated_fields: Object.keys(updateData) }
      });

      onSave(data);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Edit Customer</h2>
          <button onClick={onClose} className="p-2 hover:bg-charcoal/5 rounded-lg">
            <X className="w-5 h-5 text-charcoal/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h4 className="font-inter font-medium text-charcoal mb-3">Property Details</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Square Feet</label>
                <input
                  type="number"
                  value={formData.sqft}
                  onChange={(e) => handleChange('sqft', e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Bathrooms</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          {/* Access */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Access Type</label>
              <select
                value={formData.access_type}
                onChange={(e) => handleChange('access_type', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="">Select access type...</option>
                <option value="lockbox">Lockbox</option>
                <option value="garage_code">Garage Code</option>
                <option value="hidden_key">Hidden Key</option>
                <option value="customer_home">Customer Will Be Home</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Access Instructions</label>
              <textarea
                value={formData.access_instructions}
                onChange={(e) => handleChange('access_instructions', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                placeholder="Code is 1234, lockbox on left side of door..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-charcoal/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Job Modal (for phone bookings)
const AddJobModal = ({ customer, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: 'morning',
    job_type: 'first_clean',
    frequency: 'biweekly',
    cleaner_id: '',
    special_instructions: '',
    // Use customer's property details for pricing
    sqft: customer.sqft || 2000,
    bedrooms: customer.bedrooms || 3,
    bathrooms: customer.bathrooms || 2,
  });
  const [cleaners, setCleaners] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cleaners and addons
  useEffect(() => {
    const fetchData = async () => {
      const [cleanersRes, addonsRes] = await Promise.all([
        supabase.from('cleaners').select('*').eq('status', 'active'),
        supabase.from('addon_services').select('*').eq('is_active', true).order('display_order'),
      ]);
      setCleaners(cleanersRes.data || []);
      setAddons(addonsRes.data || []);
    };
    fetchData();
  }, []);

  // Calculate pricing
  const pricing = calculateCleaningPrice({
    sqft: formData.sqft,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    frequency: formData.frequency,
    addons: selectedAddons,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.scheduled_date) {
        throw new Error('Please select a date');
      }

      const isFirstClean = formData.job_type === 'first_clean';
      const jobPrice = isFirstClean ? pricing.firstCleanTotal : pricing.recurringPrice + pricing.addonsPrice;
      const duration = calculateCleaningDuration({
        sqft: formData.sqft,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        isFirstClean,
        addons: selectedAddons,
      });

      // Create the job
      const jobData = {
        customer_id: customer.id,
        cleaner_id: formData.cleaner_id || null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: duration,
        job_type: formData.job_type,
        base_price: isFirstClean ? pricing.firstCleanPrice : pricing.recurringPrice,
        addons_price: pricing.addonsPrice,
        total_price: jobPrice,
        final_price: jobPrice,
        status: 'scheduled',
        payment_status: 'pending',
        special_instructions: formData.special_instructions.trim() || null,
      };

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select('*, cleaners(name)')
        .single();

      if (jobError) throw jobError;

      // Create job addons
      if (selectedAddons.length > 0) {
        const addonInserts = selectedAddons.map(addon => ({
          job_id: job.id,
          addon_service_id: addon.id,
          name: addon.name,
          price: addon.price,
        }));
        await supabase.from('job_addons').insert(addonInserts);
      }

      // Create subscription if this is a first clean with recurring
      if (formData.job_type === 'first_clean' && formData.frequency !== 'onetime') {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: customer.id,
            frequency: formData.frequency,
            preferred_time: formData.scheduled_time,
            base_price: pricing.recurringPrice,
            status: 'pending',
          })
          .select()
          .single();

        if (subscription) {
          await supabase
            .from('jobs')
            .update({ subscription_id: subscription.id })
            .eq('id', job.id);
        }
      }

      // Update customer status to active if prospect
      if (customer.status === 'prospect') {
        await supabase
          .from('customers')
          .update({ status: 'active' })
          .eq('id', customer.id);
      }

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'job',
        entity_id: job.id,
        action: 'created_by_admin',
        actor_type: 'admin',
        details: { 
          customer_id: customer.id,
          job_type: formData.job_type,
          price: jobPrice,
        }
      });

      onAdd(job);
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Get min date (tomorrow)
  const minDate = formatDateForDB(new Date(Date.now() + 24 * 60 * 60 * 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            Add Job for {customer.name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-charcoal/5 rounded-lg">
            <X className="w-5 h-5 text-charcoal/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Job Type & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Job Type</label>
              <select
                value={formData.job_type}
                onChange={(e) => handleChange('job_type', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="first_clean">First Clean (Deep Clean)</option>
                <option value="recurring">Recurring Clean</option>
                <option value="one_time">One-Time Clean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="weekly">Weekly (35% off recurring)</option>
                <option value="biweekly">Bi-Weekly (20% off recurring)</option>
                <option value="monthly">Monthly (10% off recurring)</option>
                <option value="onetime">One-Time</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Date *</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                min={minDate}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Time Slot</label>
              <select
                value={formData.scheduled_time}
                onChange={(e) => handleChange('scheduled_time', e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="morning">Morning (9am - 12pm)</option>
                <option value="afternoon">Afternoon (1pm - 5pm)</option>
              </select>
            </div>
          </div>

          {/* Assign Cleaner */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Assign Cleaner (Optional)</label>
            <select
              value={formData.cleaner_id}
              onChange={(e) => handleChange('cleaner_id', e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">Unassigned</option>
              {cleaners.map(cleaner => (
                <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>
              ))}
            </select>
          </div>

          {/* Property Override */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Property Size (for pricing)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.sqft}
                  onChange={(e) => handleChange('sqft', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Sq ft"
                />
                <p className="text-xs text-charcoal/50 mt-1">Square feet</p>
              </div>
              <div>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Beds"
                />
                <p className="text-xs text-charcoal/50 mt-1">Bedrooms</p>
              </div>
              <div>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Baths"
                />
                <p className="text-xs text-charcoal/50 mt-1">Bathrooms</p>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {addons.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Add-ons</label>
              <div className="grid grid-cols-2 gap-2">
                {addons.map(addon => (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`
                      p-3 rounded-xl border-2 text-left transition-all
                      ${selectedAddons.find(a => a.id === addon.id)
                        ? 'border-sage bg-sage/10'
                        : 'border-charcoal/10 hover:border-sage/50'
                      }
                    `}
                  >
                    <p className="font-inter text-sm font-medium text-charcoal">{addon.name}</p>
                    <p className="text-xs text-sage">{formatPrice(addon.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Special Instructions</label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => handleChange('special_instructions', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              placeholder="Any special notes for this job..."
            />
          </div>

          {/* Pricing Summary */}
          <div className="bg-sage/5 rounded-xl p-4 border border-sage/20">
            <h4 className="font-inter font-semibold text-charcoal mb-3">Pricing Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/60">
                  {formData.job_type === 'first_clean' ? 'First Clean' : 'Clean'}
                </span>
                <span className="font-medium">
                  {formatPrice(formData.job_type === 'first_clean' ? pricing.firstCleanPrice : pricing.recurringPrice)}
                </span>
              </div>
              {selectedAddons.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Add-ons ({selectedAddons.length})</span>
                  <span className="font-medium">{formatPrice(pricing.addonsPrice)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-sage/20">
                <span className="font-medium text-charcoal">Total</span>
                <span className="font-semibold text-sage">
                  {formatPrice(formData.job_type === 'first_clean' 
                    ? pricing.firstCleanTotal 
                    : pricing.recurringPrice + pricing.addonsPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-charcoal/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Recurring Service Modal
const RecurringServiceModal = ({ customer, subscription, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    frequency: subscription?.frequency || 'biweekly',
    preferred_day: subscription?.preferred_day || 'monday',
    preferred_time: subscription?.preferred_time || 'morning',
    base_price: subscription?.base_price || '',
    generate_jobs_months: 3, // How many months of jobs to generate
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCount, setGeneratedCount] = useState(null);

  const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
  ];

  const FREQUENCIES = [
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'biweekly', label: 'Bi-Weekly', description: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Once a month' },
  ];

  // Calculate price based on customer property and frequency
  useEffect(() => {
    if (!subscription?.base_price && customer.sqft) {
      // Auto-calculate price if not set
      const baseRate = 40; // per 500 sqft
      const sqftUnits = Math.ceil(customer.sqft / 500);
      let price = sqftUnits * baseRate;
      
      // Apply frequency discount
      if (formData.frequency === 'weekly') price *= 0.65;
      else if (formData.frequency === 'biweekly') price *= 0.80;
      else if (formData.frequency === 'monthly') price *= 0.90;
      
      // Add extra bathroom/bedroom charges
      if (customer.bathrooms > 2) price += (customer.bathrooms - 2) * 15;
      if (customer.bedrooms > 3) price += (customer.bedrooms - 3) * 10;
      
      setFormData(prev => ({ ...prev, base_price: Math.round(price) }));
    }
  }, [formData.frequency, customer, subscription]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate recurring jobs based on frequency and day
  const generateRecurringJobs = async (subscriptionId, monthsAhead = 3) => {
    setGenerating(true);
    setGeneratedCount(null);
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + monthsAhead);
      
      // Get existing scheduled jobs to avoid duplicates
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('scheduled_date')
        .eq('customer_id', customer.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', startDate.toISOString().split('T')[0]);
      
      const existingDates = new Set(existingJobs?.map(j => j.scheduled_date) || []);
      
      // Calculate job dates based on frequency
      const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === formData.preferred_day);
      const targetDayOfWeek = dayIndex + 1; // Monday = 1, etc.
      
      const jobDates = [];
      const current = new Date(startDate);
      
      // Find first occurrence of the preferred day
      while (current.getDay() !== targetDayOfWeek) {
        current.setDate(current.getDate() + 1);
      }
      
      // Generate dates based on frequency
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          jobDates.push(dateStr);
        }
        
        if (formData.frequency === 'weekly') {
          current.setDate(current.getDate() + 7);
        } else if (formData.frequency === 'biweekly') {
          current.setDate(current.getDate() + 14);
        } else if (formData.frequency === 'monthly') {
          current.setMonth(current.getMonth() + 1);
          // Reset to first occurrence of preferred day in the new month
          current.setDate(1);
          while (current.getDay() !== targetDayOfWeek) {
            current.setDate(current.getDate() + 1);
          }
        }
      }
      
      if (jobDates.length === 0) {
        setGeneratedCount(0);
        return 0;
      }
      
      // Calculate duration
      const durationMinutes = Math.round(
        (customer.sqft || 2000) / 500 * 30 +
        Math.max(0, (customer.bathrooms || 2) - 2) * 15 +
        Math.max(0, (customer.bedrooms || 3) - 3) * 10
      );
      
      // Create jobs
      const jobsToCreate = jobDates.map(date => ({
        customer_id: customer.id,
        subscription_id: subscriptionId,
        scheduled_date: date,
        scheduled_time: formData.preferred_time,
        duration_minutes: durationMinutes,
        job_type: 'recurring',
        base_price: parseFloat(formData.base_price),
        addons_price: 0,
        total_price: parseFloat(formData.base_price),
        final_price: parseFloat(formData.base_price),
        status: 'scheduled',
        payment_status: 'pending',
      }));
      
      const { error: insertError } = await supabase
        .from('jobs')
        .insert(jobsToCreate);
      
      if (insertError) throw insertError;
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: customer.id,
        action: 'recurring_jobs_generated',
        actor_type: 'admin',
        details: { 
          count: jobsToCreate.length,
          frequency: formData.frequency,
          months_ahead: monthsAhead
        }
      });
      
      setGeneratedCount(jobsToCreate.length);
      return jobsToCreate.length;
    } catch (err) {
      console.error('Error generating jobs:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.base_price) {
        throw new Error('Please enter a price per visit');
      }

      let subscriptionId = subscription?.id;

      if (subscription) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            frequency: formData.frequency,
            preferred_day: formData.preferred_day,
            preferred_time: formData.preferred_time,
            base_price: parseFloat(formData.base_price),
            status: 'active',
          })
          .eq('id', subscription.id);

        if (updateError) throw updateError;
      } else {
        // Create new subscription
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: customer.id,
            frequency: formData.frequency,
            preferred_day: formData.preferred_day,
            preferred_time: formData.preferred_time,
            base_price: parseFloat(formData.base_price),
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        subscriptionId = newSub.id;
      }

      // Update customer status to active if not already
      if (customer.status !== 'active') {
        await supabase
          .from('customers')
          .update({ status: 'active' })
          .eq('id', customer.id);
      }

      // Generate recurring jobs
      await generateRecurringJobs(subscriptionId, formData.generate_jobs_months);

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'subscription',
        entity_id: subscriptionId,
        action: subscription ? 'updated' : 'created',
        actor_type: 'admin',
        details: { 
          customer_id: customer.id,
          frequency: formData.frequency,
          price: formData.base_price
        }
      });

      onSave();
    } catch (err) {
      console.error('Error saving subscription:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    
    if (!window.confirm('Cancel recurring service? This will also cancel all future scheduled jobs.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Cancel the subscription
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      // Cancel all future jobs for this subscription
      await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('subscription_id', subscription.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', today);

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'subscription',
        entity_id: subscription.id,
        action: 'cancelled',
        actor_type: 'admin',
        details: { customer_id: customer.id }
      });

      onSave();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-semibold text-charcoal">
                {subscription ? 'Manage' : 'Set Up'} Recurring Service
              </h2>
              <p className="text-sm text-charcoal/60">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-charcoal/5 rounded-lg">
            <X className="w-5 h-5 text-charcoal/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {generatedCount !== null && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {generatedCount > 0 
                ? `Generated ${generatedCount} upcoming job${generatedCount !== 1 ? 's' : ''} on the calendar`
                : 'All jobs already exist - no new jobs needed'
              }
            </div>
          )}

          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map(freq => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => handleChange('frequency', freq.value)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all
                    ${formData.frequency === freq.value
                      ? 'border-sage bg-sage/10'
                      : 'border-charcoal/10 hover:border-sage/50'
                    }
                  `}
                >
                  <p className="font-inter text-sm font-medium text-charcoal">{freq.label}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5">{freq.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Day */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Preferred Day</label>
            <select
              value={formData.preferred_day}
              onChange={(e) => handleChange('preferred_day', e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Preferred Time</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'morning', label: 'Morning', time: '9am - 12pm' },
                { value: 'afternoon', label: 'Afternoon', time: '1pm - 5pm' },
              ].map(time => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => handleChange('preferred_time', time.value)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all
                    ${formData.preferred_time === time.value
                      ? 'border-sage bg-sage/10'
                      : 'border-charcoal/10 hover:border-sage/50'
                    }
                  `}
                >
                  <p className="font-inter text-sm font-medium text-charcoal">{time.label}</p>
                  <p className="text-xs text-charcoal/50">{time.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Price per Visit</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => handleChange('base_price', e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="150"
                required
              />
            </div>
          </div>

          {/* Generate Jobs */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Schedule Jobs for Next
            </label>
            <select
              value={formData.generate_jobs_months}
              onChange={(e) => handleChange('generate_jobs_months', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value={1}>1 month</option>
              <option value={2}>2 months</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
            <p className="text-xs text-charcoal/50 mt-2">
              Jobs will appear on the calendar and can be assigned to cleaners
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-charcoal/10">
            {subscription && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-inter font-medium transition-colors"
              >
                Cancel Service
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button type="submit" disabled={saving || generating} className="btn-primary flex items-center gap-2">
              {(saving || generating) && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : generating ? 'Generating...' : subscription ? 'Update & Generate Jobs' : 'Start Recurring Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerDetail;
