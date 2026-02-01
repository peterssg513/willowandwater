import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CreditCard, Shield, AlertTriangle, Heart } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabaseClient';
import { formatPrice, formatFrequency, formatTimeSlot, DEPOSIT_PERCENTAGE } from '../../utils/pricingLogic';
import { formatDate } from '../../utils/scheduling';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * PaymentStep - Deposit payment + save card
 */
const PaymentStep = ({ data, onBack, onComplete }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [setupIntentSecret, setSetupIntentSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);

  // Calculate amounts
  const pricing = data.pricing;
  const firstCleanTotal = pricing?.firstCleanTotal || 0;
  const referralDiscount = data.referralDiscount || 0;
  const totalAfterDiscount = Math.max(0, firstCleanTotal - referralDiscount);
  const depositAmount = Math.round(totalAfterDiscount * DEPOSIT_PERCENTAGE);
  const remainingAmount = totalAfterDiscount - depositAmount;

  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call our edge function to create payment intent
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret: secret, stripeCustomerId } = await response.json();
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
        setError('Failed to set up payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (data.customerId && depositAmount > 0) {
      createPaymentIntent();
    }
  }, [data.customerId, depositAmount, tipAmount]);

  // Tip options
  const tipOptions = [0, 5, 10, 20];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sage mb-4" />
        <p className="text-charcoal/60 font-inter">Setting up secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-inter">{error}</p>
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
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            data={data}
            depositAmount={depositAmount}
            tipAmount={tipAmount}
            remainingAmount={remainingAmount}
            totalAfterDiscount={totalAfterDiscount}
            onBack={onBack}
            onComplete={onComplete}
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
const PaymentForm = ({ data, depositAmount, tipAmount, remainingAmount, totalAfterDiscount, onBack, onComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !agreedToPolicy) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?booking=success`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create the job and subscription in database
        const jobData = {
          customer_id: data.customerId,
          scheduled_date: data.selectedDate.toISOString().split('T')[0],
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

        if (jobError) throw jobError;

        // Create job addons
        if (data.addons?.length > 0) {
          const addonInserts = data.addons.map(addon => ({
            job_id: job.id,
            addon_service_id: addon.id,
            name: addon.name,
            price: addon.price,
          }));
          
          await supabase.from('job_addons').insert(addonInserts);
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
              status: 'pending', // Will activate after first clean
            })
            .select()
            .single();

          if (!subError && subscription) {
            subscriptionId = subscription.id;
            // Link job to subscription
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
          // Find referrer
          const { data: referrer } = await supabase
            .from('customers')
            .select('id')
            .eq('referral_code', data.referralCode)
            .single();

          if (referrer) {
            // Create referral record
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
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-sage" />
          <h4 className="font-inter font-semibold text-charcoal">Payment Details</h4>
        </div>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />

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
          disabled={!stripe || !elements || isProcessing || !agreedToPolicy}
          className="flex-1 btn-primary flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
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
