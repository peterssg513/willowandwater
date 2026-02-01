import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, amount, tipAmount = 0, metadata = {} } = await req.json()

    if (!customerId || !amount) {
      throw new Error('Missing required fields: customerId and amount')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get customer from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      throw new Error('Customer not found')
    }

    let stripeCustomerId = customer.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: {
          supabase_customer_id: customerId,
        },
      })
      stripeCustomerId = stripeCustomer.id

      // Update customer with Stripe ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customerId)
    }

    // Create payment intent with setup for future payments
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      setup_future_usage: 'off_session', // Save card for future charges
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        tip_amount: tipAmount.toString(),
        supabase_customer_id: customerId,
      },
      description: `Willow & Water - Cleaning deposit${tipAmount > 0 ? ` (includes $${tipAmount} tip)` : ''}`,
    })

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'customer',
      entity_id: customerId,
      action: 'payment_intent_created',
      actor_type: 'system',
      details: {
        payment_intent_id: paymentIntent.id,
        amount,
        tip_amount: tipAmount,
      }
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
