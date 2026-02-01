import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CalendarDays, 
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Package,
  TrendingUp,
  UserPlus,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';
import { formatDateForDB } from '../utils/scheduling';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayJobs: 0,
    weekJobs: 0,
    activeCustomers: 0,
    prospects: 0,
    monthRevenue: 0,
    unassignedJobs: 0,
    lowStockItems: 0,
    pendingPayments: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [todayJobs, setTodayJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = formatDateForDB(today);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = formatDateForDB(weekEnd);
      const monthStart = formatDateForDB(new Date(today.getFullYear(), today.getMonth(), 1));

      // Fetch all data in parallel
      const [
        todayJobsRes,
        weekJobsRes,
        customersRes,
        prospectsRes,
        revenueRes,
        unassignedRes,
        inventoryRes,
        pendingPaymentsRes,
        activityRes,
        lowRatingsRes,
      ] = await Promise.all([
        // Today's jobs
        supabase
          .from('jobs')
          .select('*, customers(name, address, city, phone)')
          .eq('scheduled_date', todayStr)
          .not('status', 'in', '("cancelled","no_show")'),
        // This week's jobs
        supabase
          .from('jobs')
          .select('id')
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', weekEndStr)
          .not('status', 'in', '("cancelled","no_show")'),
        // Active customers
        supabase
          .from('customers')
          .select('id')
          .eq('status', 'active'),
        // Prospects
        supabase
          .from('customers')
          .select('id')
          .eq('status', 'prospect'),
        // Month revenue (completed jobs)
        supabase
          .from('jobs')
          .select('final_price')
          .gte('scheduled_date', monthStart)
          .lte('scheduled_date', todayStr)
          .eq('status', 'completed'),
        // Unassigned jobs
        supabase
          .from('jobs')
          .select('id')
          .is('cleaner_id', null)
          .gte('scheduled_date', todayStr)
          .not('status', 'in', '("cancelled","no_show")'),
        // Low stock inventory
        supabase
          .from('inventory')
          .select('id')
          .in('status', ['low_stock', 'out_of_stock']),
        // Pending payments
        supabase
          .from('jobs')
          .select('id')
          .eq('payment_status', 'failed'),
        // Recent activity
        supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        // Low ratings (recent)
        supabase
          .from('jobs')
          .select('id, customer_rating, customers(name)')
          .lte('customer_rating', 3)
          .not('customer_rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      // Calculate stats
      const monthRevenue = (revenueRes.data || [])
        .reduce((sum, job) => sum + (job.final_price || 0), 0);

      setStats({
        todayJobs: todayJobsRes.data?.length || 0,
        weekJobs: weekJobsRes.data?.length || 0,
        activeCustomers: customersRes.data?.length || 0,
        prospects: prospectsRes.data?.length || 0,
        monthRevenue,
        unassignedJobs: unassignedRes.data?.length || 0,
        lowStockItems: inventoryRes.data?.length || 0,
        pendingPayments: pendingPaymentsRes.data?.length || 0,
      });

      setTodayJobs(todayJobsRes.data || []);
      setRecentActivity(activityRes.data || []);

      // Build alerts
      const newAlerts = [];
      
      if (unassignedRes.data?.length > 0) {
        newAlerts.push({
          type: 'warning',
          icon: AlertTriangle,
          title: `${unassignedRes.data.length} unassigned job${unassignedRes.data.length > 1 ? 's' : ''}`,
          subtitle: 'Jobs need cleaner assignment',
          link: '/admin/schedule',
        });
      }
      
      if (pendingPaymentsRes.data?.length > 0) {
        newAlerts.push({
          type: 'error',
          icon: XCircle,
          title: `${pendingPaymentsRes.data.length} failed payment${pendingPaymentsRes.data.length > 1 ? 's' : ''}`,
          subtitle: 'Charges need attention',
          link: '/admin/payments',
        });
      }
      
      if (inventoryRes.data?.length > 0) {
        newAlerts.push({
          type: 'warning',
          icon: Package,
          title: `${inventoryRes.data.length} item${inventoryRes.data.length > 1 ? 's' : ''} low on stock`,
          subtitle: 'Supplies need reordering',
          link: '/admin/inventory',
        });
      }
      
      if (lowRatingsRes.data?.length > 0) {
        newAlerts.push({
          type: 'info',
          icon: Star,
          title: `${lowRatingsRes.data.length} low rating${lowRatingsRes.data.length > 1 ? 's' : ''} to review`,
          subtitle: 'Customer feedback needs attention',
          link: '/admin/customers',
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot === 'morning' ? '9am-12pm' : '1pm-5pm';
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created':
      case 'booked':
        return <UserPlus className="w-4 h-4 text-sage" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'payment_intent_created':
      case 'remaining_charged':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-charcoal/50" />;
    }
  };

  const getActivityText = (activity) => {
    const entityType = activity.entity_type;
    const action = activity.action;
    
    if (entityType === 'customer') {
      if (action === 'created') return 'New customer signed up';
      if (action === 'booking_started') return 'Customer started booking';
    }
    if (entityType === 'job') {
      if (action === 'booked') return 'New cleaning booked';
      if (action === 'completed') return 'Cleaning completed';
      if (action === 'remaining_charged') return 'Payment processed';
    }
    return `${entityType} ${action}`;
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
      <div>
        <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
          Dashboard
        </h1>
        <p className="text-charcoal/60 font-inter mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {alerts.map((alert, idx) => {
            const Icon = alert.icon;
            const bgColor = alert.type === 'error' ? 'bg-red-50 border-red-200' :
                           alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                           'bg-blue-50 border-blue-200';
            const textColor = alert.type === 'error' ? 'text-red-600' :
                             alert.type === 'warning' ? 'text-yellow-600' :
                             'text-blue-600';
            
            return (
              <Link
                key={idx}
                to={alert.link}
                className={`${bgColor} border rounded-xl p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${textColor}`} />
                  <div>
                    <p className={`font-inter font-medium ${textColor.replace('600', '800')}`}>
                      {alert.title}
                    </p>
                    <p className={`text-sm ${textColor.replace('600', '700')}`}>
                      {alert.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/schedule"
          className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-sage" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.todayJobs}</p>
          <p className="text-charcoal/60 font-inter text-sm">Today's Jobs</p>
          <p className="text-xs text-sage mt-1">{stats.weekJobs} this week</p>
        </Link>

        <Link
          to="/admin/customers"
          className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.activeCustomers}</p>
          <p className="text-charcoal/60 font-inter text-sm">Active Customers</p>
          <p className="text-xs text-blue-600 mt-1">{stats.prospects} prospects</p>
        </Link>

        <Link
          to="/admin/cleaners"
          className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.unassignedJobs}</p>
          <p className="text-charcoal/60 font-inter text-sm">Unassigned Jobs</p>
          <p className="text-xs text-purple-600 mt-1">Needs assignment</p>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">
            {formatPrice(stats.monthRevenue)}
          </p>
          <p className="text-charcoal/60 font-inter text-sm">This Month</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
            <h2 className="font-playfair text-lg font-semibold text-charcoal">Today's Jobs</h2>
            <Link to="/admin/schedule" className="text-sage text-sm font-inter hover:underline">
              View all →
            </Link>
          </div>
          {todayJobs.length > 0 ? (
            <div className="divide-y divide-charcoal/5">
              {todayJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-bone/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-inter font-medium text-charcoal">
                        {job.customers?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-charcoal/50 truncate max-w-[200px]">
                        {job.customers?.city || 'Unknown location'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-inter font-medium text-charcoal">
                        {formatTime(job.scheduled_time)}
                      </p>
                      <p className={`text-xs ${job.cleaner_id ? 'text-sage' : 'text-yellow-600'}`}>
                        {job.cleaner_id ? 'Assigned' : 'Needs cleaner'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal/50">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-inter text-sm">No jobs scheduled for today</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
            <h2 className="font-playfair text-lg font-semibold text-charcoal">Recent Activity</h2>
            <Link to="/admin/communications" className="text-sage text-sm font-inter hover:underline">
              View all →
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-charcoal/5">
              {recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-bone/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bone flex items-center justify-center">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm text-charcoal">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal/50">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-inter text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
