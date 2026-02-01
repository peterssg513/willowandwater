import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Clock, CheckCircle, Loader2 } from 'lucide-react';

const SchedulingStep = ({ bookingData, onBack, onScheduled }) => {
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [capturedBooking, setCapturedBooking] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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
      // Only accept messages from Cal.com
      if (!event.origin.includes('cal.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        console.log('Cal.com message received:', data);
        
        // Check for booking confirmation events
        if (data.type === 'CAL:bookingSuccessful' || 
            data.type === '__routeChanged' && data.data?.includes('booking') ||
            data.action === 'bookingSuccessful') {
          
          // Extract booking details
          const bookingData = data.data || data;
          
          if (bookingData.startTime) {
            const startDate = new Date(bookingData.startTime);
            const dateStr = startDate.toISOString().split('T')[0];
            const timeStr = startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            console.log('Booking captured:', dateStr, timeStr);
            
            setCapturedBooking({
              date: dateStr,
              time: timeStr,
              bookingId: bookingData.uid || bookingData.id || 'cal-booking',
            });
            setBookingConfirmed(true);
          }
        }
        
        // Also check for the eventTypeSlug which indicates booking flow completion
        if (data.type === 'CAL:linkReady' || data.type === 'CAL:eventTypeSlug') {
          console.log('Cal.com ready:', data);
        }
      } catch (e) {
        // Not a JSON message, ignore
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
    if (capturedBooking) {
      onScheduled({
        scheduledDate: capturedBooking.date,
        scheduledTime: capturedBooking.time,
        calBookingId: capturedBooking.bookingId,
        calBookingUrl: `https://cal.com/${calLink}`,
      });
    }
  };

  const handleManualConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please enter the date and time you selected');
      return;
    }
    onScheduled({
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
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
          {bookingConfirmed ? 'Appointment Scheduled!' : 'Choose Your Cleaning Date'}
        </h2>
        <p className="text-charcoal/60 font-inter">
          {bookingConfirmed 
            ? 'Your time slot has been reserved' 
            : 'Select an available time slot that works best for you'}
        </p>
      </div>

      {/* Show confirmation if booking was captured */}
      {bookingConfirmed && capturedBooking ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            
            <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
              Time Confirmed
            </h3>
            
            <div className="bg-bone/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-sage" />
                <span className="font-inter font-medium text-charcoal">
                  {formatCapturedDate()}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-sage" />
                <span className="font-inter font-medium text-charcoal">
                  {capturedBooking.time}
                </span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="btn-primary w-full"
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
      ) : manualEntry ? (
        /* Manual entry fallback */
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6">
          <h3 className="font-inter font-semibold text-charcoal mb-4 text-center">
            Enter Your Appointment Details
          </h3>
          <p className="text-charcoal/60 text-sm font-inter mb-4 text-center">
            Enter the date and time you selected on Cal.com
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Selected
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                           font-inter focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Time Selected
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                           font-inter focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="">Select a time</option>
                <option value="8:00 AM">8:00 AM</option>
                <option value="8:30 AM">8:30 AM</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="9:30 AM">9:30 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="12:30 PM">12:30 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="1:30 PM">1:30 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="2:30 PM">2:30 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="3:30 PM">3:30 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="4:30 PM">4:30 PM</option>
                <option value="5:00 PM">5:00 PM</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setManualEntry(false)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleManualConfirm}
              disabled={!selectedDate || !selectedTime}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
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

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={calUrl.replace('&embed=true', '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sage hover:text-charcoal 
                         font-inter text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
            <button
              onClick={() => setManualEntry(true)}
              className="btn-secondary px-6 py-2"
            >
              Enter time manually
            </button>
          </div>
          
          <p className="mt-4 text-center text-sm text-charcoal/50 font-inter">
            Complete your booking in the calendar above. It will automatically be captured.
          </p>
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
