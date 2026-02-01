import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  BarChart3,
  PieChart,
  Clock,
  MapPin,
  Star,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const REPORT_TYPES = [
  { id: 'revenue', name: 'Revenue Report', icon: DollarSign, description: 'Revenue breakdown and trends' },
  { id: 'bookings', name: 'Bookings Report', icon: Calendar, description: 'Booking statistics and status' },
  { id: 'customers', name: 'Customer Report', icon: Users, description: 'Customer acquisition and retention' },
  { id: 'cleaners', name: 'Team Performance', icon: Star, description: 'Cleaner assignments and workload' },
  { id: 'areas', name: 'Service Areas', icon: MapPin, description: 'Revenue by service area' },
];

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('revenue');
  const [timeRange, setTimeRange] = useState('30d');
  const [compareRange, setCompareRange] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, cleanersRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('cleaners').select('*'),
      ]);

      let bookingsData = bookingsRes.data || [];
      let cleanersData = cleanersRes.data || [];
      
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
      setBookings(JSON.parse(localStorage.getItem('bookings') || '[]'));
      setCleaners(JSON.parse(localStorage.getItem('cleaners') || '[]'));
    } finally {
      setLoading(false);
    }
  };

  // Date range helper
  const getDateRange = (range) => {
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(0);
    }
    
    return { startDate, endDate: now };
  };

  // Filter data by date range
  const filteredData = useMemo(() => {
    const { startDate, endDate } = getDateRange(timeRange);
    
    return bookings.filter(b => {
      const date = new Date(b.created_at);
      return date >= startDate && date <= endDate;
    });
  }, [bookings, timeRange]);

  // Revenue Report Data
  const revenueReport = useMemo(() => {
    const confirmed = filteredData.filter(b => ['confirmed', 'completed'].includes(b.status));
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);
    
    // By frequency
    const byFrequency = {};
    confirmed.forEach(b => {
      const freq = b.frequency || 'onetime';
      if (!byFrequency[freq]) byFrequency[freq] = { count: 0, revenue: 0 };
      byFrequency[freq].count++;
      byFrequency[freq].revenue += b.first_clean_price || 0;
    });

    // By month
    const byMonth = {};
    confirmed.forEach(b => {
      const month = new Date(b.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      byMonth[month] = (byMonth[month] || 0) + (b.first_clean_price || 0);
    });

    // Recurring revenue
    const recurring = confirmed.filter(b => b.frequency && b.frequency !== 'onetime');
    const monthlyRecurring = recurring.reduce((sum, b) => {
      const price = b.recurring_price || 0;
      if (b.frequency === 'weekly') return sum + (price * 4);
      if (b.frequency === 'biweekly') return sum + (price * 2);
      return sum + price;
    }, 0);

    return { totalRevenue, byFrequency, byMonth, monthlyRecurring, confirmedCount: confirmed.length };
  }, [filteredData]);

  // Bookings Report Data
  const bookingsReport = useMemo(() => {
    const statusCounts = {};
    filteredData.forEach(b => {
      const status = b.status || 'lead';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const conversionRate = filteredData.length > 0
      ? ((statusCounts.confirmed || 0) + (statusCounts.completed || 0)) / filteredData.length * 100
      : 0;

    // By day of week
    const byDayOfWeek = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    filteredData.forEach(b => {
      if (b.scheduled_date) {
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(b.scheduled_date).getDay()];
        byDayOfWeek[day]++;
      }
    });

    return { statusCounts, conversionRate, byDayOfWeek, total: filteredData.length };
  }, [filteredData]);

  // Customer Report Data
  const customerReport = useMemo(() => {
    const customerMap = new Map();
    filteredData.forEach(b => {
      if (!b.email) return;
      const existing = customerMap.get(b.email);
      if (!existing) {
        customerMap.set(b.email, { email: b.email, name: b.name, bookings: 1, spent: b.first_clean_price || 0, firstBooking: b.created_at });
      } else {
        existing.bookings++;
        existing.spent += b.first_clean_price || 0;
      }
    });

    const customers = Array.from(customerMap.values());
    const newCustomers = customers.filter(c => {
      const first = new Date(c.firstBooking);
      return first >= getDateRange(timeRange).startDate;
    });
    const repeatCustomers = customers.filter(c => c.bookings > 1);
    const avgLifetimeValue = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.spent, 0) / customers.length 
      : 0;

    return { 
      totalCustomers: customers.length, 
      newCustomers: newCustomers.length,
      repeatRate: customers.length > 0 ? (repeatCustomers.length / customers.length * 100).toFixed(1) : 0,
      avgLifetimeValue,
      topCustomers: customers.sort((a, b) => b.spent - a.spent).slice(0, 5),
    };
  }, [filteredData, timeRange]);

  // Team Performance Report
  const teamReport = useMemo(() => {
    const cleanerStats = {};
    cleaners.forEach(c => {
      cleanerStats[c.id] = { name: c.name, assignments: 0, revenue: 0 };
    });

    filteredData.forEach(b => {
      if (b.cleaner_id && cleanerStats[b.cleaner_id]) {
        cleanerStats[b.cleaner_id].assignments++;
        cleanerStats[b.cleaner_id].revenue += b.first_clean_price || 0;
      }
    });

    const unassigned = filteredData.filter(b => !b.cleaner_id && b.status !== 'cancelled').length;

    return {
      cleanerStats: Object.values(cleanerStats).sort((a, b) => b.assignments - a.assignments),
      unassigned,
      activeCleaners: cleaners.filter(c => c.status === 'active').length,
    };
  }, [filteredData, cleaners]);

  // Service Area Report
  const areaReport = useMemo(() => {
    const byArea = {};
    filteredData.filter(b => ['confirmed', 'completed'].includes(b.status)).forEach(b => {
      const area = b.service_area || 'Unknown';
      if (!byArea[area]) byArea[area] = { count: 0, revenue: 0 };
      byArea[area].count++;
      byArea[area].revenue += b.first_clean_price || 0;
    });

    return Object.entries(byArea)
      .map(([area, data]) => ({ area, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const exportReport = () => {
    let headers = [];
    let rows = [];

    switch (activeReport) {
      case 'revenue':
        headers = ['Metric', 'Value'];
        rows = [
          ['Total Revenue', revenueReport.totalRevenue],
          ['Confirmed Bookings', revenueReport.confirmedCount],
          ['Monthly Recurring', revenueReport.monthlyRecurring],
          ...Object.entries(revenueReport.byFrequency).map(([f, d]) => [`${f} Revenue`, d.revenue]),
        ];
        break;
      case 'bookings':
        headers = ['Status', 'Count'];
        rows = Object.entries(bookingsReport.statusCounts);
        break;
      case 'customers':
        headers = ['Name', 'Email', 'Bookings', 'Total Spent'];
        rows = customerReport.topCustomers.map(c => [c.name, c.email, c.bookings, c.spent]);
        break;
      case 'cleaners':
        headers = ['Cleaner', 'Assignments', 'Revenue'];
        rows = teamReport.cleanerStats.map(c => [c.name, c.assignments, c.revenue]);
        break;
      case 'areas':
        headers = ['Service Area', 'Bookings', 'Revenue'];
        rows = areaReport.map(a => [a.area, a.count, a.revenue]);
        break;
    }

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            Reports
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Detailed business analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-charcoal/10 rounded-xl font-inter text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
          </select>
          <button onClick={exportReport} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-2">
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors ${
                  activeReport === report.id
                    ? 'bg-sage text-white'
                    : 'text-charcoal/70 hover:bg-bone'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-inter text-sm">{report.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenue Report */}
      {activeReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Total Revenue</p>
              <p className="font-playfair text-2xl font-semibold text-sage">
                {formatPrice(revenueReport.totalRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Confirmed Bookings</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {revenueReport.confirmedCount}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Avg. Booking Value</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {formatPrice(revenueReport.confirmedCount > 0 ? revenueReport.totalRevenue / revenueReport.confirmedCount : 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Est. Monthly Recurring</p>
              <p className="font-playfair text-2xl font-semibold text-green-600">
                {formatPrice(revenueReport.monthlyRecurring)}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Revenue by Frequency</h3>
              <div className="space-y-3">
                {Object.entries(revenueReport.byFrequency).map(([freq, data]) => (
                  <div key={freq} className="flex items-center justify-between py-2 border-b border-charcoal/5">
                    <span className="font-inter text-charcoal capitalize">{freq === 'onetime' ? 'One-Time' : freq}</span>
                    <div className="text-right">
                      <p className="font-inter font-semibold text-charcoal">{formatPrice(data.revenue)}</p>
                      <p className="text-xs text-charcoal/50">{data.count} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Revenue by Month</h3>
              <div className="space-y-3">
                {Object.entries(revenueReport.byMonth).slice(-6).map(([month, revenue]) => (
                  <div key={month} className="flex items-center justify-between py-2 border-b border-charcoal/5">
                    <span className="font-inter text-charcoal">{month}</span>
                    <span className="font-inter font-semibold text-charcoal">{formatPrice(revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Report */}
      {activeReport === 'bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Total Bookings</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">{bookingsReport.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Conversion Rate</p>
              <p className="font-playfair text-2xl font-semibold text-sage">{bookingsReport.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Confirmed</p>
              <p className="font-playfair text-2xl font-semibold text-green-600">{bookingsReport.statusCounts.confirmed || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Pending Leads</p>
              <p className="font-playfair text-2xl font-semibold text-yellow-600">{bookingsReport.statusCounts.lead || 0}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Bookings by Status</h3>
              <div className="space-y-3">
                {Object.entries(bookingsReport.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2 border-b border-charcoal/5">
                    <span className="font-inter text-charcoal capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-inter font-semibold text-charcoal">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Bookings by Day</h3>
              <div className="space-y-3">
                {Object.entries(bookingsReport.byDayOfWeek).map(([day, count]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-charcoal/5">
                    <span className="font-inter text-charcoal">{day}</span>
                    <span className="font-inter font-semibold text-charcoal">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Report */}
      {activeReport === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Total Customers</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">{customerReport.totalCustomers}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">New Customers</p>
              <p className="font-playfair text-2xl font-semibold text-green-600">{customerReport.newCustomers}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Repeat Rate</p>
              <p className="font-playfair text-2xl font-semibold text-sage">{customerReport.repeatRate}%</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Avg. Lifetime Value</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">{formatPrice(customerReport.avgLifetimeValue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Top Customers</h3>
            <div className="space-y-3">
              {customerReport.topCustomers.map((customer, i) => (
                <div key={customer.email} className="flex items-center justify-between py-3 border-b border-charcoal/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sage/10 flex items-center justify-center text-xs font-semibold text-sage">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-inter font-medium text-charcoal">{customer.name}</p>
                      <p className="text-xs text-charcoal/50">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-inter font-semibold text-sage">{formatPrice(customer.spent)}</p>
                    <p className="text-xs text-charcoal/50">{customer.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Report */}
      {activeReport === 'cleaners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Active Cleaners</p>
              <p className="font-playfair text-2xl font-semibold text-charcoal">{teamReport.activeCleaners}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Total Assignments</p>
              <p className="font-playfair text-2xl font-semibold text-sage">
                {teamReport.cleanerStats.reduce((sum, c) => sum + c.assignments, 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <p className="text-sm text-charcoal/50 font-inter mb-1">Unassigned Jobs</p>
              <p className="font-playfair text-2xl font-semibold text-yellow-600">{teamReport.unassigned}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Cleaner Performance</h3>
            <div className="space-y-3">
              {teamReport.cleanerStats.map((cleaner) => (
                <div key={cleaner.name} className="flex items-center justify-between py-3 border-b border-charcoal/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                      <span className="font-inter font-semibold text-sage">{cleaner.name?.[0]}</span>
                    </div>
                    <p className="font-inter font-medium text-charcoal">{cleaner.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-inter font-semibold text-charcoal">{cleaner.assignments} jobs</p>
                    <p className="text-xs text-charcoal/50">{formatPrice(cleaner.revenue)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Areas Report */}
      {activeReport === 'areas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4">Revenue by Service Area</h3>
          <div className="space-y-3">
            {areaReport.map((area) => (
              <div key={area.area} className="flex items-center justify-between py-3 border-b border-charcoal/5">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-sage" />
                  <p className="font-inter font-medium text-charcoal">{area.area}</p>
                </div>
                <div className="text-right">
                  <p className="font-inter font-semibold text-sage">{formatPrice(area.revenue)}</p>
                  <p className="text-xs text-charcoal/50">{area.count} bookings</p>
                </div>
              </div>
            ))}
            {areaReport.length === 0 && (
              <p className="text-center text-charcoal/50 py-8">No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
