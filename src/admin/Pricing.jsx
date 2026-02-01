import { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  Percent,
  Calculator,
  Save,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  Users,
  Loader2,
  PieChart,
  Truck,
  Package,
  Building2,
  Zap,
  Fuel,
  Wrench
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { 
  formatPrice, 
  calculateProfitablePricing,
  fetchCostSettings,
  clearSettingsCache,
  formatPercent
} from '../utils/profitPricingLogic';

// Category configuration with icons and colors
const CATEGORIES = {
  labor: {
    label: 'Labor Costs',
    icon: Users,
    color: 'blue',
    description: 'Cleaner pay rates and payroll burden'
  },
  supplies: {
    label: 'Supplies & Gas',
    icon: Fuel,
    color: 'green',
    description: 'Weekly costs per cleaner'
  },
  equipment: {
    label: 'Equipment',
    icon: Wrench,
    color: 'orange',
    description: 'Equipment amortization'
  },
  overhead: {
    label: 'Monthly Overhead',
    icon: Building2,
    color: 'purple',
    description: 'Fixed monthly business costs'
  },
  pricing: {
    label: 'Pricing Rules',
    icon: DollarSign,
    color: 'sage',
    description: 'Margin targets and minimums'
  },
  duration: {
    label: 'Time Estimates',
    icon: Clock,
    color: 'cyan',
    description: 'Duration calculation settings'
  },
  discounts: {
    label: 'Frequency Discounts',
    icon: Percent,
    color: 'pink',
    description: 'Recurring service discounts'
  },
  fees: {
    label: 'Fees & Business',
    icon: Calculator,
    color: 'yellow',
    description: 'Deposits, cancellations, booking rules'
  }
};

// Settings grouped by new categories
const SETTINGS_BY_CATEGORY = {
  labor: [
    { key: 'base_hourly_rate', label: 'Base Hourly Rate', description: 'Pay per hour before taxes ($)', type: 'currency' },
    { key: 'payroll_burden_percent', label: 'Payroll Burden', description: 'IL taxes + workers comp (decimal)', type: 'percent' },
    { key: 'loaded_hourly_rate', label: 'Loaded Hourly Rate', description: 'Auto-calculated: Base × (1 + Burden)', type: 'currency', computed: true },
    { key: 'solo_cleaner_max_sqft', label: 'Solo Cleaner Max Sqft', description: '2 cleaners sent above this size', type: 'number' },
  ],
  supplies: [
    { key: 'weekly_supplies_cost', label: 'Weekly Supplies', description: 'Branch Basics per cleaner per week ($)', type: 'currency' },
    { key: 'weekly_gas_cost', label: 'Weekly Gas', description: 'Gas allowance per cleaner per week ($)', type: 'currency' },
    { key: 'weekly_stipend_per_cleaner', label: 'Weekly Stipend', description: 'Stipend per cleaner per week ($)', type: 'currency' },
    { key: 'expected_jobs_per_week', label: 'Jobs Per Week', description: 'Expected jobs per cleaner per week', type: 'number' },
  ],
  equipment: [
    { key: 'annual_equipment_cost', label: 'Annual Equipment Cost', description: 'SEBO + maintenance + microfiber per year ($)', type: 'currency' },
    { key: 'expected_jobs_per_year', label: 'Jobs Per Year', description: 'Expected jobs per cleaner per year', type: 'number' },
  ],
  overhead: [
    { key: 'monthly_marketing', label: 'Marketing', description: 'Monthly marketing budget ($)', type: 'currency' },
    { key: 'monthly_admin', label: 'Admin', description: 'Monthly admin costs ($)', type: 'currency' },
    { key: 'monthly_phone', label: 'Phone', description: 'Monthly phone costs ($)', type: 'currency' },
    { key: 'monthly_website', label: 'Website', description: 'Monthly website costs ($)', type: 'currency' },
    { key: 'monthly_insurance', label: 'Insurance', description: 'Monthly insurance costs ($)', type: 'currency' },
    { key: 'monthly_overhead_total', label: 'Total Overhead', description: 'Total monthly fixed costs ($)', type: 'currency', readonly: true },
  ],
  pricing: [
    { key: 'target_margin_percent', label: 'Target Margin', description: 'Target profit margin (0.45 = 45%)', type: 'percent' },
    { key: 'minimum_price', label: 'Minimum Price', description: 'Never quote below this ($)', type: 'currency' },
    { key: 'first_clean_hours_multiplier', label: 'First Clean Multiplier', description: 'Hours multiplier for deep clean (1.5 = 50% longer)', type: 'multiplier' },
    { key: 'organic_cleaning_addon', label: 'Organic Cleaning Add-on', description: 'Price for organic/non-toxic upgrade ($)', type: 'currency' },
  ],
  duration: [
    { key: 'base_minutes_per_500_sqft', label: 'Minutes per 500 sqft', description: 'Base cleaning time per 500 sqft', type: 'number' },
    { key: 'extra_bathroom_minutes', label: 'Extra Bathroom Minutes', description: 'Additional time per bathroom over 2', type: 'number' },
    { key: 'extra_bedroom_minutes', label: 'Extra Bedroom Minutes', description: 'Additional time per bedroom over 3', type: 'number' },
    { key: 'included_bathrooms', label: 'Included Bathrooms', description: 'Bathrooms included in base time', type: 'number' },
    { key: 'included_bedrooms', label: 'Included Bedrooms', description: 'Bedrooms included in base time', type: 'number' },
  ],
  discounts: [
    { key: 'weekly_discount', label: 'Weekly Discount', description: 'Discount for weekly service (0.15 = 15%)', type: 'percent' },
    { key: 'biweekly_discount', label: 'Bi-Weekly Discount', description: 'Discount for bi-weekly service', type: 'percent' },
    { key: 'monthly_discount', label: 'Monthly Discount', description: 'Discount for monthly service', type: 'percent' },
    { key: 'referral_bonus', label: 'Referral Bonus', description: 'Credit for referrer ($)', type: 'currency' },
    { key: 'referred_discount', label: 'Referred Discount', description: 'Discount for new referred customer ($)', type: 'currency' },
  ],
  fees: [
    { key: 'deposit_percentage', label: 'Deposit Percentage', description: 'Deposit required (0.20 = 20%)', type: 'percent' },
    { key: 'cancellation_24_48h', label: 'Late Cancel Fee (24-48h)', description: 'Cancellation fee ($)', type: 'currency' },
    { key: 'booking_lead_days', label: 'Booking Lead Days', description: 'Minimum days in advance to book', type: 'number' },
    { key: 'booking_max_days', label: 'Booking Max Days', description: 'Maximum days in advance to book', type: 'number' },
  ],
};

const Pricing = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(['labor', 'pricing', 'overhead']);
  const [costSettings, setCostSettings] = useState(null);
  
  // Calculator state
  const [calcParams, setCalcParams] = useState({
    sqft: 2000,
    bedrooms: 3,
    bathrooms: 2,
    frequency: 'biweekly'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('category')
        .order('sort_order');

      if (fetchError) throw fetchError;
      
      // Convert to object
      const settingsObj = {};
      (data || []).forEach(row => {
        let value = row.value;
        if (typeof value === 'string' && !isNaN(value)) {
          value = parseFloat(value);
        }
        settingsObj[row.key] = value;
      });
      setSettings(settingsObj);
      
      // Refresh cost settings cache
      clearSettingsCache();
      const fresh = await fetchCostSettings(true);
      setCostSettings(fresh);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key, value) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getDisplayValue = (key) => {
    // Auto-calculate loaded hourly rate
    if (key === 'loaded_hourly_rate') {
      const baseRate = getVal('base_hourly_rate', 26);
      const burden = getVal('payroll_burden_percent', 0.154);
      return (baseRate * (1 + burden)).toFixed(2);
    }
    // Auto-calculate overhead total
    if (key === 'monthly_overhead_total') {
      return (getVal('monthly_marketing', 250) + 
              getVal('monthly_admin', 250) + 
              getVal('monthly_phone', 20) + 
              getVal('monthly_website', 5) + 
              getVal('monthly_insurance', 75)).toFixed(2);
    }
    if (editedValues.hasOwnProperty(key)) {
      return editedValues[key];
    }
    return settings[key] ?? '';
  };

  const handleSave = async () => {
    if (Object.keys(editedValues).length === 0) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let updates = { ...editedValues };
      
      // Auto-calculate loaded hourly rate if base rate or burden changed
      const laborKeys = ['base_hourly_rate', 'payroll_burden_percent'];
      const hasLaborChange = laborKeys.some(k => editedValues.hasOwnProperty(k));
      
      if (hasLaborChange) {
        const baseRate = parseFloat(editedValues.base_hourly_rate ?? settings.base_hourly_rate) || 26;
        const burden = parseFloat(editedValues.payroll_burden_percent ?? settings.payroll_burden_percent) || 0.154;
        updates['loaded_hourly_rate'] = parseFloat((baseRate * (1 + burden)).toFixed(2));
      }
      
      // Calculate overhead total if any overhead value changed
      const overheadKeys = ['monthly_marketing', 'monthly_admin', 'monthly_phone', 'monthly_website', 'monthly_insurance'];
      const hasOverheadChange = overheadKeys.some(k => editedValues.hasOwnProperty(k));
      
      if (hasOverheadChange) {
        const getSettingVal = (k) => parseFloat(editedValues[k] ?? settings[k]) || 0;
        const newOverheadTotal = getSettingVal('monthly_marketing') + getSettingVal('monthly_admin') + 
                                  getSettingVal('monthly_phone') + getSettingVal('monthly_website') + 
                                  getSettingVal('monthly_insurance');
        updates['monthly_overhead_total'] = newOverheadTotal;
      }

      // Update each changed setting
      for (const [key, value] of Object.entries(updates)) {
        let parsedValue = value;
        if (typeof value === 'string' && value !== 'full' && !isNaN(value)) {
          parsedValue = parseFloat(value);
        }
        
        const { error: updateError } = await supabase
          .from('pricing_settings')
          .update({ 
            value: parsedValue,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) throw updateError;
      }

      // Log activity (don't fail if activity log fails)
      try {
        await supabase.from('activity_log').insert({
          entity_type: 'settings',
          entity_id: 'pricing',
          action: 'updated',
          actor_type: 'admin',
          details: { 
            updated_keys: Object.keys(updates),
            changes: updates
          }
        });
      } catch (logError) {
        console.warn('Activity log failed:', logError);
      }

      setSuccess('Pricing settings saved! Changes are now live.');
      setEditedValues({});
      
      // Refresh everything
      await fetchSettings();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Helper to get numeric value (edited or from settings)
  const getVal = (key, defaultVal) => {
    if (editedValues.hasOwnProperty(key)) {
      const v = parseFloat(editedValues[key]);
      return isNaN(v) ? defaultVal : v;
    }
    if (settings.hasOwnProperty(key)) {
      const v = parseFloat(settings[key]);
      return isNaN(v) ? defaultVal : v;
    }
    return defaultVal;
  };

  // Get the current loaded hourly rate for display
  const displayLoadedRate = editedValues.hasOwnProperty('loaded_hourly_rate')
    ? getVal('loaded_hourly_rate', 30)
    : getVal('base_hourly_rate', 26) * (1 + getVal('payroll_burden_percent', 0.154));

  // Calculate preview price using current/edited values
  const calculatePreview = () => {
    if (!costSettings) return null;
    
    // Build preview settings from scratch using edited values
    const baseHourlyRate = getVal('base_hourly_rate', 26);
    const payrollBurden = getVal('payroll_burden_percent', 0.154);
    const loadedHourlyRate = getVal('loaded_hourly_rate', baseHourlyRate * (1 + payrollBurden));
    
    const weeklySupplies = getVal('weekly_supplies_cost', 24.5);
    const weeklyGas = getVal('weekly_gas_cost', 50);
    const weeklyStipend = getVal('weekly_stipend_per_cleaner', 0);
    const weeklyTotal = weeklySupplies + weeklyGas + weeklyStipend;
    const jobsPerWeek = getVal('expected_jobs_per_week', 9);
    
    const annualEquip = getVal('annual_equipment_cost', 750);
    const jobsPerYear = getVal('expected_jobs_per_year', 450);
    
    const monthlyMarketing = getVal('monthly_marketing', 250);
    const monthlyAdmin = getVal('monthly_admin', 250);
    const monthlyPhone = getVal('monthly_phone', 20);
    const monthlyWebsite = getVal('monthly_website', 5);
    const monthlyInsurance = getVal('monthly_insurance', 75);
    const overheadTotal = monthlyMarketing + monthlyAdmin + monthlyPhone + monthlyWebsite + monthlyInsurance;
    
    const previewSettings = {
      // Labor - use the loaded rate directly if edited, otherwise calculate from base
      baseHourlyRate,
      payrollBurdenPercent: payrollBurden,
      loadedHourlyRate: editedValues.hasOwnProperty('loaded_hourly_rate') 
        ? getVal('loaded_hourly_rate', 30) 
        : baseHourlyRate * (1 + payrollBurden),
      soloCleanerMaxSqft: getVal('solo_cleaner_max_sqft', 1999),
      
      // Supplies & Gas
      weeklySuppliesCost: weeklySupplies,
      weeklyGasCost: weeklyGas,
      weeklyStipendPerCleaner: weeklyStipend,
      weeklyTotalPerCleaner: weeklyTotal,
      expectedJobsPerWeek: jobsPerWeek,
      perJobSuppliesGas: weeklyTotal / jobsPerWeek,
      
      // Equipment
      annualEquipmentCost: annualEquip,
      expectedJobsPerYear: jobsPerYear,
      perJobEquipment: annualEquip / jobsPerYear,
      
      // Overhead
      monthlyMarketing,
      monthlyAdmin,
      monthlyPhone,
      monthlyWebsite,
      monthlyInsurance,
      monthlyOverheadTotal: overheadTotal,
      
      // Pricing
      targetMarginPercent: getVal('target_margin_percent', 0.45),
      minimumPrice: getVal('minimum_price', 115),
      firstCleanHoursMultiplier: getVal('first_clean_hours_multiplier', 1.5),
      organicCleaningAddon: getVal('organic_cleaning_addon', 20),
      
      // Duration
      baseMinutesPer500Sqft: getVal('base_minutes_per_500_sqft', 30),
      extraBathroomMinutes: getVal('extra_bathroom_minutes', 15),
      extraBedroomMinutes: getVal('extra_bedroom_minutes', 10),
      includedBathrooms: getVal('included_bathrooms', 2),
      includedBedrooms: getVal('included_bedrooms', 3),
      
      // Frequency discounts
      frequencyDiscounts: {
        weekly: getVal('weekly_discount', 0.15),
        biweekly: getVal('biweekly_discount', 0.10),
        monthly: getVal('monthly_discount', 0.05),
        onetime: 0,
      },
    };
    
    try {
      return calculateProfitablePricing({
        sqft: calcParams.sqft,
        bedrooms: calcParams.bedrooms,
        bathrooms: calcParams.bathrooms,
        frequency: calcParams.frequency,
        settings: previewSettings,
      });
    } catch (e) {
      console.error('Preview calculation error:', e);
      return null;
    }
  };

  const preview = calculatePreview();
  const hasChanges = Object.keys(editedValues).length > 0;

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
            Pricing Engine
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Configure costs, margins, and pricing rules — changes go live immediately
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save & Go Live'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Zap className="w-5 h-5" />
          You have unsaved changes. Click "Save & Go Live" to apply them to the pricing calculator.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* How Pricing Works */}
          <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl border border-sage/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-sage rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-inter font-semibold text-charcoal mb-2">Profit-Based Pricing Formula</h3>
                <div className="text-sm text-charcoal/70 font-inter">
                  <p className="font-mono bg-white/50 rounded px-2 py-1 inline-block mb-2">
                    Price = Total Cost ÷ (1 - Target Margin)
                  </p>
                  <p className="text-xs mt-2">
                    Every quote is calculated from your actual costs below. Adjust any value and see the live preview update.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Categories */}
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const categorySettings = SETTINGS_BY_CATEGORY[categoryKey] || [];
            const isExpanded = expandedCategories.includes(categoryKey);
            const Icon = category.icon;

            if (categorySettings.length === 0) return null;

            return (
              <div 
                key={categoryKey}
                className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-charcoal/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${category.color}-100`}>
                      <Icon className={`w-5 h-5 text-${category.color}-600`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-inter font-semibold text-charcoal">{category.label}</h3>
                      <p className="text-sm text-charcoal/50">{category.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-charcoal/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-charcoal/40" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-charcoal/10 p-4 space-y-4">
                    {categorySettings.map(setting => (
                      <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-charcoal">
                            {setting.label}
                          </label>
                          <p className="text-xs text-charcoal/50">{setting.description}</p>
                        </div>
                        <div className="sm:w-40">
                          <div className="relative">
                            {setting.type === 'currency' && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">$</span>
                            )}
                            {(setting.type === 'percent' || setting.type === 'multiplier') && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-xs">
                                {setting.type === 'multiplier' ? '×' : ''}
                              </span>
                            )}
                            <input
                              type="number"
                              step={setting.type === 'percent' || setting.type === 'multiplier' ? '0.01' : '1'}
                              value={getDisplayValue(setting.key)}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              disabled={setting.readonly || setting.computed}
                              className={`w-full px-3 py-2 border border-charcoal/10 rounded-lg
                                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage
                                         ${setting.type === 'currency' ? 'pl-7' : ''}
                                         ${setting.readonly || setting.computed ? 'bg-charcoal/5 text-charcoal/70 cursor-not-allowed' : 'bg-bone'}
                                         ${setting.computed ? 'font-semibold text-sage' : ''}
                                         ${editedValues.hasOwnProperty(setting.key) && !setting.computed ? 'ring-2 ring-yellow-400' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview Calculator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-charcoal/10 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-inter font-semibold text-charcoal flex items-center gap-2">
                <Calculator className="w-5 h-5 text-sage" />
                Live Preview
              </h3>
              {hasChanges && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Preview Mode
                </span>
              )}
            </div>

            {/* Calculator Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Square Feet</label>
                <input
                  type="number"
                  value={calcParams.sqft}
                  onChange={(e) => setCalcParams(p => ({ ...p, sqft: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg font-inter text-sm
                             focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={calcParams.bedrooms}
                    onChange={(e) => setCalcParams(p => ({ ...p, bedrooms: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg font-inter text-sm
                               focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcParams.bathrooms}
                    onChange={(e) => setCalcParams(p => ({ ...p, bathrooms: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg font-inter text-sm
                               focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Frequency</label>
                <select
                  value={calcParams.frequency}
                  onChange={(e) => setCalcParams(p => ({ ...p, frequency: e.target.value }))}
                  className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg font-inter text-sm
                             focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="onetime">One-Time</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {preview && (
              <>
                <div className="space-y-3 border-t border-charcoal/10 pt-4">
                  <div className="text-center mb-4">
                    <span className="text-xs bg-charcoal/10 text-charcoal px-2 py-1 rounded-full">
                      {preview.cleanerCount} cleaner{preview.cleanerCount > 1 ? 's' : ''} assigned
                    </span>
                  </div>
                  
                  {/* Base prices */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/60">Base First Clean</span>
                    <span className="font-inter font-medium text-charcoal">{formatPrice(preview.firstCleanPrice)}</span>
                  </div>
                  
                  {/* Organic Add-on */}
                  {getVal('organic_cleaning_addon', 0) > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">+ Organic Add-on</span>
                      <span className="font-inter font-medium">+{formatPrice(getVal('organic_cleaning_addon', 0))}</span>
                    </div>
                  )}
                  
                  {/* Total with organic */}
                  <div className="flex justify-between items-center pt-2 border-t border-charcoal/10">
                    <span className="text-sm font-medium text-charcoal">First Clean Total</span>
                    <span className="font-inter font-bold text-sage text-xl">{formatPrice(preview.firstCleanPrice + getVal('organic_cleaning_addon', 0))}</span>
                  </div>
                  
                  {calcParams.frequency !== 'onetime' && (
                    <>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-charcoal/60">Base Recurring ({preview.recurring.frequencyDiscount}% off)</span>
                        <span className="font-inter font-medium text-charcoal">{formatPrice(preview.recurringPrice)}</span>
                      </div>
                      {getVal('organic_cleaning_addon', 0) > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm">+ Organic Add-on</span>
                          <span className="font-inter font-medium">+{formatPrice(getVal('organic_cleaning_addon', 0))}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-charcoal">Recurring Total</span>
                        <span className="font-inter font-semibold text-charcoal">{formatPrice(preview.recurringPrice + getVal('organic_cleaning_addon', 0))}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="mt-4 bg-sage/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-sage" />
                    <h4 className="text-sm font-semibold text-charcoal">Cost Breakdown (First Clean)</h4>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-charcoal/60">
                      <span>Labor ({preview.firstClean?.durationHours?.toFixed(1)}h × ${displayLoadedRate.toFixed(0)} × {preview.cleanerCount})</span>
                      <span className="text-red-600">-{formatPrice(preview.firstClean?.laborCost)}</span>
                    </div>
                    <div className="flex justify-between text-charcoal/60">
                      <span>Supplies & Gas</span>
                      <span className="text-red-600">-{formatPrice(preview.firstClean?.suppliesGasCost)}</span>
                    </div>
                    <div className="flex justify-between text-charcoal/60">
                      <span>Equipment</span>
                      <span className="text-red-600">-{formatPrice(preview.firstClean?.equipmentCost)}</span>
                    </div>
                    <div className="flex justify-between text-charcoal/60">
                      <span>Overhead</span>
                      <span className="text-red-600">-{formatPrice(preview.firstClean?.overheadCost)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-sage/20 font-medium text-charcoal">
                      <span>Total Cost</span>
                      <span>{formatPrice(preview.firstClean?.totalCost)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-charcoal">
                      <span>Total Revenue (with organic)</span>
                      <span>{formatPrice(preview.firstCleanPrice + getVal('organic_cleaning_addon', 0))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-700">
                      <span>Profit ({(((preview.firstCleanPrice + getVal('organic_cleaning_addon', 0)) - preview.firstClean?.totalCost) / (preview.firstCleanPrice + getVal('organic_cleaning_addon', 0)) * 100).toFixed(1)}% margin)</span>
                      <span className="text-green-600">{formatPrice((preview.firstCleanPrice + getVal('organic_cleaning_addon', 0)) - preview.firstClean?.totalCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Recurring Breakdown */}
                {calcParams.frequency !== 'onetime' && (
                  <div className="mt-3 bg-charcoal/5 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-charcoal mb-2">Recurring Clean</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-charcoal/60">
                        <span>Cost</span>
                        <span>{formatPrice(preview.recurring?.totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-charcoal/60">
                        <span>Revenue (with organic)</span>
                        <span>{formatPrice(preview.recurringPrice + getVal('organic_cleaning_addon', 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Profit ({(((preview.recurringPrice + getVal('organic_cleaning_addon', 0)) - preview.recurring?.totalCost) / (preview.recurringPrice + getVal('organic_cleaning_addon', 0)) * 100).toFixed(1)}%)</span>
                        <span>{formatPrice((preview.recurringPrice + getVal('organic_cleaning_addon', 0)) - preview.recurring?.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
