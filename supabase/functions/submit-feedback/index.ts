import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Submit Feedback Function
 * 
 * Handles feedback submission for jobs.
 * If rating is 4-5, triggers Google review request.
 * If rating is 1-3, triggers low rating response.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId, rating, feedback } = await req.json()

    if (!jobId || !rating) {
      throw new Error('Missing jobId or rating')
    }

    const ratingNum = parseInt(rating)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch job and customer
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          google_review_requested
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    const customer = job.customers as any

    // Update job with rating and feedback
    await supabase
      .from('jobs')
      .update({
        customer_rating: ratingNum,
        customer_feedback: feedback || null,
      })
      .eq('id', jobId)

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'job',
      entity_id: jobId,
      action: 'feedback_submitted',
      actor_type: 'customer',
      actor_id: customer.id,
      details: {
        rating: ratingNum,
        has_feedback: !!feedback,
      }
    })

    const sendCommUrl = `${supabaseUrl}/functions/v1/send-communication`

    // Handle based on rating
    if (ratingNum >= 4) {
      // High rating - send Google review request (if not already sent)
      if (!customer.google_review_requested) {
        const smsContent = `Thank you so much ${customer.name.split(' ')[0]}! We're thrilled you loved your cleaning! 💚 If you have a moment, a Google review would mean the world to us: https://g.page/r/willowandwater/review`

        await fetch(sendCommUrl, {
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
            template: 'google_review_request',
            content: smsContent,
            related_entity_type: 'job',
            related_entity_id: jobId,
          }),
        })

        // Mark review as requested
        await supabase
          .from('customers')
          .update({ google_review_requested: true })
          .eq('id', customer.id)

        // Mark job as review sent
        await supabase
          .from('jobs')
          .update({ google_review_sent: true })
          .eq('id', jobId)
      }
    } else {
      // Low rating - send apology and flag for follow-up
      const smsContent = `Hi ${customer.name.split(' ')[0]}, we're sorry your cleaning didn't meet expectations. Your feedback is important to us. A manager will reach out shortly to make this right. 🌿`

      await fetch(sendCommUrl, {
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
          template: 'low_rating_response',
          content: smsContent,
          related_entity_type: 'job',
          related_entity_id: jobId,
        }),
      })

      // Create a customer note for follow-up
      await supabase.from('customer_notes').insert({
        customer_id: customer.id,
        note_type: 'complaint',
        content: `⚠️ LOW RATING ALERT: Customer gave ${ratingNum}/5 stars for job on ${job.scheduled_date}. ${feedback ? `Feedback: "${feedback}"` : 'No additional feedback provided.'} REQUIRES FOLLOW-UP.`,
      })

      // Log activity for dashboard alert
      await supabase.from('activity_log').insert({
        entity_type: 'customer',
        entity_id: customer.id,
        action: 'low_rating_received',
        actor_type: 'system',
        details: {
          job_id: jobId,
          rating: ratingNum,
          feedback,
          requires_followup: true,
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rating: ratingNum,
        response_type: ratingNum >= 4 ? 'google_review_request' : 'low_rating_followup',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in submit-feedback:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
