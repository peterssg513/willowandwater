import { useState } from 'react';
import { X, Leaf, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

// Fox Valley service area cities for address detection
const FOX_VALLEY_CITIES = [
  'st. charles', 'saint charles', 'geneva', 'batavia', 
  'wayne', 'campton hills', 'elburn'
];

/**
 * Detect service area from address
 */
const detectServiceArea = (address) => {
  const lowerAddress = address.toLowerCase();
  for (const city of FOX_VALLEY_CITIES) {
    if (lowerAddress.includes(city)) {
      return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return 'Fox Valley';
};

const LeadForm = ({ isOpen, onClose, quote }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Detect service area from address
    const serviceArea = detectServiceArea(formData.address);

    // Prepare booking data
    const bookingData = {
      // Contact info
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      
      // Quote details
      sqft: quote.sqft,
      bedrooms: quote.bedrooms,
      bathrooms: quote.bathrooms,
      frequency: quote.frequency,
      recurring_price: quote.recurringPrice,
      first_clean_price: quote.firstCleanPrice,
      
      // Metadata
      service_area: serviceArea,
      status: 'lead',
      source: 'website_calculator',
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      setStatus('success');
    } catch (err) {
      console.error('Lead submission error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({ name: '', email: '', phone: '', address: '' });
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="relative bg-bone rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-charcoal/50 hover:text-charcoal 
                     hover:bg-charcoal/5 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            <h2 className="text-2xl font-playfair font-semibold text-charcoal mb-3">
              Thank You, {formData.name.split(' ')[0]}!
            </h2>
            <p className="text-charcoal/70 font-inter mb-6">
              Our Fox Valley team will call you shortly to confirm your preferred cleaning date.
            </p>
            <div className="bg-sage/5 rounded-xl p-4 mb-6">
              <p className="text-sm text-charcoal/60 font-inter mb-1">Your quoted price</p>
              <p className="text-3xl font-playfair font-semibold text-charcoal">
                {formatPrice(quote.recurringPrice)}<span className="text-base font-inter text-charcoal/60">/visit</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        ) : (
          // Form State
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
                <Leaf className="w-4 h-4" />
                <span className="font-inter text-xs font-medium">Scope Locked</span>
              </div>
              <h2 
                id="lead-form-title"
                className="text-2xl font-playfair font-semibold text-charcoal mb-2"
              >
                Lock In Your Quote
              </h2>
              <p className="text-charcoal/60 font-inter text-sm">
                {formatPrice(quote.recurringPrice)}/visit for your {quote.sqft.toLocaleString()} sq ft home
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label 
                  htmlFor="name" 
                  className="block font-inter text-sm font-medium text-charcoal mb-1.5"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
              </div>

              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block font-inter text-sm font-medium text-charcoal mb-1.5"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
              </div>

              {/* Phone */}
              <div>
                <label 
                  htmlFor="phone" 
                  className="block font-inter text-sm font-medium text-charcoal mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(630) 555-1234"
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
              </div>

              {/* Address */}
              <div>
                <label 
                  htmlFor="address" 
                  className="block font-inter text-sm font-medium text-charcoal mb-1.5"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, St. Charles, IL"
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
                <p className="mt-1.5 text-xs text-charcoal/50 font-inter">
                  We serve St. Charles, Geneva, Batavia, Wayne, Campton Hills & Elburn
                </p>
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-primary w-full flex items-center justify-center gap-2 
                           disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request My Cleaning'
                )}
              </button>

              {/* Trust indicators */}
              <p className="text-center text-xs text-charcoal/50 font-inter">
                No spam, ever. We'll only contact you about your cleaning.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadForm;
