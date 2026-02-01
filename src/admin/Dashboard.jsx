import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  CalendarDays, 
  Users, 
  DollarSign,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Package,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [stats, setStats] = useState({
    leads: 0,
    upcomingBookings: 0,
    customers: 0,
    unreadMessages: 0,
    lowStockItems: 0,
    monthlyRevenue: 0,
    unassignedBookings: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch all data in parallel
      const [
        leadsRes,
        bookingsRes,
        messagesRes,
        inventoryRes
      ] = await Promise.all([
        supabase.from('bookings').select('*').eq('status', 'lead').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('*').in('status', ['confirmed', 'payment_initiated', 'completed']).order('scheduled_date', { ascending: true }),
        supabase.from('messages').select('id').eq('status', 'unread'),
        supabase.from('inventory').select('id').in('status', ['low_stock', 'out_of_stock'])
      ]);

      const leads = leadsRes.data || [];
      const bookings = bookingsRes.data || [];
      const messages = messagesRes.data || [];
      const lowStock = inventoryRes.data || [];

      // Calculate stats
      const upcoming = bookings.filter(b => {
        if (!b.scheduled_date) return false;
        return new Date(b.scheduled_date) >= today;
      });

      const unassigned = upcoming.filter(b => !b.cleaner_id);

      const uniqueCustomers = new Set(bookings.map(b => b.email?.toLowerCase()).filter(Boolean));

      const monthRevenue = bookings
        .filter(b => {
          if (!b.scheduled_date) return false;
          const date = new Date(b.scheduled_date);
          return date >= startOfMonth && date <= today && b.status === 'completed';
        })
        .reduce((sum, b) => sum + (b.first_clean_price || 0), 0);

      setStats({
        leads: leads.length,
        upcomingBookings: upcoming.length,
        customers: uniqueCustomers.size,
        unreadMessages: messages.length,
        lowStockItems: lowStock.length,
        monthlyRevenue: monthRevenue,
        unassignedBookings: unassigned.length
      });

      setRecentLeads(leads);
      setUpcomingBookings(upcoming.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
          Welcome back! Here's what's happening.
        </p>
      </div>

      {/* Alerts */}
      {(stats.unassignedBookings > 0 || stats.lowStockItems > 0 || stats.unreadMessages > 0) && (
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.unassignedBookings > 0 && (
            <Link to="/admin/bookings" className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:border-yellow-300 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-inter font-medium text-yellow-800">
                    {stats.unassignedBookings} unassigned
                  </p>
                  <p className="text-sm text-yellow-700">Bookings need cleaners</p>
                </div>
              </div>
            </Link>
          )}
          {stats.lowStockItems > 0 && (
            <Link to="/admin/inventory" className="bg-red-50 border border-red-200 rounded-xl p-4 hover:border-red-300 transition-colors">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-inter font-medium text-red-800">
                    {stats.lowStockItems} low stock
                  </p>
                  <p className="text-sm text-red-700">Items need reordering</p>
                </div>
              </div>
            </Link>
          )}
          {stats.unreadMessages > 0 && (
            <Link to="/admin/messages" className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-inter font-medium text-blue-800">
                    {stats.unreadMessages} new message{stats.unreadMessages !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-700">From contact form</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/leads" className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-yellow-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.leads}</p>
          <p className="text-charcoal/60 font-inter text-sm">Active Leads</p>
        </Link>

        <Link to="/admin/bookings" className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-sage" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.upcomingBookings}</p>
          <p className="text-charcoal/60 font-inter text-sm">Upcoming Bookings</p>
        </Link>

        <Link to="/admin/customers" className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{stats.customers}</p>
          <p className="text-charcoal/60 font-inter text-sm">Total Customers</p>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-playfair font-semibold text-charcoal">{formatPrice(stats.monthlyRevenue)}</p>
          <p className="text-charcoal/60 font-inter text-sm">This Month</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
            <h2 className="font-playfair text-lg font-semibold text-charcoal">Recent Leads</h2>
            <Link to="/admin/leads" className="text-sage text-sm font-inter hover:underline">
              View all →
            </Link>
          </div>
          {recentLeads.length > 0 ? (
            <div className="divide-y divide-charcoal/5">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-bone/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-inter font-medium text-charcoal">{lead.name}</p>
                      <p className="text-sm text-charcoal/50">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-inter font-medium text-charcoal">{formatPrice(lead.first_clean_price)}</p>
                      <p className="text-xs text-charcoal/50">{lead.sqft?.toLocaleString()} sqft</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal/50">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-inter text-sm">No leads yet</p>
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
            <h2 className="font-playfair text-lg font-semibold text-charcoal">Upcoming Bookings</h2>
            <Link to="/admin/schedule" className="text-sage text-sm font-inter hover:underline">
              View calendar →
            </Link>
          </div>
          {upcomingBookings.length > 0 ? (
            <div className="divide-y divide-charcoal/5">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-bone/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-inter font-medium text-charcoal">{booking.name}</p>
                      <p className="text-sm text-charcoal/50 truncate max-w-[200px]">{booking.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-inter font-medium text-charcoal">{formatDate(booking.scheduled_date)}</p>
                      <p className={`text-xs ${booking.cleaner_id ? 'text-sage' : 'text-yellow-600'}`}>
                        {booking.cleaner_id ? 'Assigned' : 'Needs cleaner'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal/50">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-inter text-sm">No upcoming bookings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
