import { useState, useEffect, useMemo } from 'react';
import { Leaf, Sparkles, Shield, Clock, Check, Star, Phone, Mail, ChevronDown, Minus, Plus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  calculateCleaningPrice,
  formatPrice,
  formatDuration,
  getFrequencyBadge,
  getCleanerCount,
  fetchCostSettings
} from '../utils/profitPricingLogic';

const LeadCaptureLanding = () => {
  // Pricing calculator state
  const [sqft, setSqft] = useState(2000);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [frequency, setFrequency] = useState('biweekly');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Lead form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    fetchCostSettings().then(() => setSettingsLoaded(true));
  }, []);

  // Calculate pricing
  const pricing = useMemo(() => {
    return calculateCleaningPrice(sqft, bedrooms, bathrooms, frequency);
  }, [sqft, bedrooms, bathrooms, frequency, settingsLoaded]);

  const cleanerCount = getCleanerCount(sqft);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          zip_code: formData.zipCode,
          notes: formData.notes,
          source: 'landing_page',
          utm_source: new URLSearchParams(window.location.search).get('utm_source') || null,
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || null,
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || null,
          quote_details: {
            sqft,
            bedrooms,
            bathrooms,
            frequency,
            firstCleanPrice: pricing.firstCleanPrice,
            recurringPrice: pricing.recurringPrice
          }
        });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-sage" />
          </div>
          <h1 className="font-playfair text-3xl font-semibold text-charcoal mb-4">
            Thanks for Your Interest!
          </h1>
          <p className="text-charcoal/70 font-inter mb-6">
            We've received your information and will reach out within 24 hours to discuss your cleaning needs.
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-inter font-semibold text-charcoal mb-3">Your Quote Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/60">First Deep Clean</span>
                <span className="font-semibold text-sage">{formatPrice(pricing.firstCleanPrice)}</span>
              </div>
              {frequency !== 'onetime' && (
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Recurring ({getFrequencyBadge(frequency)})</span>
                  <span className="font-semibold text-charcoal">{formatPrice(pricing.recurringPrice)}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-charcoal/50 mt-6">
            Questions? Call us at{' '}
            <a href="tel:6302670096" className="text-sage hover:underline">(630) 267-0096</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone">
      {/* Minimal Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-charcoal/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-sage" />
            <span className="font-playfair text-xl font-semibold text-charcoal">
              Willow & Water
            </span>
          </div>
          <a
            href="tel:6302670096"
            className="flex items-center gap-2 text-sage font-inter font-medium text-sm hover:text-sage/80 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">(630) 267-0096</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full text-sm font-inter mb-6">
              <Leaf className="w-4 h-4" />
              <span>100% Organic Cleaning Products</span>
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-semibold text-charcoal mb-6 leading-tight">
              Premium Organic
              <br />
              <span className="text-sage">Home Cleaning</span>
            </h1>
            <p className="text-lg sm:text-xl text-charcoal/70 font-inter max-w-2xl mx-auto mb-8">
              Safe for your family. Safe for your pets. Safe for the planet.
              <br className="hidden sm:block" />
              Serving the Fox Valley area with eco-friendly cleaning services.
            </p>
            <a
              href="#get-quote"
              className="inline-flex items-center gap-2 bg-sage text-white px-8 py-4 rounded-full font-inter font-semibold text-lg hover:bg-sage/90 transition-colors shadow-lg shadow-sage/20"
            >
              Get Your Free Quote
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-8 border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 text-sage" />
              </div>
              <div>
                <p className="font-inter font-semibold text-charcoal text-sm">100% Organic</p>
                <p className="text-xs text-charcoal/60">Non-toxic products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-sage" />
              </div>
              <div>
                <p className="font-inter font-semibold text-charcoal text-sm">Fully Insured</p>
                <p className="text-xs text-charcoal/60">Peace of mind</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-sage" />
              </div>
              <div>
                <p className="font-inter font-semibold text-charcoal text-sm">Satisfaction</p>
                <p className="text-xs text-charcoal/60">Guaranteed clean</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-sage" />
              </div>
              <div>
                <p className="font-inter font-semibold text-charcoal text-sm">Flexible</p>
                <p className="text-xs text-charcoal/60">Your schedule</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Calculator + Lead Form */}
      <section id="get-quote" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl sm:text-4xl font-semibold text-charcoal mb-4">
              Get Your Instant Quote
            </h2>
            <p className="text-charcoal/70 font-inter max-w-xl mx-auto">
              See exactly what your home cleaning will cost. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Calculator */}
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 order-2 lg:order-1">
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-6">
                Customize Your Clean
              </h3>

              {/* Square Footage */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Home Size: <span className="text-sage font-semibold">{sqft.toLocaleString()} sq ft</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={sqft}
                  onChange={(e) => setSqft(parseInt(e.target.value))}
                  className="w-full h-2 bg-charcoal/10 rounded-lg appearance-none cursor-pointer accent-sage"
                />
                <div className="flex justify-between text-xs text-charcoal/50 mt-1">
                  <span>500 sq ft</span>
                  <span>5,000 sq ft</span>
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Bedrooms</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                      className="w-10 h-10 rounded-full bg-charcoal/5 hover:bg-charcoal/10 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 text-charcoal" />
                    </button>
                    <span className="font-inter font-semibold text-charcoal text-lg w-8 text-center">{bedrooms}</span>
                    <button
                      onClick={() => setBedrooms(Math.min(8, bedrooms + 1))}
                      className="w-10 h-10 rounded-full bg-charcoal/5 hover:bg-charcoal/10 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-charcoal" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Bathrooms</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBathrooms(Math.max(1, bathrooms - 0.5))}
                      className="w-10 h-10 rounded-full bg-charcoal/5 hover:bg-charcoal/10 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 text-charcoal" />
                    </button>
                    <span className="font-inter font-semibold text-charcoal text-lg w-8 text-center">{bathrooms}</span>
                    <button
                      onClick={() => setBathrooms(Math.min(6, bathrooms + 0.5))}
                      className="w-10 h-10 rounded-full bg-charcoal/5 hover:bg-charcoal/10 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-charcoal" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-charcoal mb-3">Cleaning Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'weekly', label: 'Weekly', discount: '15% off' },
                    { value: 'biweekly', label: 'Bi-Weekly', discount: '10% off' },
                    { value: 'monthly', label: 'Monthly', discount: '5% off' },
                    { value: 'onetime', label: 'One-Time', discount: null }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFrequency(option.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        frequency === option.value
                          ? 'border-sage bg-sage/5'
                          : 'border-charcoal/10 hover:border-charcoal/20'
                      }`}
                    >
                      <span className="font-inter font-medium text-charcoal text-sm block">{option.label}</span>
                      {option.discount && (
                        <span className="text-xs text-sage">{option.discount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Display */}
              <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sage" />
                    <span className="text-sm text-charcoal/70">{cleanerCount} cleaner{cleanerCount > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-charcoal/50" />
                    <span className="text-sm text-charcoal/50">{formatDuration(pricing.durationMinutes)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60 mb-1">First Deep Clean</p>
                      <p className="text-3xl font-playfair font-semibold text-sage">
                        {formatPrice(pricing.firstCleanPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sage text-sm">
                      <Leaf className="w-4 h-4" />
                      <span>Organic</span>
                    </div>
                  </div>

                  {frequency !== 'onetime' && (
                    <div className="pt-3 border-t border-sage/20">
                      <p className="text-sm text-charcoal/60 mb-1">
                        Then {getFrequencyBadge(frequency)}
                      </p>
                      <p className="text-2xl font-playfair font-semibold text-charcoal">
                        {formatPrice(pricing.recurringPrice)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Form */}
            <div className="bg-charcoal rounded-3xl shadow-xl p-6 sm:p-8 order-1 lg:order-2">
              <h3 className="font-playfair text-xl font-semibold text-bone mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-bone/70 font-inter text-sm mb-6">
                Leave your details and we'll reach out to discuss your cleaning needs.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bone/80 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-bone placeholder-bone/40 font-inter focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bone/80 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-bone placeholder-bone/40 font-inter focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bone/80 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(630) 555-1234"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-bone placeholder-bone/40 font-inter focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bone/80 mb-1">Zip Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="60174"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-bone placeholder-bone/40 font-inter focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bone/80 mb-1">Anything else we should know?</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Pets, special requests, etc."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-bone placeholder-bone/40 font-inter focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-sage text-white py-4 rounded-xl font-inter font-semibold text-lg hover:bg-sage/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Get My Free Quote</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-bone/50 text-center">
                  We'll reach out within 24 hours. No spam, ever.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl sm:text-4xl font-semibold text-charcoal mb-4">
              Why Families Choose Willow & Water
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
                Truly Organic
              </h3>
              <p className="text-charcoal/70 font-inter">
                We use Branch Basics and other certified organic products. No harsh chemicals, ever. Safe for kids, pets, and allergy sufferers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
                Trusted & Insured
              </h3>
              <p className="text-charcoal/70 font-inter">
                Fully insured and background-checked cleaners. We treat your home like our own and stand behind every clean.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
                Local & Personal
              </h3>
              <p className="text-charcoal/70 font-inter">
                We're your neighbors in the Fox Valley. You'll always have the same trusted cleaner who knows your home and preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-sage/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
          <blockquote className="font-playfair text-2xl sm:text-3xl text-charcoal mb-6 italic">
            "Finally, a cleaning service that takes organic seriously. My kids have allergies and I noticed a huge difference after switching to Willow & Water."
          </blockquote>
          <p className="text-charcoal/70 font-inter">
            — Sarah M., St. Charles
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-charcoal py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl font-semibold text-bone mb-4">
            Ready for a Cleaner, Healthier Home?
          </h2>
          <p className="text-bone/70 font-inter mb-8 max-w-2xl mx-auto">
            Join families across the Fox Valley who've made the switch to organic cleaning.
          </p>
          <a
            href="#get-quote"
            className="inline-flex items-center gap-2 bg-sage text-white px-8 py-4 rounded-full font-inter font-semibold text-lg hover:bg-sage/90 transition-colors"
          >
            Get Your Free Quote
            <Sparkles className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-charcoal border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-sage" />
              <span className="font-playfair text-bone">Willow & Water Organic Cleaning</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-bone/60">
              <a href="tel:6302670096" className="hover:text-bone transition-colors flex items-center gap-1">
                <Phone className="w-4 h-4" />
                (630) 267-0096
              </a>
              <a href="mailto:hello@willowandwaterorganiccleaning.com" className="hover:text-bone transition-colors flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          </div>
          <p className="text-center text-bone/40 text-xs mt-6">
            © {new Date().getFullYear()} Willow & Water Organic Cleaning. Serving St. Charles, Geneva, Batavia & the Fox Valley.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LeadCaptureLanding;
