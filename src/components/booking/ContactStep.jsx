import { useState } from 'react';
import { ArrowLeft, Loader2, Tag, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Fox Valley service area cities
const SERVICE_AREAS = [
  'St. Charles', 'Geneva', 'Batavia', 'Wayne', 'Campton Hills', 'Elburn',
  'South Elgin', 'North Aurora', 'Sugar Grove', 'Lily Lake'
];

// Access type options
const ACCESS_TYPES = [
  { id: 'lockbox', label: 'Lockbox', placeholder: 'Enter lockbox code' },
  { id: 'garage_code', label: 'Garage Code', placeholder: 'Enter garage code' },
  { id: 'hidden_key', label: 'Hidden Key', placeholder: 'Describe key location' },
  { id: 'customer_home', label: "I'll Be Home", placeholder: null },
  { id: 'other', label: 'Other', placeholder: 'Describe access method' },
];

/**
 * ContactStep - Customer info + access instructions
 */
const ContactStep = ({ data, onBack, onComplete }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: data.customer?.name || '',
    email: data.customer?.email || '',
    phone: data.customer?.phone || '',
    address: data.customer?.address || '',
    city: data.customer?.city || '',
    zip: data.customer?.zip || '',
    accessType: data.customer?.access_type || '',
    accessInstructions: data.customer?.access_instructions || '',
    smsConsent: data.customer?.sms_consent || false,
  });
  
  // Referral code
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [referralDiscount, setReferralDiscount] = useState(0);
  
  // Form state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Detect service area from city
  const detectServiceArea = (city) => {
    const normalizedCity = city.toLowerCase().trim();
    const match = SERVICE_AREAS.find(area => 
      normalizedCity.includes(area.toLowerCase()) ||
      area.toLowerCase().includes(normalizedCity)
    );
    return match || 'Fox Valley';
  };

  // Validate referral code
  const validateReferralCode = async () => {
    if (!referralCode.trim()) return;
    
    setReferralStatus('checking');
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, referral_code')
        .eq('referral_code', referralCode.toUpperCase())
        .single();
      
      if (error || !customer) {
        setReferralStatus('invalid');
        setReferralDiscount(0);
      } else {
        setReferralStatus('valid');
        setReferralDiscount(25); // $25 off
      }
    } catch (err) {
      setReferralStatus('invalid');
      setReferralDiscount(0);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.accessType) {
      newErrors.accessType = 'Please select how we can access your home';
    }
    
    if (!formData.smsConsent) {
      newErrors.smsConsent = 'Please agree to receive text messages to continue';
    }
    
    // Require access instructions for certain types
    if (['lockbox', 'garage_code', 'hidden_key', 'other'].includes(formData.accessType)) {
      if (!formData.accessInstructions.trim()) {
        newErrors.accessInstructions = 'Please provide access details';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const serviceArea = detectServiceArea(formData.city);
      
      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .single();
      
      let customerId;
      let customer;
      
      if (existingCustomer) {
        // Update existing customer
        const { data: updated, error } = await supabase
          .from('customers')
          .update({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            zip: formData.zip.trim(),
            service_area: serviceArea,
            sqft: data.sqft,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            access_type: formData.accessType,
            access_instructions: formData.accessInstructions.trim() || null,
            sms_consent: formData.smsConsent,
            sms_consent_at: formData.smsConsent ? new Date().toISOString() : null,
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();
        
        if (error) throw error;
        customerId = existingCustomer.id;
        customer = updated;
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            zip: formData.zip.trim(),
            service_area: serviceArea,
            sqft: data.sqft,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            access_type: formData.accessType,
            access_instructions: formData.accessInstructions.trim() || null,
            status: 'prospect',
            referred_by_customer_id: referralStatus === 'valid' ? undefined : null,
            sms_consent: formData.smsConsent,
            sms_consent_at: formData.smsConsent ? new Date().toISOString() : null,
          })
          .select()
          .single();
        
        if (error) throw error;
        customerId = newCustomer.id;
        customer = newCustomer;
      }
      
      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: customerId,
        action: existingCustomer ? 'booking_started' : 'created',
        actor_type: 'customer',
        actor_id: customerId,
        details: { step: 'contact_info', source: 'booking_flow' }
      });
      
      // Complete step
      onComplete({
        customer,
        customerId,
        referralCode: referralStatus === 'valid' ? referralCode.toUpperCase() : null,
        referralDiscount,
      });
      
    } catch (err) {
      console.error('Error saving customer:', err);
      setSubmitError(err.message || 'Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get placeholder for access instructions
  const accessPlaceholder = ACCESS_TYPES.find(t => t.id === formData.accessType)?.placeholder;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-playfair font-semibold text-charcoal mb-2">
          Your Information
        </h3>
        <p className="text-charcoal/60 font-inter">
          Tell us about yourself and how we can access your home
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-inter font-medium text-charcoal">Contact Details</h4>
        
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                       ${errors.name ? 'border-red-400' : 'border-charcoal/10'}`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         ${errors.email ? 'border-red-400' : 'border-charcoal/10'}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(630) 555-1234"
              className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         ${errors.phone ? 'border-red-400' : 'border-charcoal/10'}`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* SMS Consent */}
        <div className={`p-4 rounded-xl border-2 transition-colors ${
          formData.smsConsent ? 'border-sage bg-sage/5' : errors.smsConsent ? 'border-red-300 bg-red-50/50' : 'border-charcoal/10 bg-charcoal/5'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.smsConsent}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, smsConsent: e.target.checked }));
                if (errors.smsConsent) {
                  setErrors(prev => ({ ...prev, smsConsent: null }));
                }
              }}
              className="mt-1 w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage cursor-pointer"
            />
            <div className="flex-1">
              <span className="font-inter text-sm font-medium text-charcoal">
                I agree to receive text messages from Willow & Water
              </span>
              <p className="mt-1 text-xs text-charcoal/60 leading-relaxed">
                By checking this box, you consent to receive automated appointment reminders, 
                booking confirmations, and service updates via SMS to the phone number provided. 
                Message frequency varies. Message and data rates may apply. 
                Reply STOP to unsubscribe or HELP for assistance.
              </p>
            </div>
          </label>
          {errors.smsConsent && (
            <p className="mt-2 text-sm text-red-600 ml-8">{errors.smsConsent}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-charcoal mb-1.5">
            Street Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main Street"
            className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                       ${errors.address ? 'border-red-400' : 'border-charcoal/10'}`}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        {/* City & Zip */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-charcoal mb-1.5">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="St. Charles"
              className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         ${errors.city ? 'border-red-400' : 'border-charcoal/10'}`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-charcoal mb-1.5">
              ZIP Code
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="60174"
              className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>
        </div>
        
        <p className="text-xs text-charcoal/50 font-inter">
          We serve St. Charles, Geneva, Batavia, Wayne, Campton Hills, Elburn & surrounding areas
        </p>
      </div>

      {/* Access Instructions */}
      <div className="space-y-4 pt-4 border-t border-charcoal/10">
        <h4 className="font-inter font-medium text-charcoal">
          🔑 How Will Our Cleaner Access Your Home?
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACCESS_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                accessType: type.id,
                accessInstructions: type.id === 'customer_home' ? '' : prev.accessInstructions
              }))}
              className={`p-3 rounded-xl border-2 text-left transition-all
                ${formData.accessType === type.id
                  ? 'border-sage bg-sage/10'
                  : 'border-charcoal/10 hover:border-sage/50'
                }`}
            >
              <span className="font-inter text-sm font-medium text-charcoal">
                {type.label}
              </span>
            </button>
          ))}
        </div>
        {errors.accessType && (
          <p className="text-sm text-red-600">{errors.accessType}</p>
        )}

        {/* Access Instructions Input */}
        {accessPlaceholder && (
          <div>
            <label htmlFor="accessInstructions" className="block text-sm font-medium text-charcoal mb-1.5">
              Access Details
            </label>
            <input
              type="text"
              id="accessInstructions"
              name="accessInstructions"
              value={formData.accessInstructions}
              onChange={handleChange}
              placeholder={accessPlaceholder}
              className={`w-full px-4 py-3 bg-white border rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                         ${errors.accessInstructions ? 'border-red-400' : 'border-charcoal/10'}`}
            />
            {errors.accessInstructions && (
              <p className="mt-1 text-sm text-red-600">{errors.accessInstructions}</p>
            )}
            <p className="mt-1.5 text-xs text-charcoal/50">
              This information is kept secure and only shared with your assigned cleaner
            </p>
          </div>
        )}
      </div>

      {/* Referral Code */}
      <div className="space-y-3 pt-4 border-t border-charcoal/10">
        <label className="block font-inter font-medium text-charcoal">
          <Tag className="w-4 h-4 inline mr-2" />
          Have a Referral Code?
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
              setReferralStatus(null);
            }}
            placeholder="Enter code"
            className="flex-1 px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                       focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                       uppercase"
          />
          <button
            type="button"
            onClick={validateReferralCode}
            disabled={!referralCode.trim() || referralStatus === 'checking'}
            className="px-6 py-3 bg-charcoal/5 hover:bg-charcoal/10 rounded-xl
                       font-inter font-medium text-charcoal disabled:opacity-50
                       transition-colors"
          >
            {referralStatus === 'checking' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Apply'
            )}
          </button>
        </div>
        
        {referralStatus === 'valid' && (
          <div className="flex items-center gap-2 text-sage">
            <Check className="w-4 h-4" />
            <span className="text-sm font-inter">$25 discount applied!</span>
          </div>
        )}
        
        {referralStatus === 'invalid' && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-inter">Invalid referral code</span>
          </div>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter">
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 rounded-xl
                     font-inter font-medium text-charcoal hover:bg-charcoal/5
                     transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 btn-primary flex items-center justify-center gap-2
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue to Scheduling'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactStep;
