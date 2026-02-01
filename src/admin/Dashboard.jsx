import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  CalendarCheck, 
  Users, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  Bell,
  MapPin,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

// Quick Contact Button
const QuickContactButton = ({ type, value, name, size = 'sm' }) => {
  if (!value) return null;
  
  const config = {
    phone: { icon: Phone, href: `tel:${value}`, className: 'bg-green-100 text-green-700 hover:bg-green-200' },
    email: { icon: Mail, href: `mailto:${value}`, className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    sms: { icon: MessageSquare, href: `sms:${value}?body=Hi ${name || ''}, this is Willow %26 Water Cleaning. `, className: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  };
  
  const { icon: Icon, href, className } = config[type];
  const sizeClass = size === 'sm' ? 'p-1.5' : 'p-2';
  
  return (
    <a href={href} className={`inline-flex items-center justify-center rounded-lg transition-colors ${className} ${sizeClass}`}>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </a>
  );
};

// Stat Card
const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color = 'sage', link }) => {
  const colorClasses = {
    sage: 'bg-sage/10 text-sage',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  const content = (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5 ${link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-inter ${
            trend === 'up' ? 'text-green-600' : 'text-red-500'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-charcoal/60 font-inter text-sm mb-1">{title}</h3>
      <p className="font-playfair text-3xl font-semibold text-charcoal">{value}</p>
      {subValue && <p className="text-charcoal/50 font-inter text-xs mt-1">{subValue}</p>}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

// Alert Item Component
const AlertItem = ({ type, title, description, action, actionLink, onDismiss }) => {
  const typeConfig = {
    urgent: { icon: AlertTriangle, bgClass: 'bg-red-50 border-red-200', iconClass: 'text-red-600 bg-red-100', textClass: 'text-red-800' },
    warning: { icon: AlertCircle, bgClass: 'bg-yellow-50 border-yellow-200', iconClass: 'text-yellow-600 bg-yellow-100', textClass: 'text-yellow-800' },
    info: { icon: Bell, bgClass: 'bg-blue-50 border-blue-200', iconClass: 'text-blue-600 bg-blue-100', textClass: 'text-blue-800' },
    success: { icon: CheckCircle2, bgClass: 'bg-green-50 border-green-200', iconClass: 'text-green-600 bg-green-100', textClass: 'text-green-800' },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bgClass}`}>
      <div className={`p-2 rounded-lg ${config.iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-inter font-medium text-sm ${config.textClass}`}>{title}</p>
        {description && <p className="text-xs text-charcoal/60 mt-0.5">{description}</p>}
      </div>
      {action && actionLink && (
        <Link
          to={actionLink}
          className={`px-3 py-1.5 rounded-lg text-xs font-inter font-medium whitespace-nowrap
                     ${type === 'urgent' ? 'bg-red-500 text-white hover:bg-red-600' : 
                       type === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                       'bg-blue-500 text-white hover:bg-blue-600'} transition-colors`}
        >
          {action}
        </Link>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 text-charcoal/40 hover:text-charcoal rounded">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Today's Job Card
const TodayJobCard = ({ booking, cleaners }) => {
  const cleaner = cleaners.find(c => c.id === booking.cleaner_id);

  return (
    <div className={`p-4 rounded-xl border ${booking.cleaner_id ? 'bg-white border-charcoal/10' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-inter font-semibold text-charcoal">{booking.name}</p>
          <p className="text-xs text-charcoal/50 font-inter flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {booking.service_area || booking.address?.split(',')[0] || 'No address'}
          </p>
        </div>
        <div className="flex gap-1">
          <QuickContactButton type="phone" value={booking.phone} name={booking.name} />
          <QuickContactButton type="sms" value={booking.phone} name={booking.name} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            cleaner ? 'bg-sage/10 text-sage' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {cleaner ? cleaner.name.charAt(0) : '?'}
          </div>
          <span className={`text-sm font-inter ${cleaner ? 'text-charcoal' : 'text-yellow-700'}`}>
            {cleaner ? cleaner.name : 'Unassigned'}
          </span>
        </div>
        <span className="text-sm font-semibold text-charcoal">
          {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
        </span>
      </div>
      
      {!booking.cleaner_id && (
        <Link
          to="/admin/schedule"
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white 
                     rounded-lg text-sm font-inter font-medium hover:bg-yellow-600 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Assign Cleaner
        </Link>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase
      let bookingsData = [];
      let cleanersData = [];
      
      try {
        const bookingsRes = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (bookingsRes.data && !bookingsRes.error) {
          bookingsData = bookingsRes.data;
        }
      } catch (e) {
        console.log('Bookings table not available, using localStorage');
      }
      
      try {
        const cleanersRes = await supabase.from('cleaners').select('*');
        if (cleanersRes.data && !cleanersRes.error) {
          cleanersData = cleanersRes.data;
        }
      } catch (e) {
        console.log('Cleaners table not available, using localStorage');
      }
      
      // Fallback to localStorage if no data from Supabase
      if (bookingsData.length === 0) {
        bookingsData = JSON.parse(localStorage.getItem('bookings') || '[]');
      }
      if (cleanersData.length === 0) {
        cleanersData = JSON.parse(localStorage.getItem('cleaners') || '[]');
      }
      
      setBookings(bookingsData);
      setCleaners(cleanersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Always fallback to localStorage on any error
      setBookings(JSON.parse(localStorage.getItem('bookings') || '[]'));
      setCleaners(JSON.parse(localStorage.getItem('cleaners') || '[]'));
    } finally {
      setLoading(false);
    }
  };

  // Computed stats and alerts
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    
    const activeCleaners = cleaners.filter(c => c.status === 'active');
    const confirmed = bookings.filter(b => ['confirmed', 'completed'].includes(b.status));
    const monthlyConfirmed = confirmed.filter(b => new Date(b.created_at) >= monthStart);
    const recurring = bookings.filter(b => b.frequency && b.frequency !== 'onetime' && b.status !== 'cancelled');
    const leads = bookings.filter(b => b.status === 'lead');
    
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);
    const monthlyRevenue = monthlyConfirmed.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);
    
    // Estimate recurring monthly revenue
    const recurringMonthlyRevenue = recurring.reduce((sum, b) => {
      const price = b.recurring_price || b.first_clean_price || 0;
      const multiplier = b.frequency === 'weekly' ? 4 : b.frequency === 'biweekly' ? 2 : 1;
      return sum + (price * multiplier);
    }, 0);

    return {
      totalRevenue,
      monthlyRevenue,
      recurringMonthlyRevenue,
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      activeCleaners: activeCleaners.length,
      recurringJobs: recurring.filter(r => ['confirmed', 'completed'].includes(r.status)).length,
      pendingLeads: leads.length,
    };
  }, [bookings, cleaners]);

  // Today's jobs
  const todaysJobs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => 
      b.scheduled_date?.split('T')[0] === today && 
      b.status !== 'cancelled'
    ).sort((a, b) => (a.cleaner_id ? 0 : 1) - (b.cleaner_id ? 0 : 1));
  }, [bookings]);

  // Upcoming this week
  const upcomingThisWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    
    return bookings.filter(b => {
      const date = new Date(b.scheduled_date);
      return date > now && date <= weekEnd && b.status !== 'cancelled';
    }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  }, [bookings]);

  // Check inventory
  const inventoryAlerts = useMemo(() => {
    try {
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      const outOfStock = inventory.filter(item => item.quantity === 0);
      const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= item.reorderPoint);
      return { outOfStock: outOfStock.length, lowStock: lowStock.length };
    } catch {
      return { outOfStock: 0, lowStock: 0 };
    }
  }, []);

  // Alerts
  const alerts = useMemo(() => {
    const alertList = [];
    
    // Unassigned jobs for today
    const unassignedToday = todaysJobs.filter(j => !j.cleaner_id);
    if (unassignedToday.length > 0) {
      alertList.push({
        type: 'urgent',
        title: `${unassignedToday.length} job${unassignedToday.length > 1 ? 's' : ''} today without cleaner!`,
        description: 'Assign a cleaner immediately to avoid missing appointments',
        action: 'Assign Now',
        actionLink: '/admin/schedule',
      });
    }
    
    // Low/out of stock inventory
    if (inventoryAlerts.outOfStock > 0) {
      alertList.push({
        type: 'urgent',
        title: `${inventoryAlerts.outOfStock} item${inventoryAlerts.outOfStock > 1 ? 's' : ''} out of stock!`,
        description: 'Order supplies before your next cleaning',
        action: 'View Inventory',
        actionLink: '/admin/inventory',
      });
    } else if (inventoryAlerts.lowStock > 0) {
      alertList.push({
        type: 'warning',
        title: `${inventoryAlerts.lowStock} item${inventoryAlerts.lowStock > 1 ? 's' : ''} running low`,
        description: 'Consider reordering supplies soon',
        action: 'View Inventory',
        actionLink: '/admin/inventory',
      });
    }
    
    // Unassigned jobs this week
    const unassignedWeek = upcomingThisWeek.filter(j => !j.cleaner_id);
    if (unassignedWeek.length > 0 && unassignedToday.length === 0) {
      alertList.push({
        type: 'warning',
        title: `${unassignedWeek.length} upcoming job${unassignedWeek.length > 1 ? 's' : ''} need assignment`,
        description: 'Assign cleaners to upcoming jobs this week',
        action: 'View Schedule',
        actionLink: '/admin/schedule',
      });
    }
    
    // Pending leads
    if (stats.pendingLeads > 0) {
      alertList.push({
        type: 'warning',
        title: `${stats.pendingLeads} lead${stats.pendingLeads > 1 ? 's' : ''} awaiting follow-up`,
        description: 'Customers started booking but haven\'t completed payment',
        action: 'View Leads',
        actionLink: '/admin/bookings',
      });
    }
    
    // No active cleaners
    if (stats.activeCleaners === 0) {
      alertList.push({
        type: 'warning',
        title: 'No active cleaners',
        description: 'Add team members to start assigning jobs',
        action: 'Add Cleaner',
        actionLink: '/admin/cleaners',
      });
    }
    
    return alertList;
  }, [todaysJobs, upcomingThisWeek, stats, inventoryAlerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Dashboard
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn-secondary self-start flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertItem key={index} {...alert} />
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatPrice(stats.monthlyRevenue)}
          subValue="This month"
          icon={DollarSign}
          color="green"
          link="/admin/revenue"
        />
        <StatCard
          title="Recurring Revenue"
          value={formatPrice(stats.recurringMonthlyRevenue)}
          subValue="Estimated monthly"
          icon={TrendingUp}
          color="sage"
          link="/admin/recurring"
        />
        <StatCard
          title="Active Customers"
          value={stats.confirmedBookings}
          subValue={`${stats.recurringJobs} recurring`}
          icon={CalendarCheck}
          color="blue"
          link="/admin/customers"
        />
        <StatCard
          title="Team Members"
          value={stats.activeCleaners}
          subValue="Active cleaners"
          icon={Users}
          color="purple"
          link="/admin/cleaners"
        />
      </div>

      {/* Today's Overview & Upcoming */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-playfair text-lg font-semibold text-charcoal">
                Today's Jobs
              </h2>
              <p className="text-xs text-charcoal/50 font-inter">
                {todaysJobs.length} cleaning{todaysJobs.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
            <Link 
              to="/admin/schedule"
              className="text-sage hover:text-charcoal font-inter text-sm flex items-center gap-1 transition-colors"
            >
              Full calendar
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {todaysJobs.length > 0 ? (
            <div className="space-y-3">
              {todaysJobs.map((job) => (
                <TodayJobCard key={job.id} booking={job} cleaners={cleaners} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-charcoal/50">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-inter">No jobs scheduled for today</p>
              <p className="text-sm mt-1">Enjoy your day off!</p>
            </div>
          )}
        </div>

        {/* Coming Up */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-lg font-semibold text-charcoal">
              Coming Up This Week
            </h2>
            <Link 
              to="/admin/bookings"
              className="text-sage hover:text-charcoal font-inter text-sm flex items-center gap-1 transition-colors"
            >
              All bookings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {upcomingThisWeek.length > 0 ? (
            <div className="space-y-2">
              {upcomingThisWeek.slice(0, 6).map((booking) => {
                const cleaner = cleaners.find(c => c.id === booking.cleaner_id);
                return (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between py-3 border-b border-charcoal/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[40px]">
                        <p className="text-xs text-charcoal/50 font-inter">
                          {new Date(booking.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="font-playfair font-semibold text-charcoal">
                          {new Date(booking.scheduled_date).getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="font-inter font-medium text-charcoal text-sm">{booking.name}</p>
                        <p className="text-xs text-charcoal/50">
                          {cleaner ? cleaner.name : <span className="text-yellow-600">Needs cleaner</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <QuickContactButton type="phone" value={booking.phone} name={booking.name} />
                      <span className="font-inter font-semibold text-charcoal text-sm">
                        {formatPrice(booking.first_clean_price || booking.recurring_price || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {upcomingThisWeek.length > 6 && (
                <Link 
                  to="/admin/schedule"
                  className="block text-center text-sm text-sage hover:text-charcoal font-inter py-2"
                >
                  +{upcomingThisWeek.length - 6} more this week
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-charcoal/50">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-inter">All caught up!</p>
              <p className="text-sm mt-1">No upcoming jobs this week</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
        <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/schedule"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <Calendar className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Schedule</span>
          </Link>
          <Link
            to="/admin/bookings"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <CalendarCheck className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Bookings</span>
          </Link>
          <Link
            to="/admin/customers"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <Users className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Customers</span>
          </Link>
          <Link
            to="/admin/cleaners"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <UserPlus className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Team</span>
          </Link>
          <Link
            to="/admin/revenue"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <DollarSign className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Revenue</span>
          </Link>
          <Link
            to="/admin/reports"
            className="p-4 bg-bone/50 hover:bg-bone rounded-xl text-center transition-all hover:shadow-sm group"
          >
            <Eye className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-inter text-sm text-charcoal">Reports</span>
          </Link>
        </div>
      </div>

      {/* Business Health Summary */}
      <div className="bg-gradient-to-r from-sage/10 to-sage/5 rounded-2xl p-6 border border-sage/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sage/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-sage" />
          </div>
          <div className="flex-1">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-1">Business Health</h3>
            <p className="text-sm text-charcoal/70 font-inter">
              {stats.recurringJobs > 0 
                ? `You have ${stats.recurringJobs} recurring customer${stats.recurringJobs > 1 ? 's' : ''} generating an estimated ${formatPrice(stats.recurringMonthlyRevenue)}/month. `
                : 'Build recurring revenue by converting one-time customers to recurring schedules. '}
              {todaysJobs.length > 0 
                ? `${todaysJobs.filter(j => j.cleaner_id).length}/${todaysJobs.length} jobs are ready for today.`
                : 'No jobs scheduled for today.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
