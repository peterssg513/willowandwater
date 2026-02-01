import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

/**
 * Twilio Webhook Handler
 * 
 * Processes incoming SMS messages.
 * - Handles rating replies (1-5)
 * - Handles STOP/unsubscribe requests
 * - Handles YES responses for recurring upsell
 */
serve(async (req) => {
  try {
    // Parse Twilio webhook data (form-urlencoded)
    const formData = await req.formData()
    const from = formData.get('From') as string
    const body = (formData.get('Body') as string || '').trim().toLowerCase()
    
    if (!from || !body) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Normalize phone number for lookup
    const normalizedPhone = from.replace(/\D/g, '').slice(-10)

    // Find customer by phone
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, phone')
      .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${from}%`)
      .single()

    let responseMessage = ''

    // Handle STOP/unsubscribe
    if (['stop', 'unsubscribe', 'cancel', 'quit', 'end'].includes(body)) {
      responseMessage = 'You have been unsubscribed from Willow & Water messages. Reply START to resubscribe.'
      
      if (customer) {
        await supabase.from('activity_log').insert({
          entity_type: 'customer',
          entity_id: customer.id,
          action: 'sms_unsubscribed',
          actor_type: 'customer',
        })
      }
    }
    // Handle START/resubscribe
    else if (['start', 'subscribe', 'yes'].includes(body)) {
      responseMessage = 'Welcome back! You are now subscribed to Willow & Water messages. 🌿'
      
      if (customer) {
        await supabase.from('activity_log').insert({
          entity_type: 'customer',
          entity_id: customer.id,
          action: 'sms_resubscribed',
          actor_type: 'customer',
        })
      }
    }
    // Handle rating (1-5)
    else if (/^[1-5]$/.test(body)) {
      const rating = parseInt(body)
      
      if (customer) {
        // Find most recent completed job for this customer
        const { data: recentJob } = await supabase
          .from('jobs')
          .select('id, scheduled_date, customer_rating')
          .eq('customer_id', customer.id)
          .eq('status', 'completed')
          .is('customer_rating', null)
          .order('scheduled_date', { ascending: false })
          .limit(1)
          .single()

        if (recentJob) {
          // Submit feedback via the feedback function
          await fetch(`${supabaseUrl}/functions/v1/submit-feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              jobId: recentJob.id,
              rating: rating,
            }),
          })

          if (rating >= 4) {
            responseMessage = `Thank you for the ${rating}-star rating! We're so glad you loved your cleaning! 💚`
          } else {
            responseMessage = `Thank you for your feedback. We're sorry we didn't meet your expectations. A manager will reach out shortly.`
          }
        } else {
          responseMessage = `Thank you for your rating! We appreciate your feedback. 🌿`
        }
      } else {
        responseMessage = `Thanks for your message! If you're a Willow & Water customer and need help, please call us at (630) 267-0096.`
      }
    }
    // Handle other messages
    else {
      // Log the incoming message for review
      await supabase.from('activity_log').insert({
        entity_type: 'system',
        entity_id: null,
        action: 'sms_received',
        actor_type: 'customer',
        actor_id: customer?.id,
        details: {
          from,
          body,
          customer_id: customer?.id,
        }
      })

      responseMessage = `Thanks for your message! For assistance, please call us at (630) 267-0096 or visit willowandwater.com. 🌿`
    }

    // Log incoming message
    if (customer) {
      await supabase.from('communications_log').insert({
        recipient_type: 'customer',
        recipient_id: customer.id,
        recipient_contact: from,
        channel: 'sms',
        template: 'inbound',
        content: body,
        status: 'delivered',
      })
    }

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('Error in twilio-webhook:', error)
    
    // Return empty response on error to avoid Twilio retries
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
})
