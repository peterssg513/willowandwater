# Willow & Water v2.0 — Complete System Specification

## Overview

A comprehensive cleaning business operating system with:
- Customer-facing booking flow with scheduling, add-ons, and payments
- Full admin CRM for managing customers, jobs, cleaners, and inventory
- Automated communications (email/SMS) throughout the customer lifecycle
- Activity logging and communications tracking

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Payments**: Stripe (deposits, saved cards, per-job charges)
- **Communications**: Twilio (SMS) + Resend (Email)
- **Icons**: Lucide React

---

## Database Schema

### Core Tables

#### `customers`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Unique, required |
| phone | TEXT | Required |
| name | TEXT | Required |
| address | TEXT | Street address |
| city | TEXT | City |
| zip | TEXT | ZIP code |
| service_area | TEXT | Service area name |
| sqft | INTEGER | Property square footage |
| bedrooms | INTEGER | Number of bedrooms |
| bathrooms | DECIMAL | Number of bathrooms |
| access_type | TEXT | lockbox, garage_code, hidden_key, customer_home, other |
| access_instructions | TEXT | Detailed access notes |
| status | TEXT | prospect, active, paused, churned |
| stripe_customer_id | TEXT | Stripe customer ID |
| referral_code | TEXT | Unique referral code |
| referred_by_customer_id | UUID | FK to customers |
| credit_balance | DECIMAL | Available credits |
| google_review_requested | BOOLEAN | Whether review was requested |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

#### `subscriptions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | FK to customers |
| frequency | TEXT | weekly, biweekly, monthly, onetime |
| preferred_day | TEXT | monday-sunday |
| preferred_time | TEXT | morning, afternoon |
| base_price | DECIMAL | Base recurring price |
| status | TEXT | pending, active, paused, cancelled |
| started_at | TIMESTAMPTZ | When subscription started |
| paused_at | TIMESTAMPTZ | When paused |
| cancelled_at | TIMESTAMPTZ | When cancelled |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `jobs`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | FK to customers |
| subscription_id | UUID | FK to subscriptions (nullable) |
| cleaner_id | UUID | FK to cleaners (nullable) |
| scheduled_date | DATE | Date of job |
| scheduled_time | TEXT | morning, afternoon |
| duration_minutes | INTEGER | Estimated duration |
| job_type | TEXT | first_clean, recurring, one_time |
| base_price | DECIMAL | Base service price |
| addons_price | DECIMAL | Total add-ons price |
| total_price | DECIMAL | Total before credits/discounts |
| discount_amount | DECIMAL | Discounts applied |
| final_price | DECIMAL | Final amount to charge |
| deposit_amount | DECIMAL | 20% deposit |
| deposit_paid_at | TIMESTAMPTZ | When deposit paid |
| deposit_payment_intent_id | TEXT | Stripe PI for deposit |
| remaining_amount | DECIMAL | 80% remaining |
| remaining_paid_at | TIMESTAMPTZ | When remaining paid |
| remaining_payment_intent_id | TEXT | Stripe PI for remaining |
| tip_amount | DECIMAL | Tip amount |
| tip_payment_intent_id | TEXT | Stripe PI for tip |
| status | TEXT | pending_payment, scheduled, confirmed, in_progress, completed, cancelled, no_show |
| payment_status | TEXT | pending, deposit_paid, paid, failed, refunded |
| cleaner_started_at | TIMESTAMPTZ | When cleaner started |
| cleaner_completed_at | TIMESTAMPTZ | When cleaner finished |
| actual_duration_minutes | INTEGER | Actual time taken |
| customer_rating | INTEGER | 1-5 rating |
| customer_feedback | TEXT | Feedback text |
| google_review_sent | BOOLEAN | Whether review request sent |
| cancellation_fee | DECIMAL | Fee if cancelled late |
| cancelled_at | TIMESTAMPTZ | When cancelled |
| cancellation_reason | TEXT | Reason for cancellation |
| special_instructions | TEXT | Special notes for this job |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

#### `cleaners`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Full name |
| email | TEXT | Email address |
| phone | TEXT | Phone number |
| service_areas | TEXT[] | Array of service areas |
| status | TEXT | active, inactive |
| hire_date | DATE | Date hired |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `cleaner_time_off`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cleaner_id | UUID | FK to cleaners |
| start_date | DATE | Start of PTO |
| end_date | DATE | End of PTO |
| reason | TEXT | Reason |
| created_by | UUID | Admin who created |
| created_at | TIMESTAMPTZ | Created timestamp |

### Supporting Tables

#### `addon_services`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Service name |
| description | TEXT | Description |
| price | DECIMAL | Price |
| duration_minutes | INTEGER | Added time |
| is_active | BOOLEAN | Whether available |
| display_order | INTEGER | Sort order |

#### `job_addons`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| addon_service_id | UUID | FK to addon_services |
| name | TEXT | Name at time of booking |
| price | DECIMAL | Price at time of booking |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `activity_log`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| entity_type | TEXT | customer, job, cleaner, etc. |
| entity_id | UUID | ID of entity |
| action | TEXT | created, updated, status_changed, etc. |
| actor_type | TEXT | customer, admin, system, cleaner |
| actor_id | UUID | ID of actor (nullable) |
| details | JSONB | Additional details |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `customer_notes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | FK to customers |
| note_type | TEXT | call, email, internal, complaint, compliment |
| content | TEXT | Note content |
| created_by | UUID | Admin who created |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `communications_log`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipient_type | TEXT | customer, cleaner |
| recipient_id | UUID | FK to recipient |
| recipient_contact | TEXT | Email or phone |
| channel | TEXT | email, sms |
| template | TEXT | Template name used |
| subject | TEXT | Email subject (if email) |
| content | TEXT | Message content |
| status | TEXT | sent, delivered, failed, bounced |
| external_id | TEXT | Twilio/Resend message ID |
| related_entity_type | TEXT | job, customer, etc. |
| related_entity_id | UUID | Related entity ID |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `payments`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | FK to customers |
| job_id | UUID | FK to jobs (nullable) |
| amount | DECIMAL | Payment amount |
| payment_type | TEXT | deposit, remaining, recurring, tip, cancellation_fee |
| stripe_payment_intent_id | TEXT | Stripe PI ID |
| status | TEXT | succeeded, failed, refunded, pending |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `customer_credits`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | FK to customers |
| amount | DECIMAL | Credit amount |
| reason | TEXT | Reason for credit |
| applied_to_job_id | UUID | Job where applied |
| expires_at | TIMESTAMPTZ | Expiration date |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `referrals`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| referrer_customer_id | UUID | FK to customers |
| referred_customer_id | UUID | FK to customers |
| referral_code_used | TEXT | Code used |
| status | TEXT | pending, completed, credited |
| credit_amount | DECIMAL | Credit amount (default $25) |
| credited_at | TIMESTAMPTZ | When credit applied |
| created_at | TIMESTAMPTZ | Created timestamp |

#### `inventory`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Item name |
| category | TEXT | Category |
| quantity | INTEGER | Current quantity |
| unit | TEXT | Unit type (bottles, packs, etc.) |
| reorder_threshold | INTEGER | When to reorder |
| reorder_quantity | INTEGER | How much to reorder |
| purchase_url | TEXT | Link to buy |
| cost_per_unit | DECIMAL | Cost per unit |
| last_restock_date | DATE | Last restocked |
| status | TEXT | in_stock, low_stock, out_of_stock |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

#### `admin_users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Supabase auth user ID |
| role | TEXT | owner, manager |
| name | TEXT | Display name |
| email | TEXT | Email |
| created_at | TIMESTAMPTZ | Created timestamp |

---

## Payment Flow

### First Clean Booking
1. Customer completes booking flow
2. Charge 20% deposit immediately
3. Save card on file (Stripe SetupIntent)
4. Morning of job: Charge remaining 80%
5. After job complete: Send receipt

### Recurring Clean
1. Job marked complete by cleaner
2. System generates next job based on frequency
3. Charge customer for completed job
4. Send receipt

### Tips
- Optional during booking
- Optional after job (via text link)
- Charged separately, tracked separately

### Cancellation Fees
| Timeframe | Fee |
|-----------|-----|
| 48+ hours | Free |
| 24-48 hours | $25 |
| <24 hours / Same day | Full charge |
| No-show | Full charge |

---

## Automated Communications

### Customer Messages

| Trigger | Channel | Template |
|---------|---------|----------|
| Booking confirmed | Email + SMS | booking_confirmed |
| Day before job | SMS | day_before_reminder |
| Remaining charged | SMS | remaining_charged |
| Charge failed | SMS + Email | charge_failed |
| Cleaner on the way | SMS | cleaner_on_way |
| Job complete | Email + SMS | job_complete |
| Feedback request | SMS | feedback_request |
| Rating 4-5 received | SMS | google_review_request |
| Rating 1-3 received | SMS | low_rating_response |
| 3 days after one-time | SMS | recurring_upsell |
| Referral credit earned | SMS | referral_credit |

### Cleaner Messages

| Trigger | Channel | Template |
|---------|---------|----------|
| Saturday 8am | Email | weekly_schedule |
| Job assigned | SMS | job_assigned |
| Day before | SMS | cleaner_day_before |

---

## Scheduling Logic

### Availability Calculation
- Working hours: 9am-5pm (no weekends)
- Booking window: 1 week to 2 months out
- Time blocks: Morning (9am-12pm), Afternoon (1pm-5pm)
- Capacity: Number of available cleaners per block

### Cleaner Availability
- Active cleaners with matching service area
- Not on PTO for that date
- Not already assigned to a job in that block

### Auto-Assignment
1. Previous cleaner for this customer (continuity)
2. Cleaner covering service area
3. Cleaner with fewest jobs that week (balance)

---

## Admin Portal Structure

### Navigation
- Dashboard (overview, alerts)
- Customers (full CRM)
- Schedule (calendar view)
- Cleaners (team management)
- Inventory (supplies)
- Communications (all sent messages)
- Payments (owner only)
- Settings (owner only)

### Role Permissions

| Feature | Owner | Manager |
|---------|-------|---------|
| Dashboard | ✅ | ✅ |
| Customers | ✅ | ✅ |
| Schedule | ✅ | ✅ |
| Cleaners | ✅ | ✅ |
| Inventory | ✅ | ✅ |
| Communications | ✅ | ✅ |
| Payments | ✅ | ❌ |
| Settings | ✅ | ❌ |

---

## Add-On Services (Default)

| Service | Price | Duration |
|---------|-------|----------|
| Inside Fridge Cleaning | $35 | 30 min |
| Inside Oven Cleaning | $25 | 20 min |
| Interior Windows (per floor) | $50 | 45 min |
| Laundry - Wash/Dry/Fold (1 load) | $30 | 60 min |
| Organize Pantry | $40 | 30 min |
| Organize Closet | $40 | 30 min |
| Baseboards Deep Clean | $30 | 30 min |
| Garage Sweep | $25 | 20 min |

---

## Duration Calculation

```javascript
function getCleaningDuration(sqft, bedrooms, bathrooms, isFirstClean) {
  // Base: 30 mins per 500 sqft
  let minutes = Math.ceil(sqft / 500) * 30;
  
  // +15 mins per bathroom over 2
  minutes += Math.max(0, bathrooms - 2) * 15;
  
  // First clean = 1.5x
  if (isFirstClean) {
    minutes = Math.ceil(minutes * 1.5);
  }
  
  // Round to nearest 30
  return Math.ceil(minutes / 30) * 30;
}
```

---

## File Structure

```
src/
├── admin/
│   ├── AdminLayout.jsx
│   ├── AdminLogin.jsx
│   ├── Dashboard.jsx
│   ├── Customers.jsx
│   ├── CustomerDetail.jsx
│   ├── Schedule.jsx
│   ├── Cleaners.jsx
│   ├── Inventory.jsx
│   ├── Communications.jsx
│   ├── Payments.jsx
│   └── Settings.jsx
├── components/
│   ├── booking/
│   │   ├── BookingFlow.jsx
│   │   ├── QuoteStep.jsx
│   │   ├── ContactStep.jsx
│   │   ├── ScheduleStep.jsx
│   │   ├── PaymentStep.jsx
│   │   └── ConfirmationStep.jsx
│   ├── (existing public components...)
├── lib/
│   ├── supabaseClient.js
│   ├── stripeClient.js
│   └── database.types.js
├── utils/
│   ├── pricingLogic.js
│   ├── scheduling.js
│   └── formatting.js
└── hooks/
    ├── useCustomer.js
    ├── useJobs.js
    └── useAuth.js

supabase/
├── migrations/
│   └── 000_complete_schema.sql
└── functions/
    ├── create-booking/
    ├── charge-remaining/
    ├── complete-job/
    ├── send-communication/
    └── weekly-schedules/
```
