import { useState } from 'react';
import { CalendarCheck, CheckCircle, ArrowLeft, Phone, Heart } from 'lucide-react';
import { formatPrice } from '../utils/pricingLogic';

const RecurringStep = ({ bookingData, onBack, onComplete }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const recurringPlans = [
    { id: 'weekly', label: 'Weekly', description: 'Every week', savings: 'Best value - 35% off' },
    { id: 'biweekly', label: 'Bi-Weekly', description: 'Every 2 weeks', savings: 'Most popular - 25% off' },
    { id: 'monthly', label: 'Monthly', description: 'Once a month', savings: '10% off' },
  ];

  // Get the recurring price based on selection
  const getRecurringPrice = () => {
    if (!selectedPlan || !bookingData.quote) return null;
    // The quote already has the recurring price calculated
    return bookingData.quote.recurringPrice;
  };

  const handleSetupPlan = () => {
    if (selectedPlan) {
      setIsSubmitted(true);
      // In production, this would call an API to save the recurring preference
      console.log('Recurring plan requested:', selectedPlan, 'for booking:', bookingData);
    }
  };

  const handleSkip = () => {
    // Navigate to success page without recurring
    window.location.href = '/?booking=success';
  };

  const handleFinish = () => {
    // Navigate to success page
    window.location.href = '/?booking=success';
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-sage" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-4">
          Recurring Cleaning Requested!
        </h2>
        
        <div className="bg-sage/10 rounded-xl p-6 max-w-md mx-auto mb-6">
          <p className="text-charcoal/80 font-inter mb-4">
            A member of our team will get in touch in the next <strong>24-48 hours</strong> to 
            set up your recurring cleaning schedule.
          </p>
          <div className="bg-white rounded-lg p-4 border border-sage/20">
            <p className="text-sm text-charcoal/60 font-inter mb-1">Your locked-in rate:</p>
            <p className="text-3xl font-playfair font-semibold text-sage">
              {formatPrice(getRecurringPrice())}
              <span className="text-base text-charcoal/60 font-inter">/visit</span>
            </p>
            <p className="text-xs text-charcoal/50 font-inter mt-1">
              {recurringPlans.find(p => p.id === selectedPlan)?.label} cleaning
            </p>
          </div>
        </div>

        <p className="text-charcoal/60 font-inter text-sm mb-6 max-w-md mx-auto">
          We'll confirm the best day and time that works for your schedule. 
          No contracts—cancel or pause anytime.
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleFinish}
            className="btn-primary px-8"
          >
            View Booking Details
          </button>
          
          <div className="flex items-center gap-2 text-charcoal/50">
            <Phone className="w-4 h-4" />
            <span className="font-inter text-sm">Questions? Call (630) 267-0096</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-charcoal/10">
          <div className="inline-flex items-center gap-2 text-sage">
            <Heart className="w-4 h-4" />
            <span className="font-inter font-medium text-sm">Thank you for choosing Willow & Water</span>
            <Heart className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarCheck className="w-8 h-8 text-sage" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
          Set Up Recurring Cleanings
        </h2>
        <p className="text-charcoal/70 font-inter">
          Love your first clean? Lock in your rate and save on every visit.
        </p>
      </div>

      {/* Plan Selection */}
      <div className="max-w-md mx-auto">
        <div className="space-y-3 mb-6">
          {recurringPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all
                ${selectedPlan === plan.id 
                  ? 'border-sage bg-sage/5' 
                  : 'border-charcoal/10 bg-white hover:border-sage/30'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-inter font-semibold text-charcoal">{plan.label}</span>
                  <span className="text-charcoal/50 font-inter text-sm ml-2">{plan.description}</span>
                </div>
                <span className="text-sage font-inter text-sm font-medium">{plan.savings}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Price Preview */}
        {selectedPlan && (
          <div className="bg-sage/5 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-charcoal/60 font-inter mb-1">Your {recurringPlans.find(p => p.id === selectedPlan)?.label.toLowerCase()} rate:</p>
            <p className="text-2xl font-playfair font-semibold text-charcoal">
              {formatPrice(bookingData.quote?.recurringPrice || 0)}
              <span className="text-sm text-charcoal/60 font-inter">/visit</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSetupPlan}
            disabled={!selectedPlan}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Up {selectedPlan ? recurringPlans.find(p => p.id === selectedPlan)?.label : ''} Cleaning
          </button>
          
          <button
            onClick={handleSkip}
            className="w-full py-3 text-charcoal/60 font-inter text-sm hover:text-charcoal transition-colors"
          >
            Skip for now — I'll decide after my first clean
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t border-charcoal/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-charcoal/60 hover:text-charcoal 
                       font-inter text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to payment
          </button>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-charcoal/50 font-inter mt-4">
          No contracts required • Cancel or pause anytime
        </p>
      </div>
    </div>
  );
};

export default RecurringStep;
