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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId, chargeAll } = await req.json();

    // If chargeAll is true, find all bookings scheduled for today that need charging
    // If bookingId is provided, charge just that booking
    
    let bookingsToCharge = [];

    if (chargeAll) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Find all confirmed bookings scheduled for today with remaining balance
      const { data: todayBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('scheduled_date', today)
        .eq('status', 'confirmed')
        .eq('payment_status', 'deposit_paid')
        .not('stripe_customer_id', 'is', null)
        .gt('remaining_amount', 0);

      if (fetchError) {
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }

      bookingsToCharge = todayBookings || [];
    } else if (bookingId) {
      // Fetch specific booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new Error(`Booking not found: ${fetchError?.message || 'Unknown error'}`);
      }

      bookingsToCharge = [booking];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either bookingId or chargeAll: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const booking of bookingsToCharge) {
      try {
        if (!booking.stripe_customer_id) {
          results.push({
            bookingId: booking.id,
            success: false,
            error: "No Stripe customer ID found",
          });
          continue;
        }

        if (!booking.remaining_amount || booking.remaining_amount <= 0) {
          results.push({
            bookingId: booking.id,
            success: false,
            error: "No remaining amount to charge",
          });
          continue;
        }

        // Get the customer's default payment method
        const customer = await stripe.customers.retrieve(booking.stripe_customer_id);
        
        if (customer.deleted) {
          results.push({
            bookingId: booking.id,
            success: false,
            error: "Customer has been deleted in Stripe",
          });
          continue;
        }

        const paymentMethods = await stripe.paymentMethods.list({
          customer: booking.stripe_customer_id,
          type: 'card',
          limit: 1,
        });

        if (paymentMethods.data.length === 0) {
          results.push({
            bookingId: booking.id,
            success: false,
            error: "No payment method on file",
          });
          continue;
        }

        const paymentMethodId = paymentMethods.data[0].id;
        const amountInCents = booking.remaining_amount * 100;

        // Create and confirm a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          customer: booking.stripe_customer_id,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          description: `Remaining balance for cleaning - ${booking.address || 'Address on file'}`,
          metadata: {
            booking_id: booking.id,
            type: 'remaining_balance',
            customer_name: booking.name || '',
            customer_email: booking.email || '',
          },
        });

        // Update booking status in Supabase
        await supabase
          .from('bookings')
          .update({
            payment_status: 'fully_paid',
            remaining_amount: 0,
            stripe_payment_intent_id: paymentIntent.id,
            final_charge_date: new Date().toISOString(),
          })
          .eq('id', booking.id);

        results.push({
          bookingId: booking.id,
          success: true,
          amountCharged: amountInCents / 100,
          paymentIntentId: paymentIntent.id,
          customerEmail: booking.email,
        });

      } catch (chargeError: any) {
        console.error(`Failed to charge booking ${booking.id}:`, chargeError);
        
        // Update booking with failed charge attempt
        await supabase
          .from('bookings')
          .update({
            payment_status: 'charge_failed',
            charge_error: chargeError.message,
          })
          .eq('id', booking.id);

        results.push({
          bookingId: booking.id,
          success: false,
          error: chargeError.message,
          customerEmail: booking.email,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} booking(s): ${successCount} successful, ${failedCount} failed`,
        results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Charge remaining error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
