import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';

const SchedulingStep = ({ bookingData, onBack, onScheduled }) => {
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [capturedBooking, setCapturedBooking] = useState(null);
  const iframeRef = useRef(null);
  
  const calLink = import.meta.env.VITE_CALCOM_LINK || 'peter-williams-gizpz6/willowandwatercleaning-appointment';
  
  // Build the Cal.com URL with prefilled data
  const guestName = encodeURIComponent(bookingData.contact?.name || '');
  const guestEmail = encodeURIComponent(bookingData.contact?.email || '');
  const notes = encodeURIComponent(`
Home: ${bookingData.quote?.sqft?.toLocaleString()} sq ft, ${bookingData.quote?.bedrooms} bed, ${bookingData.quote?.bathrooms} bath
Frequency: ${bookingData.quote?.frequency}
Address: ${bookingData.contact?.address || 'Not provided'}
Quote: $${bookingData.quote?.recurringPrice}/visit
  `.trim());

  // Add embed=true for better event support
  const calUrl = `https://cal.com/${calLink}?name=${guestName}&email=${guestEmail}&notes=${notes}&theme=light&embed=true`;

  // Listen for Cal.com booking events via postMessage
  useEffect(() => {
    const handleCalMessage = (event) => {
      // Accept messages from Cal.com
      if (!event.origin.includes('cal.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        console.log('Cal.com message received:', data);
        
        // Check for booking confirmation events
        // Cal.com sends various event types depending on version
        if (data.type === 'CAL:bookingSuccessful' || 
            data.type === 'bookingSuccessful' ||
            data.action === 'bookingSuccessful' ||
            (data.type === '__routeChanged' && data.data?.includes('/booking/'))) {
          
          // Extract booking details
          const bookingInfo = data.data || data;
          
          if (bookingInfo.startTime) {
            const startDate = new Date(bookingInfo.startTime);
            const dateStr = startDate.toISOString().split('T')[0];
            const timeStr = startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            console.log('Booking captured from Cal.com:', dateStr, timeStr);
            
            setCapturedBooking({
              date: dateStr,
              time: timeStr,
              bookingId: bookingInfo.uid || bookingInfo.id || 'cal-booking',
            });
            setBookingConfirmed(true);
          } else {
            // If no startTime but booking was successful, mark as confirmed
            // and we'll capture the date from the confirmation email
            console.log('Booking confirmed but no startTime in event');
            setBookingConfirmed(true);
          }
        }
      } catch (e) {
        // Not a JSON message or parse error, ignore
        console.log('Cal.com message parse error:', e);
      }
    };

    window.addEventListener('message', handleCalMessage);
    return () => window.removeEventListener('message', handleCalMessage);
  }, []);

  // Format captured date for display
  const formatCapturedDate = () => {
    if (!capturedBooking?.date) return '';
    const date = new Date(capturedBooking.date + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleContinue = () => {
    onScheduled({
      scheduledDate: capturedBooking?.date || new Date().toISOString().split('T')[0],
      scheduledTime: capturedBooking?.time || 'Scheduled via Cal.com',
      calBookingId: capturedBooking?.bookingId || 'cal-booking',
      calBookingUrl: `https://cal.com/${calLink}`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-4 h-4" />
          <span className="font-inter text-xs font-medium">Step 3 of 4</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
          {bookingConfirmed ? 'Appointment Scheduled!' : 'Choose Your Cleaning Date'}
        </h2>
        <p className="text-charcoal/60 font-inter">
          {bookingConfirmed 
            ? 'Your time slot has been reserved' 
            : 'Select an available time slot that works best for you'}
        </p>
      </div>

      {/* Show confirmation if booking was captured */}
      {bookingConfirmed ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            
            <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
              Time Confirmed
            </h3>
            
            {capturedBooking?.date && (
              <div className="bg-bone/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-sage" />
                  <span className="font-inter font-medium text-charcoal">
                    {formatCapturedDate()}
                  </span>
                </div>
                {capturedBooking?.time && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-sage" />
                    <span className="font-inter font-medium text-charcoal">
                      {capturedBooking.time}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleContinue}
              className="btn-primary w-full text-lg py-4"
            >
              Continue to Payment
            </button>
            
            <button
              onClick={() => {
                setBookingConfirmed(false);
                setCapturedBooking(null);
              }}
              className="mt-3 text-charcoal/60 hover:text-charcoal font-inter text-sm"
            >
              Choose a different time
            </button>
          </div>
        </div>
      ) : (
        /* Cal.com embed */
        <>
          <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={calUrl}
              width="100%"
              height="650"
              frameBorder="0"
              title="Schedule your cleaning appointment"
              className="w-full"
              allow="payment"
            />
          </div>

          {/* Action buttons */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-charcoal/60 font-inter text-sm">
              After selecting a time and confirming in the calendar above, click below:
            </p>
            
            <button
              onClick={() => setBookingConfirmed(true)}
              className="btn-primary px-8 py-3"
            >
              I've Completed My Booking → Continue to Payment
            </button>
            
            <a
              href={calUrl.replace('&embed=true', '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sage hover:text-charcoal 
                         font-inter text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Having trouble? Open calendar in new tab
            </a>
          </div>
        </>
      )}

      {/* Back Button */}
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal 
                     font-inter text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contact info
        </button>
      </div>

      {/* Help Text */}
      <p className="mt-4 text-center text-xs text-charcoal/50 font-inter">
        Can't find a time that works? Call us at (630) 267-0096
      </p>
    </div>
  );
};

export default SchedulingStep;
