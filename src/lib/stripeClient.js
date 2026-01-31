import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn(
    'Stripe publishable key not found. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.'
  );
}

// Lazy-load Stripe to avoid blocking page load
let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};
