import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

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
    // Check for Stripe key first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { 
      totalAmount,  // Full cleaning price in dollars
      customerEmail, 
      customerName,
      customerPhone,
      bookingDetails,
      successUrl,
      cancelUrl 
    } = await req.json();

    // Validate required fields
    if (!totalAmount || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: totalAmount, customerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate 20% deposit
    const depositPercent = 0.20;
    const depositAmount = Math.round(totalAmount * depositPercent * 100); // Convert to cents
    const remainingAmount = Math.round(totalAmount * (1 - depositPercent) * 100);

    // Create or retrieve Stripe Customer (to save card for future charges)
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        metadata: {
          address: bookingDetails?.address || "",
          source: "willow_water_website",
        },
      });
    }

    // Create a Stripe Checkout Session for the deposit
    // setup_future_usage saves the card for future charges
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customer.id,
      payment_intent_data: {
        setup_future_usage: "off_session", // Save card for future charges
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Cleaning Deposit (20%)",
              description: `Deposit for organic home cleaning - ${bookingDetails?.sqft || ''} sq ft home. Remaining balance of $${(remainingAmount / 100).toFixed(0)} due on day of service.`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_name: customerName || "",
        customer_email: customerEmail,
        total_amount_cents: (totalAmount * 100).toString(),
        deposit_amount_cents: depositAmount.toString(),
        remaining_amount_cents: remainingAmount.toString(),
        sqft: bookingDetails?.sqft?.toString() || "",
        bedrooms: bookingDetails?.bedrooms?.toString() || "",
        bathrooms: bookingDetails?.bathrooms?.toString() || "",
        frequency: bookingDetails?.frequency || "",
        address: bookingDetails?.address || "",
        scheduled_date: bookingDetails?.scheduledDate || "",
      },
      success_url: successUrl || `${req.headers.get("origin")}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}?booking=cancelled`,
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url,
        customerId: customer.id,
        depositAmount: depositAmount / 100,
        remainingAmount: remainingAmount / 100,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Payment processing failed. Please try again.";
    
    if (error.type === 'StripeAuthenticationError') {
      errorMessage = "Payment configuration error. Please contact support.";
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = error.message || "Invalid payment request.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.type || 'unknown',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
