import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { nanoid } from 'https://esm.sh/nanoid@5.0.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Send Cleaner Reminders Function
 * 
 * Sends reminders to cleaners about upcoming jobs:
 * - Day-before reminder (SMS + Email)
 * - Morning-of reminder (SMS only)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type } = await req.json() // 'day_before' or 'morning_of'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const sendCommUrl = `${supabaseUrl}/functions/v1/send-communication`

    const today = new Date()
    let targetDate: string
    
    if (type === 'day_before') {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      targetDate = tomorrow.toISOString().split('T')[0]
    } else {
      targetDate = today.toISOString().split('T')[0]
    }

    // Get jobs for target date with cleaner and customer info
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        cleaner_id,
        cleaners (
          id,
          name,
          email,
          phone
        ),
        customers (
          id,
          name,
          address,
          city,
          phone,
          access_type,
          access_instructions
        )
      `)
      .eq('scheduled_date', targetDate)
      .in('status', ['scheduled', 'confirmed'])
      .not('cleaner_id', 'is', null)

    if (jobsError) {
      throw new Error(`Error fetching jobs: ${jobsError.message}`)
    }

    const results = { sent: 0, failed: 0, details: [] as any[] }

    // Group jobs by cleaner
    const jobsByCleaner: { [key: string]: any[] } = {}
    for (const job of jobs || []) {
      const cleanerId = job.cleaner_id
      if (!jobsByCleaner[cleanerId]) {
        jobsByCleaner[cleanerId] = []
      }
      jobsByCleaner[cleanerId].push(job)
    }

    for (const [cleanerId, cleanerJobs] of Object.entries(jobsByCleaner)) {
      const cleaner = cleanerJobs[0].cleaners as any
      if (!cleaner?.phone && !cleaner?.email) continue

      // Generate magic link token for checklist access
      const magicToken = nanoid(32)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Valid for 7 days

      // Create magic link
      await supabase.from('cleaner_magic_links').insert({
        cleaner_id: cleanerId,
        token: magicToken,
        expires_at: expiresAt.toISOString(),
      })

      // Format date
      const dateObj = new Date(targetDate + 'T12:00:00')
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })

      if (type === 'day_before') {
        // Day-before reminder
        const jobsList = cleanerJobs.map(job => {
          const customer = job.customers as any
          const time = job.scheduled_time === 'morning' ? '9am-12pm' : '1pm-5pm'
          return `• ${time}: ${customer?.name} - ${customer?.address}, ${customer?.city}`
        }).join('\n')

        const smsContent = `Hi ${cleaner.name.split(' ')[0]}! Reminder: You have ${cleanerJobs.length} cleaning${cleanerJobs.length > 1 ? 's' : ''} tomorrow (${formattedDate}).\n\n${jobsList}\n\nView checklist: ${supabaseUrl.replace('.supabase.co', '')}.vercel.app/checklist?token=${magicToken}&job=${cleanerJobs[0].id}`

        // Send SMS
        if (cleaner.phone) {
          const response = await fetch(sendCommUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              channel: 'sms',
              recipient_type: 'cleaner',
              recipient_id: cleanerId,
              recipient_phone: cleaner.phone,
              template: 'cleaner_day_before',
              content: smsContent,
            }),
          })

          const result = await response.json()
          if (result.results?.sms?.success) {
            results.sent++
          } else {
            results.failed++
          }
        }

        // Send email with full schedule
        if (cleaner.email) {
          const emailHtml = generateCleanerReminderEmail(cleaner.name, cleanerJobs, formattedDate, magicToken)
          
          await fetch(sendCommUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              channel: 'email',
              recipient_type: 'cleaner',
              recipient_id: cleanerId,
              recipient_email: cleaner.email,
              template: 'cleaner_day_before',
              subject: `Tomorrow's Schedule: ${cleanerJobs.length} Cleaning${cleanerJobs.length > 1 ? 's' : ''}`,
              content: `Reminder for ${formattedDate}`,
              html_content: emailHtml,
            }),
          })
        }

      } else {
        // Morning-of reminder (brief SMS only)
        const firstJob = cleanerJobs[0]
        const customer = firstJob.customers as any
        const time = firstJob.scheduled_time === 'morning' ? '9am' : '1pm'
        
        const smsContent = cleanerJobs.length === 1
          ? `Good morning ${cleaner.name.split(' ')[0]}! Your cleaning today is at ${time} - ${customer?.name}, ${customer?.address}. Customer phone: ${customer?.phone || 'N/A'}. Checklist: willowandwaterorganiccleaning.com/checklist?token=${magicToken}&job=${firstJob.id}`
          : `Good morning ${cleaner.name.split(' ')[0]}! You have ${cleanerJobs.length} cleanings today starting at ${time}. First stop: ${customer?.name}, ${customer?.address}. Check your email for full details.`

        if (cleaner.phone) {
          const response = await fetch(sendCommUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              channel: 'sms',
              recipient_type: 'cleaner',
              recipient_id: cleanerId,
              recipient_phone: cleaner.phone,
              template: 'cleaner_morning_of',
              content: smsContent,
            }),
          })

          const result = await response.json()
          if (result.results?.sms?.success) {
            results.sent++
          } else {
            results.failed++
          }
        }
      }

      results.details.push({
        cleaner: cleaner.name,
        jobCount: cleanerJobs.length,
        type,
      })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'system',
      entity_id: null,
      action: `cleaner_reminders_${type}`,
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
    console.error('Error in send-cleaner-reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateCleanerReminderEmail(
  cleanerName: string,
  jobs: any[],
  date: string,
  magicToken: string
): string {
  const jobsHtml = jobs.map(job => {
    const customer = job.customers as any
    const time = job.scheduled_time === 'morning' ? '9am - 12pm' : '1pm - 5pm'
    
    return `
      <div style="background: #F9F6EE; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <strong style="color: #36454F; font-size: 16px;">${customer?.name}</strong>
          <span style="background: #71797E; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${time}</span>
        </div>
        <p style="color: #36454F; margin: 5px 0; font-size: 14px;">
          📍 ${customer?.address}, ${customer?.city}
        </p>
        <p style="color: #36454F; margin: 5px 0; font-size: 14px;">
          📞 <a href="tel:${customer?.phone}" style="color: #71797E;">${customer?.phone || 'N/A'}</a>
        </p>
        ${customer?.access_instructions ? `
          <div style="background: white; padding: 10px; border-radius: 8px; margin-top: 10px;">
            <p style="color: #36454F; margin: 0; font-size: 13px;">
              🔑 <strong>${customer?.access_type?.replace('_', ' ')}:</strong> ${customer?.access_instructions}
            </p>
          </div>
        ` : ''}
        <a href="https://www.willowandwaterorganiccleaning.com/checklist?token=${magicToken}&job=${job.id}" 
           style="display: inline-block; margin-top: 12px; background: #71797E; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
          View Checklist
        </a>
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
          <p style="color: #36454F; opacity: 0.6; margin: 5px 0 0 0; font-size: 14px;">Tomorrow's Schedule</p>
        </div>

        <h2 style="color: #36454F; font-size: 20px; margin-bottom: 10px;">Hi ${cleanerName.split(' ')[0]}!</h2>
        <p style="color: #36454F; font-size: 14px; margin-bottom: 30px;">
          Here's your schedule for <strong>${date}</strong>. You have <strong>${jobs.length} cleaning${jobs.length > 1 ? 's' : ''}</strong> scheduled.
        </p>

        ${jobsHtml}

        <div style="background: #71797E; color: white; padding: 15px 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <strong>${jobs.length}</strong> job${jobs.length !== 1 ? 's' : ''} tomorrow
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
