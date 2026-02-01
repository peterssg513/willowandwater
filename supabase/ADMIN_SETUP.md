# Admin Portal Setup Guide

This guide will help you set up the admin portal for Willow & Water Organic Cleaning.

## Quick Start

1. **Access the Admin Portal**: Navigate to `/admin` on your website
2. **Login**: Use your Supabase auth credentials at `/admin/login`

## Demo Mode (No Setup Required!)

If Supabase is not configured, the admin portal automatically runs in **Demo Mode**:

- Access the portal at `/admin/login` and click "Enter Demo Mode"
- All features work with sample data stored in your browser's localStorage
- Perfect for exploring the admin portal before connecting Supabase
- Changes you make in demo mode persist locally until you clear browser data

Demo mode includes:
- 3 sample team members (cleaners)
- 6 sample bookings at various stages
- Sample expense records
- All dashboard metrics calculated from demo data

To exit demo mode and use production data, add your Supabase credentials to `.env`.

## Setting Up Admin Authentication

### Option 1: Create Admin User via Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User** → **Create New User**
5. Enter:
   - Email: `admin@willowandwaterorganiccleaning.com` (or your preferred email)
   - Password: Choose a strong password
   - Check "Auto Confirm User"
6. Click **Create User**

### Option 2: Create Admin User via SQL

Run this in the Supabase SQL Editor:

```sql
-- Create an admin user (replace with your email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@willowandwaterorganiccleaning.com',
  crypt('your-secure-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
);
```

## Database Migrations

Make sure to run the database migrations to set up the necessary tables.

Run these migrations in order via the Supabase SQL Editor:

### 0. Bookings Table (000_bookings_table.sql)
Creates the core bookings table with:
- Customer information (name, email, phone, address)
- Property details (sqft, bedrooms, bathrooms)
- Service details (frequency, instructions)
- Pricing (recurring price, first clean price, deposit)
- Status tracking
- RLS policies for security

### 1. Cleaners Table (001_cleaners_table.sql)
Creates the cleaners management system:
- Team member profiles
- Availability (days of week)
- Service areas
- Assignment tracking (round-robin support)
- Links cleaners to bookings

### 2. Page Views Table (002_page_views_table.sql)
Creates analytics tracking:
- Page view logging
- Session tracking
- Device/browser detection
- UTM parameter tracking
- RLS policies (anonymous insert, authenticated read)

### 3. Expenses Table (003_expenses_table.sql)
Creates expense tracking:
- Expense categories
- Vendor tracking
- Receipt URLs
- Date tracking

## Admin Portal Features

### Dashboard (`/admin`)
- Overview of key metrics (revenue, bookings, cleaners)
- Pending leads alert
- Recent bookings list
- Upcoming cleanings
- Quick action buttons

### Bookings (`/admin/bookings`)
- View all bookings with search and filters
- Filter by status (lead, confirmed, completed, etc.)
- Click any booking to view/edit details
- Assign cleaners to bookings
- Export bookings as CSV

### Cleaners (`/admin/cleaners`)
- View all team members
- Add new cleaners
- Edit cleaner details (name, email, phone)
- Set availability (days of the week)
- Set service areas
- Change cleaner status (active, inactive, on leave)
- Remove cleaners

### Schedule (`/admin/schedule`)
- Calendar view of all cleanings
- Filter by cleaner
- Color-coded by assignment status
- Click appointments for details
- Weekly summary with stats

### Revenue (`/admin/revenue`)
- Total revenue tracking
- Revenue by time period (7d, 30d, 90d, YTD, all time)
- Average order value
- Recurring revenue calculation
- Revenue breakdown by frequency
- Revenue breakdown by service area
- Daily revenue chart
- Export revenue reports

### Recurring Jobs (`/admin/recurring`)
- View all recurring customers
- Filter by frequency (weekly, bi-weekly, monthly)
- Pause/resume service
- View next scheduled cleaning
- Estimated monthly recurring revenue

### Customers (`/admin/customers`)
- CRM-style customer management
- Search and filter customers
- View customer history (all bookings)
- Customer details (contact info, property details)
- Add internal notes
- Track total spend per customer

### Expenses (`/admin/expenses`)
- Track business expenses
- Categories: supplies, equipment, vehicle, labor, insurance, marketing, software, other
- Calculate profit (revenue - expenses)
- Filter by category and time range
- Export expenses as CSV

### Reports (`/admin/reports`)
- Generate business reports
- Report types: Revenue, Bookings, Customers, Team Performance, Service Areas
- Filter by time range
- Export reports as CSV

### Checklists (`/admin/checklists`)
- Create cleaning checklists for standardization
- Organize tasks by category (Kitchen, Bathrooms, Living Areas, etc.)
- Mark tasks as required or optional
- Duplicate and edit checklists

### Communications (`/admin/communications`)
- Message templates (booking confirmation, reminder, thank you, reschedule)
- Send messages to customers or team
- Placeholder replacement for personalization
- Quick actions for upcoming booking reminders

### Activity Log (`/admin/activity`)
- Audit trail of business activities
- Track bookings, payments, team changes
- Filter by activity type
- Search across all activities

### Analytics (`/admin/analytics`)
- Page views tracking
- Unique visitors
- Traffic sources
- Device breakdown
- Conversion funnel
- Top pages

### Settings (`/admin/settings`)
- Business information
- Integration status (Cal.com, Google Calendar)
- Notification preferences
- Pricing policies
- Operating hours
- Service areas
- Payment settings

## Optional: Custom Page View Tracking

To track page views with your own Supabase table instead of Google Analytics:

Add this component to your app:

```jsx
// src/components/PageViewTracker.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      // Generate or get session ID
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('session_id', sessionId);
      }

      await supabase.from('page_views').insert({
        page_path: location.pathname,
        page_title: document.title,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        referrer: document.referrer || null,
      });
    };

    trackPageView();
  }, [location.pathname]);

  return null;
};

export default PageViewTracker;
```

Then add it to your App.jsx:

```jsx
import PageViewTracker from './components/PageViewTracker';

// In your App component's return:
<>
  <PageViewTracker />
  <Routes>
    {/* your routes */}
  </Routes>
</>
```

## Security Considerations

1. **Use strong passwords** for admin accounts
2. **Enable RLS** on all tables (migrations include this)
3. **Regularly rotate** admin credentials
4. **Monitor** login attempts via Supabase Auth logs

## Troubleshooting

### "Supabase not configured" errors
Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Can't log in
1. Verify the user exists in Supabase Auth → Users
2. Check that email is confirmed
3. Try resetting the password via Supabase Dashboard

### Page views not tracking
1. Run the `002_page_views_table.sql` migration
2. Add the PageViewTracker component to your app
3. Check browser console for errors

## Support

For issues with the admin portal, check:
1. Browser console for JavaScript errors
2. Supabase Dashboard for database/auth issues
3. Network tab for failed API requests
