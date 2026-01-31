import { useState, useEffect } from 'react';
import { Calendar, Phone, X } from 'lucide-react';

/**
 * Sticky Mobile CTA - Fixed bottom bar on mobile with quick actions
 * Only shows on mobile devices and after user scrolls past hero
 */
const StickyMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px (past hero section)
      const shouldShow = window.scrollY > 400;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade effect */}
      <div className="h-4 bg-gradient-to-t from-white to-transparent" />
      
      {/* CTA Bar */}
      <div className="bg-white border-t border-charcoal/10 shadow-lg px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          <a
            href="#pricing"
            className="flex-1 bg-sage text-bone text-center py-3 px-4 rounded-lg font-inter font-semibold text-sm
                       flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Calendar className="w-4 h-4" />
            Get Free Quote
          </a>
          
          {/* Call Button */}
          <a
            href="tel:6302670096"
            className="bg-charcoal/5 text-charcoal p-3 rounded-lg active:scale-[0.98] transition-transform"
            aria-label="Call us"
          >
            <Phone className="w-5 h-5" />
          </a>
          
          {/* Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-charcoal/40 p-2 -mr-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
