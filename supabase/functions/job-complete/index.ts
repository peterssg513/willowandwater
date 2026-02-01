import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Job Complete Function
 * 
 * Called when a job is marked as completed.
 * Sends job complete notification with feedback request.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId } = await req.json()

    if (!jobId) {
      throw new Error('Missing jobId')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch job and customer details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        cleaners (
          name
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    const customer = job.customers as any
    const cleaner = job.cleaners as any

    // Update job status to completed
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        cleaner_completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Format date
    const dateObj = new Date(job.scheduled_date + 'T12:00:00')
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })

    // Build feedback URL (for email)
    const feedbackUrl = `https://www.willowandwaterorganiccleaning.com/feedback?job=${jobId}`

    // SMS content
    const smsContent = `Hi ${customer.name.split(' ')[0]}! Your home is sparkling clean! ✨ We hope you love it. We'd really appreciate your feedback - reply with a rating 1-5.`

    // Email content
    const emailSubject = `Your Home is Sparkling Clean! ✨`
    const emailHtml = generateJobCompleteEmail({
      customerName: customer.name.split(' ')[0],
      date: formattedDate,
      cleanerName: cleaner?.name || 'Your cleaner',
      feedbackUrl,
    })

    // Send notifications via send-communication function
    const sendCommUrl = `${supabaseUrl}/functions/v1/send-communication`
    
    await fetch(sendCommUrl, {
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
        template: 'job_complete',
        subject: emailSubject,
        content: smsContent,
        html_content: emailHtml,
        related_entity_type: 'job',
        related_entity_id: jobId,
      }),
    })

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'job',
      entity_id: jobId,
      action: 'completed',
      actor_type: 'system',
      details: {
        cleaner_name: cleaner?.name,
        notification_sent: true,
      }
    })

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in job-complete:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateJobCompleteEmail(data: {
  customerName: string
  date: string
  cleanerName: string
  feedbackUrl: string
}): string {
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

        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">✨</span>
        </div>

        <h2 style="color: #36454F; font-size: 24px; margin-bottom: 20px; text-align: center;">Your Home is Clean!</h2>
        
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${data.customerName},
        </p>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          ${data.cleanerName} has completed your cleaning on ${data.date}. We hope your home feels fresh and inviting!
        </p>

        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
          <h3 style="color: #36454F; font-size: 18px; margin: 0 0 10px 0;">How did we do?</h3>
          <p style="color: #36454F; opacity: 0.7; font-size: 14px; margin: 0 0 20px 0;">
            Your feedback helps us improve and lets our cleaners know they're doing a great job!
          </p>
          <a href="${data.feedbackUrl}" style="background-color: #71797E; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Rate Your Clean
          </a>
        </div>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
          Thank you for choosing Willow & Water! 🌿
        </p>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
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
