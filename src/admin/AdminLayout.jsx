import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  UserCog,
  Package,
  MessageSquare,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  ClipboardList,
  Calculator,
  UserPlus
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      setUser(user);

      // Get admin user details
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminData) {
        setAdminUser(adminData);
      }
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  // Navigation items
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/schedule', icon: CalendarDays, label: 'Schedule' },
    { path: '/admin/cleaners', icon: UserCog, label: 'Cleaners' },
    { path: '/admin/checklists', icon: ClipboardList, label: 'Checklists' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/communications', icon: MessageSquare, label: 'Communications' },
  ];

  // Owner-only items
  const ownerItems = [
    { path: '/admin/leads', icon: UserPlus, label: 'Leads' },
    { path: '/admin/payments', icon: DollarSign, label: 'Payments' },
    { path: '/admin/pricing', icon: Calculator, label: 'Pricing Engine' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isOwner = adminUser?.role === 'owner';

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-charcoal flex flex-col
        transform lg:transform-none transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-playfair text-lg font-semibold text-bone">
                Willow & Water
              </h1>
              <p className="text-xs text-bone/50 font-inter">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-inter text-sm
                  transition-all duration-200
                  ${active 
                    ? 'bg-sage text-white' 
                    : 'text-bone/70 hover:bg-white/5 hover:text-bone'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Owner Only Section */}
          {isOwner && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs text-bone/30 uppercase tracking-wider font-inter">
                  Owner Only
                </p>
              </div>
              {ownerItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-inter text-sm
                      transition-all duration-200
                      ${active 
                        ? 'bg-sage text-white' 
                        : 'text-bone/70 hover:bg-white/5 hover:text-bone'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center">
              <span className="text-sage font-semibold text-sm">
                {adminUser?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-bone truncate">
                {adminUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-bone/50 capitalize">
                {adminUser?.role || 'user'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-bone/70 hover:text-bone
                       hover:bg-white/5 rounded-xl transition-colors font-inter text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-charcoal/10 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-charcoal/5 rounded-lg"
            >
              <Menu className="w-6 h-6 text-charcoal" />
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-sage" />
              <span className="font-playfair font-semibold text-charcoal">Admin</span>
            </Link>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
