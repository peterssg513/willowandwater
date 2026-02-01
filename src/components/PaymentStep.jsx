import { useState } from 'react';
import { CreditCard, Shield, CheckCircle, ArrowLeft, Loader2, Calendar, MapPin, Clock, RefreshCw, CreditCard as CardIcon } from 'lucide-react';
import { formatPrice } from '../utils/pricingLogic';
import { supabase } from '../lib/supabaseClient';

const DEPOSIT_PERCENT = 0.20; // 20% deposit

const PaymentStep = ({ bookingData, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState('');

  const { quote, contact, schedule } = bookingData;
  
  // Calculate deposit and remaining amounts
  const totalAmount = quote?.firstCleanPrice || 0;
  const depositAmount = Math.round(totalAmount * DEPOSIT_PERCENT);
  const remainingAmount = totalAmount - depositAmount;

  // Format the scheduled date for display
  const formatScheduledDate = () => {
    if (!schedule?.scheduledDate) return 'Not scheduled';
    const date = new Date(schedule.scheduledDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePayDeposit = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'payment_initiated',
          scheduled_date: schedule?.scheduledDate,
          scheduled_time: schedule?.scheduledTime,
          cal_booking_id: schedule?.calBookingId,
          deposit_amount: depositAmount,
          remaining_amount: remainingAmount,
        })
        .eq('email', contact?.email)
        .eq('status', 'lead')
        .order('created_at', { ascending: false })
        .limit(1);

      // Call Supabase Edge Function to create Stripe Checkout Session
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          totalAmount: totalAmount,
          customerEmail: contact?.email,
          customerName: contact?.name,
          customerPhone: contact?.phone,
          bookingDetails: {
            sqft: quote?.sqft,
            bedrooms: quote?.bedrooms,
            bathrooms: quote?.bathrooms,
            frequency: quote?.frequency,
            address: contact?.address,
            scheduledDate: schedule?.scheduledDate,
          },
          successUrl: `${window.location.origin}?booking=success`,
          cancelUrl: `${window.location.origin}?booking=cancelled`,
        },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        // Check if it's a configuration issue
        if (fnError.message?.includes('non-2xx') || fnError.message?.includes('Edge Function')) {
          throw new Error('Payment system is being configured. Please call us at (630) 267-0096 to complete your booking.');
        }
        throw new Error(fnError.message || 'Failed to create checkout session');
      }

      // Also check if data contains an error
      if (data?.error) {
        console.error('Checkout error:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        if (data.customerId) {
          await supabase
            .from('bookings')
            .update({
              stripe_customer_id: data.customerId,
            })
            .eq('email', contact?.email)
            .order('created_at', { ascending: false })
            .limit(1);
        }
        
        // Save booking data to localStorage so BookingSuccess can update status
        localStorage.setItem('willow_booking_data', JSON.stringify(bookingData));
        
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Payment error:', err);
      // Show user-friendly error but log details
      let userMessage = err.message || 'Failed to initiate payment. Please try again.';
      
      // If it's a generic error, provide contact info
      if (userMessage.includes('non-2xx') || userMessage.includes('Edge Function') || userMessage.includes('Failed to fetch')) {
        userMessage = 'Payment system temporarily unavailable. Please call us at (630) 267-0096 to complete your booking.';
      }
      
      setError(userMessage);
      setIsProcessing(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-sage" />
        </div>
        <h2 className="text-3xl font-playfair font-semibold text-charcoal mb-3">
          Booking Confirmed!
        </h2>
        <p className="text-charcoal/70 font-inter mb-8">
          Thank you, {contact?.name?.split(' ')[0]}! Your organic cleaning is scheduled.
        </p>

        <div className="bg-sage/5 rounded-2xl p-6 text-left mb-8">
          <h3 className="font-inter font-semibold text-charcoal mb-4">Your Appointment</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-sage mt-0.5" />
              <div>
                <p className="font-inter font-medium text-charcoal">{formatScheduledDate()}</p>
                <p className="text-sm text-charcoal/60">{schedule?.scheduledTime || 'Time confirmed via email'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sage mt-0.5" />
              <div>
                <p className="font-inter text-charcoal">{contact?.address}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-charcoal/50 font-inter">
          You'll receive a confirmation email shortly with all the details.
          <br />
          Our team will send a reminder 24 hours before your cleaning.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
          <CreditCard className="w-4 h-4" />
          <span className="font-inter text-xs font-medium">Step 4 of 4</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
          Secure Your Booking
        </h2>
        <p className="text-charcoal/60 font-inter">
          A small deposit holds your spot—the rest is charged on cleaning day
        </p>
      </div>

      {/* How It Works - Payment Timeline */}
      <div className="bg-sage/5 rounded-2xl p-5 mb-6">
        <h3 className="font-inter font-semibold text-charcoal mb-4 text-center">How Payment Works</h3>
        <div className="space-y-4">
          {/* Step 1: Today */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-sage text-bone flex items-center justify-center font-inter font-semibold text-sm">
                1
              </div>
              <div className="w-0.5 h-full bg-sage/30 my-1"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CardIcon className="w-4 h-4 text-sage" />
                <span className="font-inter font-semibold text-charcoal">Today: Pay 20% Deposit</span>
              </div>
              <p className="text-sm text-charcoal/60 font-inter">
                {formatPrice(depositAmount)} secures your appointment slot
              </p>
            </div>
          </div>

          {/* Step 2: Service Day */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-charcoal/10 text-charcoal flex items-center justify-center font-inter font-semibold text-sm">
                2
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-charcoal/50" />
                <span className="font-inter font-semibold text-charcoal">Day of Service: Remaining 80%</span>
              </div>
              <p className="text-sm text-charcoal/60 font-inter">
                {formatPrice(remainingAmount)} automatically charged to your card on file
              </p>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="mt-4 pt-4 border-t border-sage/20">
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
            <p className="text-sm text-charcoal/70 font-inter">
              <span className="font-medium text-charcoal">Full refund guarantee:</span> Cancel or reschedule up to 24 hours before your appointment for a complete deposit refund.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6 mb-6">
        <h3 className="font-inter font-semibold text-charcoal mb-4">Booking Summary</h3>
        
        {/* Service Details */}
        <div className="space-y-3 pb-4 border-b border-charcoal/10">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">Service</span>
            <span className="font-inter text-charcoal">
              {quote?.frequency === 'onetime' ? 'One-Time Deep Clean' : `${quote?.frequency?.charAt(0).toUpperCase() + quote?.frequency?.slice(1)} Cleaning`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">Home Size</span>
            <span className="font-inter text-charcoal">{quote?.sqft?.toLocaleString()} sq ft</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">Rooms</span>
            <span className="font-inter text-charcoal">{quote?.bedrooms} bed, {quote?.bathrooms} bath</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">Date</span>
            <span className="font-inter text-charcoal">{formatScheduledDate()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">Address</span>
            <span className="font-inter text-charcoal text-right max-w-[200px]">{contact?.address}</span>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60 font-inter">First Clean Total</span>
            <span className="font-inter text-charcoal">{formatPrice(totalAmount)}</span>
          </div>
          
          <div className="bg-sage/10 rounded-xl p-4 -mx-2 border border-sage/20">
            <div className="flex justify-between items-center mb-2">
              <span className="font-inter font-semibold text-charcoal">Due Today (20%)</span>
              <span className="font-playfair font-bold text-2xl text-sage">
                {formatPrice(depositAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal/60 font-inter">Due on service day (80%)</span>
              <span className="font-inter text-charcoal">{formatPrice(remainingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm text-charcoal/60">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sage" />
          <span className="font-inter">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-sage" />
          <span className="font-inter">Satisfaction Guaranteed</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter mb-4">
          {error}
        </div>
      )}

      {/* Pay Deposit Button */}
      <button
        onClick={handlePayDeposit}
        disabled={isProcessing}
        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4
                   disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay {formatPrice(depositAmount)} Deposit
          </>
        )}
      </button>

      {/* Reassurance Text */}
      <div className="mt-4 text-center space-y-2">
        <p className="text-sm text-charcoal/60 font-inter">
          Your card will be securely saved for the {formatPrice(remainingAmount)} balance on cleaning day
        </p>
        <p className="text-xs text-sage font-inter font-medium">
          ✓ Free cancellation up to 24 hours before your appointment
        </p>
      </div>

      {/* Back Link */}
      <div className="mt-4 text-center">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal 
                     font-inter text-sm transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to scheduling
        </button>
      </div>

      {/* Fine Print */}
      <p className="mt-6 text-center text-xs text-charcoal/40 font-inter">
        By completing this booking, you agree to our Terms of Service.
        <br />
        Your deposit is fully refundable if cancelled 24+ hours before your appointment.
      </p>
    </div>
  );
};

export default PaymentStep;
