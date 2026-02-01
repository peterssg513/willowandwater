import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Daily Reminders Function
 * 
 * Should be triggered via cron job each morning (e.g., 8am)
 * - Sends day-before reminders to customers with jobs tomorrow
 * - Sends weekly schedule to cleaners on Saturday morning
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const sendCommUrl = `${supabaseUrl}/functions/v1/send-communication`

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Get today's day of week (0 = Sunday, 6 = Saturday)
    const today = new Date()
    const dayOfWeek = today.getDay()

    const results = {
      dayBeforeReminders: { sent: 0, failed: 0 },
      cleanerSchedules: { sent: 0, failed: 0 },
    }

    // ==============================
    // 1. Day-Before Customer Reminders
    // ==============================
    const { data: tomorrowJobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        customer_id,
        customers (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('scheduled_date', tomorrowStr)
      .in('status', ['scheduled', 'confirmed'])

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
    } else if (tomorrowJobs && tomorrowJobs.length > 0) {
      console.log(`Found ${tomorrowJobs.length} jobs for tomorrow`)

      for (const job of tomorrowJobs) {
        const customer = job.customers as any
        if (!customer?.phone) continue

        const dateObj = new Date(job.scheduled_date + 'T12:00:00')
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
        const timeSlot = job.scheduled_time === 'morning' ? '9am - 12pm' : '1pm - 5pm'

        const smsContent = `Hi ${customer.name.split(' ')[0]}! Quick reminder: Your Willow & Water cleaning is tomorrow, ${formattedDate} (${timeSlot}). We'll text when your cleaner is on the way. Reply STOP to unsubscribe.`

        try {
          const response = await fetch(sendCommUrl, {
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
              template: 'day_before_reminder',
              content: smsContent,
              related_entity_type: 'job',
              related_entity_id: job.id,
            }),
          })

          const result = await response.json()
          if (result.results?.sms?.success) {
            results.dayBeforeReminders.sent++
          } else {
            results.dayBeforeReminders.failed++
          }
        } catch (err) {
          console.error('Error sending reminder:', err)
          results.dayBeforeReminders.failed++
        }
      }
    }

    // ==============================
    // 2. Weekly Cleaner Schedules (Saturday only)
    // ==============================
    if (dayOfWeek === 6) { // Saturday
      // Get next week's date range
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + 2) // Saturday + 2 = Monday
      const nextFriday = new Date(nextMonday)
      nextFriday.setDate(nextMonday.getDate() + 4)

      const mondayStr = nextMonday.toISOString().split('T')[0]
      const fridayStr = nextFriday.toISOString().split('T')[0]

      // Get all active cleaners
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, name, email')
        .eq('status', 'active')

      if (cleaners && cleaners.length > 0) {
        for (const cleaner of cleaners) {
          if (!cleaner.email) continue

          // Get cleaner's jobs for next week
          const { data: cleanerJobs } = await supabase
            .from('jobs')
            .select(`
              id,
              scheduled_date,
              scheduled_time,
              customers (
                name,
                address,
                city
              )
            `)
            .eq('cleaner_id', cleaner.id)
            .gte('scheduled_date', mondayStr)
            .lte('scheduled_date', fridayStr)
            .in('status', ['scheduled', 'confirmed'])
            .order('scheduled_date')
            .order('scheduled_time')

          // Build schedule email
          const scheduleHtml = generateCleanerScheduleEmail(
            cleaner.name,
            cleanerJobs || [],
            nextMonday,
            nextFriday
          )

          try {
            const response = await fetch(sendCommUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                channel: 'email',
                recipient_type: 'cleaner',
                recipient_id: cleaner.id,
                recipient_email: cleaner.email,
                template: 'weekly_schedule',
                subject: `Your Schedule for ${nextMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                content: `Weekly schedule: ${cleanerJobs?.length || 0} jobs`,
                html_content: scheduleHtml,
              }),
            })

            const result = await response.json()
            if (result.results?.email?.success) {
              results.cleanerSchedules.sent++
            } else {
              results.cleanerSchedules.failed++
            }
          } catch (err) {
            console.error('Error sending cleaner schedule:', err)
            results.cleanerSchedules.failed++
          }
        }
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'system',
      entity_id: null,
      action: 'daily_reminders_sent',
      actor_type: 'system',
      details: results,
    })

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in daily-reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateCleanerScheduleEmail(
  cleanerName: string,
  jobs: any[],
  startDate: Date,
  endDate: Date
): string {
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

  // Group jobs by date
  const jobsByDate: { [key: string]: any[] } = {}
  for (const job of jobs) {
    if (!jobsByDate[job.scheduled_date]) {
      jobsByDate[job.scheduled_date] = []
    }
    jobsByDate[job.scheduled_date].push(job)
  }

  const jobsHtml = Object.entries(jobsByDate).map(([date, dayJobs]) => {
    const dateObj = new Date(date + 'T12:00:00')
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    
    const jobsList = dayJobs.map(job => {
      const customer = job.customers as any
      const time = job.scheduled_time === 'morning' ? '9am - 12pm' : '1pm - 5pm'
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${time}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${customer?.name || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${customer?.address || ''}, ${customer?.city || ''}</td>
        </tr>
      `
    }).join('')

    return `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #71797E; margin: 0 0 10px 0; font-size: 16px;">${dayName}</h4>
        <table cellpadding="0" cellspacing="0" width="100%" style="background: #F9F6EE; border-radius: 8px;">
          <tr>
            <th style="text-align: left; padding: 10px; font-size: 12px; color: #666;">Time</th>
            <th style="text-align: left; padding: 10px; font-size: 12px; color: #666;">Customer</th>
            <th style="text-align: left; padding: 10px; font-size: 12px; color: #666;">Address</th>
          </tr>
          ${jobsList}
        </table>
      </div>
    `
  }).join('')

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
          <p style="color: #36454F; opacity: 0.6; margin: 5px 0 0 0; font-size: 14px;">Weekly Schedule</p>
        </div>

        <h2 style="color: #36454F; font-size: 20px; margin-bottom: 10px;">Hi ${cleanerName}!</h2>
        <p style="color: #36454F; font-size: 14px; margin-bottom: 30px;">
          Here's your schedule for <strong>${dateRange}</strong>
        </p>

        ${jobs.length > 0 ? jobsHtml : `
          <div style="background: #F9F6EE; padding: 30px; border-radius: 12px; text-align: center;">
            <p style="color: #666; margin: 0;">No jobs scheduled for next week.</p>
          </div>
        `}

        <div style="background: #71797E; color: white; padding: 15px 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <strong>${jobs.length}</strong> job${jobs.length !== 1 ? 's' : ''} scheduled
        </div>

        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #36454F; opacity: 0.5; font-size: 12px; margin: 0;">
            Questions? Contact the office at (630) 267-0096
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
