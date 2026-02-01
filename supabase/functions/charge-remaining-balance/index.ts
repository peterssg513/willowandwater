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

          // Send failed charge notification via send-communication function
          await fetch(`${supabaseUrl}/functions/v1/send-communication`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              channel: 'both',
              recipient_type: 'customer',
              recipient_id: customer.id,
              recipient_email: customer.email,
              recipient_phone: customer.phone,
              template: 'charge_failed',
              subject: 'Action Required: Payment Issue for Your Cleaning',
              content: `Hi ${customer.name?.split(' ')[0]}, we couldn't process your payment of $${job.remaining_amount.toFixed(2)} for today's cleaning. Please update your card or reply to reschedule. Call us at (630) 267-0096 if you need help.`,
              html_content: generateChargeFailedEmail(customer.name?.split(' ')[0] || 'there', job.remaining_amount),
              related_entity_type: 'job',
              related_entity_id: job.id,
            }),
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

          // Send confirmation SMS via send-communication function
          await fetch(`${supabaseUrl}/functions/v1/send-communication`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              channel: 'sms',
              recipient_type: 'customer',
              recipient_id: customer.id,
              recipient_phone: customer.phone,
              template: 'remaining_charged',
              content: `Hi ${customer.name?.split(' ')[0]}! Your cleaning is today! We've charged $${job.remaining_amount.toFixed(2)} to your card. Your cleaner will arrive during your scheduled window. 🏠✨`,
              related_entity_type: 'job',
              related_entity_id: job.id,
            }),
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

function generateChargeFailedEmail(customerName: string, amount: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6EE; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #71797E; font-size: 28px; margin: 0;">Willow & Water</h1>
        </div>

        <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <span style="font-size: 32px;">⚠️</span>
          <h2 style="color: #991B1B; font-size: 20px; margin: 10px 0 0 0;">Payment Issue</h2>
        </div>

        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${customerName},
        </p>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          We were unable to charge $${amount.toFixed(2)} to your card on file for your cleaning today. To keep your appointment, please contact us to update your payment method.
        </p>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6;">
          If you need help or want to reschedule, please call us at (630) 267-0096.
        </p>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #36454F; opacity: 0.5; font-size: 12px; margin: 0;">
            Willow & Water Organic Cleaning • St. Charles, IL
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
