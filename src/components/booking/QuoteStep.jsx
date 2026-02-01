import { useState, useMemo, useEffect } from 'react';
import { Minus, Plus, Leaf, Clock, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { 
  calculateCleaningPrice, 
  formatPrice, 
  formatDuration,
  getFrequencyBadge,
  fetchCostSettings
} from '../../utils/pricingLogic';

/**
 * QuoteStep - Pricing calculator with add-ons
 */
const QuoteStep = ({ data, onComplete, onClose }) => {
  // Form state
  const [sqft, setSqft] = useState(data.sqft);
  const [bedrooms, setBedrooms] = useState(data.bedrooms);
  const [bathrooms, setBathrooms] = useState(data.bathrooms);
  const [frequency, setFrequency] = useState(data.frequency);
  const [selectedAddons, setSelectedAddons] = useState(data.addons || []);
  
  // Available add-ons from database
  const [addonServices, setAddonServices] = useState([]);
  const [loadingAddons, setLoadingAddons] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch fresh pricing settings on mount
  useEffect(() => {
    fetchCostSettings(true).then(() => setSettingsLoaded(true));
  }, []);

  // Fetch add-on services
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const { data: addons, error } = await supabase
          .from('addon_services')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setAddonServices(addons || []);
      } catch (err) {
        console.error('Error fetching addons:', err);
        // Fallback to default add-ons
        setAddonServices([
          { id: '1', name: 'Inside Fridge Cleaning', price: 35, duration_minutes: 30 },
          { id: '2', name: 'Inside Oven Cleaning', price: 25, duration_minutes: 20 },
          { id: '3', name: 'Interior Windows (per floor)', price: 50, duration_minutes: 45 },
          { id: '4', name: 'Laundry - Wash/Dry/Fold', price: 30, duration_minutes: 60 },
          { id: '5', name: 'Organize Pantry', price: 40, duration_minutes: 30 },
          { id: '6', name: 'Organize Closet', price: 40, duration_minutes: 30 },
        ]);
      } finally {
        setLoadingAddons(false);
      }
    };

    fetchAddons();
  }, []);

  // Calculate pricing (re-calculates when settings load)
  const pricing = useMemo(() => {
    return calculateCleaningPrice({
      sqft,
      bedrooms,
      bathrooms,
      frequency,
      addons: selectedAddons,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqft, bedrooms, bathrooms, frequency, selectedAddons, settingsLoaded]);

  // Toggle add-on selection
  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Handle continue
  const handleContinue = () => {
    onComplete({
      sqft,
      bedrooms,
      bathrooms,
      frequency,
      addons: selectedAddons,
      pricing,
    });
  };

  // Frequency options
  const frequencyOptions = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: 'Bi-Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'onetime', label: 'One-Time' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-playfair font-semibold text-charcoal mb-2">
          Get Your Instant Quote
        </h3>
        <p className="text-charcoal/60 font-inter">
          Customize your cleaning and see your price instantly
        </p>
      </div>

      {/* Property Size */}
      <div className="space-y-6">
        {/* Square Footage Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-inter font-medium text-charcoal">
              Home Size
            </label>
            <span className="font-inter text-sage font-semibold text-lg">
              {sqft.toLocaleString()} sq ft
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="w-full h-2 bg-sage/20 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-sage
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-md
                       [&::-moz-range-thumb]:w-5
                       [&::-moz-range-thumb]:h-5
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-sage
                       [&::-moz-range-thumb]:border-0"
          />
          <div className="flex justify-between mt-1 text-xs text-charcoal/50 font-inter">
            <span>500 sq ft</span>
            <span>5,000 sq ft</span>
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-6">
          <CounterInput
            label="Bedrooms"
            value={bedrooms}
            onChange={setBedrooms}
            min={1}
            max={8}
          />
          <CounterInput
            label="Bathrooms"
            value={bathrooms}
            onChange={setBathrooms}
            min={1}
            max={6}
            allowHalf
          />
        </div>

        {/* Frequency Selection */}
        <div>
          <label className="block font-inter font-medium text-charcoal mb-3">
            Cleaning Frequency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {frequencyOptions.map((option) => {
              const badge = getFrequencyBadge(option.id);
              const isSelected = frequency === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setFrequency(option.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-sage bg-sage/10'
                      : 'border-charcoal/10 hover:border-sage/50 bg-white'
                    }`}
                >
                  {badge && (
                    <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 
                      text-xs font-inter font-medium rounded-full whitespace-nowrap
                      ${option.id === 'biweekly' 
                        ? 'bg-sage text-bone' 
                        : 'bg-sage/20 text-sage'
                      }`}>
                      {badge}
                    </span>
                  )}
                  <span className={`block font-inter font-medium text-sm
                    ${isSelected ? 'text-charcoal' : 'text-charcoal/70'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add-On Services */}
      <div>
        <label className="block font-inter font-medium text-charcoal mb-3">
          Add-On Services <span className="text-charcoal/50 font-normal">(optional)</span>
        </label>
        
        {loadingAddons ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-sage border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {addonServices.map((addon) => {
              const isSelected = selectedAddons.some(a => a.id === addon.id);
              
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 
                    transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-sage bg-sage/10'
                      : 'border-charcoal/10 hover:border-sage/50 bg-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                      ${isSelected ? 'bg-sage border-sage' : 'border-charcoal/20'}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-inter font-medium text-charcoal text-sm">
                        {addon.name}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        +{addon.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <span className="font-inter font-semibold text-sage">
                    +{formatPrice(addon.price)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-charcoal/10" />

      {/* Pricing Summary */}
      <div className="space-y-4">
        {/* Duration Estimate */}
        <div className="flex items-center justify-center gap-2 text-charcoal/60">
          <Clock className="w-4 h-4" />
          <span className="font-inter text-sm">
            Estimated duration: {formatDuration(pricing.firstCleanDuration)}
          </span>
        </div>

        {/* Price Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* First Clean */}
          <div className="bg-sage/10 rounded-xl p-5 border-2 border-sage">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-sage text-bone text-xs font-inter font-semibold px-2 py-1 rounded-full">
                FIRST CLEAN
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-playfair font-semibold text-charcoal">
                {formatPrice(pricing.firstCleanTotal)}
              </span>
            </div>
            <p className="text-charcoal/60 font-inter text-sm">
              Deep clean to get your home sparkling
            </p>
            {selectedAddons.length > 0 && (
              <p className="text-xs text-sage mt-2">
                Includes {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Recurring */}
          {frequency !== 'onetime' ? (
            <div className="bg-white rounded-xl p-5 border border-charcoal/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-charcoal/10 text-charcoal text-xs font-inter font-semibold px-2 py-1 rounded-full uppercase">
                  {frequency} After
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-playfair font-semibold text-charcoal">
                  {formatPrice(pricing.recurringPrice)}
                </span>
                <span className="text-charcoal/60 font-inter text-sm">/visit</span>
              </div>
              <p className="text-charcoal/60 font-inter text-sm">
                Maintenance cleaning each visit
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-charcoal/10 flex items-center justify-center">
              <p className="text-charcoal/60 font-inter text-sm text-center">
                Want recurring cleanings?<br />
                <span className="text-sage font-medium">Select a frequency above!</span>
              </p>
            </div>
          )}
        </div>

        {/* Savings callout */}
        {frequency !== 'onetime' && pricing.savingsPerVisit > 0 && (
          <div className="bg-sage/5 rounded-lg p-3 text-center">
            <p className="text-sm font-inter text-charcoal/70">
              <span className="font-semibold text-sage">
                Save {formatPrice(pricing.savingsPerVisit)}
              </span> per visit with {frequency} cleaning
            </p>
          </div>
        )}

        {/* Value Props */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-charcoal/70">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-sage" />
            <span className="font-inter">Premium non-toxic supplies included</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-charcoal/20 rounded-xl
                     font-inter font-medium text-charcoal hover:bg-charcoal/5
                     transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 btn-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Counter Input Component
const CounterInput = ({ label, value, onChange, min = 0, max = 10, allowHalf = false }) => {
  const step = allowHalf ? 0.5 : 1;

  const decrement = () => {
    if (value > min) onChange(value - step);
  };

  const increment = () => {
    if (value < max) onChange(value + step);
  };

  const displayValue = allowHalf && value % 1 !== 0 
    ? value.toFixed(1) 
    : value;

  return (
    <div>
      <label className="block font-inter font-medium text-charcoal mb-3">
        {label}
      </label>
      <div className="flex items-center justify-between bg-white rounded-xl border border-charcoal/10 p-2">
        <button
          onClick={decrement}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center rounded-lg 
                     bg-sage/10 text-sage hover:bg-sage hover:text-bone
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors duration-200"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="font-inter font-semibold text-xl text-charcoal min-w-[3rem] text-center">
          {displayValue}
        </span>
        <button
          onClick={increment}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center rounded-lg 
                     bg-sage/10 text-sage hover:bg-sage hover:text-bone
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors duration-200"
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default QuoteStep;
