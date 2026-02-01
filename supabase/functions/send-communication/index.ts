import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Twilio config
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

// Resend config
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Willow & Water <scheduling@willowandwaterorganiccleaning.com>'

// Supabase config
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendRequest {
  channel: 'sms' | 'email' | 'both'
  recipient_type: 'customer' | 'cleaner'
  recipient_id: string
  recipient_email?: string
  recipient_phone?: string
  template: string
  subject?: string
  content: string
  html_content?: string
  related_entity_type?: string
  related_entity_id?: string
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS')
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: to,
        Body: body,
      }),
    })

    const data = await response.json()

    if (response.ok && data.sid) {
      return { success: true, messageId: data.sid }
    } else {
      console.error('Twilio error:', data)
      return { success: false, error: data.message || 'Failed to send SMS' }
    }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send Email via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('Resend not configured, skipping email')
    return { success: false, error: 'Resend not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const data = await response.json()

    if (response.ok && data.id) {
      return { success: true, messageId: data.id }
    } else {
      console.error('Resend error:', data)
      return { success: false, error: data.message || 'Failed to send email' }
    }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Format phone to E.164
 */
function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  return `+${cleaned}`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const request: SendRequest = await req.json()

    const {
      channel,
      recipient_type,
      recipient_id,
      recipient_email,
      recipient_phone,
      template,
      subject,
      content,
      html_content,
      related_entity_type,
      related_entity_id,
    } = request

    const results: { sms?: any; email?: any } = {}

    // Send SMS
    if ((channel === 'sms' || channel === 'both') && recipient_phone) {
      const phone = formatPhoneE164(recipient_phone)
      const smsResult = await sendSMS(phone, content)
      results.sms = smsResult

      // Log to database
      await supabase.from('communications_log').insert({
        recipient_type,
        recipient_id,
        recipient_contact: phone,
        channel: 'sms',
        template,
        content,
        status: smsResult.success ? 'sent' : 'failed',
        external_id: smsResult.messageId,
        error_message: smsResult.error,
        related_entity_type,
        related_entity_id,
      })
    }

    // Send Email
    if ((channel === 'email' || channel === 'both') && recipient_email && subject) {
      const emailResult = await sendEmail(
        recipient_email,
        subject,
        html_content || `<p>${content}</p>`
      )
      results.email = emailResult

      // Log to database
      await supabase.from('communications_log').insert({
        recipient_type,
        recipient_id,
        recipient_contact: recipient_email,
        channel: 'email',
        template,
        subject,
        content: content.substring(0, 500), // Truncate for storage
        status: emailResult.success ? 'sent' : 'failed',
        external_id: emailResult.messageId,
        error_message: emailResult.error,
        related_entity_type,
        related_entity_id,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-communication:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
