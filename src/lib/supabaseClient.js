import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a placeholder client if credentials are missing
// This allows the site to load without Supabase configured
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  console.warn(
    'Supabase credentials not found. Admin portal will use demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable full functionality.'
  );
  
  // Create a chainable mock builder that returns empty data
  const createMockQueryBuilder = () => {
    const result = { data: [], error: null };
    const singleResult = { data: null, error: null };
    
    const builder = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      upsert: () => builder,
      eq: () => builder,
      neq: () => builder,
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
      like: () => builder,
      ilike: () => builder,
      is: () => builder,
      in: () => builder,
      not: () => builder,
      or: () => builder,
      and: () => builder,
      filter: () => builder,
      match: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      single: () => Promise.resolve(singleResult),
      maybeSingle: () => Promise.resolve(singleResult),
      then: (resolve) => resolve(result),
      // Make it thenable
      [Symbol.toStringTag]: 'Promise',
    };
    
    // Add promise-like behavior
    builder.then = (onFulfilled, onRejected) => {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    };
    builder.catch = (onRejected) => {
      return Promise.resolve(result).catch(onRejected);
    };
    builder.finally = (onFinally) => {
      return Promise.resolve(result).finally(onFinally);
    };
    
    return builder;
  };

  // Mock client that won't crash the app
  supabase = {
    from: () => createMockQueryBuilder(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please add your credentials to use authentication.' } 
      }),
      signUp: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback) => {
        // Return a subscription object
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {} 
            } 
          } 
        };
      },
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
    functions: {
      invoke: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured' } 
      }),
    },
    realtime: {
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
        unsubscribe: () => {},
      }),
    },
  };
}

export { supabase };
