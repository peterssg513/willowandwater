import { useState } from 'react';
import { User, Loader2, Leaf } from 'lucide-react';
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

const ContactStep = ({ bookingData, onComplete, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { quote } = bookingData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const serviceArea = detectServiceArea(formData.address);

    // Prepare lead data for Supabase
    const leadData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      sqft: quote?.sqft,
      bedrooms: quote?.bedrooms,
      bathrooms: quote?.bathrooms,
      frequency: quote?.frequency,
      recurring_price: quote?.recurringPrice,
      first_clean_price: quote?.firstCleanPrice,
      service_area: serviceArea,
      status: 'lead',
      source: 'website_calculator',
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([leadData]);

      if (insertError) throw insertError;

      // Pass contact data to next step
      onComplete({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        serviceArea,
      });
    } catch (err) {
      console.error('Lead submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
          <Leaf className="w-4 h-4" />
          <span className="font-inter text-xs font-medium">Step 2 of 4</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
          Your Contact Information
        </h2>
        <p className="text-charcoal/60 font-inter">
          {formatPrice(quote?.recurringPrice)}/visit for your {quote?.sqft?.toLocaleString()} sq ft home
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label 
            htmlFor="contact-name" 
            className="block font-inter text-sm font-medium text-charcoal mb-1.5"
          >
            Full Name
          </label>
          <input
            type="text"
            id="contact-name"
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
            htmlFor="contact-email" 
            className="block font-inter text-sm font-medium text-charcoal mb-1.5"
          >
            Email Address
          </label>
          <input
            type="email"
            id="contact-email"
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
            htmlFor="contact-phone" 
            className="block font-inter text-sm font-medium text-charcoal mb-1.5"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="contact-phone"
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
            htmlFor="contact-address" 
            className="block font-inter text-sm font-medium text-charcoal mb-1.5"
          >
            Street Address
          </label>
          <input
            type="text"
            id="contact-address"
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, St. Charles, IL 60174"
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              Continue to Scheduling
            </>
          )}
        </button>

        {/* Cancel Link */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-charcoal/60 hover:text-charcoal 
                     font-inter text-sm transition-colors"
        >
          Cancel
        </button>

        {/* Trust Note */}
        <p className="text-center text-xs text-charcoal/50 font-inter">
          Your information is secure and will only be used to schedule your cleaning.
        </p>
      </form>
    </div>
  );
};

export default ContactStep;
