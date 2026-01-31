import { useState } from 'react';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

const SchedulingStep = ({ bookingData, onBack, onScheduled }) => {
  const [hasBooked, setHasBooked] = useState(false);
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

  const calUrl = `https://cal.com/${calLink}?name=${guestName}&email=${guestEmail}&notes=${notes}&theme=light`;

  const handleConfirmBooking = () => {
    // User confirms they completed the booking on Cal.com
    onScheduled({
      scheduledDate: new Date().toISOString(),
      scheduledTime: 'Confirmed via Cal.com',
      calBookingId: 'manual-confirmation',
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
          Choose Your Cleaning Date
        </h2>
        <p className="text-charcoal/60 font-inter">
          Select an available time slot that works best for you
        </p>
      </div>

      {/* Cal.com Embed via iframe */}
      <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 overflow-hidden">
        <iframe
          src={calUrl}
          width="100%"
          height="650"
          frameBorder="0"
          title="Schedule your cleaning appointment"
          className="w-full"
          allow="payment"
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* If user booked externally, they can confirm */}
        {!hasBooked ? (
          <>
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sage hover:text-charcoal 
                         font-inter text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
            <button
              onClick={() => setHasBooked(true)}
              className="btn-primary px-6 py-2"
            >
              I've Selected My Time
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-charcoal/70 font-inter mb-4">
              Did you complete your booking on Cal.com?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setHasBooked(false)}
                className="btn-secondary px-6 py-2"
              >
                Not Yet
              </button>
              <button
                onClick={handleConfirmBooking}
                className="btn-primary px-6 py-2"
              >
                Yes, Continue to Payment
              </button>
            </div>
          </div>
        )}
      </div>

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
        Can't find a time that works? Call us at (630) 555-1234
      </p>
    </div>
  );
};

export default SchedulingStep;
