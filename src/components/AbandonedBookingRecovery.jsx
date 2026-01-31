import { useState, useEffect } from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';

/**
 * Abandoned Booking Recovery - Shows reminder for users who started but didn't finish
 * Triggers after returning to site with saved progress
 */
const AbandonedBookingRecovery = ({ onResume }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [savedData, setSavedData] = useState(null);

  useEffect(() => {
    // Check for abandoned booking data
    const checkAbandonedBooking = () => {
      const savedQuote = localStorage.getItem('abandonedQuote');
      const savedEmail = localStorage.getItem('capturedEmail');
      const lastVisit = localStorage.getItem('lastBookingAttempt');
      
      if (savedQuote) {
        try {
          const quoteData = JSON.parse(savedQuote);
          const timeSinceAttempt = lastVisit 
            ? Date.now() - parseInt(lastVisit) 
            : Infinity;
          
          // Show if they have saved data and it's been more than 1 hour but less than 7 days
          const oneHour = 60 * 60 * 1000;
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          
          if (timeSinceAttempt > oneHour && timeSinceAttempt < sevenDays) {
            setSavedData({ ...quoteData, email: savedEmail });
            setIsVisible(true);
          }
        } catch (e) {
          console.error('Error parsing abandoned quote:', e);
        }
      }
    };

    // Check after a short delay to not interrupt initial load
    const timer = setTimeout(checkAbandonedBooking, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleResume = () => {
    setIsVisible(false);
    if (onResume) {
      onResume(savedData);
    }
    // Scroll to pricing section
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Clear the abandoned data so we don't show again
    localStorage.removeItem('abandonedQuote');
    localStorage.removeItem('lastBookingAttempt');
  };

  if (!isVisible || !savedData) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-charcoal/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-sage/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sage">
            <Clock className="w-4 h-4" />
            <span className="font-inter text-sm font-semibold">Welcome back!</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-charcoal/40 hover:text-charcoal p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-playfair font-semibold text-charcoal mb-1">
            Your quote is waiting!
          </h3>
          <p className="text-charcoal/60 font-inter text-sm mb-4">
            You were looking at a {savedData.frequency} cleaning for your {savedData.sqft?.toLocaleString()} sq ft home.
          </p>
          
          {/* Saved Quote Display */}
          <div className="bg-sage/5 rounded-lg p-3 mb-4">
            <div className="flex items-baseline justify-between">
              <span className="font-inter text-sm text-charcoal/60">Your price:</span>
              <span className="font-playfair font-semibold text-xl text-sage">
                ${savedData.recurringPrice}/visit
              </span>
            </div>
          </div>
          
          {/* Resume Button */}
          <button
            onClick={handleResume}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            Continue Booking
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full text-center text-charcoal/40 font-inter text-xs mt-3 hover:text-charcoal"
          >
            Start fresh instead
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to save booking progress
 * Call this in the booking flow components
 */
export const saveBookingProgress = (quoteData) => {
  localStorage.setItem('abandonedQuote', JSON.stringify(quoteData));
  localStorage.setItem('lastBookingAttempt', Date.now().toString());
};

/**
 * Helper function to clear saved booking (call on successful completion)
 */
export const clearBookingProgress = () => {
  localStorage.removeItem('abandonedQuote');
  localStorage.removeItem('lastBookingAttempt');
};

export default AbandonedBookingRecovery;
