import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SetupRecurringRequest {
  customerId: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  preferredDay: string // 'monday', 'tuesday', etc.
  preferredTime: 'morning' | 'afternoon'
  basePrice: number
  monthsAhead?: number // How many months of jobs to generate (default 3)
}

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

/**
 * Set up recurring cleaning subscription
 * Creates subscription record and generates future jobs
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const {
      customerId,
      frequency,
      preferredDay,
      preferredTime,
      basePrice,
      monthsAhead = 3,
    }: SetupRecurringRequest = await req.json()

    // Validate required fields
    if (!customerId || !frequency || !preferredDay || !preferredTime || !basePrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*, subscriptions(*)')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if customer already has an active subscription
    const existingActive = customer.subscriptions?.find((s: any) => s.status === 'active')
    if (existingActive) {
      return new Response(
        JSON.stringify({ error: 'Customer already has an active subscription', subscriptionId: existingActive.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Calculate duration based on property
    const durationMinutes = Math.round(
      (customer.sqft || 2000) / 500 * 30 +
      Math.max(0, (customer.bathrooms || 2) - 2) * 15 +
      Math.max(0, (customer.bedrooms || 3) - 3) * 10
    )

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        customer_id: customerId,
        frequency,
        preferred_day: preferredDay,
        preferred_time: preferredTime,
        base_price: basePrice,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error('Subscription creation error:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Generate job dates
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1) // Start from tomorrow
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + monthsAhead)

    // Get existing scheduled jobs to avoid duplicates
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('scheduled_date')
      .eq('customer_id', customerId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_date', startDate.toISOString().split('T')[0])

    const existingDates = new Set(existingJobs?.map(j => j.scheduled_date) || [])

    // Find first occurrence of preferred day
    const targetDayOfWeek = DAYS_MAP[preferredDay.toLowerCase()] ?? 1
    const current = new Date(startDate)
    
    while (current.getDay() !== targetDayOfWeek) {
      current.setDate(current.getDate() + 1)
    }

    // Generate dates based on frequency
    const jobDates: string[] = []
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        jobDates.push(dateStr)
      }

      if (frequency === 'weekly') {
        current.setDate(current.getDate() + 7)
      } else if (frequency === 'biweekly') {
        current.setDate(current.getDate() + 14)
      } else if (frequency === 'monthly') {
        current.setMonth(current.getMonth() + 1)
        // Reset to first occurrence of preferred day in new month
        current.setDate(1)
        while (current.getDay() !== targetDayOfWeek) {
          current.setDate(current.getDate() + 1)
        }
      }
    }

    // Create jobs
    if (jobDates.length > 0) {
      const jobsToCreate = jobDates.map(date => ({
        customer_id: customerId,
        subscription_id: subscription.id,
        scheduled_date: date,
        scheduled_time: preferredTime,
        duration_minutes: durationMinutes,
        job_type: 'recurring',
        base_price: basePrice,
        addons_price: 0,
        total_price: basePrice,
        final_price: basePrice,
        deposit_amount: 0, // No deposit for recurring - full charge on day of
        remaining_amount: basePrice, // Full amount charged morning of
        status: 'scheduled',
        payment_status: 'pending', // Will be charged via charge-remaining-balance
      }))

      const { error: jobsError } = await supabase
        .from('jobs')
        .insert(jobsToCreate)

      if (jobsError) {
        console.error('Jobs creation error:', jobsError)
        // Rollback subscription
        await supabase.from('subscriptions').delete().eq('id', subscription.id)
        return new Response(
          JSON.stringify({ error: 'Failed to create recurring jobs' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Update customer status to active if not already
    if (customer.status !== 'active') {
      await supabase
        .from('customers')
        .update({ status: 'active' })
        .eq('id', customerId)
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'subscription',
      entity_id: subscription.id,
      action: 'created',
      actor_type: 'customer',
      actor_id: customerId,
      details: {
        frequency,
        preferred_day: preferredDay,
        preferred_time: preferredTime,
        base_price: basePrice,
        jobs_created: jobDates.length,
        months_ahead: monthsAhead,
      }
    })

    // Send confirmation email
    try {
      const frequencyLabels: Record<string, string> = {
        weekly: 'Weekly',
        biweekly: 'Bi-Weekly',
        monthly: 'Monthly',
      }

      await fetch(`${supabaseUrl}/functions/v1/send-communication`, {
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
          template: 'recurring_setup',
          subject: `Your ${frequencyLabels[frequency]} Cleaning Subscription is Active! 🌿`,
          content: `Hi ${customer.name?.split(' ')[0]}! Great news - your ${frequencyLabels[frequency].toLowerCase()} cleaning is set up! We've scheduled ${jobDates.length} cleanings on ${preferredDay}s (${preferredTime}). Your card will be charged $${basePrice.toFixed(2)} the morning of each cleaning. Reply STOP to unsubscribe from texts.`,
          html_content: generateRecurringConfirmEmail(
            customer.name?.split(' ')[0] || 'there',
            frequencyLabels[frequency],
            preferredDay,
            preferredTime,
            basePrice,
            jobDates.length
          ),
          related_entity_type: 'subscription',
          related_entity_id: subscription.id,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send confirmation:', emailError)
      // Don't fail the whole operation for email failure
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        jobsCreated: jobDates.length,
        nextCleaningDate: jobDates[0],
        frequency,
        preferredDay,
        preferredTime,
        pricePerVisit: basePrice,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in setup-recurring:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generateRecurringConfirmEmail(
  customerName: string,
  frequency: string,
  preferredDay: string,
  preferredTime: string,
  price: number,
  jobCount: number
): string {
  const timeLabel = preferredTime === 'morning' ? '9am - 12pm' : '1pm - 5pm'
  const dayCapitalized = preferredDay.charAt(0).toUpperCase() + preferredDay.slice(1)
  
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
          <p style="color: #71797E; font-size: 14px; margin: 5px 0 0 0;">Organic Cleaning</p>
        </div>

        <div style="background-color: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <span style="font-size: 32px;">🔄</span>
          <h2 style="color: #166534; font-size: 20px; margin: 10px 0 0 0;">Recurring Cleanings Activated!</h2>
        </div>

        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${customerName},
        </p>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Great news! Your ${frequency.toLowerCase()} cleaning subscription is now active. We've scheduled <strong>${jobCount} cleanings</strong> for you.
        </p>

        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #36454F; font-size: 16px; margin: 0 0 15px 0;">Your Schedule:</h3>
          <table style="width: 100%; font-size: 14px; color: #36454F;">
            <tr>
              <td style="padding: 8px 0;"><strong>Frequency:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${frequency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Day:</strong></td>
              <td style="padding: 8px 0; text-align: right;">Every ${dayCapitalized}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${timeLabel}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
              <td style="padding: 12px 0 0 0;"><strong>Price per visit:</strong></td>
              <td style="padding: 12px 0 0 0; text-align: right; color: #71797E; font-weight: bold;">$${price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #EFF6FF; border-radius: 12px; padding: 16px; margin-bottom: 30px;">
          <p style="color: #1E40AF; font-size: 14px; margin: 0;">
            <strong>💳 Auto-Payment:</strong> Your card on file will be charged the morning of each cleaning.
          </p>
        </div>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6;">
          Questions or need to make changes? Call us at (630) 267-0096 or reply to this email.
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
