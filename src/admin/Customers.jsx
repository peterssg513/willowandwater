import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Calendar,
  ArrowRight,
  RefreshCw,
  Star,
  DollarSign,
  Plus,
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  Pause
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const STATUS_TABS = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'active', label: 'Active', icon: UserCheck },
  { id: 'prospect', label: 'Prospects', icon: UserPlus },
  { id: 'paused', label: 'Paused', icon: Pause },
  { id: 'churned', label: 'Churned', icon: UserX },
];

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          subscriptions (
            id,
            frequency,
            preferred_day,
            base_price,
            status
          ),
          jobs (
            id,
            scheduled_date,
            status,
            customer_rating,
            final_price
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Calculate additional stats for each customer
      const customersWithStats = (data || []).map(customer => {
        const completedJobs = customer.jobs?.filter(j => j.status === 'completed') || [];
        const ratings = completedJobs
          .map(j => j.customer_rating)
          .filter(r => r !== null);
        
        const activeSubscription = customer.subscriptions?.find(s => s.status === 'active');
        const nextJob = customer.jobs?.find(j => 
          ['scheduled', 'confirmed'].includes(j.status) && 
          new Date(j.scheduled_date) >= new Date()
        );

        return {
          ...customer,
          completedJobsCount: completedJobs.length,
          avgRating: ratings.length > 0 
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
            : null,
          totalSpent: completedJobs.reduce((sum, j) => sum + (j.final_price || 0), 0),
          activeSubscription,
          nextJob,
        };
      });

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.city?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      prospect: 'bg-yellow-100 text-yellow-700',
      paused: 'bg-gray-100 text-gray-700',
      churned: 'bg-red-100 text-red-700',
    };
    const labels = {
      active: 'Active',
      prospect: 'Prospect',
      paused: 'Paused',
      churned: 'Churned',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.prospect}`}>
        {labels[status] || status}
      </span>
    );
  };

  const statusCounts = {
    all: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    prospect: customers.filter(c => c.status === 'prospect').length,
    paused: customers.filter(c => c.status === 'paused').length,
    churned: customers.filter(c => c.status === 'churned').length,
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
            {filteredCustomers.length} {statusFilter !== 'all' ? statusFilter : ''} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
          <button 
            onClick={fetchCustomers} 
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          const count = statusCounts[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-inter text-sm
                transition-all
                ${isActive 
                  ? 'bg-sage text-white' 
                  : 'bg-white border border-charcoal/10 text-charcoal hover:border-sage/50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`
                px-1.5 py-0.5 rounded-full text-xs
                ${isActive ? 'bg-white/20' : 'bg-charcoal/5'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                       font-inter focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/admin/customers/${customer.id}`}
                className="block p-4 hover:bg-bone/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${customer.status === 'active' ? 'bg-green-100' :
                          customer.status === 'prospect' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}
                      >
                        <Users className={`w-5 h-5 
                          ${customer.status === 'active' ? 'text-green-600' :
                            customer.status === 'prospect' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-inter font-semibold text-charcoal">
                            {customer.name}
                          </h3>
                          {getStatusBadge(customer.status)}
                        </div>
                        <p className="text-sm text-charcoal/50">{customer.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <MapPin className="w-4 h-4" />
                        <span>{customer.city || 'No address'}</span>
                      </div>
                      
                      {customer.activeSubscription && (
                        <div className="flex items-center gap-2 text-charcoal/60">
                          <Calendar className="w-4 h-4" />
                          <span className="capitalize">
                            {customer.activeSubscription.frequency}
                          </span>
                        </div>
                      )}
                      
                      {customer.avgRating && (
                        <div className="flex items-center gap-2 text-charcoal/60">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{customer.avgRating} avg</span>
                        </div>
                      )}
                      
                      {customer.totalSpent > 0 && (
                        <div className="flex items-center gap-2 text-charcoal/60">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatPrice(customer.totalSpent)} total</span>
                        </div>
                      )}
                    </div>

                    {customer.nextJob && (
                      <p className="text-xs text-sage mt-2">
                        Next clean: {formatDate(customer.nextJob.scheduled_date)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-charcoal/30 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No customers found</h3>
            <p className="text-charcoal/50 text-sm mb-4">
              {searchQuery 
                ? 'Try adjusting your search' 
                : statusFilter !== 'all'
                  ? `No ${statusFilter} customers yet`
                  : 'Customers will appear here when they sign up'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newCustomer) => {
            setCustomers(prev => [{ ...newCustomer, completedJobsCount: 0, avgRating: null, totalSpent: 0 }, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// Add Customer Modal
const AddCustomerModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    sqft: '',
    bedrooms: '',
    bathrooms: '',
    status: 'prospect',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      setSaving(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          zip: formData.zip.trim() || null,
          sqft: formData.sqft ? parseInt(formData.sqft) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          status: formData.status,
          service_area: formData.city || 'Fox Valley',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: data.id,
        action: 'created',
        actor_type: 'admin',
        details: { source: 'admin_portal' }
      });

      onAdd(data);
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Add Customer</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="jane@example.com"
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

            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="St. Charles"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">ZIP</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="60174"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-2">
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

            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
              </select>
            </div>
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
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers;
