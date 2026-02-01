/**
 * Communication Templates for Willow & Water
 * 
 * All SMS and Email templates used throughout the customer lifecycle
 */

// ============================================
// SMS TEMPLATES
// ============================================

export const SMS_TEMPLATES = {
  // Booking Confirmed
  booking_confirmed: ({ customerName, date, time, address }) => 
    `Hi ${customerName}! 🌿 Your Willow & Water cleaning is confirmed for ${date} (${time}). We'll text you when your cleaner is on the way! Address on file: ${address}`,

  // Day Before Reminder
  day_before_reminder: ({ customerName, date, time }) =>
    `Hi ${customerName}! Quick reminder: Your Willow & Water cleaning is tomorrow, ${date} (${time}). We'll text when your cleaner is on the way. Reply STOP to unsubscribe.`,

  // Remaining Balance Charged
  remaining_charged: ({ customerName, amount }) =>
    `Hi ${customerName}! Your cleaning is today! We've charged the remaining ${amount} to your card on file. Your cleaner will arrive during your scheduled window. 🏠✨`,

  // Charge Failed
  charge_failed: ({ customerName, amount }) =>
    `Hi ${customerName}, we couldn't process your payment of ${amount} for today's cleaning. Please update your card or reply to reschedule. Call us at (630) 555-0123 if you need help.`,

  // Cleaner On The Way
  cleaner_on_way: ({ customerName, cleanerName }) =>
    `Hi ${customerName}! ${cleanerName} from Willow & Water is on the way to your home now. They should arrive within 15-20 minutes. 🚗`,

  // Job Complete
  job_complete: ({ customerName }) =>
    `Hi ${customerName}! Your home is sparkling clean! ✨ We hope you love it. We'd really appreciate your feedback - reply with a rating 1-5.`,

  // Feedback Request (if no response to job_complete)
  feedback_request: ({ customerName }) =>
    `Hi ${customerName}! How was your cleaning? We'd love to hear your feedback. Reply with 1-5 (5 being best). Your opinion helps us improve! 🌿`,

  // Google Review Request (after 4-5 star rating)
  google_review_request: ({ customerName }) =>
    `Thank you so much ${customerName}! We're thrilled you loved your cleaning! 💚 If you have a moment, a Google review would mean the world to us: https://g.page/r/willowandwater/review`,

  // Low Rating Response (1-3 stars)
  low_rating_response: ({ customerName }) =>
    `Hi ${customerName}, we're sorry your cleaning didn't meet expectations. Your feedback is important to us. A manager will reach out shortly to make this right. 🌿`,

  // Recurring Upsell (3 days after one-time clean)
  recurring_upsell: ({ customerName, discountPercent }) =>
    `Hi ${customerName}! Loved your Willow & Water clean? Get ${discountPercent}% off when you switch to recurring service! Reply YES to learn more or book at willowandwaterorganiccleaning.com 🌿`,

  // Referral Credit Earned
  referral_credit: ({ customerName, creditAmount, referredName }) =>
    `Hi ${customerName}! 🎉 ${referredName} just booked using your referral! You've earned $${creditAmount} credit toward your next cleaning. Thank you for spreading the word! 💚`,

  // Subscription Paused
  subscription_paused: ({ customerName }) =>
    `Hi ${customerName}, your Willow & Water subscription has been paused. You can reactivate anytime at willowandwaterorganiccleaning.com or reply to this message. We'll be here when you need us! 🌿`,

  // Cancellation Confirmation
  cancellation_confirmed: ({ customerName, date, fee }) =>
    fee > 0 
      ? `Hi ${customerName}, your cleaning for ${date} has been cancelled. A ${fee} cancellation fee has been charged per our policy. Reply with questions.`
      : `Hi ${customerName}, your cleaning for ${date} has been cancelled. No cancellation fee since you gave us 48+ hours notice. See you next time! 🌿`,
};

// ============================================
// EMAIL TEMPLATES
// ============================================

export const EMAIL_TEMPLATES = {
  // Booking Confirmed Email
  booking_confirmed: ({ customerName, date, time, address, price, depositPaid, remainingAmount }) => ({
    subject: `Your Willow & Water Cleaning is Confirmed! 🌿`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6EE; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #71797E; font-size: 28px; margin: 0;">Willow & Water</h1>
          <p style="color: #36454F; opacity: 0.6; margin: 5px 0 0 0; font-size: 14px;">Organic Home Cleaning</p>
        </div>

        <!-- Confirmation Badge -->
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background-color: #71797E; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; display: inline-block;">
            ✓ Booking Confirmed
          </span>
        </div>

        <!-- Greeting -->
        <h2 style="color: #36454F; font-size: 24px; margin-bottom: 20px;">Hi ${customerName}!</h2>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Your cleaning has been scheduled! We're looking forward to making your home sparkle with our eco-friendly, plant-based products.
        </p>

        <!-- Appointment Details -->
        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
          <h3 style="color: #36454F; font-size: 18px; margin: 0 0 15px 0;">Appointment Details</h3>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #36454F; opacity: 0.7; font-size: 14px;">Address</td>
              <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right; font-weight: 600;">${address}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Summary -->
        <div style="background-color: #71797E; background: linear-gradient(135deg, #71797E 0%, #5a6268 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; color: white;">
          <h3 style="font-size: 18px; margin: 0 0 15px 0;">Payment Summary</h3>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; opacity: 0.9; font-size: 14px;">Total</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">$${price}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; opacity: 0.9; font-size: 14px;">Deposit Paid</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">$${depositPaid}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.2);">
              <td style="padding: 12px 0 0 0; font-weight: 600; font-size: 16px;">Due on Cleaning Day</td>
              <td style="padding: 12px 0 0 0; font-size: 16px; text-align: right; font-weight: 600;">$${remainingAmount}</td>
            </tr>
          </table>
        </div>

        <!-- What's Next -->
        <h3 style="color: #36454F; font-size: 18px; margin-bottom: 15px;">What's Next?</h3>
        <ul style="color: #36454F; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
          <li>The remaining balance will be charged the morning of your cleaning</li>
          <li>We'll text you when your cleaner is on the way</li>
          <li>Make sure your home is accessible at your scheduled time</li>
        </ul>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://www.willowandwaterorganiccleaning.com" style="background-color: #71797E; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Manage Your Booking
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #36454F; opacity: 0.5; font-size: 12px; margin: 0;">
            Questions? Reply to this email or call us at (630) 555-0123
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
    `,
  }),

  // Job Complete Email
  job_complete: ({ customerName, date, cleanerName, feedbackUrl }) => ({
    subject: `Your Home is Sparkling Clean! ✨`,
    html: `
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
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #71797E; font-size: 28px; margin: 0;">Willow & Water</h1>
        </div>

        <!-- Icon -->
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">✨</span>
        </div>

        <h2 style="color: #36454F; font-size: 24px; margin-bottom: 20px; text-align: center;">Your Home is Clean!</h2>
        
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${customerName},
        </p>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          ${cleanerName} has completed your cleaning on ${date}. We hope your home feels fresh and inviting!
        </p>

        <!-- Feedback Request -->
        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
          <h3 style="color: #36454F; font-size: 18px; margin: 0 0 10px 0;">How did we do?</h3>
          <p style="color: #36454F; opacity: 0.7; font-size: 14px; margin: 0 0 20px 0;">
            Your feedback helps us improve and lets our cleaners know they're doing a great job!
          </p>
          <a href="${feedbackUrl}" style="background-color: #71797E; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Rate Your Clean
          </a>
        </div>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
          Thank you for choosing Willow & Water! 🌿
        </p>

        <!-- Footer -->
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
    `,
  }),

  // Charge Failed Email
  charge_failed: ({ customerName, amount, updatePaymentUrl }) => ({
    subject: `Action Required: Payment Issue for Your Cleaning`,
    html: `
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

        <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <span style="font-size: 32px;">⚠️</span>
          <h2 style="color: #991B1B; font-size: 20px; margin: 10px 0 0 0;">Payment Issue</h2>
        </div>

        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${customerName},
        </p>
        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          We were unable to charge $${amount} to your card on file for your upcoming cleaning. To keep your appointment, please update your payment method.
        </p>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${updatePaymentUrl}" style="background-color: #71797E; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Update Payment Method
          </a>
        </div>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6;">
          If you need help or want to reschedule, reply to this email or call us at (630) 555-0123.
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
    `,
  }),

  // Receipt/Invoice Email
  receipt: ({ customerName, date, items, total, paymentMethod }) => ({
    subject: `Receipt for Your Willow & Water Cleaning`,
    html: `
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
          <p style="color: #36454F; opacity: 0.6; margin: 5px 0 0 0; font-size: 14px;">Payment Receipt</p>
        </div>

        <p style="color: #36454F; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Hi ${customerName}, here's your receipt for your cleaning on ${date}.
        </p>

        <div style="background-color: #F9F6EE; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            ${items.map(item => `
              <tr>
                <td style="padding: 8px 0; color: #36454F; font-size: 14px;">${item.name}</td>
                <td style="padding: 8px 0; color: #36454F; font-size: 14px; text-align: right;">$${item.price}</td>
              </tr>
            `).join('')}
            <tr style="border-top: 2px solid #71797E;">
              <td style="padding: 15px 0 0 0; color: #36454F; font-size: 16px; font-weight: 600;">Total Paid</td>
              <td style="padding: 15px 0 0 0; color: #71797E; font-size: 18px; text-align: right; font-weight: 600;">$${total}</td>
            </tr>
          </table>
        </div>

        <p style="color: #36454F; opacity: 0.7; font-size: 14px; margin-bottom: 30px;">
          Paid with ${paymentMethod}
        </p>

        <p style="color: #36454F; font-size: 14px; line-height: 1.6;">
          Thank you for choosing Willow & Water! 🌿
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
    `,
  }),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format phone number for Twilio (E.164)
 */
export function formatPhoneE164(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Format time slot for display
 */
export function formatTimeSlotForComms(slot) {
  return slot === 'morning' ? '9am - 12pm' : '1pm - 5pm';
}

/**
 * Format date for display in communications
 */
export function formatDateForComms(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default {
  SMS_TEMPLATES,
  EMAIL_TEMPLATES,
  formatPhoneE164,
  formatTimeSlotForComms,
  formatDateForComms,
};
