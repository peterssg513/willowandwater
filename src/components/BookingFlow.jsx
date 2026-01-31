import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import StepIndicator from './StepIndicator';
import ContactStep from './ContactStep';
import SchedulingStep from './SchedulingStep';
import PaymentStep from './PaymentStep';
import RecurringStep from './RecurringStep';

/**
 * BookingFlow - Multi-step booking wizard
 * 
 * Flow: Quote (handled by PricingCalculator) → Contact → Schedule → Payment → Recurring
 * 
 * The quote step is handled externally by PricingCalculator.
 * This component manages Contact → Schedule → Payment → Recurring steps.
 */
const BookingFlow = ({ isOpen, onClose, quoteData }) => {
  // Current step: 'contact' | 'schedule' | 'payment' | 'recurring'
  const [currentStep, setCurrentStep] = useState('contact');
  
  // Collected booking data across steps
  const [bookingData, setBookingData] = useState({
    quote: quoteData,
    contact: null,
    schedule: null,
  });

  // Update quote data when it changes from parent
  useState(() => {
    setBookingData((prev) => ({ ...prev, quote: quoteData }));
  }, [quoteData]);

  // Step navigation handlers
  const handleContactComplete = useCallback((contactData) => {
    setBookingData((prev) => ({ ...prev, contact: contactData }));
    setCurrentStep('schedule');
  }, []);

  const handleScheduleComplete = useCallback((scheduleData) => {
    setBookingData((prev) => ({ ...prev, schedule: scheduleData }));
    setCurrentStep('payment');
  }, []);

  const handlePaymentComplete = useCallback(() => {
    // Move to recurring step after payment
    setCurrentStep('recurring');
  }, []);

  const handleRecurringComplete = useCallback(() => {
    // Booking complete - redirect to success page
    console.log('Booking complete:', bookingData);
    window.location.href = '/?booking=success';
  }, [bookingData]);

  const handleBack = useCallback(() => {
    if (currentStep === 'schedule') {
      setCurrentStep('contact');
    } else if (currentStep === 'payment') {
      setCurrentStep('schedule');
    } else if (currentStep === 'recurring') {
      setCurrentStep('payment');
    }
  }, [currentStep]);

  const handleClose = () => {
    // Reset state on close
    setCurrentStep('contact');
    setBookingData({
      quote: quoteData,
      contact: null,
      schedule: null,
    });
    onClose();
  };

  // Map internal steps to step indicator (which shows all 5 including quote)
  const getIndicatorStep = () => {
    switch (currentStep) {
      case 'contact': return 'contact';
      case 'schedule': return 'schedule';
      case 'payment': return 'payment';
      case 'recurring': return 'recurring';
      default: return 'contact';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative bg-bone rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] 
                   overflow-y-auto mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-flow-title"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 text-charcoal/50 hover:text-charcoal 
                     hover:bg-charcoal/5 rounded-full transition-colors"
          aria-label="Close booking"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 md:p-10">
          {/* Step Indicator */}
          <StepIndicator currentStep={getIndicatorStep()} />

          {/* Step Content */}
          <div className="mt-6">
            {currentStep === 'contact' && (
              <ContactStep
                bookingData={bookingData}
                onComplete={handleContactComplete}
                onClose={handleClose}
              />
            )}

            {currentStep === 'schedule' && (
              <SchedulingStep
                bookingData={bookingData}
                onBack={handleBack}
                onScheduled={handleScheduleComplete}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentStep
                bookingData={bookingData}
                onBack={handleBack}
                onComplete={handlePaymentComplete}
              />
            )}

            {currentStep === 'recurring' && (
              <RecurringStep
                bookingData={bookingData}
                onBack={handleBack}
                onComplete={handleRecurringComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
