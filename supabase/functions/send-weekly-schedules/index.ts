import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Send Weekly Schedules Edge Function
 * 
 * Sends each cleaner their schedule for the upcoming week.
 * Designed to be triggered by a cron job every Saturday.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is required for sending emails')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate date range for the upcoming week
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() + (7 - today.getDay()) % 7 + 1) // Next Monday
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
    endOfWeek.setHours(23, 59, 59, 999)

    console.log(`Sending schedules for: ${startOfWeek.toDateString()} - ${endOfWeek.toDateString()}`)

    // Get all active cleaners
    const { data: cleaners, error: cleanerError } = await supabase
      .from('cleaners')
      .select('*')
      .eq('status', 'active')

    if (cleanerError) {
      throw new Error(`Error fetching cleaners: ${cleanerError.message}`)
    }

    if (!cleaners || cleaners.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active cleaners found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    // For each cleaner, get their schedule and send email
    for (const cleaner of cleaners) {
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('cleaner_id', cleaner.id)
        .gte('scheduled_date', startOfWeek.toISOString())
        .lte('scheduled_date', endOfWeek.toISOString())
        .in('status', ['confirmed', 'deposit_paid', 'fully_paid'])
        .order('scheduled_date', { ascending: true })

      if (bookingError) {
        console.error(`Error fetching bookings for ${cleaner.name}:`, bookingError)
        results.push({ cleaner: cleaner.name, success: false, error: bookingError.message })
        continue
      }

      // Send email even if no bookings (to confirm empty week)
      const emailSent = await sendWeeklyScheduleEmail(
        resendApiKey,
        cleaner,
        bookings || [],
        startOfWeek,
        endOfWeek
      )

      results.push({
        cleaner: cleaner.name,
        email: cleaner.email,
        bookingsCount: bookings?.length || 0,
        emailSent,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send weekly schedules error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Send weekly schedule email to a cleaner
 */
async function sendWeeklyScheduleEmail(
  apiKey: string,
  cleaner: any,
  bookings: any[],
  weekStart: Date,
  weekEnd: Date
): Promise<boolean> {
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // Group bookings by day
  const bookingsByDay: { [key: string]: any[] } = {}
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  bookings.forEach(booking => {
    const date = new Date(booking.scheduled_date)
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!bookingsByDay[dayKey]) {
      bookingsByDay[dayKey] = []
    }
    bookingsByDay[dayKey].push(booking)
  })

  // Generate schedule HTML
  let scheduleHtml = ''
  
  if (bookings.length === 0) {
    scheduleHtml = `
      <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="color: #666; margin: 0;">No cleanings scheduled for this week.</p>
        <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Enjoy your time off! 🌴</p>
      </div>
    `
  } else {
    scheduleHtml = Object.entries(bookingsByDay).map(([day, dayBookings]) => `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #71797E; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #71797E;">
          📅 ${day}
        </h3>
        ${dayBookings.map((booking, index) => `
          <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #71797E;">
            <p style="margin: 0 0 8px 0; color: #36454F; font-weight: bold;">
              ${index + 1}. ${booking.name}
            </p>
            <p style="margin: 0 0 4px 0; color: #36454F; font-size: 14px;">
              📍 ${booking.address}
            </p>
            <p style="margin: 0 0 4px 0; color: #36454F; font-size: 14px;">
              📞 ${booking.phone}
            </p>
            <p style="margin: 0; color: #666; font-size: 13px;">
              🏠 ${booking.sqft?.toLocaleString()} sq ft • ${booking.bedrooms} bed • ${booking.bathrooms} bath
            </p>
          </div>
        `).join('')}
      </div>
    `).join('')
  }

  // Calculate total earnings estimate
  const totalCleanings = bookings.length
  const estimatedHours = bookings.reduce((total, b) => {
    // Rough estimate: 2 hours base + 0.5 hours per 1000 sqft
    return total + 2 + ((b.sqft || 2000) / 1000 * 0.5)
  }, 0)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Willow & Water <schedule@willowandwater.com>',
      to: cleaner.email,
      subject: `📋 Your Schedule for ${weekRange} (${totalCleanings} cleaning${totalCleanings !== 1 ? 's' : ''})`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #71797E; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #F9F6EE; margin: 0; font-size: 24px;">Your Weekly Schedule</h1>
            <p style="color: #F9F6EE; opacity: 0.9; margin: 8px 0 0 0; font-size: 14px;">${weekRange}</p>
          </div>
          
          <div style="background: #F9F6EE; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #36454F; font-size: 16px;">Hi ${cleaner.name.split(' ')[0]}! 👋</p>
            
            <p style="color: #36454F; font-size: 16px;">Here's your schedule for the upcoming week:</p>
            
            <!-- Summary Box -->
            <div style="background: #71797E; color: #F9F6EE; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <div style="display: inline-block; margin: 0 20px;">
                <p style="margin: 0; font-size: 28px; font-weight: bold;">${totalCleanings}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Cleaning${totalCleanings !== 1 ? 's' : ''}</p>
              </div>
              <div style="display: inline-block; margin: 0 20px;">
                <p style="margin: 0; font-size: 28px; font-weight: bold;">~${Math.round(estimatedHours)}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Hours</p>
              </div>
            </div>
            
            <!-- Schedule -->
            ${scheduleHtml}
            
            <!-- Reminders -->
            <div style="background: #71797E10; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #71797E; margin: 0 0 12px 0; font-size: 14px;">📋 WEEKLY REMINDERS</h3>
              <ul style="color: #36454F; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Text each customer 15 minutes before arrival</li>
                <li>Bring all Branch Basics supplies</li>
                <li>Check your equipment before heading out</li>
                <li>Submit any supply requests by Wednesday</li>
              </ul>
            </div>
            
            <p style="color: #36454F; font-size: 14px;">
              Questions or need to swap a shift? Contact Peter & Claira at 
              <a href="tel:6302670096" style="color: #71797E;">(630) 267-0096</a>
            </p>
            
            <p style="color: #36454F; font-size: 14px; margin-top: 24px;">
              Have a great week! 💚<br>
              <strong>The Willow & Water Team</strong>
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            Willow & Water Organic Cleaning • Fox Valley, IL
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Failed to send email to ${cleaner.email}:`, errorText)
  }

  return response.ok
}
