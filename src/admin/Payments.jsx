import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDateForDB } from '../utils/scheduling';
import { formatPrice } from '../utils/pricingLogic';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, typeFilter, dateRange]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          customers (id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('payment_type', typeFilter);
      }

      // Date filtering
      const today = new Date();
      if (dateRange === 'today') {
        const todayStr = formatDateForDB(today);
        query = query.gte('created_at', todayStr);
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.customers?.name?.toLowerCase().includes(query) ||
      payment.customers?.email?.toLowerCase().includes(query) ||
      payment.stripe_payment_intent_id?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const successfulPayments = payments.filter(p => p.status === 'succeeded');
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = payments.filter(p => p.status === 'failed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  
  // Today's revenue
  const today = new Date().toDateString();
  const todayRevenue = successfulPayments
    .filter(p => new Date(p.created_at).toDateString() === today)
    .reduce((sum, p) => sum + p.amount, 0);

  // This month's revenue
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = successfulPayments
    .filter(p => new Date(p.created_at) >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

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

  const getStatusBadge = (status) => {
    const styles = {
      succeeded: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      deposit: 'bg-blue-100 text-blue-700',
      remaining: 'bg-green-100 text-green-700',
      recurring: 'bg-purple-100 text-purple-700',
      tip: 'bg-pink-100 text-pink-700',
      cancellation_fee: 'bg-orange-100 text-orange-700',
      refund: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[type] || 'bg-gray-100'}`}>
        {type?.replace('_', ' ')}
      </span>
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
            Payments
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {payments.length} transactions
          </p>
        </div>
        <button onClick={fetchPayments} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {formatPrice(monthRevenue)}
          </p>
          <p className="text-sm text-charcoal/60">This Month</p>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {formatPrice(todayRevenue)}
          </p>
          <p className="text-sm text-charcoal/60">Today</p>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {pendingPayments.length}
          </p>
          <p className="text-sm text-charcoal/60">Pending</p>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {failedPayments.length}
          </p>
          <p className="text-sm text-charcoal/60">Failed</p>
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
              placeholder="Search by customer or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-bone border border-charcoal/10 rounded-xl
                         font-inter focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          
          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Status</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-bone border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="remaining">Remaining</option>
            <option value="recurring">Recurring</option>
            <option value="tip">Tip</option>
            <option value="cancellation_fee">Cancellation Fee</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Customer</th>
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Type</th>
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Amount</th>
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Status</th>
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Date</th>
                  <th className="text-center p-4 font-inter font-semibold text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-bone/30">
                    <td className="p-4">
                      {payment.customers ? (
                        <Link 
                          to={`/admin/customers/${payment.customers.id}`}
                          className="hover:text-sage"
                        >
                          <p className="font-inter font-medium text-charcoal">
                            {payment.customers.name}
                          </p>
                          <p className="text-xs text-charcoal/50">
                            {payment.customers.email}
                          </p>
                        </Link>
                      ) : (
                        <p className="text-charcoal/50">Unknown</p>
                      )}
                    </td>
                    <td className="p-4">
                      {getTypeBadge(payment.payment_type)}
                    </td>
                    <td className="p-4">
                      <p className={`font-inter font-semibold ${
                        payment.payment_type === 'refund' ? 'text-red-600' : 'text-charcoal'
                      }`}>
                        {payment.payment_type === 'refund' ? '-' : ''}{formatPrice(payment.amount)}
                      </p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-charcoal/70">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      {payment.stripe_payment_intent_id && (
                        <a
                          href={`https://dashboard.stripe.com/payments/${payment.stripe_payment_intent_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sage hover:underline text-sm"
                        >
                          View in Stripe
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No payments found</h3>
            <p className="text-charcoal/50 text-sm">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Payments will appear here as they are processed'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
