# Cleaner Management System Setup

This guide explains how to set up the automated cleaner assignment and notification system.

## Overview

The system automatically:
1. **Assigns cleaners** to bookings using round-robin (fair distribution)
2. **Emails cleaners** when they're assigned a new job
3. **Sends weekly schedules** every Saturday to each cleaner

---

## Step 1: Run the Database Migration

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Copy the contents of migrations/001_cleaners_table.sql here
```

This creates:
- `cleaners` table with round-robin tracking
- Adds `cleaner_id` to bookings
- Creates helpful views for schedules

---

## Step 2: Add Your Cleaners

In Supabase Dashboard → Table Editor → cleaners:

Add your team members with:
- **name**: Full name
- **email**: Their email for notifications
- **phone**: Contact number
- **available_days**: Array of days they work, e.g., `["monday", "tuesday", "wednesday", "thursday", "friday"]`
- **service_areas**: Areas they cover, e.g., `["st-charles", "geneva", "batavia"]`
- **status**: `active`, `inactive`, or `on_leave`

---

## Step 3: Set Up Email Service (Resend)

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key
3. Add to Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

Or in Dashboard → Settings → Edge Functions → Add new secret

---

## Step 4: Deploy Edge Functions

```bash
# Deploy the assign-cleaner function
supabase functions deploy assign-cleaner

# Deploy the weekly schedule function
supabase functions deploy send-weekly-schedules
```

---

## Step 5: Set Up Automatic Assignment

Update your `stripe-webhook` function to call `assign-cleaner` after payment confirmation:

```typescript
// In stripe-webhook/index.ts, after updating booking status:
if (event.type === 'checkout.session.completed') {
  // ... existing booking update code ...
  
  // Automatically assign a cleaner
  const assignResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/assign-cleaner`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId: booking.id }),
    }
  );
}
```

---

## Step 6: Set Up Saturday Schedule Cron Job

Use Supabase's pg_cron to send weekly schedules every Saturday at 8 AM:

Run in SQL Editor:

```sql
-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly email every Saturday at 8 AM Central Time
SELECT cron.schedule(
  'send-weekly-schedules',
  '0 14 * * 6',  -- 8 AM Central = 14:00 UTC (adjust for daylight saving)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-schedules',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

---

## Testing

### Test Cleaner Assignment

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/assign-cleaner' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"bookingId": "your-booking-uuid"}'
```

### Test Weekly Schedule

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-weekly-schedules' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## How Round-Robin Works

1. When a booking needs a cleaner, the system:
   - Finds all **active** cleaners
   - Filters by those **available** on the scheduled day
   - Picks the one with the **oldest** `last_assigned_at` (or never assigned)
   
2. After assignment:
   - Updates `last_assigned_at` to now
   - Increments `total_assignments`
   - This ensures fair, rotating distribution

---

## Managing Cleaners

### Mark cleaner as unavailable
```sql
UPDATE cleaners SET status = 'on_leave' WHERE email = 'sarah@willowandwaterorganiccleaning.com';
```

### Change available days
```sql
UPDATE cleaners 
SET available_days = ARRAY['monday', 'wednesday', 'friday'] 
WHERE email = 'maria@willowandwaterorganiccleaning.com';
```

### View cleaner workload
```sql
SELECT name, total_assignments, last_assigned_at 
FROM cleaners 
WHERE status = 'active'
ORDER BY total_assignments DESC;
```

---

## Email Templates

The system sends two types of emails:

1. **Assignment Notification** - When a cleaner is assigned a new job
   - Customer details (name, address, phone)
   - Home specs (sqft, beds, baths)
   - Reminders checklist

2. **Weekly Schedule** - Every Saturday for the upcoming week
   - Summary of total cleanings and estimated hours
   - Day-by-day breakdown with all customer details
   - Weekly reminders

---

## Environment Variables Needed

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for cron jobs) |
| `RESEND_API_KEY` | Resend.com API key for emails |

---

## Troubleshooting

**Cleaner not being assigned?**
- Check if cleaner status is `active`
- Verify their `available_days` includes the booking day
- Check function logs in Supabase Dashboard

**Emails not sending?**
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery status
- Make sure the "from" email domain is verified in Resend

**Cron job not running?**
- Enable `pg_cron` and `pg_net` extensions
- Check cron job exists: `SELECT * FROM cron.job;`
- Verify the schedule time is correct for your timezone
