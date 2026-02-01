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

/**
 * Charge remaining balance for a job
 * Called morning of the cleaning day via scheduled function or manually
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    
    // Get jobs scheduled for today that need remaining balance charged
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          stripe_customer_id
        )
      `)
      .eq('scheduled_date', today)
      .eq('payment_status', 'deposit_paid')
      .gt('remaining_amount', 0)

    if (jobsError) {
      throw new Error(`Error fetching jobs: ${jobsError.message}`)
    }

    const results = []

    for (const job of jobs || []) {
      try {
        const customer = job.customers
        
        if (!customer?.stripe_customer_id) {
          console.error(`No Stripe customer ID for job ${job.id}`)
          results.push({ jobId: job.id, success: false, error: 'No Stripe customer' })
          continue
        }

        // Get the customer's default payment method
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.stripe_customer_id,
          type: 'card',
        })

        if (!paymentMethods.data.length) {
          console.error(`No payment method for customer ${customer.id}`)
          results.push({ jobId: job.id, success: false, error: 'No payment method' })
          
          // Log failed charge
          await supabase.from('activity_log').insert({
            entity_type: 'job',
            entity_id: job.id,
            action: 'charge_failed',
            actor_type: 'system',
            details: { reason: 'No payment method on file' }
          })

          // Send failed charge notification (would trigger SMS/email)
          await supabase.from('communications_log').insert({
            recipient_type: 'customer',
            recipient_id: customer.id,
            recipient_contact: customer.phone,
            channel: 'sms',
            template: 'charge_failed',
            content: `Hi ${customer.name?.split(' ')[0]}, we couldn't charge your card for today's cleaning. Please update your payment method.`,
            status: 'sent',
            related_entity_type: 'job',
            related_entity_id: job.id,
          })
          
          continue
        }

        const paymentMethodId = paymentMethods.data[0].id

        // Create payment intent for remaining amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(job.remaining_amount * 100),
          currency: 'usd',
          customer: customer.stripe_customer_id,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            job_id: job.id,
            customer_id: customer.id,
            payment_type: 'remaining',
          },
          description: `Willow & Water - Remaining balance for cleaning on ${today}`,
        })

        if (paymentIntent.status === 'succeeded') {
          // Update job
          await supabase
            .from('jobs')
            .update({
              remaining_paid_at: new Date().toISOString(),
              remaining_payment_intent_id: paymentIntent.id,
              payment_status: 'paid',
            })
            .eq('id', job.id)

          // Create payment record
          await supabase.from('payments').insert({
            customer_id: customer.id,
            job_id: job.id,
            amount: job.remaining_amount,
            payment_type: 'remaining',
            stripe_payment_intent_id: paymentIntent.id,
            status: 'succeeded',
          })

          // Log success
          await supabase.from('activity_log').insert({
            entity_type: 'job',
            entity_id: job.id,
            action: 'remaining_charged',
            actor_type: 'system',
            details: {
              amount: job.remaining_amount,
              payment_intent_id: paymentIntent.id,
            }
          })

          // Send confirmation SMS
          await supabase.from('communications_log').insert({
            recipient_type: 'customer',
            recipient_id: customer.id,
            recipient_contact: customer.phone,
            channel: 'sms',
            template: 'remaining_charged',
            content: `Hi ${customer.name?.split(' ')[0]}! Your cleaning is today! We've charged $${job.remaining_amount.toFixed(2)} to your card. Your cleaner will text when on the way.`,
            status: 'sent',
            related_entity_type: 'job',
            related_entity_id: job.id,
          })

          results.push({ jobId: job.id, success: true, paymentIntentId: paymentIntent.id })
        } else {
          results.push({ jobId: job.id, success: false, error: `Payment status: ${paymentIntent.status}` })
        }
      } catch (jobError: any) {
        console.error(`Error processing job ${job.id}:`, jobError)
        results.push({ jobId: job.id, success: false, error: jobError.message })
        
        // Update job with failed status
        await supabase
          .from('jobs')
          .update({ payment_status: 'failed' })
          .eq('id', job.id)
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in charge-remaining-balance:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
