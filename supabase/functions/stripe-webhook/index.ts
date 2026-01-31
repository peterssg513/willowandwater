import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    // Verify webhook signature if secret is set
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract customer email and update booking
        const customerEmail = session.customer_email || session.metadata?.customer_email;
        const customerId = session.customer as string;
        
        if (customerEmail) {
          // Update the most recent booking for this customer
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'deposit_paid',
              stripe_customer_id: customerId,
              stripe_checkout_session_id: session.id,
              deposit_paid_at: new Date().toISOString(),
            })
            .eq('email', customerEmail.toLowerCase())
            .in('status', ['lead', 'payment_initiated'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (updateError) {
            console.error('Failed to update booking:', updateError);
          } else {
            console.log(`Booking confirmed for ${customerEmail}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Check if this is a remaining balance charge
        if (paymentIntent.metadata?.type === 'remaining_balance') {
          const bookingId = paymentIntent.metadata.booking_id;
          
          if (bookingId) {
            await supabase
              .from('bookings')
              .update({
                payment_status: 'fully_paid',
                remaining_amount: 0,
                stripe_payment_intent_id: paymentIntent.id,
                final_charge_date: new Date().toISOString(),
              })
              .eq('id', bookingId);
            
            console.log(`Remaining balance charged for booking ${bookingId}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.type === 'remaining_balance') {
          const bookingId = paymentIntent.metadata.booking_id;
          
          if (bookingId) {
            await supabase
              .from('bookings')
              .update({
                payment_status: 'charge_failed',
                charge_error: paymentIntent.last_payment_error?.message || 'Payment failed',
              })
              .eq('id', bookingId);
            
            console.log(`Payment failed for booking ${bookingId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
