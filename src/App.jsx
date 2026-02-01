import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceAreas from './components/ServiceAreas';
import TrustBadges from './components/TrustBadges';
import PricingCalculator from './components/PricingCalculator';
import Services from './components/Services';
import About from './components/About';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import ReferralProgram from './components/ReferralProgram';
import BookingSuccess from './components/BookingSuccess';
import CityLanding from './components/CityLanding';
import ServiceAreasPage from './components/ServiceAreasPage';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import StickyMobileCTA from './components/StickyMobileCTA';
import ExitIntentPopup from './components/ExitIntentPopup';
import AbandonedBookingRecovery from './components/AbandonedBookingRecovery';

// Admin imports
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';

// Service area data
import { SERVICE_AREA_LIST, getPrimaryServiceAreas, getServiceAreasByTier } from './data/serviceAreas';

// Get service areas for footer (primary + some secondary)
const primaryAreas = getPrimaryServiceAreas();
const secondaryAreas = getServiceAreasByTier('secondary').slice(0, 3);

// Home page component
function HomePage() {
  const [searchParams] = useSearchParams();
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Check URL for booking status on load
  useEffect(() => {
    const bookingStatus = searchParams.get('booking');
    if (bookingStatus === 'success') {
      setShowBookingSuccess(true);
      // Clean up URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const handleCloseSuccess = () => {
    setShowBookingSuccess(false);
  };

  // Show booking success page
  if (showBookingSuccess) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <BookingSuccess onClose={handleCloseSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main>
        <Hero />
        <TrustBadges />
        <ServiceAreas />
        <PricingCalculator />
        <Services />
        <About />
        <ReferralProgram />
        <FAQ />
        <Contact />
      </main>
      
      {/* Conversion Optimization Components */}
      <StickyMobileCTA />
      <ExitIntentPopup />
      <AbandonedBookingRecovery />

      {/* Footer */}
      <footer className="bg-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="font-playfair text-xl font-semibold text-bone mb-3">
                Willow & Water
              </h3>
              <p className="text-bone/60 font-inter text-sm">
                Organic home cleaning for Fox Valley families. Safe for kids, pets, and the planet.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#pricing" className="text-bone/60 hover:text-bone font-inter text-sm transition-colors">
                    Get a Quote
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-bone/60 hover:text-bone font-inter text-sm transition-colors">
                    Our Services
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-bone/60 hover:text-bone font-inter text-sm transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-bone/60 hover:text-bone font-inter text-sm transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Service Areas - SEO Internal Links */}
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Service Areas</h4>
              <ul className="space-y-2">
                {primaryAreas.map((area) => (
                  <li key={area.slug}>
                    <Link 
                      to={`/${area.slug}`}
                      className="text-bone/60 hover:text-bone font-inter text-sm transition-colors"
                    >
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
                {secondaryAreas.map((area) => (
                  <li key={area.slug}>
                    <Link 
                      to={`/${area.slug}`}
                      className="text-bone/60 hover:text-bone font-inter text-sm transition-colors"
                    >
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
                <li>
                  <Link 
                    to="/service-areas"
                    className="text-sage hover:underline font-inter text-sm transition-colors"
                  >
                    View all areas →
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact Us</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li>
                  <a href="tel:6302670096" className="hover:text-bone transition-colors">
                    (630) 267-0096
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@willowandwater.com" className="hover:text-bone transition-colors">
                    hello@willowandwater.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-bone/10 pt-8 text-center">
            <p className="text-bone/40 font-inter text-sm">
              © {new Date().getFullYear()} Willow & Water Organic Cleaning. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      
      {/* Service Areas Overview Page */}
      <Route path="/service-areas" element={<ServiceAreasPage />} />
      
      {/* Blog Routes */}
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      
      {/* City Landing Pages - All Fox Valley Service Areas */}
      {SERVICE_AREA_LIST.map((area) => (
        <Route 
          key={area.slug} 
          path={`/${area.slug}`} 
          element={<CityLanding citySlug={area.slug} />} 
        />
      ))}
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
      
      {/* Fallback to home for unknown routes */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
