import { useState, useMemo, useEffect } from 'react';
import { Leaf, Minus, Plus, Shield, Calendar, Clock } from 'lucide-react';
import { 
  calculateCleaningPrice, 
  formatPrice, 
  formatDuration,
  getFrequencyBadge 
} from '../utils/pricingLogic';
import { BookingFlow } from './booking';

const PricingCalculator = () => {
  // Form state (defaults to common Fox Valley home size)
  const [sqft, setSqft] = useState(2400);
  const [bedrooms, setBedrooms] = useState(4);
  const [bathrooms, setBathrooms] = useState(2.5);
  const [frequency, setFrequency] = useState('biweekly');
  
  // Modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Calculate price whenever inputs change
  const pricing = useMemo(() => {
    return calculateCleaningPrice({ sqft, bedrooms, bathrooms, frequency });
  }, [sqft, bedrooms, bathrooms, frequency]);

  // Handle opening booking flow
  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  // Frequency options
  const frequencyOptions = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: 'Bi-Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'onetime', label: 'One-Time' },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-sage/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-4">
            Get Your Instant Quote
          </h2>
          <p className="text-charcoal/70 font-inter max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Adjust the options below to see your personalized estimate.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-bone rounded-2xl shadow-lg shadow-charcoal/5 p-6 sm:p-8 md:p-10">
          {/* Input Section */}
          <div className="space-y-8 mb-10">
            {/* Square Footage Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label 
                  htmlFor="sqft-slider"
                  className="font-inter font-medium text-charcoal"
                >
                  Home Size
                </label>
                <span className="font-inter text-sage font-semibold text-lg">
                  {sqft.toLocaleString()} sq ft
                </span>
              </div>
              <input
                id="sqft-slider"
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
                           [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:hover:scale-110
                           [&::-moz-range-thumb]:w-5
                           [&::-moz-range-thumb]:h-5
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:bg-sage
                           [&::-moz-range-thumb]:border-0
                           [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-1 text-xs text-charcoal/50 font-inter">
                <span>500 sq ft</span>
                <span>5,000 sq ft</span>
              </div>
            </div>

            {/* Bedrooms & Bathrooms Counters */}
            <div className="grid grid-cols-2 gap-6">
              {/* Bedrooms */}
              <CounterInput
                label="Bedrooms"
                value={bedrooms}
                onChange={setBedrooms}
                min={1}
                max={8}
              />
              {/* Bathrooms */}
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

          {/* Divider */}
          <div className="border-t border-charcoal/10 my-8" />

          {/* Results Section */}
          <div>
            {/* Duration Estimate */}
            <div className="flex items-center justify-center gap-2 mb-6 text-charcoal/60">
              <Clock className="w-4 h-4" />
              <span className="font-inter text-sm">
                Estimated duration: {formatDuration(pricing.firstCleanDuration)}
              </span>
            </div>

            {/* Price Cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {/* First Clean Card */}
              <div className="bg-sage/10 rounded-xl p-5 border-2 border-sage">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-sage text-bone text-xs font-inter font-semibold px-2 py-1 rounded-full">
                    FIRST CLEAN
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal">
                    {formatPrice(pricing.firstCleanPrice)}
                  </span>
                </div>
                <p className="text-charcoal/60 font-inter text-sm">
                  Deep clean to get your home sparkling
                </p>
              </div>

              {/* Recurring Clean Card */}
              {frequency !== 'onetime' && (
                <div className="bg-white rounded-xl p-5 border border-charcoal/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-charcoal/10 text-charcoal text-xs font-inter font-semibold px-2 py-1 rounded-full uppercase">
                      {frequency} After
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal">
                      {formatPrice(pricing.recurringPrice)}
                    </span>
                    <span className="text-charcoal/60 font-inter text-sm">/visit</span>
                  </div>
                  <p className="text-charcoal/60 font-inter text-sm">
                    Maintenance cleaning each visit
                  </p>
                </div>
              )}

              {/* One-time message */}
              {frequency === 'onetime' && (
                <div className="bg-white rounded-xl p-5 border border-charcoal/10 flex items-center justify-center">
                  <p className="text-charcoal/60 font-inter text-sm text-center">
                    Want recurring cleanings?<br />
                    <span className="text-sage font-medium">Select a frequency above!</span>
                  </p>
                </div>
              )}
            </div>

            {/* Savings callout for recurring */}
            {frequency !== 'onetime' && (
              <div className="bg-sage/5 rounded-lg p-3 mb-6 text-center">
                <p className="text-sm font-inter text-charcoal/70">
                  <span className="font-semibold text-sage">Save {formatPrice(pricing.firstCleanPrice - pricing.recurringPrice)}</span> per visit with {frequency} cleaning vs. one-time deep cleans
                </p>
              </div>
            )}

            {/* Value Proposition */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm text-charcoal/70">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-sage" aria-hidden="true" />
                <span className="font-inter">Premium non-toxic supplies included</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sage" aria-hidden="true" />
                <span className="font-inter">Fully insured</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={handleOpenBooking}
                className="inline-flex items-center justify-center gap-2 btn-primary text-lg px-8 py-4"
              >
                <Calendar className="w-5 h-5" aria-hidden="true" />
                Book Your First Clean
              </button>

              {/* Satisfaction Note */}
              <p className="mt-4 text-xs text-charcoal/50 font-inter">
                100% satisfaction guaranteed • No contracts • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Flow Modal */}
      <BookingFlow 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialData={{ sqft, bedrooms, bathrooms, frequency }}
      />
    </section>
  );
};

// ============================================
// Counter Input Sub-Component
// ============================================
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

export default PricingCalculator;
