import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList,
  DollarSign,
  RefreshCw,
  BarChart3,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
  Receipt,
  FileText,
  MessageSquare,
  Activity,
  Settings,
  UserCircle,
  Package,
  Calculator
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { initializeDemoData } from './demoData';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { name: 'Schedule', href: '/admin/schedule', icon: Calendar },
  { name: 'Customers', href: '/admin/customers', icon: UserCircle },
  { name: 'Team', href: '/admin/cleaners', icon: Users },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Pricing', href: '/admin/pricing', icon: Calculator },
  { name: 'Recurring', href: '/admin/recurring', icon: RefreshCw },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Checklists', href: '/admin/checklists', icon: ClipboardList },
  { name: 'Messages', href: '/admin/communications', icon: MessageSquare },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Check if Supabase is configured
const isSupabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      // If Supabase isn't configured, enable demo mode
      if (!isSupabaseConfigured) {
        setDemoMode(true);
        setUser({ email: 'demo@willowandwater.com' });
        // Initialize demo data for testing
        initializeDemoData();
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Always ensure demo data exists as fallback for when tables don't exist
          initializeDemoData();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Enable demo mode on auth error
        setDemoMode(true);
        setUser({ email: 'demo@willowandwater.com' });
        // Initialize demo data for testing
        initializeDemoData();
      }
      setLoading(false);
    };
    
    checkAuth();

    // Listen for auth changes (only if Supabase is configured)
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    if (demoMode) {
      setUser(null);
      setDemoMode(false);
      navigate('/admin/login');
      return;
    }
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  if (!user && !demoMode) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8 text-sage" />
              <span className="font-playfair text-2xl font-semibold text-charcoal">Admin Portal</span>
            </div>
            <p className="text-charcoal/60 font-inter">Please sign in to continue</p>
          </div>
          <Link
            to="/admin/login"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Sign In
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-charcoal/10
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-charcoal/10">
            <Link to="/admin" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-sage" />
              <span className="font-playfair text-lg font-semibold text-charcoal">
                Willow & Water
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-charcoal/50 hover:text-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl font-inter text-sm transition-colors
                    ${isActive 
                      ? 'bg-sage text-white' 
                      : 'text-charcoal/70 hover:bg-sage/10 hover:text-charcoal'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-charcoal/10">
            {demoMode && (
              <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-inter text-yellow-800 font-medium">Demo Mode</p>
                <p className="text-xs text-yellow-700">Connect Supabase for full features</p>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                <span className="font-inter font-semibold text-sage">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm font-medium text-charcoal truncate">
                  {user?.email || 'Admin'}
                </p>
                <p className="text-xs text-charcoal/50">{demoMode ? 'Demo User' : 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-charcoal/60 hover:text-charcoal 
                         hover:bg-charcoal/5 rounded-lg font-inter text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {demoMode ? 'Exit Demo' : 'Sign Out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-charcoal/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-charcoal/70 hover:text-charcoal"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-sage" />
              <span className="font-playfair font-semibold text-charcoal">Admin</span>
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
