import { useState, useEffect, useRef } from 'react';
import { User, Loader2, Leaf, MapPin, AlertCircle } from 'lucide-react';
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

/**
 * Format phone number as user types: (XXX) XXX-XXXX
 */
const formatPhoneNumber = (value) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

/**
 * Validate phone number (must be 10 digits)
 */
const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
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
  const [phoneError, setPhoneError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !addressInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { quote } = bookingData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format phone number as user types
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, phone: formatted }));
      // Clear error when user starts typing again
      if (phoneError) setPhoneError('');
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle phone blur validation
  const handlePhoneBlur = () => {
    if (formData.phone && !isValidPhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('');
    }
  };

  // Address autocomplete using free Nominatim (OpenStreetMap) API
  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, address: value }));
    
    // Only search if user has typed at least 3 characters
    if (value.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsLoadingAddress(true);
    
    try {
      // Use Nominatim (OpenStreetMap) for free address lookup
      // Bias results toward Illinois/Fox Valley area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(value)}&` +
        `countrycodes=us&` +
        `addressdetails=1&` +
        `limit=5&` +
        `viewbox=-88.5,41.8,-88.1,42.1&bounded=0`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter and format results
        const suggestions = data
          .filter(item => item.address)
          .map(item => ({
            display: item.display_name,
            street: [item.address.house_number, item.address.road].filter(Boolean).join(' '),
            city: item.address.city || item.address.town || item.address.village || '',
            state: item.address.state || 'IL',
            zip: item.address.postcode || '',
          }))
          .slice(0, 5);
        
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (err) {
      console.error('Address lookup error:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Select an address suggestion
  const handleSelectAddress = (suggestion) => {
    const formattedAddress = suggestion.street 
      ? `${suggestion.street}, ${suggestion.city}, ${suggestion.state} ${suggestion.zip}`.trim()
      : suggestion.display.split(',').slice(0, 3).join(',');
    
    setFormData((prev) => ({ ...prev, address: formattedAddress }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone before submitting
    if (!isValidPhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    
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
      customer_type: 'first_time',
    };

    console.log('Creating lead in Supabase:', leadData);

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('bookings')
        .insert([leadData])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }

      console.log('Lead created successfully:', insertedData);

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
          <span className="font-inter text-xs font-medium">Step 2 of 5</span>
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
            onBlur={handlePhoneBlur}
            placeholder="(630) 555-1234"
            className={`w-full px-4 py-3 bg-white border rounded-xl
                       font-inter text-charcoal placeholder:text-charcoal/40
                       focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                       transition-shadow
                       ${phoneError ? 'border-red-400' : 'border-charcoal/10'}`}
          />
          {phoneError && (
            <p className="mt-1.5 text-xs text-red-500 font-inter flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {phoneError}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="relative">
          <label 
            htmlFor="contact-address" 
            className="block font-inter text-sm font-medium text-charcoal mb-1.5"
          >
            Street Address
          </label>
          <div className="relative">
            <input
              ref={addressInputRef}
              type="text"
              id="contact-address"
              name="address"
              required
              autoComplete="off"
              value={formData.address}
              onChange={handleAddressChange}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Start typing your address..."
              className="w-full px-4 py-3 pl-10 bg-white border border-charcoal/10 rounded-xl
                         font-inter text-charcoal placeholder:text-charcoal/40
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         transition-shadow"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            {isLoadingAddress && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage animate-spin" />
            )}
          </div>
          
          {/* Address Suggestions Dropdown */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-20 w-full mt-1 bg-white border border-charcoal/10 rounded-xl 
                         shadow-lg overflow-hidden"
            >
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectAddress(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-sage/5 transition-colors
                             border-b border-charcoal/5 last:border-b-0"
                >
                  <p className="font-inter text-sm text-charcoal truncate">
                    {suggestion.street || suggestion.display.split(',')[0]}
                  </p>
                  <p className="font-inter text-xs text-charcoal/50 truncate">
                    {suggestion.city ? `${suggestion.city}, ${suggestion.state} ${suggestion.zip}` : suggestion.display.split(',').slice(1, 3).join(',')}
                  </p>
                </button>
              ))}
            </div>
          )}
          
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
