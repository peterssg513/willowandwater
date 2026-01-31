import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Google Analytics 4 + Custom Event Tracking
 * 
 * Set VITE_GA_MEASUREMENT_ID in your environment variables
 */

// GA4 Measurement ID (set in .env)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialize GA4
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not found');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll track manually for SPA
  });
};

// Track page views
export const trackPageView = (path, title) => {
  if (!window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
};

// Track custom events
export const trackEvent = (eventName, params = {}) => {
  if (!window.gtag) return;
  
  window.gtag('event', eventName, params);
};

// Pre-defined conversion events
export const trackConversion = {
  // Quote viewed
  quoteViewed: (price) => {
    trackEvent('view_quote', {
      currency: 'USD',
      value: price,
    });
  },
  
  // Booking flow started
  bookingStarted: (quoteData) => {
    trackEvent('begin_checkout', {
      currency: 'USD',
      value: quoteData.firstCleanPrice,
      items: [{
        item_name: 'First Clean',
        price: quoteData.firstCleanPrice,
        quantity: 1,
      }],
    });
  },
  
  // Contact info submitted
  contactSubmitted: () => {
    trackEvent('add_contact_info', {
      step: 'contact',
    });
  },
  
  // Scheduling completed
  scheduleSelected: () => {
    trackEvent('add_shipping_info', {
      step: 'schedule',
    });
  },
  
  // Payment initiated
  paymentStarted: (amount) => {
    trackEvent('add_payment_info', {
      currency: 'USD',
      value: amount,
    });
  },
  
  // Booking completed
  bookingCompleted: (bookingData) => {
    trackEvent('purchase', {
      currency: 'USD',
      value: bookingData.firstCleanPrice,
      transaction_id: bookingData.id || Date.now().toString(),
      items: [{
        item_name: 'First Clean',
        price: bookingData.firstCleanPrice,
        quantity: 1,
      }],
    });
  },
  
  // Lead captured (exit popup, etc)
  leadCaptured: (source) => {
    trackEvent('generate_lead', {
      source: source,
    });
  },
  
  // Phone call clicked
  phoneClicked: () => {
    trackEvent('click_to_call', {
      phone_number: '6302670096',
    });
  },
  
  // Referral link shared
  referralShared: (method) => {
    trackEvent('share', {
      method: method,
      content_type: 'referral',
    });
  },
};

/**
 * Analytics Provider Component - handles page view tracking
 */
const Analytics = ({ children }) => {
  const location = useLocation();

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return children;
};

export default Analytics;
