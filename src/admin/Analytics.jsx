import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  MousePointerClick,
  Clock,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  ExternalLink,
  Calendar,
  ChevronDown,
  Eye,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const Analytics = () => {
  const [pageViews, setPageViews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch page views if table exists
      const { data: viewsData } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Fetch bookings for conversion data
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewsData) setPageViews(viewsData);
      if (bookingsData) setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter page views by date
    const filteredViews = pageViews.filter(
      (v) => new Date(v.created_at) >= startDate
    );

    // Filter bookings by date
    const filteredBookings = bookings.filter(
      (b) => new Date(b.created_at) >= startDate
    );

    // Unique visitors (by session or IP)
    const uniqueVisitors = new Set(
      filteredViews.map((v) => v.session_id || v.ip_address)
    ).size;

    // Page views by page
    const viewsByPage = filteredViews.reduce((acc, v) => {
      const page = v.page_path || '/';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

    // Views by device
    const viewsByDevice = filteredViews.reduce((acc, v) => {
      const device = v.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Views by source/referrer
    const viewsBySource = filteredViews.reduce((acc, v) => {
      let source = 'Direct';
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          source = url.hostname.replace('www.', '');
        } catch {
          source = v.referrer.slice(0, 30);
        }
      }
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Daily views for chart
    const dailyViews = [];
    for (let i = Math.min(daysBack, 14) - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayViews = filteredViews.filter(
        (v) => v.created_at?.startsWith(dateStr)
      ).length;
      
      dailyViews.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: dayViews,
      });
    }

    // Conversion funnel
    const leads = filteredBookings.filter((b) => b.status === 'lead').length;
    const confirmed = filteredBookings.filter((b) => 
      ['confirmed', 'completed'].includes(b.status)
    ).length;

    return {
      totalViews: filteredViews.length,
      uniqueVisitors,
      avgViewsPerVisitor: uniqueVisitors > 0 
        ? (filteredViews.length / uniqueVisitors).toFixed(1) 
        : 0,
      viewsByPage: Object.entries(viewsByPage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      viewsByDevice,
      viewsBySource: Object.entries(viewsBySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      dailyViews,
      leads,
      confirmed,
      conversionRate: leads > 0 ? ((confirmed / leads) * 100).toFixed(1) : 0,
      totalBookings: filteredBookings.length,
    };
  }, [pageViews, bookings, timeRange]);

  // Simple bar chart
  const SimpleBarChart = ({ data, valueKey }) => {
    const maxValue = Math.max(...data.map((d) => d[valueKey]), 1);
    
    return (
      <div className="flex items-end justify-between h-32 gap-1 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-sage/80 rounded-t transition-all duration-300 hover:bg-sage"
              style={{ 
                height: `${(item[valueKey] / maxValue) * 100}%`,
                minHeight: item[valueKey] > 0 ? '4px' : '0'
              }}
              title={`${item.date}: ${item[valueKey]} views`}
            />
            <span className="text-[10px] text-charcoal/50 font-inter truncate w-full text-center">
              {item.date.split(' ')[1]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  // Show message if no analytics data
  const hasAnalyticsData = pageViews.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Analytics
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Track website visitors and conversions
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
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {!hasAnalyticsData ? (
        /* Setup Instructions */
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-sage" />
            </div>
            <h2 className="font-playfair text-xl font-semibold text-charcoal mb-2">
              Set Up Analytics Tracking
            </h2>
            <p className="text-charcoal/60 font-inter mb-6">
              To track website visitors, you can either use Google Analytics or set up custom tracking with Supabase.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-bone/50 rounded-xl p-5">
                <h3 className="font-inter font-semibold text-charcoal mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sage" />
                  Google Analytics
                </h3>
                <p className="text-sm text-charcoal/70 mb-3">
                  Add your GA4 Measurement ID to your environment variables:
                </p>
                <code className="text-xs bg-charcoal/5 px-2 py-1 rounded font-mono">
                  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
                </code>
                <a 
                  href="https://analytics.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 text-sage hover:text-charcoal text-sm flex items-center gap-1"
                >
                  Open Google Analytics
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-bone/50 rounded-xl p-5">
                <h3 className="font-inter font-semibold text-charcoal mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sage" />
                  Custom Tracking
                </h3>
                <p className="text-sm text-charcoal/70 mb-3">
                  Create a <code className="text-xs bg-charcoal/5 px-1 py-0.5 rounded">page_views</code> table in Supabase to track visitors directly.
                </p>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 text-sage hover:text-charcoal text-sm flex items-center gap-1"
                >
                  Open Supabase Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {metrics.totalViews.toLocaleString()}
              </p>
              <p className="text-sm text-charcoal/50 font-inter">Page Views</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {metrics.uniqueVisitors.toLocaleString()}
              </p>
              <p className="text-sm text-charcoal/50 font-inter">Unique Visitors</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {metrics.totalBookings}
              </p>
              <p className="text-sm text-charcoal/50 font-inter">Total Leads</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-sage/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-sage" />
                </div>
              </div>
              <p className="font-playfair text-2xl font-semibold text-charcoal">
                {metrics.conversionRate}%
              </p>
              <p className="text-sm text-charcoal/50 font-inter">Conversion Rate</p>
            </div>
          </div>

          {/* Traffic Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
            <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
              Daily Traffic
            </h2>
            <SimpleBarChart data={metrics.dailyViews} valueKey="views" />
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
                Top Pages
              </h2>
              <div className="space-y-3">
                {metrics.viewsByPage.length > 0 ? (
                  metrics.viewsByPage.map(([page, views], index) => (
                    <div 
                      key={page}
                      className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-charcoal/40 font-inter w-5">
                          {index + 1}.
                        </span>
                        <span className="font-inter text-charcoal truncate">
                          {page === '/' ? 'Home' : page}
                        </span>
                      </div>
                      <span className="font-inter font-medium text-charcoal">
                        {views.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-charcoal/50 py-4">No data available</p>
                )}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
              <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
                Traffic Sources
              </h2>
              <div className="space-y-3">
                {metrics.viewsBySource.length > 0 ? (
                  metrics.viewsBySource.map(([source, views]) => (
                    <div 
                      key={source}
                      className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-charcoal/40" />
                        <span className="font-inter text-charcoal">{source}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-inter font-medium text-charcoal">
                          {views.toLocaleString()}
                        </span>
                        <span className="text-xs text-charcoal/50 ml-2">
                          ({((views / metrics.totalViews) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-charcoal/50 py-4">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
            <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
              Devices
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-bone/50 rounded-xl">
                <Monitor className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="font-playfair text-xl font-semibold text-charcoal">
                  {(metrics.viewsByDevice.desktop || 0).toLocaleString()}
                </p>
                <p className="text-sm text-charcoal/50 font-inter">Desktop</p>
              </div>
              <div className="text-center p-4 bg-bone/50 rounded-xl">
                <Smartphone className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="font-playfair text-xl font-semibold text-charcoal">
                  {(metrics.viewsByDevice.mobile || 0).toLocaleString()}
                </p>
                <p className="text-sm text-charcoal/50 font-inter">Mobile</p>
              </div>
              <div className="text-center p-4 bg-bone/50 rounded-xl">
                <Monitor className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="font-playfair text-xl font-semibold text-charcoal">
                  {(metrics.viewsByDevice.tablet || 0).toLocaleString()}
                </p>
                <p className="text-sm text-charcoal/50 font-inter">Tablet</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Conversion Funnel - Always Show */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
        <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
          Booking Funnel
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="font-playfair text-2xl font-semibold text-blue-600">
                {metrics.totalBookings}
              </span>
            </div>
            <p className="font-inter text-sm text-charcoal">Total Leads</p>
          </div>
          <ArrowUpRight className="w-6 h-6 text-charcoal/20 rotate-45" />
          <div className="flex-1 text-center">
            <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <span className="font-playfair text-2xl font-semibold text-yellow-600">
                {metrics.leads}
              </span>
            </div>
            <p className="font-inter text-sm text-charcoal">Pending</p>
          </div>
          <ArrowUpRight className="w-6 h-6 text-charcoal/20 rotate-45" />
          <div className="flex-1 text-center">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="font-playfair text-2xl font-semibold text-green-600">
                {metrics.confirmed}
              </span>
            </div>
            <p className="font-inter text-sm text-charcoal">Confirmed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
