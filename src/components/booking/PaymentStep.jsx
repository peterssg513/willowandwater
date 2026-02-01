import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, CreditCard, Shield, AlertTriangle, Heart, RefreshCw } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabaseClient';
import { formatPrice, formatFrequency, formatTimeSlot, DEPOSIT_PERCENTAGE } from '../../utils/pricingLogic';
import { formatDate, formatDateForDB } from '../../utils/scheduling';

// Initialize Stripe - check for key first
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

/**
 * PaymentStep - Deposit payment + save card
 */
const PaymentStep = ({ data, onBack, onComplete }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Calculate amounts
  const pricing = data.pricing;
  const firstCleanTotal = pricing?.firstCleanTotal || 0;
  const referralDiscount = data.referralDiscount || 0;
  const totalAfterDiscount = Math.max(0, firstCleanTotal - referralDiscount);
  const depositAmount = Math.round(totalAfterDiscount * DEPOSIT_PERCENTAGE);
  const remainingAmount = totalAfterDiscount - depositAmount;

  // Check for Stripe configuration
  useEffect(() => {
    if (!stripePublishableKey) {
      setError('Payment system is not configured. Please contact support.');
      setLoading(false);
    }
  }, []);

  // Create payment intent
  const createPaymentIntent = useCallback(async () => {
    if (!stripePublishableKey) return;
    
    setLoading(true);
    setError(null);

    try {
      // Validate required data
      if (!data.customerId) {
        throw new Error('Customer information is missing. Please go back and try again.');
      }
      
      if (depositAmount <= 0) {
        throw new Error('Invalid deposit amount. Please go back and try again.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Server configuration error. Please contact support.');
      }

      // Call our edge function to create payment intent
      const response = await fetch(`${supabaseUrl}/functions/v1/create-booking-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          customerId: data.customerId,
          amount: depositAmount + tipAmount,
          tipAmount,
          metadata: {
            customer_id: data.customerId,
            job_type: 'first_clean',
            payment_type: 'deposit',
          }
        }),
      });

      // Parse response
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create payment intent';
        console.error('Payment intent error:', responseData);
        throw new Error(errorMessage);
      }

      const { clientSecret: secret, stripeCustomerId } = responseData;

      // Validate clientSecret format
      if (!secret || typeof secret !== 'string' || !secret.includes('_secret_')) {
        console.error('Invalid clientSecret received:', secret);
        throw new Error('Invalid payment configuration received from server.');
      }

      setClientSecret(secret);
      
      // Update customer with Stripe ID if needed
      if (stripeCustomerId && !data.customer?.stripe_customer_id) {
        await supabase
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', data.customerId);
      }
    } catch (err) {
      console.error('Payment setup error:', err);
      setError(err.message || 'Failed to set up payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [data.customerId, data.customer?.stripe_customer_id, depositAmount, tipAmount]);

  // Create payment intent on mount and when tip changes
  useEffect(() => {
    if (data.customerId && depositAmount > 0 && stripePublishableKey) {
      createPaymentIntent();
    }
  }, [data.customerId, depositAmount, tipAmount, retryCount, createPaymentIntent]);

  // Retry handler
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Tip options
  const tipOptions = [0, 5, 10, 20];

  // Configuration error state
  if (!stripePublishableKey) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h4 className="font-inter font-semibold text-red-800 mb-2">Payment Not Available</h4>
          <p className="text-red-700 font-inter text-sm">
            The payment system is not configured. Please contact support or try again later.
          </p>
        </div>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 
                     border border-charcoal/20 rounded-xl font-inter font-medium 
                     text-charcoal hover:bg-charcoal/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sage mb-4" />
        <p className="text-charcoal/60 font-inter">Setting up secure payment...</p>
      </div>
    );
  }

  // Error state with retry
  if (error && !clientSecret) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h4 className="font-inter font-semibold text-red-800 mb-2">Payment Setup Failed</h4>
          <p className="text-red-700 font-inter text-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 
                       text-red-800 rounded-lg font-inter text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 
                     border border-charcoal/20 rounded-xl font-inter font-medium 
                     text-charcoal hover:bg-charcoal/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-playfair font-semibold text-charcoal mb-2">
          Complete Your Booking
        </h3>
        <p className="text-charcoal/60 font-inter">
          Pay your deposit to secure your cleaning
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
        <h4 className="font-inter font-semibold text-charcoal mb-4">Order Summary</h4>
        
        {/* Appointment Details */}
        <div className="bg-sage/5 rounded-xl p-4 mb-4">
          <p className="font-inter font-medium text-charcoal">
            {formatDate(data.selectedDate)}
          </p>
          <p className="text-sm text-charcoal/60">
            {formatTimeSlot(data.selectedTime)}
          </p>
          {data.frequency !== 'onetime' && (
            <p className="text-sm text-sage mt-1">
              {formatFrequency(data.frequency)} service starting after first clean
            </p>
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/70">First Deep Clean ({data.sqft?.toLocaleString()} sqft)</span>
            <span className="text-charcoal">{formatPrice(pricing?.firstCleanPrice)}</span>
          </div>
          
          {data.addons?.length > 0 && data.addons.map((addon, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-charcoal/70">+ {addon.name}</span>
              <span className="text-charcoal">{formatPrice(addon.price)}</span>
            </div>
          ))}
          
          {referralDiscount > 0 && (
            <div className="flex justify-between text-sm text-sage">
              <span>Referral Discount</span>
              <span>-{formatPrice(referralDiscount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-charcoal/10 pt-4 space-y-2">
          <div className="flex justify-between font-medium">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">{formatPrice(totalAfterDiscount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/70">Due today (20% deposit)</span>
            <span className="text-sage font-semibold">{formatPrice(depositAmount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/70">Due on {formatDate(data.selectedDate)}</span>
            <span className="text-charcoal">{formatPrice(remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Tip Selection */}
      <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-500" />
          <h4 className="font-inter font-semibold text-charcoal">Add a Tip (Optional)</h4>
        </div>
        <p className="text-sm text-charcoal/60 mb-4">
          100% of tips go directly to your cleaner
        </p>
        <div className="flex gap-3">
          {tipOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setTipAmount(amount)}
              className={`
                flex-1 py-3 rounded-xl border-2 font-inter font-medium transition-all
                ${tipAmount === amount
                  ? 'border-sage bg-sage/10 text-charcoal'
                  : 'border-charcoal/10 hover:border-sage/50 text-charcoal/70'
                }
              `}
            >
              {amount === 0 ? 'No tip' : `$${amount}`}
            </button>
          ))}
        </div>
        {tipAmount > 0 && (
          <p className="text-sm text-sage mt-3 text-center">
            Thank you! Tip of {formatPrice(tipAmount)} will be added to your deposit.
          </p>
        )}
      </div>

      {/* Payment Form */}
      {clientSecret && stripePromise && (
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#71797E',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
            },
          }}
        >
          <PaymentForm
            data={data}
            depositAmount={depositAmount}
            tipAmount={tipAmount}
            remainingAmount={remainingAmount}
            totalAfterDiscount={totalAfterDiscount}
            onBack={onBack}
            onComplete={onComplete}
            onRetry={handleRetry}
          />
        </Elements>
      )}

      {/* Cancellation Policy */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h5 className="font-inter font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Cancellation Policy
        </h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Free cancellation 48+ hours before your appointment</li>
          <li>• $25 fee for cancellations 24-48 hours before</li>
          <li>• Full charge for same-day cancellations or no-shows</li>
        </ul>
      </div>
    </div>
  );
};

// Payment Form Component (uses Stripe hooks)
const PaymentForm = ({ data, depositAmount, tipAmount, remainingAmount, totalAfterDiscount, onBack, onComplete, onRetry }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [paymentElementError, setPaymentElementError] = useState(null);

  // Handle PaymentElement load error
  const handleLoadError = (event) => {
    console.error('PaymentElement load error:', event);
    setPaymentElementError('Unable to load payment form. Please check your connection and try again.');
  };

  // Handle PaymentElement ready
  const handleReady = () => {
    setPaymentElementReady(true);
    setPaymentElementError(null);
  };

  // Handle PaymentElement change (validation errors)
  const handleChange = (event) => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !agreedToPolicy || !paymentElementReady) {
      if (!paymentElementReady) {
        setError('Payment form is still loading. Please wait a moment.');
      }
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      // Validate the payment element before submission
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?booking=success`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        // Map common error codes to user-friendly messages
        const errorMessages = {
          'card_declined': 'Your card was declined. Please try a different card.',
          'expired_card': 'Your card has expired. Please use a different card.',
          'incorrect_cvc': 'The security code is incorrect. Please check and try again.',
          'processing_error': 'An error occurred while processing your card. Please try again.',
          'incorrect_number': 'The card number is incorrect. Please check and try again.',
          'invalid_expiry_month': 'The expiration month is invalid.',
          'invalid_expiry_year': 'The expiration year is invalid.',
          'insufficient_funds': 'Insufficient funds. Please try a different card.',
        };
        
        const friendlyMessage = errorMessages[paymentError.code] || paymentError.message;
        throw new Error(friendlyMessage);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create the job and subscription in database
        await createBookingRecords(paymentIntent);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure or additional action required - Stripe handles this
        setError('Additional verification required. Please complete the authentication.');
      } else {
        throw new Error('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create booking records after successful payment
  const createBookingRecords = async (paymentIntent) => {
    try {
      const jobData = {
        customer_id: data.customerId,
        scheduled_date: formatDateForDB(data.selectedDate),
        scheduled_time: data.selectedTime,
        duration_minutes: data.pricing.firstCleanDuration,
        job_type: 'first_clean',
        base_price: data.pricing.firstCleanPrice,
        addons_price: data.pricing.addonsPrice,
        total_price: data.pricing.firstCleanTotal,
        discount_amount: data.referralDiscount || 0,
        final_price: totalAfterDiscount,
        deposit_amount: depositAmount,
        deposit_paid_at: new Date().toISOString(),
        deposit_payment_intent_id: paymentIntent.id,
        remaining_amount: remainingAmount,
        tip_amount: tipAmount,
        status: 'scheduled',
        payment_status: 'deposit_paid',
      };

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (jobError) {
        console.error('Job creation error:', jobError);
        throw new Error('Payment succeeded but booking creation failed. Please contact support with payment ID: ' + paymentIntent.id);
      }

      // Create job addons
      if (data.addons?.length > 0) {
        const addonInserts = data.addons.map(addon => ({
          job_id: job.id,
          addon_service_id: addon.id,
          name: addon.name,
          price: addon.price,
        }));
        
        const { error: addonsError } = await supabase.from('job_addons').insert(addonInserts);
        if (addonsError) {
          console.error('Addons creation error:', addonsError);
          // Non-critical, continue
        }
      }

      // Create subscription if recurring
      let subscriptionId = null;
      if (data.frequency !== 'onetime') {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: data.customerId,
            frequency: data.frequency,
            preferred_day: data.preferredDay,
            preferred_time: data.preferredTime,
            base_price: data.pricing.recurringPrice,
            status: 'pending',
          })
          .select()
          .single();

        if (!subError && subscription) {
          subscriptionId = subscription.id;
          await supabase
            .from('jobs')
            .update({ subscription_id: subscription.id })
            .eq('id', job.id);
        }
      }

      // Create payment record
      await supabase.from('payments').insert({
        customer_id: data.customerId,
        job_id: job.id,
        amount: depositAmount + tipAmount,
        payment_type: 'deposit',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'succeeded',
      });

      // Update customer status to active
      await supabase
        .from('customers')
        .update({ status: 'active' })
        .eq('id', data.customerId);

      // Handle referral if applicable
      if (data.referralCode) {
        const { data: referrer } = await supabase
          .from('customers')
          .select('id')
          .eq('referral_code', data.referralCode)
          .single();

        if (referrer) {
          await supabase.from('referrals').insert({
            referrer_customer_id: referrer.id,
            referred_customer_id: data.customerId,
            referral_code_used: data.referralCode,
            status: 'completed',
          });
        }
      }

      // Log activity
      await supabase.from('activity_log').insert({
        entity_type: 'job',
        entity_id: job.id,
        action: 'booked',
        actor_type: 'customer',
        actor_id: data.customerId,
        details: {
          deposit_amount: depositAmount,
          tip_amount: tipAmount,
          payment_intent_id: paymentIntent.id,
        }
      });

      // Complete the step
      onComplete({
        jobId: job.id,
        subscriptionId,
        paymentIntentId: paymentIntent.id,
        depositPaid: true,
      });
    } catch (err) {
      throw err;
    }
  };

  // If payment element failed to load, show retry option
  if (paymentElementError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="font-inter font-semibold text-red-800">Payment Form Error</h4>
          </div>
          <p className="text-sm text-red-700 mb-4">{paymentElementError}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 
                       text-red-800 rounded-lg font-inter text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-charcoal/20 rounded-xl
                     font-inter font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-sage" />
          <h4 className="font-inter font-semibold text-charcoal">Payment Details</h4>
        </div>
        
        <div className="min-h-[200px]">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
            onReady={handleReady}
            onLoadError={handleLoadError}
            onChange={handleChange}
          />
        </div>

        {/* Loading indicator for payment element */}
        {!paymentElementReady && !paymentElementError && (
          <div className="flex items-center justify-center py-4 text-charcoal/50">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading payment form...</span>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-2 mt-4 text-xs text-charcoal/50">
          <Shield className="w-4 h-4" />
          <span>Your payment info is encrypted and secure</span>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToPolicy}
          onChange={(e) => setAgreedToPolicy(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-charcoal/20 text-sage 
                     focus:ring-sage focus:ring-offset-0"
        />
        <span className="text-sm text-charcoal/70">
          I agree to the cancellation policy and understand that my card will be saved 
          for the remaining balance due on the day of my cleaning.
        </span>
      </label>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 rounded-xl
                     font-inter font-medium text-charcoal hover:bg-charcoal/5
                     transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !agreedToPolicy || !paymentElementReady}
          className="flex-1 btn-primary flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : !paymentElementReady ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Pay {formatPrice(depositAmount + tipAmount)} Deposit
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentStep;
