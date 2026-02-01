import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
];

const Revenue = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Use Supabase data or fallback to localStorage
      if (data && data.length > 0) {
        setBookings(data);
      } else {
        const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        setBookings(localBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to localStorage
      const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      setBookings(localBookings);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range
  const getDateRange = (range) => {
    const now = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }

    return { startDate, endDate: now };
  };

  // Filter and calculate metrics
  const metrics = useMemo(() => {
    const { startDate, endDate } = getDateRange(timeRange);
    
    // Filter bookings by date range and confirmed status
    const filteredBookings = bookings.filter((b) => {
      const date = new Date(b.created_at);
      return date >= startDate && date <= endDate;
    });

    const confirmedBookings = filteredBookings.filter((b) => 
      ['confirmed', 'completed'].includes(b.status)
    );

    // Calculate total revenue
    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + (b.first_clean_price || 0),
      0
    );

    // Calculate average order value
    const avgOrderValue = confirmedBookings.length > 0
      ? totalRevenue / confirmedBookings.length
      : 0;

    // Calculate recurring vs one-time
    const recurringBookings = confirmedBookings.filter((b) => b.frequency && b.frequency !== 'onetime');
    const recurringRevenue = recurringBookings.reduce(
      (sum, b) => sum + (b.recurring_price || 0),
      0
    );

    // Calculate by frequency
    const byFrequency = confirmedBookings.reduce((acc, b) => {
      const freq = b.frequency || 'onetime';
      if (!acc[freq]) acc[freq] = { count: 0, revenue: 0 };
      acc[freq].count++;
      acc[freq].revenue += b.first_clean_price || 0;
      return acc;
    }, {});

    // Calculate by service area
    const byArea = confirmedBookings.reduce((acc, b) => {
      const area = b.service_area || 'Unknown';
      if (!acc[area]) acc[area] = { count: 0, revenue: 0 };
      acc[area].count++;
      acc[area].revenue += b.first_clean_price || 0;
      return acc;
    }, {});

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = startDate;

    const prevPeriodBookings = bookings.filter((b) => {
      const date = new Date(b.created_at);
      return date >= prevStartDate && date < prevEndDate && 
             ['confirmed', 'completed'].includes(b.status);
    });

    const prevRevenue = prevPeriodBookings.reduce(
      (sum, b) => sum + (b.first_clean_price || 0),
      0
    );

    const revenueChange = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
      : totalRevenue > 0 ? 100 : 0;

    // Daily revenue for chart
    const dailyRevenue = [];
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = confirmedBookings
        .filter((b) => b.created_at?.startsWith(dateStr))
        .reduce((sum, b) => sum + (b.first_clean_price || 0), 0);
      
      dailyRevenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      });
    }

    return {
      totalRevenue,
      confirmedCount: confirmedBookings.length,
      avgOrderValue,
      recurringRevenue,
      recurringCount: recurringBookings.length,
      byFrequency,
      byArea,
      revenueChange: parseFloat(revenueChange),
      dailyRevenue,
      totalLeads: filteredBookings.length,
      conversionRate: filteredBookings.length > 0
        ? ((confirmedBookings.length / filteredBookings.length) * 100).toFixed(1)
        : 0,
    };
  }, [bookings, timeRange]);

  // Simple bar chart component
  const SimpleBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map((d) => d.revenue), 1);
    
    return (
      <div className="flex items-end justify-between h-40 gap-1 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-sage/80 rounded-t transition-all duration-300 hover:bg-sage"
              style={{ 
                height: `${(item.revenue / maxValue) * 100}%`,
                minHeight: item.revenue > 0 ? '4px' : '0'
              }}
              title={`${item.date}: ${formatPrice(item.revenue)}`}
            />
            <span className="text-[10px] text-charcoal/50 font-inter truncate w-full text-center">
              {item.date.split(' ')[1]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const exportReport = () => {
    const { startDate, endDate } = getDateRange(timeRange);
    
    const confirmedBookings = bookings.filter((b) => {
      const date = new Date(b.created_at);
      return date >= startDate && date <= endDate && 
             ['confirmed', 'completed'].includes(b.status);
    });

    const headers = ['Date', 'Customer', 'Service Area', 'Frequency', 'Price', 'Status'];
    const rows = confirmedBookings.map((b) => [
      new Date(b.created_at).toLocaleDateString(),
      b.name,
      b.service_area,
      b.frequency,
      b.first_clean_price,
      b.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
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
            Revenue
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Track your business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
          <button onClick={fetchBookings} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-inter ${
              metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {metrics.revenueChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(metrics.revenueChange)}%
            </div>
          </div>
          <h3 className="text-charcoal/60 font-inter text-sm mb-1">Total Revenue</h3>
          <p className="font-playfair text-3xl font-semibold text-charcoal">
            {formatPrice(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-charcoal/50 font-inter mt-1">vs previous period</p>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-charcoal/60 font-inter text-sm mb-1">Confirmed Bookings</h3>
          <p className="font-playfair text-3xl font-semibold text-charcoal">
            {metrics.confirmedCount}
          </p>
          <p className="text-xs text-charcoal/50 font-inter mt-1">
            {metrics.conversionRate}% conversion rate
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-charcoal/60 font-inter text-sm mb-1">Avg. Order Value</h3>
          <p className="font-playfair text-3xl font-semibold text-charcoal">
            {formatPrice(metrics.avgOrderValue)}
          </p>
          <p className="text-xs text-charcoal/50 font-inter mt-1">per booking</p>
        </div>

        {/* Recurring Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-sage/20">
              <RefreshCw className="w-6 h-6 text-sage" />
            </div>
          </div>
          <h3 className="text-charcoal/60 font-inter text-sm mb-1">Recurring Revenue</h3>
          <p className="font-playfair text-3xl font-semibold text-charcoal">
            {formatPrice(metrics.recurringRevenue)}
          </p>
          <p className="text-xs text-charcoal/50 font-inter mt-1">
            {metrics.recurringCount} recurring customers
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
        <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
          Daily Revenue
        </h2>
        <SimpleBarChart data={metrics.dailyRevenue} />
      </div>

      {/* Breakdown Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Frequency */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
            Revenue by Frequency
          </h2>
          <div className="space-y-3">
            {Object.entries(metrics.byFrequency).map(([frequency, data]) => (
              <div key={frequency} className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0">
                <div>
                  <p className="font-inter font-medium text-charcoal capitalize">
                    {frequency === 'onetime' ? 'One-Time' : frequency}
                  </p>
                  <p className="text-xs text-charcoal/50 font-inter">
                    {data.count} booking{data.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="font-inter font-semibold text-charcoal">
                  {formatPrice(data.revenue)}
                </p>
              </div>
            ))}
            {Object.keys(metrics.byFrequency).length === 0 && (
              <p className="text-center text-charcoal/50 py-4 font-inter">No data available</p>
            )}
          </div>
        </div>

        {/* By Service Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
          <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
            Revenue by Service Area
          </h2>
          <div className="space-y-3">
            {Object.entries(metrics.byArea)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([area, data]) => (
                <div key={area} className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0">
                  <div>
                    <p className="font-inter font-medium text-charcoal">{area}</p>
                    <p className="text-xs text-charcoal/50 font-inter">
                      {data.count} booking{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-inter font-semibold text-charcoal">
                      {formatPrice(data.revenue)}
                    </p>
                    <p className="text-xs text-charcoal/50">
                      {((data.revenue / metrics.totalRevenue) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            {Object.keys(metrics.byArea).length === 0 && (
              <p className="text-center text-charcoal/50 py-4 font-inter">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
