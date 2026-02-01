import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import QuoteStep from './QuoteStep';
import ContactStep from './ContactStep';
import ScheduleStep from './ScheduleStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';
import BookingProgress from './BookingProgress';

/**
 * BookingFlow - Complete booking wizard
 * 
 * Steps:
 * 1. Quote (pricing calculator with add-ons)
 * 2. Contact (customer info + access instructions)
 * 3. Schedule (date/time selection)
 * 4. Payment (deposit + save card)
 * 5. Confirmation (success + referral)
 */
const BookingFlow = ({ isOpen, onClose, initialData }) => {
  // Current step
  const [currentStep, setCurrentStep] = useState('quote');
  
  // Accumulated booking data
  const [bookingData, setBookingData] = useState({
    // Quote data
    sqft: initialData?.sqft || 2400,
    bedrooms: initialData?.bedrooms || 4,
    bathrooms: initialData?.bathrooms || 2.5,
    frequency: initialData?.frequency || 'biweekly',
    addons: [],
    pricing: null,
    
    // Contact data
    customer: null,
    
    // Schedule data
    selectedDate: null,
    selectedTime: null,
    preferredDay: null,
    preferredTime: null,
    
    // Payment data
    depositPaid: false,
    stripeCustomerId: null,
    paymentIntentId: null,
    
    // IDs
    customerId: null,
    subscriptionId: null,
    jobId: null,
    
    // Referral
    referralCode: null,
    referralDiscount: 0,
  });

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('quote');
      setBookingData(prev => ({
        ...prev,
        sqft: initialData?.sqft || prev.sqft,
        bedrooms: initialData?.bedrooms || prev.bedrooms,
        bathrooms: initialData?.bathrooms || prev.bathrooms,
        frequency: initialData?.frequency || prev.frequency,
      }));
    }
  }, [isOpen, initialData]);

  // Step handlers
  const handleQuoteComplete = useCallback((quoteData) => {
    setBookingData(prev => ({ ...prev, ...quoteData }));
    setCurrentStep('contact');
  }, []);

  const handleContactComplete = useCallback((contactData) => {
    setBookingData(prev => ({ ...prev, ...contactData }));
    setCurrentStep('schedule');
  }, []);

  const handleScheduleComplete = useCallback((scheduleData) => {
    setBookingData(prev => ({ ...prev, ...scheduleData }));
    setCurrentStep('payment');
  }, []);

  const handlePaymentComplete = useCallback((paymentData) => {
    setBookingData(prev => ({ ...prev, ...paymentData, depositPaid: true }));
    setCurrentStep('confirmation');
  }, []);

  const handleBack = useCallback(() => {
    const stepOrder = ['quote', 'contact', 'schedule', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    if (currentStep === 'confirmation') {
      // Full reset on close after confirmation
      setCurrentStep('quote');
      setBookingData({
        sqft: 2400,
        bedrooms: 4,
        bathrooms: 2.5,
        frequency: 'biweekly',
        addons: [],
        pricing: null,
        customer: null,
        selectedDate: null,
        selectedTime: null,
        preferredDay: null,
        preferredTime: null,
        depositPaid: false,
        stripeCustomerId: null,
        paymentIntentId: null,
        customerId: null,
        subscriptionId: null,
        jobId: null,
        referralCode: null,
        referralDiscount: 0,
      });
    }
    onClose();
  }, [currentStep, onClose]);

  if (!isOpen) return null;

  // Step titles for progress indicator
  const steps = [
    { id: 'quote', label: 'Quote' },
    { id: 'contact', label: 'Contact' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={currentStep !== 'confirmation' ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative bg-bone rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] 
                   overflow-hidden mx-4 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-flow-title"
      >
        {/* Header */}
        {currentStep !== 'confirmation' && (
          <div className="flex-shrink-0 border-b border-charcoal/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 
                id="booking-flow-title"
                className="font-playfair text-xl font-semibold text-charcoal"
              >
                Book Your Cleaning
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-charcoal/50 hover:text-charcoal 
                           hover:bg-charcoal/5 rounded-full transition-colors"
                aria-label="Close booking"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Indicator */}
            <div className="mt-4">
              <BookingProgress steps={steps} currentStep={currentStep} />
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8">
            {currentStep === 'quote' && (
              <QuoteStep
                data={bookingData}
                onComplete={handleQuoteComplete}
                onClose={handleClose}
              />
            )}

            {currentStep === 'contact' && (
              <ContactStep
                data={bookingData}
                onBack={handleBack}
                onComplete={handleContactComplete}
              />
            )}

            {currentStep === 'schedule' && (
              <ScheduleStep
                data={bookingData}
                onBack={handleBack}
                onComplete={handleScheduleComplete}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentStep
                data={bookingData}
                onBack={handleBack}
                onComplete={handlePaymentComplete}
              />
            )}

            {currentStep === 'confirmation' && (
              <ConfirmationStep
                data={bookingData}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
