import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';

/**
 * Exit Intent Popup - Shows discount offer when user tries to leave
 */
const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const hasShown = sessionStorage.getItem('exitPopupShown');
    if (hasShown) return;

    const handleMouseLeave = (e) => {
      // Only trigger when mouse leaves toward top of page (likely leaving)
      if (e.clientY <= 5 && !isVisible) {
        setIsVisible(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    };

    // Also show after 45 seconds of inactivity as fallback
    const inactivityTimer = setTimeout(() => {
      if (!sessionStorage.getItem('exitPopupShown')) {
        setIsVisible(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    }, 45000);

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(inactivityTimer);
    };
  }, [isVisible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, send to your email service
    console.log('Exit popup email captured:', email);
    
    // Store in localStorage for abandoned cart recovery
    localStorage.setItem('capturedEmail', email);
    
    setIsSubmitted(true);
    
    // Close after showing success
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="relative bg-bone rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-charcoal/40 hover:text-charcoal p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header Banner */}
        <div className="bg-sage text-bone py-3 px-6 text-center">
          <p className="font-inter font-semibold text-sm uppercase tracking-wide">
            Wait! Don't Miss This
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {!isSubmitted ? (
            <>
              <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-sage" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
                Get 15% Off
              </h2>
              <p className="text-3xl font-playfair font-bold text-sage mb-4">
                Your First Clean
              </p>
              
              <p className="text-charcoal/60 font-inter text-sm mb-6">
                Enter your email and we'll send you an exclusive discount code for your first organic cleaning.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  Claim My 15% Off
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              
              <button
                onClick={handleClose}
                className="mt-4 text-charcoal/40 font-inter text-sm hover:text-charcoal"
              >
                No thanks, I'll pay full price
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-sage rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-bone" />
              </div>
              
              <h2 className="text-2xl font-playfair font-semibold text-charcoal mb-2">
                You're In! 🎉
              </h2>
              <p className="text-charcoal/60 font-inter">
                Check your email for your exclusive 15% discount code.
              </p>
              <p className="text-sage font-inter font-semibold mt-2">
                Code: WELCOME15
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
