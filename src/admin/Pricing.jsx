import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Save, 
  RefreshCw, 
  Calculator,
  TrendingUp,
  Percent,
  Clock,
  Home,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

// Default pricing constants (matching pricingLogic.js)
const DEFAULT_PRICING = {
  // Core rates
  hourlyRate: 48.50,
  baseLaborCost: 23.34,
  supplyCost: 4.50,
  targetMargin: 0.42,
  
  // Adjustments
  organicBuffer: 1.10,
  efficiencyDiscount: 0.15,
  efficiencyThresholdHours: 4,
  firstCleanPremium: 100,
  
  // Frequency multipliers
  frequencyMultipliers: {
    weekly: 0.65,
    biweekly: 0.75,
    monthly: 0.90,
    onetime: 1.35,
  },
  
  // Room calculations
  bathroomHours: 0.8,
  bedroomHours: 0.3,
  
  // Square footage tiers (for base hours calculation)
  sqftBaseHours: 1.0,      // Hours for homes under 1000 sqft
  sqftPerThousand: 0.5,    // Additional hours per 1000 sqft over 1000
};

// Helper to calculate price with given settings
const calculatePreviewPrice = (settings, sqft, bedrooms, bathrooms, frequency) => {
  // Base hours from sqft
  let baseHours = settings.sqftBaseHours;
  if (sqft >= 1000) {
    baseHours = ((sqft - 1000) / 1000 * settings.sqftPerThousand) + settings.sqftBaseHours;
  }
  
  // Room load
  const roomLoad = (bathrooms * settings.bathroomHours) + (bedrooms * settings.bedroomHours);
  
  // Apply organic buffer
  const totalHours = (baseHours + roomLoad) * settings.organicBuffer;
  
  // Raw price
  const rawPrice = totalHours * settings.hourlyRate;
  
  // Efficiency discount
  const priceAfterEfficiency = totalHours > settings.efficiencyThresholdHours
    ? rawPrice * (1 - settings.efficiencyDiscount)
    : rawPrice;
  
  // Frequency multiplier
  const multiplier = settings.frequencyMultipliers[frequency] || settings.frequencyMultipliers.biweekly;
  const finalPrice = priceAfterEfficiency * multiplier;
  
  // Round to nearest $5
  const recurringPrice = Math.round(finalPrice / 5) * 5;
  const firstCleanPrice = recurringPrice + settings.firstCleanPremium;
  
  return {
    recurringPrice,
    firstCleanPrice,
    totalHours: Math.round(totalHours * 100) / 100,
    rawPrice: Math.round(rawPrice),
  };
};

// Input component with label and description
const PricingInput = ({ label, description, value, onChange, type = 'number', step = '0.01', prefix, suffix, min, max }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-charcoal font-inter">{label}</label>
    {description && <p className="text-xs text-charcoal/50 font-inter">{description}</p>}
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 font-inter">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        step={step}
        min={min}
        max={max}
        className={`w-full py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                   focus:outline-none focus:ring-2 focus:ring-sage ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50 font-inter text-sm">{suffix}</span>
      )}
    </div>
  </div>
);

// Collapsible section component
const Section = ({ title, description, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bone/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sage/10 rounded-lg">
            <Icon className="w-5 h-5 text-sage" />
          </div>
          <div className="text-left">
            <h3 className="font-playfair font-semibold text-charcoal">{title}</h3>
            {description && <p className="text-xs text-charcoal/50 font-inter">{description}</p>}
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-charcoal/40" /> : <ChevronDown className="w-5 h-5 text-charcoal/40" />}
      </button>
      {isOpen && <div className="px-6 pb-6 pt-2">{children}</div>}
    </div>
  );
};

// Preview card component
const PreviewCard = ({ label, sqft, bedrooms, bathrooms, frequency, settings }) => {
  const result = calculatePreviewPrice(settings, sqft, bedrooms, bathrooms, frequency);
  
  return (
    <div className="bg-bone/50 rounded-xl p-4 border border-charcoal/10">
      <p className="text-xs text-charcoal/50 font-inter mb-1">{label}</p>
      <p className="text-sm text-charcoal/70 font-inter mb-2">
        {sqft.toLocaleString()} sqft • {bedrooms} bed • {bathrooms} bath • {frequency}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-playfair text-2xl font-semibold text-sage">${result.recurringPrice}</span>
        <span className="text-sm text-charcoal/50">/clean</span>
      </div>
      <p className="text-xs text-charcoal/50 mt-1">
        First clean: ${result.firstCleanPrice} • Est. {result.totalHours} hrs
      </p>
    </div>
  );
};

const Pricing = () => {
  const [settings, setSettings] = useState(DEFAULT_PRICING);
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_PRICING);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('pricingSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all fields exist
        const merged = { ...DEFAULT_PRICING, ...parsed, frequencyMultipliers: { ...DEFAULT_PRICING.frequencyMultipliers, ...parsed.frequencyMultipliers } };
        setSettings(merged);
        setOriginalSettings(merged);
      } catch (e) {
        console.error('Error loading pricing settings:', e);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  // Update a single setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update frequency multiplier
  const updateFrequency = (key, value) => {
    setSettings(prev => ({
      ...prev,
      frequencyMultipliers: { ...prev.frequencyMultipliers, [key]: value }
    }));
  };

  // Save settings
  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('pricingSettings', JSON.stringify(settings));
      setOriginalSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving pricing settings:', e);
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Reset all pricing to default values? This cannot be undone.')) {
      setSettings(DEFAULT_PRICING);
      localStorage.removeItem('pricingSettings');
      setOriginalSettings(DEFAULT_PRICING);
    }
  };

  // Revert changes
  const handleRevert = () => {
    setSettings(originalSettings);
  };

  // Calculate margin info
  const marginInfo = useMemo(() => {
    const costPerHour = settings.baseLaborCost + settings.supplyCost;
    const profitPerHour = settings.hourlyRate - costPerHour;
    const actualMargin = profitPerHour / settings.hourlyRate;
    return {
      costPerHour: costPerHour.toFixed(2),
      profitPerHour: profitPerHour.toFixed(2),
      actualMargin: (actualMargin * 100).toFixed(1),
    };
  }, [settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Pricing Engine
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Configure how cleaning quotes are calculated
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button onClick={handleRevert} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Revert
            </button>
          )}
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className={`btn-primary flex items-center gap-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-inter">
            You have unsaved changes. Click "Save Changes" to apply your new pricing.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Core Rates */}
          <Section title="Core Rates" description="Base pricing rates" icon={DollarSign}>
            <div className="grid sm:grid-cols-2 gap-4">
              <PricingInput
                label="Hourly Rate"
                description="What you charge per hour of cleaning"
                value={settings.hourlyRate}
                onChange={(v) => updateSetting('hourlyRate', v)}
                prefix="$"
                suffix="/hr"
                min={0}
              />
              <PricingInput
                label="First Clean Premium"
                description="Extra charge for initial deep clean"
                value={settings.firstCleanPremium}
                onChange={(v) => updateSetting('firstCleanPremium', v)}
                prefix="$"
                min={0}
                step="5"
              />
              <PricingInput
                label="Base Labor Cost"
                description="Your labor cost per hour (for margin calc)"
                value={settings.baseLaborCost}
                onChange={(v) => updateSetting('baseLaborCost', v)}
                prefix="$"
                suffix="/hr"
                min={0}
              />
              <PricingInput
                label="Supply Cost"
                description="Cost of cleaning supplies per hour"
                value={settings.supplyCost}
                onChange={(v) => updateSetting('supplyCost', v)}
                prefix="$"
                suffix="/hr"
                min={0}
              />
            </div>
            
            {/* Margin Info */}
            <div className="mt-4 p-4 bg-sage/5 rounded-xl border border-sage/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-charcoal">Margin Analysis</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-charcoal/50">Cost/Hour</p>
                  <p className="font-semibold text-charcoal">${marginInfo.costPerHour}</p>
                </div>
                <div>
                  <p className="text-charcoal/50">Profit/Hour</p>
                  <p className="font-semibold text-green-600">${marginInfo.profitPerHour}</p>
                </div>
                <div>
                  <p className="text-charcoal/50">Gross Margin</p>
                  <p className="font-semibold text-sage">{marginInfo.actualMargin}%</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Frequency Discounts */}
          <Section title="Frequency Discounts" description="Multipliers for recurring service" icon={TrendingUp}>
            <div className="grid sm:grid-cols-2 gap-4">
              <PricingInput
                label="Weekly Multiplier"
                description="65% = 35% discount for weekly clients"
                value={settings.frequencyMultipliers.weekly}
                onChange={(v) => updateFrequency('weekly', v)}
                suffix="×"
                min={0}
                max={2}
              />
              <PricingInput
                label="Biweekly Multiplier"
                description="75% = 25% discount for biweekly"
                value={settings.frequencyMultipliers.biweekly}
                onChange={(v) => updateFrequency('biweekly', v)}
                suffix="×"
                min={0}
                max={2}
              />
              <PricingInput
                label="Monthly Multiplier"
                description="90% = 10% discount for monthly"
                value={settings.frequencyMultipliers.monthly}
                onChange={(v) => updateFrequency('monthly', v)}
                suffix="×"
                min={0}
                max={2}
              />
              <PricingInput
                label="One-Time Multiplier"
                description="135% = 35% premium for deep cleans"
                value={settings.frequencyMultipliers.onetime}
                onChange={(v) => updateFrequency('onetime', v)}
                suffix="×"
                min={0}
                max={3}
              />
            </div>
            
            {/* Discount Summary */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Object.entries(settings.frequencyMultipliers).map(([key, value]) => {
                const discount = (1 - value) * 100;
                const isDiscount = discount > 0;
                return (
                  <div key={key} className={`p-3 rounded-lg text-center ${isDiscount ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="text-xs text-charcoal/50 capitalize">{key}</p>
                    <p className={`font-semibold ${isDiscount ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isDiscount ? `-${Math.round(discount)}%` : `+${Math.abs(Math.round(discount))}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Time Calculations */}
          <Section title="Time Calculations" description="How cleaning hours are estimated" icon={Clock} defaultOpen={false}>
            <div className="grid sm:grid-cols-2 gap-4">
              <PricingInput
                label="Base Hours (< 1000 sqft)"
                description="Minimum hours for small homes"
                value={settings.sqftBaseHours}
                onChange={(v) => updateSetting('sqftBaseHours', v)}
                suffix="hrs"
                min={0}
              />
              <PricingInput
                label="Hours per 1000 sqft"
                description="Additional hours per 1000 sqft over 1000"
                value={settings.sqftPerThousand}
                onChange={(v) => updateSetting('sqftPerThousand', v)}
                suffix="hrs"
                min={0}
              />
              <PricingInput
                label="Hours per Bathroom"
                description="Time added for each bathroom"
                value={settings.bathroomHours}
                onChange={(v) => updateSetting('bathroomHours', v)}
                suffix="hrs"
                min={0}
              />
              <PricingInput
                label="Hours per Bedroom"
                description="Time added for each bedroom"
                value={settings.bedroomHours}
                onChange={(v) => updateSetting('bedroomHours', v)}
                suffix="hrs"
                min={0}
              />
            </div>
          </Section>

          {/* Adjustments */}
          <Section title="Adjustments & Buffers" description="Special pricing adjustments" icon={Percent} defaultOpen={false}>
            <div className="grid sm:grid-cols-2 gap-4">
              <PricingInput
                label="Organic Product Buffer"
                description="110% = 10% extra time for eco-products"
                value={settings.organicBuffer}
                onChange={(v) => updateSetting('organicBuffer', v)}
                suffix="×"
                min={1}
                max={2}
              />
              <PricingInput
                label="Efficiency Discount"
                description="Discount for larger jobs (as decimal)"
                value={settings.efficiencyDiscount}
                onChange={(v) => updateSetting('efficiencyDiscount', v)}
                suffix="%"
                min={0}
                max={0.5}
              />
              <PricingInput
                label="Efficiency Threshold"
                description="Hours needed to qualify for discount"
                value={settings.efficiencyThresholdHours}
                onChange={(v) => updateSetting('efficiencyThresholdHours', v)}
                suffix="hrs"
                min={0}
                step="0.5"
              />
            </div>
            
            <div className="mt-4 p-4 bg-bone/50 rounded-xl">
              <p className="text-sm text-charcoal/70 font-inter">
                <strong>How it works:</strong> Jobs over {settings.efficiencyThresholdHours} hours get a {(settings.efficiencyDiscount * 100).toFixed(0)}% 
                efficiency discount because larger homes are more efficient to clean.
              </p>
            </div>
          </Section>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-sage" />
              <h3 className="font-playfair font-semibold text-charcoal">Live Preview</h3>
            </div>
            <p className="text-sm text-charcoal/50 font-inter mb-4">
              See how your pricing affects different home sizes
            </p>
            
            <div className="space-y-4">
              <PreviewCard
                label="Small Apartment"
                sqft={800}
                bedrooms={1}
                bathrooms={1}
                frequency="biweekly"
                settings={settings}
              />
              <PreviewCard
                label="Average Home"
                sqft={2000}
                bedrooms={3}
                bathrooms={2}
                frequency="biweekly"
                settings={settings}
              />
              <PreviewCard
                label="Large Home"
                sqft={3500}
                bedrooms={5}
                bathrooms={3}
                frequency="biweekly"
                settings={settings}
              />
              <PreviewCard
                label="One-Time Deep Clean"
                sqft={2000}
                bedrooms={3}
                bathrooms={2}
                frequency="onetime"
                settings={settings}
              />
            </div>

            {/* Formula Summary */}
            <div className="mt-6 pt-4 border-t border-charcoal/10">
              <h4 className="text-sm font-medium text-charcoal mb-2">Pricing Formula</h4>
              <div className="text-xs text-charcoal/60 font-mono bg-bone/50 p-3 rounded-lg space-y-1">
                <p>base_hrs = {settings.sqftBaseHours} + (sqft - 1000) / 1000 × {settings.sqftPerThousand}</p>
                <p>room_hrs = bath × {settings.bathroomHours} + bed × {settings.bedroomHours}</p>
                <p>total_hrs = (base + room) × {settings.organicBuffer}</p>
                <p>price = total_hrs × ${settings.hourlyRate} × freq_mult</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
