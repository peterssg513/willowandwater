import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Assign Cleaner Edge Function
 * 
 * Automatically assigns a cleaner to a booking using round-robin logic:
 * 1. Finds active cleaners available on the scheduled day
 * 2. Picks the cleaner with the oldest last_assigned_at (or never assigned)
 * 3. Updates the booking with cleaner_id
 * 4. Sends notification email to the cleaner
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { bookingId } = await req.json()

    if (!bookingId) {
      throw new Error('bookingId is required')
    }

    // 1. Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`)
    }

    // 2. Get the day of the week for the scheduled date
    const scheduledDate = new Date(booking.scheduled_date)
    const dayOfWeek = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // 3. Find available cleaners using round-robin
    // - Must be active
    // - Must be available on that day
    // - Optionally filter by service area
    const { data: availableCleaners, error: cleanerError } = await supabase
      .from('cleaners')
      .select('*')
      .eq('status', 'active')
      .contains('available_days', [dayOfWeek])
      .order('last_assigned_at', { ascending: true, nullsFirst: true })
      .limit(1)

    if (cleanerError) {
      throw new Error(`Error finding cleaners: ${cleanerError.message}`)
    }

    if (!availableCleaners || availableCleaners.length === 0) {
      // No cleaners available - notify admin
      console.log('No cleaners available for this date')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No cleaners available for this date',
          requiresManualAssignment: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const assignedCleaner = availableCleaners[0]

    // 4. Update the booking with the assigned cleaner
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        cleaner_id: assignedCleaner.id,
        cleaning_instructions: generateCleaningInstructions(booking),
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Error updating booking: ${updateError.message}`)
    }

    // 5. Update cleaner's last_assigned_at and total_assignments
    await supabase
      .from('cleaners')
      .update({
        last_assigned_at: new Date().toISOString(),
        total_assignments: (assignedCleaner.total_assignments || 0) + 1,
      })
      .eq('id', assignedCleaner.id)

    // 6. Send email notification to cleaner
    let emailSent = false
    if (resendApiKey) {
      try {
        emailSent = await sendCleanerNotification(
          resendApiKey,
          assignedCleaner,
          booking,
          scheduledDate
        )
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
      }
    }

    // 7. Mark as notified if email sent
    if (emailSent) {
      await supabase
        .from('bookings')
        .update({ cleaner_notified_at: new Date().toISOString() })
        .eq('id', bookingId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleaner: {
          id: assignedCleaner.id,
          name: assignedCleaner.name,
          email: assignedCleaner.email,
        },
        emailSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Assign cleaner error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Generate cleaning instructions based on booking details
 */
function generateCleaningInstructions(booking: any): string {
  const instructions = []
  
  instructions.push(`## Cleaning Details`)
  instructions.push(`- **Customer:** ${booking.name}`)
  instructions.push(`- **Address:** ${booking.address}`)
  instructions.push(`- **Phone:** ${booking.phone}`)
  instructions.push(`- **Email:** ${booking.email}`)
  instructions.push('')
  instructions.push(`## Home Specs`)
  instructions.push(`- **Size:** ${booking.sqft?.toLocaleString()} sq ft`)
  instructions.push(`- **Bedrooms:** ${booking.bedrooms}`)
  instructions.push(`- **Bathrooms:** ${booking.bathrooms}`)
  instructions.push(`- **Service Type:** ${booking.frequency === 'onetime' ? 'One-Time Deep Clean' : `${booking.frequency} cleaning`}`)
  instructions.push('')
  instructions.push(`## Reminders`)
  instructions.push(`- Text customer 15 minutes before arrival`)
  instructions.push(`- Use Branch Basics products only`)
  instructions.push(`- Take before/after photos if possible`)
  instructions.push(`- Lock up when leaving if customer not home`)
  
  return instructions.join('\n')
}

/**
 * Send email notification to assigned cleaner
 */
async function sendCleanerNotification(
  apiKey: string,
  cleaner: any,
  booking: any,
  scheduledDate: Date
): Promise<boolean> {
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Willow & Water <assignments@willowandwater.com>',
      to: cleaner.email,
      subject: `🧹 New Cleaning Assignment - ${formattedDate}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #71797E; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #F9F6EE; margin: 0; font-size: 24px;">New Cleaning Assignment</h1>
          </div>
          
          <div style="background: #F9F6EE; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #36454F; font-size: 16px;">Hi ${cleaner.name.split(' ')[0]},</p>
            
            <p style="color: #36454F; font-size: 16px;">You've been assigned a new cleaning appointment!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #71797E;">
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>📅 Date:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>👤 Customer:</strong> ${booking.name}</p>
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>📍 Address:</strong> ${booking.address}</p>
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>📞 Phone:</strong> ${booking.phone}</p>
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>🏠 Size:</strong> ${booking.sqft?.toLocaleString()} sq ft</p>
              <p style="margin: 0 0 8px 0; color: #36454F;"><strong>🛏️ Bedrooms:</strong> ${booking.bedrooms}</p>
              <p style="margin: 0; color: #36454F;"><strong>🚿 Bathrooms:</strong> ${booking.bathrooms}</p>
            </div>
            
            <div style="background: #71797E10; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #71797E; margin: 0 0 12px 0; font-size: 14px;">📋 REMINDERS</h3>
              <ul style="color: #36454F; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Text the customer 15 minutes before you arrive</li>
                <li>Use Branch Basics products only</li>
                <li>Take before/after photos when possible</li>
                <li>Lock up when leaving if customer isn't home</li>
              </ul>
            </div>
            
            <p style="color: #36454F; font-size: 14px;">
              Questions? Contact Peter & Claira at <a href="tel:6302670096" style="color: #71797E;">(630) 267-0096</a>
            </p>
            
            <p style="color: #36454F; font-size: 14px; margin-top: 24px;">
              Thank you for being part of the Willow & Water team! 💚
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            Willow & Water Organic Cleaning • Fox Valley, IL
          </p>
        </div>
      `,
    }),
  })

  return response.ok
}
