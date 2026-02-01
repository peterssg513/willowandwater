import { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Clock, 
  Percent, 
  AlertTriangle,
  Save,
  RefreshCw,
  Calculator,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  CalendarDays
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState('scheduling');
  
  // Preview calculator state
  const [previewSqft, setPreviewSqft] = useState(2000);
  const [previewBedrooms, setPreviewBedrooms] = useState(3);
  const [previewBathrooms, setPreviewBathrooms] = useState(2);
  const [previewFrequency, setPreviewFrequency] = useState('biweekly');

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;

      // Convert to object keyed by setting key
      const settingsObj = {};
      data.forEach(row => {
        // Parse JSON values and convert to display format
        let displayValue = row.value;
        if (typeof row.value === 'string') {
          // If it's a JSON string (starts with quote), parse it
          if (row.value.startsWith('"') && row.value.endsWith('"')) {
            try {
              displayValue = JSON.parse(row.value);
            } catch {
              displayValue = row.value;
            }
          }
        } else if (typeof row.value === 'object') {
          displayValue = JSON.stringify(row.value);
        }
        
        settingsObj[row.key] = {
          ...row,
          value: String(displayValue)
        };
      });
      
      setSettings(settingsObj);
      setOriginalSettings(JSON.parse(JSON.stringify(settingsObj)));
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Update a single setting
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updates = Object.entries(settings)
        .filter(([key]) => {
          const original = originalSettings[key];
          return original && original.value !== settings[key].value;
        })
        .map(([key, data]) => {
          // Re-encode date values as JSON strings for storage
          let value = data.value;
          if (key.includes('_date') && value && !value.startsWith('"')) {
            value = JSON.stringify(value);
          }
          return {
            key,
            value,
            updated_at: new Date().toISOString()
          };
        });

      if (updates.length === 0) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      // Update each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('pricing_settings')
          .update({ value: update.value, updated_at: update.updated_at })
          .eq('key', update.key);
        
        if (error) throw error;
      }

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'settings',
        entity_id: null,
        action: 'updated',
        actor_type: 'admin',
        details: { updated_keys: updates.map(u => u.key) }
      });

      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
  };

  // Calculate preview pricing
  const previewPricing = useMemo(() => {
    const getValue = (key, defaultVal) => {
      const val = settings[key]?.value;
      if (val === undefined || val === '') return defaultVal;
      return parseFloat(val) || defaultVal;
    };

    const baseRate = getValue('base_rate_per_500_sqft', 40);
    const minFirst = getValue('min_first_clean_price', 150);
    const minRecurring = getValue('min_recurring_price', 120);
    const firstMultiplier = getValue('first_clean_multiplier', 1.25);
    const extraBathroomPrice = getValue('extra_bathroom_price', 15);
    const extraBedroomPrice = getValue('extra_bedroom_price', 10);
    const includedBathrooms = getValue('included_bathrooms', 2);
    const includedBedrooms = getValue('included_bedrooms', 3);
    
    const baseMinutes = getValue('base_minutes_per_500_sqft', 30);
    const extraBathroomMinutes = getValue('extra_bathroom_minutes', 15);
    const extraBedroomMinutes = getValue('extra_bedroom_minutes', 10);
    const durationMultiplier = getValue('first_clean_duration_multiplier', 1.5);
    
    const discounts = {
      weekly: getValue('weekly_discount', 0.35),
      biweekly: getValue('biweekly_discount', 0.20),
      monthly: getValue('monthly_discount', 0.10),
      onetime: 0
    };
    const depositPct = getValue('deposit_percentage', 0.20);

    // Calculate base price
    let basePrice = Math.ceil(previewSqft / 500) * baseRate;
    const extraBath = Math.max(0, previewBathrooms - includedBathrooms);
    const extraBed = Math.max(0, previewBedrooms - includedBedrooms);
    basePrice += extraBath * extraBathroomPrice;
    basePrice += extraBed * extraBedroomPrice;

    // First clean price
    let firstCleanPrice = Math.round(basePrice * firstMultiplier);
    firstCleanPrice = Math.max(firstCleanPrice, minFirst);

    // Recurring price with discount
    const discount = discounts[previewFrequency] || 0;
    let recurringPrice = Math.round(basePrice * (1 - discount));
    recurringPrice = Math.max(recurringPrice, minRecurring);

    // Duration calculation
    let baseDuration = Math.ceil(previewSqft / 500) * baseMinutes;
    baseDuration += extraBath * extraBathroomMinutes;
    baseDuration += extraBed * extraBedroomMinutes;
    const firstCleanDuration = Math.ceil(baseDuration * durationMultiplier);
    const roundedDuration = Math.ceil(firstCleanDuration / 30) * 30;

    // Deposit
    const deposit = Math.round(firstCleanPrice * depositPct);
    const remaining = firstCleanPrice - deposit;

    return {
      basePrice,
      firstCleanPrice,
      recurringPrice,
      discount: Math.round(discount * 100),
      savings: firstCleanPrice - recurringPrice,
      deposit,
      remaining,
      duration: roundedDuration,
      durationHours: Math.floor(roundedDuration / 60),
      durationMinutes: roundedDuration % 60,
    };
  }, [settings, previewSqft, previewBedrooms, previewBathrooms, previewFrequency]);

  // Group settings by category
  const groupedSettings = useMemo(() => {
    const groups = {
      scheduling: { label: 'Booking & Scheduling', icon: CalendarDays, items: [] },
      pricing: { label: 'Pricing', icon: DollarSign, items: [] },
      duration: { label: 'Duration Calculations', icon: Clock, items: [] },
      discounts: { label: 'Discounts & Referrals', icon: Percent, items: [] },
      fees: { label: 'Fees', icon: AlertTriangle, items: [] },
      business: { label: 'Business Rules', icon: SettingsIcon, items: [] },
    };

    Object.entries(settings).forEach(([key, data]) => {
      if (groups[data.category]) {
        groups[data.category].items.push({ key, ...data });
      }
    });

    return groups;
  }, [settings]);

  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-charcoal">
            Settings
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Configure pricing, duration calculations, and business rules
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-charcoal/20 rounded-xl font-inter text-sm
                         text-charcoal hover:bg-charcoal/5 transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl
                       font-inter text-sm hover:bg-sage/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Settings Sections */}
        <div className="xl:col-span-2 space-y-4">
          {Object.entries(groupedSettings).map(([category, group]) => {
            const Icon = group.icon;
            const isExpanded = expandedSection === category;
            
            return (
              <div
                key={category}
                className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-charcoal/2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-sage" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-inter font-semibold text-charcoal">
                        {group.label}
                      </h3>
                      <p className="text-sm text-charcoal/50">
                        {group.items.length} setting{group.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-charcoal/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-charcoal/50" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-charcoal/5 p-4 sm:p-6 space-y-4">
                    {group.items.map(item => {
                      // Determine input type based on key
                      const isDateField = item.key.includes('_date') || item.key.includes('launch');
                      const isBooleanField = item.key.includes('_enabled') || item.value === 'true' || item.value === 'false';
                      const isTextField = item.value === 'full' || isDateField;
                      
                      return (
                        <div key={item.key} className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-charcoal">
                                {item.label}
                              </label>
                              <p className="text-xs text-charcoal/50 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                            <div className={isDateField ? 'w-40' : 'w-32'}>
                              {isBooleanField ? (
                                <select
                                  value={item.value}
                                  onChange={(e) => handleSettingChange(item.key, e.target.value)}
                                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                             font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                                >
                                  <option value="true">Enabled</option>
                                  <option value="false">Disabled</option>
                                </select>
                              ) : isDateField ? (
                                <input
                                  type="date"
                                  value={item.value || ''}
                                  onChange={(e) => handleSettingChange(item.key, e.target.value)}
                                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                             font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                                />
                              ) : isTextField ? (
                                <input
                                  type="text"
                                  value={item.value}
                                  onChange={(e) => handleSettingChange(item.key, e.target.value)}
                                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                             font-inter text-sm text-right focus:outline-none focus:ring-2 focus:ring-sage"
                                />
                              ) : (
                                <input
                                  type="number"
                                  step={item.key.includes('multiplier') || item.key.includes('discount') || item.key.includes('percentage') ? '0.01' : '1'}
                                  value={item.value}
                                  onChange={(e) => handleSettingChange(item.key, e.target.value)}
                                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                             font-inter text-sm text-right focus:outline-none focus:ring-2 focus:ring-sage"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Preview Calculator */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-sage" />
              <h3 className="font-inter font-semibold text-charcoal">
                Live Preview
              </h3>
            </div>
            <p className="text-sm text-charcoal/50 mb-4">
              See how your settings affect pricing in real-time
            </p>

            {/* Preview Inputs */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-charcoal/50 mb-1">Square Feet</label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={previewSqft}
                  onChange={(e) => setPreviewSqft(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm font-medium text-charcoal">
                  {previewSqft.toLocaleString()} sqft
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-charcoal/50 mb-1">Bedrooms</label>
                  <select
                    value={previewBedrooms}
                    onChange={(e) => setPreviewBedrooms(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-charcoal/50 mb-1">Bathrooms</label>
                  <select
                    value={previewBathrooms}
                    onChange={(e) => setPreviewBathrooms(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg text-sm"
                  >
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-charcoal/50 mb-1">Frequency</label>
                <select
                  value={previewFrequency}
                  onChange={(e) => setPreviewFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg text-sm"
                >
                  <option value="weekly">Weekly (35% off)</option>
                  <option value="biweekly">Bi-Weekly (20% off)</option>
                  <option value="monthly">Monthly (10% off)</option>
                  <option value="onetime">One-Time</option>
                </select>
              </div>
            </div>

            {/* Preview Results */}
            <div className="space-y-3 pt-4 border-t border-charcoal/10">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/60">Base Price</span>
                <span className="font-medium text-charcoal">${previewPricing.basePrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/60">First Clean</span>
                <span className="font-semibold text-charcoal">${previewPricing.firstCleanPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/60">
                  Recurring ({previewPricing.discount}% off)
                </span>
                <span className="font-semibold text-sage">${previewPricing.recurringPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/60">Savings per visit</span>
                <span className="text-sage">${previewPricing.savings}</span>
              </div>
              
              <div className="pt-3 border-t border-charcoal/10">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">Deposit (20%)</span>
                  <span className="font-medium text-charcoal">${previewPricing.deposit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">Due on cleaning day</span>
                  <span className="font-medium text-charcoal">${previewPricing.remaining}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-charcoal/10">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">Est. Duration (First)</span>
                  <span className="font-medium text-charcoal">
                    {formatDuration(previewPricing.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-inter font-medium text-blue-900 mb-2">
                  How Pricing Works
                </h4>
                <div className="text-xs text-blue-800 space-y-2">
                  <p>
                    <strong>Base Price:</strong><br />
                    (sqft ÷ 500) × $40 + extra bathrooms × $15 + extra bedrooms × $10
                  </p>
                  <p>
                    <strong>First Clean:</strong><br />
                    Base Price × 1.25 (min $150)
                  </p>
                  <p>
                    <strong>Recurring:</strong><br />
                    Base Price × (1 - frequency discount) (min $120)
                  </p>
                  <p>
                    <strong>Duration:</strong><br />
                    (sqft ÷ 500) × 30min + extras, then × 1.5 for first clean
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
