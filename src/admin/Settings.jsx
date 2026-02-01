import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Calendar,
  Bell,
  Mail,
  Phone,
  CreditCard,
  Globe,
  Link2,
  ExternalLink,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Leaf,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SettingsSection = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
    <div className="p-6 border-b border-charcoal/10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sage/10 rounded-lg">
          <Icon className="w-5 h-5 text-sage" />
        </div>
        <div>
          <h2 className="font-playfair text-lg font-semibold text-charcoal">{title}</h2>
          <p className="text-sm text-charcoal/60 font-inter">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    // Business Info
    businessName: 'Willow & Water Organic Cleaning',
    email: 'hello@willowandwater.com',
    phone: '(630) 267-0096',
    address: 'St. Charles, IL',
    website: 'https://willowandwater.com',
    
    // Integrations
    calcomLink: '',
    googleCalendarConnected: false,
    stripeConnected: false,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    newBookingAlert: true,
    paymentAlert: true,
    reminderHours: 24,
    
    // Pricing
    depositPercent: 20,
    cancellationHours: 24,
    
    // Service Areas
    serviceAreas: ['st-charles', 'geneva', 'batavia', 'wayne', 'campton-hills', 'elburn'],
    
    // Operating Hours
    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    startTime: '08:00',
    endTime: '18:00',
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [calcomStatus, setCalcomStatus] = useState('disconnected');
  const [googleStatus, setGoogleStatus] = useState('disconnected');

  // Load settings from localStorage/database
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
    
    // Check Cal.com connection
    const calLink = import.meta.env.VITE_CALCOM_LINK;
    if (calLink) {
      setSettings(prev => ({ ...prev, calcomLink: calLink }));
      setCalcomStatus('connected');
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      // In production, save to database
      // await supabase.from('settings').upsert({ id: 1, ...settings });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const connectGoogleCalendar = () => {
    // In production, this would redirect to Google OAuth
    window.open('https://calendar.google.com', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Settings
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Configure your business settings and integrations
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Business Information */}
      <SettingsSection 
        title="Business Information" 
        description="Your company details"
        icon={Leaf}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Business Name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Phone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Website
            </label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Cal.com Integration */}
      <SettingsSection 
        title="Cal.com Integration" 
        description="Connect your scheduling calendar"
        icon={Calendar}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bone/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                calcomStatus === 'connected' ? 'bg-green-500' : 'bg-charcoal/30'
              }`} />
              <div>
                <p className="font-inter font-medium text-charcoal">Cal.com</p>
                <p className="text-sm text-charcoal/60">
                  {calcomStatus === 'connected' ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            <a
              href="https://cal.com/settings/developer/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Configure
            </a>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Cal.com Booking Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.calcomLink}
                onChange={(e) => handleInputChange('calcomLink', e.target.value)}
                placeholder="username/event-type"
                className="flex-1 px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <button
                onClick={() => copyToClipboard(`https://cal.com/${settings.calcomLink}`)}
                className="p-2.5 bg-bone/50 border border-charcoal/10 rounded-xl hover:bg-bone transition-colors"
                title="Copy link"
              >
                <Copy className="w-5 h-5 text-charcoal/60" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-charcoal/50 font-inter">
              This is used to embed your booking calendar on the website
            </p>
          </div>
          
          <div className="p-4 bg-sage/5 rounded-xl border border-sage/20">
            <h4 className="font-inter font-medium text-charcoal mb-2">View Cal.com Bookings</h4>
            <p className="text-sm text-charcoal/60 mb-3">
              Access your Cal.com dashboard to see all appointments
            </p>
            <a
              href="https://cal.com/bookings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sage hover:text-charcoal font-inter text-sm"
            >
              <Calendar className="w-4 h-4" />
              Open Cal.com Bookings
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </SettingsSection>

      {/* Google Calendar Integration */}
      <SettingsSection 
        title="Google Calendar" 
        description="Sync appointments with Google Calendar"
        icon={Calendar}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bone/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                googleStatus === 'connected' ? 'bg-green-500' : 'bg-charcoal/30'
              }`} />
              <div>
                <p className="font-inter font-medium text-charcoal">Google Calendar</p>
                <p className="text-sm text-charcoal/60">
                  {googleStatus === 'connected' ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            <button
              onClick={connectGoogleCalendar}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {googleStatus === 'connected' ? 'Manage' : 'Connect'}
            </button>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-inter font-medium text-blue-800 mb-1">
                  Sync via Cal.com
                </h4>
                <p className="text-sm text-blue-700">
                  Cal.com automatically syncs with Google Calendar. Connect your Google account 
                  in Cal.com settings for two-way calendar sync.
                </p>
                <a
                  href="https://cal.com/settings/my-account/calendars"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Connect in Cal.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection 
        title="Notifications" 
        description="Configure alerts and reminders"
        icon={Bell}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-charcoal/10">
            <div>
              <p className="font-inter font-medium text-charcoal">Email Notifications</p>
              <p className="text-sm text-charcoal/60">Receive booking updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-charcoal/20 peer-focus:outline-none peer-focus:ring-2 
                              peer-focus:ring-sage rounded-full peer peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                              after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 
                              after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-charcoal/10">
            <div>
              <p className="font-inter font-medium text-charcoal">SMS Notifications</p>
              <p className="text-sm text-charcoal/60">Receive booking updates via text</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-charcoal/20 peer-focus:outline-none peer-focus:ring-2 
                              peer-focus:ring-sage rounded-full peer peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                              after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 
                              after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-charcoal/10">
            <div>
              <p className="font-inter font-medium text-charcoal">New Booking Alerts</p>
              <p className="text-sm text-charcoal/60">Get notified when a new booking is made</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.newBookingAlert}
                onChange={(e) => handleInputChange('newBookingAlert', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-charcoal/20 peer-focus:outline-none peer-focus:ring-2 
                              peer-focus:ring-sage rounded-full peer peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                              after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 
                              after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Customer Reminder (hours before)
            </label>
            <select
              value={settings.reminderHours}
              onChange={(e) => handleInputChange('reminderHours', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      {/* Pricing & Policies */}
      <SettingsSection 
        title="Pricing & Policies" 
        description="Configure pricing and cancellation policies"
        icon={DollarSign}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Deposit Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.depositPercent}
                onChange={(e) => handleInputChange('depositPercent', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50">%</span>
            </div>
            <p className="mt-1 text-xs text-charcoal/50">Charged at booking to secure appointment</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Free Cancellation Window
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={settings.cancellationHours}
                onChange={(e) => handleInputChange('cancellationHours', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50">hours</span>
            </div>
            <p className="mt-1 text-xs text-charcoal/50">Full refund if cancelled before this window</p>
          </div>
        </div>
      </SettingsSection>

      {/* Operating Hours */}
      <SettingsSection 
        title="Operating Hours" 
        description="Set your business hours"
        icon={Clock}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Start Time
              </label>
              <input
                type="time"
                value={settings.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                End Time
              </label>
              <input
                type="time"
                value={settings.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 font-inter">
              Operating Days
            </label>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const days = settings.operatingDays.includes(day)
                      ? settings.operatingDays.filter(d => d !== day)
                      : [...settings.operatingDays, day];
                    handleInputChange('operatingDays', days);
                  }}
                  className={`px-3 py-2 rounded-lg font-inter text-sm capitalize transition-colors ${
                    settings.operatingDays.includes(day)
                      ? 'bg-sage text-white'
                      : 'bg-bone/50 text-charcoal/70 hover:bg-bone'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Service Areas */}
      <SettingsSection 
        title="Service Areas" 
        description="Cities you serve"
        icon={MapPin}
      >
        <div className="flex flex-wrap gap-2">
          {['st-charles', 'geneva', 'batavia', 'wayne', 'campton-hills', 'elburn'].map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => {
                const areas = settings.serviceAreas.includes(area)
                  ? settings.serviceAreas.filter(a => a !== area)
                  : [...settings.serviceAreas, area];
                handleInputChange('serviceAreas', areas);
              }}
              className={`px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                settings.serviceAreas.includes(area)
                  ? 'bg-sage text-white'
                  : 'bg-bone/50 text-charcoal/70 hover:bg-bone'
              }`}
            >
              {area.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Payment Integration */}
      <SettingsSection 
        title="Payment Processing" 
        description="Stripe payment configuration"
        icon={CreditCard}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bone/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="font-inter font-medium text-charcoal">Stripe</p>
                <p className="text-sm text-charcoal/60">Connected</p>
              </div>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Dashboard
            </a>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://dashboard.stripe.com/payments"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-bone/50 rounded-xl hover:bg-bone transition-colors"
            >
              <p className="font-inter font-medium text-charcoal mb-1">View Payments</p>
              <p className="text-sm text-charcoal/60">See all transactions</p>
            </a>
            <a
              href="https://dashboard.stripe.com/customers"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-bone/50 rounded-xl hover:bg-bone transition-colors"
            >
              <p className="font-inter font-medium text-charcoal mb-1">Customer List</p>
              <p className="text-sm text-charcoal/60">Manage saved cards</p>
            </a>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default Settings;
