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
  Home,
  Loader2,
  PieChart,
  Truck,
  Package,
  Building2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { 
  formatPrice, 
  calculateProfitablePricing,
  getCostSettings,
  formatPercent
} from '../utils/profitPricingLogic';

// Category configuration with icons and colors
const CATEGORIES = {
  pricing: {
    label: 'Base Pricing',
    icon: DollarSign,
    color: 'green',
    description: 'Core pricing rates and minimums'
  },
  duration: {
    label: 'Time Estimates',
    icon: Clock,
    color: 'blue',
    description: 'Duration calculation settings'
  },
  discounts: {
    label: 'Discounts & Referrals',
    icon: Percent,
    color: 'purple',
    description: 'Frequency discounts and referral program'
  },
  fees: {
    label: 'Fees & Deposits',
    icon: Calculator,
    color: 'yellow',
    description: 'Deposit and cancellation fees'
  },
  business: {
    label: 'Business Rules',
    icon: TrendingUp,
    color: 'sage',
    description: 'Booking windows and capacity'
  }
};

const Pricing = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(['pricing', 'discounts']);
  const [showCalculator, setShowCalculator] = useState(true);
  
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
      setSettings(data || []);
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

  const getDisplayValue = (setting) => {
    if (editedValues.hasOwnProperty(setting.key)) {
      return editedValues[setting.key];
    }
    // Parse JSONB value
    let val = setting.value;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch (e) {
        // Keep as string
      }
    }
    return val;
  };

  const handleSave = async () => {
    if (Object.keys(editedValues).length === 0) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update each changed setting
      for (const [key, value] of Object.entries(editedValues)) {
        const { error: updateError } = await supabase
          .from('pricing_settings')
          .update({ 
            value: typeof value === 'string' && value !== 'full' ? parseFloat(value) || value : value,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) throw updateError;
      }

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'settings',
        entity_id: 'pricing',
        action: 'updated',
        actor_type: 'admin',
        details: { 
          updated_keys: Object.keys(editedValues),
          changes: editedValues
        }
      });

      setSuccess('Pricing settings saved successfully!');
      setEditedValues({});
      fetchSettings();
      
      setTimeout(() => setSuccess(null), 3000);
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

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {});

  // Calculate preview price using profit-based logic
  const calculatePreview = () => {
    const pricing = calculateProfitablePricing({
      sqft: calcParams.sqft,
      bedrooms: calcParams.bedrooms,
      bathrooms: calcParams.bathrooms,
      frequency: calcParams.frequency,
    });
    
    return {
      ...pricing,
      basePrice: pricing.recurring.basePrice,
      firstCleanPrice: pricing.firstCleanPrice,
      recurringPrice: pricing.recurringPrice,
      discount: pricing.recurring.frequencyDiscount / 100,
    };
  };

  const preview = calculatePreview();
  const costSettings = getCostSettings();
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
            Configure quote pricing, discounts, and business rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
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
            {saving ? 'Saving...' : 'Save Changes'}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* How Profit-Based Pricing Works */}
          <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl border border-sage/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-sage rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-inter font-semibold text-charcoal mb-2">Profit-Based Pricing Model</h3>
                <div className="text-sm text-charcoal/70 space-y-3 font-inter">
                  <p>
                    <strong>Price = Total Cost ÷ (1 - Target Margin)</strong><br />
                    Every quote is calculated from actual costs to guarantee profitability.
                  </p>
                  <div className="bg-white/50 rounded-lg p-3 mt-3">
                    <p className="font-medium text-charcoal mb-2">📊 Your Cost Components:</p>
                    <ul className="text-xs space-y-1.5 text-charcoal/60">
                      <li className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-sage" />
                        <strong>Labor:</strong> ${costSettings.loadedHourlyRate}/hr loaded (${costSettings.baseHourlyRate}/hr + {(costSettings.payrollBurdenPercent * 100).toFixed(1)}% burden)
                      </li>
                      <li className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-sage" />
                        <strong>Supplies & Gas:</strong> ${costSettings.perJobSuppliesGas.toFixed(2)}/job per cleaner
                      </li>
                      <li className="flex items-center gap-2">
                        <Truck className="w-3 h-3 text-sage" />
                        <strong>Equipment:</strong> ${costSettings.perJobEquipment.toFixed(2)}/job per cleaner (amortized)
                      </li>
                      <li className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-sage" />
                        <strong>Overhead:</strong> ${costSettings.monthlyOverheadTotal}/mo ÷ jobs = variable per job
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <strong>Target Margin:</strong> {(costSettings.targetMarginPercent * 100).toFixed(0)}% | Min Price: ${costSettings.minimumPrice}
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-charcoal/50 mt-2">
                    Team size: 1 cleaner for &lt;2,000 sqft, 2 cleaners for ≥2,000 sqft
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Categories */}
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const categorySettings = settingsByCategory[categoryKey] || [];
            const isExpanded = expandedCategories.includes(categoryKey);
            const Icon = category.icon;

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

                {isExpanded && categorySettings.length > 0 && (
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
                          {setting.key === 'cancellation_under_24h' ? (
                            <select
                              value={getDisplayValue(setting)}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                            >
                              <option value="full">Full Charge</option>
                              <option value="50">50% of Job Price</option>
                              <option value="0">No Fee</option>
                            </select>
                          ) : (
                            <div className="relative">
                              {(setting.key.includes('price') || setting.key.includes('rate') || 
                                setting.key.includes('bonus') || setting.key.includes('discount_amount') ||
                                setting.key === 'cancellation_24_48h') && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">$</span>
                              )}
                              {(setting.key.includes('discount') || setting.key.includes('percentage') ||
                                setting.key.includes('multiplier')) && !setting.key.includes('bonus') && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-xs">
                                  {setting.key.includes('multiplier') ? '×' : '%'}
                                </span>
                              )}
                              <input
                                type="number"
                                step={setting.key.includes('discount') || setting.key.includes('multiplier') || setting.key.includes('percentage') ? '0.01' : '1'}
                                value={getDisplayValue(setting)}
                                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                className={`w-full px-3 py-2 bg-bone border border-charcoal/10 rounded-lg
                                           font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage
                                           ${setting.key.includes('price') || setting.key.includes('rate') || 
                                             setting.key.includes('bonus') || setting.key === 'cancellation_24_48h' ? 'pl-7' : ''}
                                           ${setting.key.includes('discount') || setting.key.includes('multiplier') || 
                                             setting.key.includes('percentage') ? 'pr-8' : ''}`}
                              />
                            </div>
                          )}
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
                Price Preview
              </h3>
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
            <div className="space-y-3 border-t border-charcoal/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-charcoal/60">Base Price</span>
                <span className="font-inter font-medium text-charcoal">{formatPrice(preview.basePrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-charcoal/60">First Clean</span>
                <span className="font-inter font-semibold text-charcoal">{formatPrice(preview.firstCleanPrice)}</span>
              </div>
              {preview.discount > 0 && (
                <div className="flex justify-between items-center text-sage">
                  <span className="text-sm">Frequency Discount</span>
                  <span className="font-inter font-medium">-{Math.round(preview.discount * 100)}%</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-charcoal/10">
                <span className="text-sm font-medium text-charcoal">Recurring Price</span>
                <span className="font-inter font-bold text-sage text-lg">{formatPrice(preview.recurringPrice)}</span>
              </div>
            </div>

            {/* Real Cost Breakdown */}
            <div className="mt-4 bg-sage/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-sage" />
                <h4 className="text-sm font-semibold text-charcoal">Real Cost Breakdown</h4>
              </div>
              
              {/* First Clean Breakdown */}
              <div className="mb-4">
                <p className="text-xs font-medium text-charcoal/70 mb-2">First Clean ({preview.cleanerCount} cleaner{preview.cleanerCount > 1 ? 's' : ''})</p>
                <div className="space-y-1 text-xs text-charcoal/60">
                  <div className="flex justify-between">
                    <span>Labor ({(preview.firstClean?.durationHours || 0).toFixed(1)}h × ${costSettings.loadedHourlyRate} × {preview.cleanerCount})</span>
                    <span className="text-red-600">-{formatPrice(preview.firstClean?.laborCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplies & Gas</span>
                    <span className="text-red-600">-{formatPrice(preview.firstClean?.suppliesGasCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipment</span>
                    <span className="text-red-600">-{formatPrice(preview.firstClean?.equipmentCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead</span>
                    <span className="text-red-600">-{formatPrice(preview.firstClean?.overheadCost || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-sage/20 font-medium">
                    <span className="text-charcoal">Total Cost</span>
                    <span className="text-charcoal">{formatPrice(preview.firstClean?.totalCost || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-charcoal">Quote Price</span>
                    <span className="text-charcoal">{formatPrice(preview.firstCleanPrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1">
                    <span className="text-green-700">Profit ({preview.firstClean?.margin || 0}% margin)</span>
                    <span className="text-green-600">{formatPrice(preview.firstClean?.profit || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Recurring Breakdown */}
              {calcParams.frequency !== 'onetime' && (
                <div className="pt-3 border-t border-charcoal/10">
                  <p className="text-xs font-medium text-charcoal/70 mb-2">Recurring Clean</p>
                  <div className="space-y-1 text-xs text-charcoal/60">
                    <div className="flex justify-between">
                      <span>Labor ({(preview.recurring?.durationHours || 0).toFixed(1)}h × ${costSettings.loadedHourlyRate} × {preview.cleanerCount})</span>
                      <span className="text-red-600">-{formatPrice(preview.recurring?.laborCost || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supplies & Gas</span>
                      <span className="text-red-600">-{formatPrice(preview.recurring?.suppliesGasCost || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipment</span>
                      <span className="text-red-600">-{formatPrice(preview.recurring?.equipmentCost || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overhead</span>
                      <span className="text-red-600">-{formatPrice(preview.recurring?.overheadCost || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-sage/20 font-medium">
                      <span className="text-charcoal">Total Cost</span>
                      <span className="text-charcoal">{formatPrice(preview.recurring?.totalCost || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-charcoal">Quote Price (after {preview.recurring?.frequencyDiscount || 0}% discount)</span>
                      <span className="text-charcoal">{formatPrice(preview.recurringPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                      <span className="text-green-700">Profit ({preview.recurring?.margin || 0}% margin)</span>
                      <span className="text-green-600">{formatPrice(preview.recurring?.profit || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {hasChanges && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-700 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Preview updates as you change settings. Save to apply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
