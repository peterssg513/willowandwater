// Demo data for testing the admin portal without Supabase
// This data is loaded into localStorage when running in demo mode

// Flag to track if demo data has been initialized this session
let demoDataInitialized = false;

export const DEMO_CLEANERS = [
  {
    id: 'demo-cleaner-1',
    name: 'Sarah Johnson',
    email: 'sarah@willowandwater.com',
    phone: '(630) 555-0101',
    status: 'active',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    service_areas: ['st-charles', 'geneva', 'batavia'],
    total_assignments: 45,
    last_assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Team lead. Excellent with deep cleans.',
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-cleaner-2',
    name: 'Maria Garcia',
    email: 'maria@willowandwater.com',
    phone: '(630) 555-0102',
    status: 'active',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    service_areas: ['st-charles', 'geneva', 'batavia', 'wayne', 'campton-hills', 'elburn'],
    total_assignments: 62,
    last_assigned_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Bilingual (English/Spanish). Very detail oriented.',
    created_at: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-cleaner-3',
    name: 'Jennifer Lee',
    email: 'jennifer@willowandwater.com',
    phone: '(630) 555-0103',
    status: 'active',
    available_days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    service_areas: ['geneva', 'batavia', 'wayne'],
    total_assignments: 38,
    last_assigned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Great with pets. Move-in/move-out specialist.',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_BOOKINGS = [
  {
    id: 'demo-booking-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(630) 555-1001',
    address: '123 Main St, St. Charles, IL 60174',
    service_area: 'St. Charles',
    sqft: 2200,
    bedrooms: 4,
    bathrooms: 3,
    frequency: 'biweekly',
    recurring_price: 195,
    first_clean_price: 245,
    deposit_amount: 49,
    status: 'confirmed',
    cleaner_id: 'demo-cleaner-1',
    scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cleaning_instructions: 'Please use unscented products. Dog is friendly.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-booking-2',
    name: 'Emily Wilson',
    email: 'emily.wilson@email.com',
    phone: '(630) 555-1002',
    address: '456 Oak Ave, Geneva, IL 60134',
    service_area: 'Geneva',
    sqft: 2800,
    bedrooms: 5,
    bathrooms: 3,
    frequency: 'weekly',
    recurring_price: 235,
    first_clean_price: 285,
    deposit_amount: 57,
    status: 'confirmed',
    cleaner_id: 'demo-cleaner-2',
    scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cleaning_instructions: 'Key under mat. Please text when done.',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-booking-3',
    name: 'Michael Brown',
    email: 'michael.b@email.com',
    phone: '(630) 555-1003',
    address: '789 Elm Rd, Batavia, IL 60510',
    service_area: 'Batavia',
    sqft: 1800,
    bedrooms: 3,
    bathrooms: 2,
    frequency: 'monthly',
    recurring_price: 165,
    first_clean_price: 215,
    deposit_amount: 43,
    status: 'lead',
    scheduled_date: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-booking-4',
    name: 'Sarah Davis',
    email: 'sarah.d@email.com',
    phone: '(630) 555-1004',
    address: '321 Pine St, Wayne, IL 60184',
    service_area: 'Wayne',
    sqft: 3200,
    bedrooms: 5,
    bathrooms: 4,
    frequency: 'biweekly',
    recurring_price: 275,
    first_clean_price: 325,
    deposit_amount: 65,
    status: 'completed',
    cleaner_id: 'demo-cleaner-3',
    scheduled_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-booking-5',
    name: 'Robert Taylor',
    email: 'rob.taylor@email.com',
    phone: '(630) 555-1005',
    address: '654 Maple Dr, Campton Hills, IL 60175',
    service_area: 'Campton Hills',
    sqft: 2500,
    bedrooms: 4,
    bathrooms: 3,
    frequency: 'onetime',
    recurring_price: null,
    first_clean_price: 295,
    deposit_amount: 59,
    status: 'payment_initiated',
    scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-booking-6',
    name: 'Lisa Anderson',
    email: 'lisa.a@email.com',
    phone: '(630) 555-1006',
    address: '987 Birch Ln, St. Charles, IL 60174',
    service_area: 'St. Charles',
    sqft: 1600,
    bedrooms: 3,
    bathrooms: 2,
    frequency: 'weekly',
    recurring_price: 145,
    first_clean_price: 195,
    deposit_amount: 39,
    status: 'confirmed',
    cleaner_id: 'demo-cleaner-1',
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_EXPENSES = [
  {
    id: 'demo-expense-1',
    description: 'Cleaning supplies - Mrs. Meyers',
    amount: 89.50,
    category: 'supplies',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendor: 'Amazon',
    notes: 'Multi-surface cleaners and dish soap',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-expense-2',
    description: 'Gas for company vehicle',
    amount: 65.00,
    category: 'vehicle',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendor: 'Shell',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-expense-3',
    description: 'Vacuum cleaner replacement',
    amount: 299.99,
    category: 'equipment',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendor: 'Best Buy',
    notes: 'Dyson V15 for deep cleaning jobs',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-expense-4',
    description: 'Liability insurance - quarterly',
    amount: 450.00,
    category: 'insurance',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendor: 'State Farm',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-expense-5',
    description: 'Facebook ads campaign',
    amount: 150.00,
    category: 'marketing',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendor: 'Meta',
    notes: 'Local targeting for Fox Valley area',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Function to initialize demo data in localStorage
export const initializeDemoData = (force = false) => {
  // Prevent multiple initializations in the same session unless forced
  if (demoDataInitialized && !force) {
    return;
  }
  
  try {
    // Helper to check if data is valid
    const isValidData = (data) => {
      if (!data) return false;
      if (data === '[]' || data === 'null' || data === 'undefined') return false;
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    };
    
    // Check and initialize cleaners
    const existingCleaners = localStorage.getItem('cleaners');
    if (force || !isValidData(existingCleaners)) {
      localStorage.setItem('cleaners', JSON.stringify(DEMO_CLEANERS));
      console.log('Initialized demo cleaners data');
    }
    
    // Check and initialize bookings
    const existingBookings = localStorage.getItem('bookings');
    if (force || !isValidData(existingBookings)) {
      localStorage.setItem('bookings', JSON.stringify(DEMO_BOOKINGS));
      console.log('Initialized demo bookings data');
    }
    
    // Check and initialize expenses
    const existingExpenses = localStorage.getItem('expenses');
    if (force || !isValidData(existingExpenses)) {
      localStorage.setItem('expenses', JSON.stringify(DEMO_EXPENSES));
      console.log('Initialized demo expenses data');
    }
    
    demoDataInitialized = true;
    console.log('Demo data initialization complete');
  } catch (error) {
    console.error('Error initializing demo data:', error);
    // Force set data even on error
    try {
      localStorage.setItem('cleaners', JSON.stringify(DEMO_CLEANERS));
      localStorage.setItem('bookings', JSON.stringify(DEMO_BOOKINGS));
      localStorage.setItem('expenses', JSON.stringify(DEMO_EXPENSES));
    } catch (e) {
      console.error('Failed to force set demo data:', e);
    }
  }
};

// Function to reset demo data
export const resetDemoData = () => {
  localStorage.setItem('cleaners', JSON.stringify(DEMO_CLEANERS));
  localStorage.setItem('bookings', JSON.stringify(DEMO_BOOKINGS));
  localStorage.setItem('expenses', JSON.stringify(DEMO_EXPENSES));
  demoDataInitialized = true;
};

// Function to check if we have any data
export const hasAnyData = () => {
  try {
    const cleaners = JSON.parse(localStorage.getItem('cleaners') || '[]');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    return cleaners.length > 0 || bookings.length > 0;
  } catch {
    return false;
  }
};

// Auto-initialize on module load to ensure data is always available
initializeDemoData();
