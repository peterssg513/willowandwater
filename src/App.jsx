import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceAreas from './components/ServiceAreas';
import PricingCalculator from './components/PricingCalculator';
import Services from './components/Services';
import About from './components/About';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import BookingSuccess from './components/BookingSuccess';

function App() {
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Check URL for booking status on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingStatus = params.get('booking');
    
    if (bookingStatus === 'success') {
      setShowBookingSuccess(true);
      // Clean up URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
        <ServiceAreas />
        <PricingCalculator />
        <Services />
        <About />
        <FAQ />
        <Contact />
      </main>

      {/* Footer */}
      <footer className="bg-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
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
                <li className="pt-2">
                  Serving: St. Charles, Geneva, Batavia, Wayne, Campton Hills & Elburn
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

export default App;
