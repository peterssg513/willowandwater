import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId, customerId } = await req.json()

    if (!jobId || !customerId) {
      throw new Error('Missing jobId or customerId')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch job and customer details
    const [jobRes, customerRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).single(),
      supabase.from('customers').select('*').eq('id', customerId).single(),
    ])

    if (jobRes.error || !jobRes.data) {
      throw new Error('Job not found')
    }
    if (customerRes.error || !customerRes.data) {
      throw new Error('Customer not found')
    }

    const job = jobRes.data
    const customer = customerRes.data

    // Format date for display
    const dateObj = new Date(job.scheduled_date + 'T12:00:00')
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    const timeSlot = job.scheduled_time === 'morning' ? '9am - 12pm' : '1pm - 5pm'
    const address = customer.address 
      ? `${customer.address}, ${customer.city || ''}`
      : 'Address on file'

    // SMS content
    const smsContent = `Hi ${customer.name.split(' ')[0]}! 🌿 Your Willow & Water cleaning is confirmed for ${formattedDate} (${timeSlot}). We'll text you when your cleaner is on the way! Address: ${address}`

    // Email content
    const emailSubject = `Your Willow & Water Cleaning is Confirmed! 🌿`
    const emailHtml = generateConfirmationEmail({
      customerName: customer.name.split(' ')[0],
      date: formattedDate,
      time: timeSlot,
      address: address,
      price: job.final_price || job.total_price,
      depositPaid: job.deposit_amount || 0,
      remainingAmount: job.remaining_amount || 0,
    })

    // Call the send-communication function
    const sendCommUrl = `${supabaseUrl}/functions/v1/send-communication`
    
    const response = await fetch(sendCommUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        channel: 'both',
        recipient_type: 'customer',
        recipient_id: customerId,
        recipient_email: customer.email,
        recipient_phone: customer.phone,
        template: 'booking_confirmed',
        subject: emailSubject,
        content: smsContent,
        html_content: emailHtml,
        related_entity_type: 'job',
        related_entity_id: jobId,
      }),
    })

    const result = await response.json()

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'job',
      entity_id: jobId,
      action: 'confirmation_sent',
      actor_type: 'system',
      details: { 
        sms_sent: result.results?.sms?.success || false,
        email_sent: result.results?.email?.success || false,
      }
    })

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateConfirmationEmail(data: {
  customerName: string
  date: string
  time: string
  address: string
  price: number
  depositPaid: number
  remainingAmount: number
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
          <p style="color: #36454F; opacity: 0.6; margin: 5px 0 0 0; font-size: 14px;">Organic Home Cleaning</p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background-color: #71797E; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; display: inline-block;">
            ✓ Booking Confirmed
          </span>
        </div>

        <h2 style="color: #36454F; font-size: 24px; margin-bottom: 20px;">Hi ${data.customerName}!</h2>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Your cleaning has been scheduled! We're looking forward to making your home sparkle with our eco-friendly, plant-based products.
        </p>

        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
          <h3 style="color: #36454F; font-size: 18px; margin: 0 0 15px 0;">Appointment Details</h3>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${data.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Address</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${data.address}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #71797E; border-radius: 12px; padding: 25px; margin-bottom: 30px; color: white;">
          <h3 style="font-size: 18px; margin: 0 0 15px 0;">Payment Summary</h3>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; opacity: 0.9; font-size: 14px;">Total</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">$${data.price}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; opacity: 0.9; font-size: 14px;">Deposit Paid</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">$${data.depositPaid}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.2);">
              <td style="padding: 12px 0 0 0; font-weight: 600; font-size: 16px;">Due on Cleaning Day</td>
              <td style="padding: 12px 0 0 0; font-size: 16px; text-align: right; font-weight: 600;">$${data.remainingAmount}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #36454F; font-size: 18px; margin-bottom: 15px;">What's Next?</h3>
        <ul style="color: #36454F; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
          <li>The remaining balance will be charged the morning of your cleaning</li>
          <li>We'll text you when your cleaner is on the way</li>
          <li>Make sure your home is accessible at your scheduled time</li>
        </ul>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #36454F; opacity: 0.5; font-size: 12px; margin: 0;">
            Questions? Reply to this email or call us at (630) 267-0096
          </p>
          <p style="color: #36454F; opacity: 0.5; font-size: 12px; margin: 10px 0 0 0;">
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
