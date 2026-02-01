import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';

const SchedulingStep = ({ bookingData, onBack, onScheduled }) => {
  const [step, setStep] = useState('calendar'); // 'calendar' | 'confirm'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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

  const calUrl = `https://cal.com/${calLink}?name=${guestName}&email=${guestEmail}&notes=${notes}&theme=light&embed=true`;

  // Listen for Cal.com booking events via postMessage (as backup)
  useEffect(() => {
    const handleCalMessage = (event) => {
      if (!event.origin.includes('cal.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('Cal.com message received:', data);
        
        // Check for booking confirmation events
        if (data.type === 'CAL:bookingSuccessful' || 
            data.type === 'bookingSuccessful' ||
            data.action === 'bookingSuccessful' ||
            (data.type === '__routeChanged' && data.data?.includes('/booking/'))) {
          
          const bookingInfo = data.data || data;
          
          if (bookingInfo.startTime) {
            const startDate = new Date(bookingInfo.startTime);
            const dateStr = startDate.toISOString().split('T')[0];
            const timeStr = startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            console.log('Auto-captured from Cal.com:', dateStr, timeStr);
            setSelectedDate(dateStr);
            setSelectedTime(timeStr);
            setCapturedBooking({
              date: dateStr,
              time: timeStr,
              bookingId: bookingInfo.uid || bookingInfo.id || 'cal-booking',
              autoCapture: true,
            });
            setStep('confirm');
          }
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleCalMessage);
    return () => window.removeEventListener('message', handleCalMessage);
  }, []);

  // Time options for dropdown
  const timeOptions = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  // Format date for display
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleConfirmBooking = () => {
    setStep('confirm');
  };

  const handleContinueToPayment = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please enter the date and time you selected on Cal.com');
      return;
    }

    onScheduled({
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      calBookingId: capturedBooking?.bookingId || 'cal-booking',
      calBookingUrl: `https://cal.com/${calLink}`,
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-4 h-4" />
          <span className="font-inter text-xs font-medium">Step 3 of 4</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-2">
          {step === 'confirm' ? 'Confirm Your Appointment' : 'Choose Your Cleaning Date'}
        </h2>
        <p className="text-charcoal/60 font-inter">
          {step === 'confirm' 
            ? 'Enter the date and time you selected' 
            : 'Select an available time slot that works best for you'}
        </p>
      </div>

      {step === 'confirm' ? (
        /* Date/Time Confirmation Form */
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            
            <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2 text-center">
              {capturedBooking?.autoCapture ? 'Appointment Details' : 'Enter Your Appointment Time'}
            </h3>
            
            <p className="text-charcoal/60 font-inter text-sm text-center mb-6">
              {capturedBooking?.autoCapture 
                ? 'We detected your booking. Please verify the details below.'
                : 'Please enter the date and time you selected on Cal.com'}
            </p>

            <div className="space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border border-charcoal/20 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
                />
                {selectedDate && (
                  <p className="mt-1 text-sm text-sage font-inter">
                    {formatDateForDisplay(selectedDate)}
                  </p>
                )}
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Appointment Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-3 border border-charcoal/20 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage
                           bg-white"
                >
                  <option value="">Select a time...</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && (
              <div className="mt-6 p-4 bg-bone/50 rounded-xl">
                <p className="text-center font-inter text-charcoal">
                  <span className="font-semibold">{formatDateForDisplay(selectedDate)}</span>
                  <br />
                  <span className="text-sage font-medium">at {selectedTime}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleContinueToPayment}
              disabled={!selectedDate || !selectedTime}
              className="btn-primary w-full text-lg py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
            
            <button
              onClick={() => {
                setStep('calendar');
                if (!capturedBooking?.autoCapture) {
                  setSelectedDate('');
                  setSelectedTime('');
                }
              }}
              className="w-full mt-3 text-charcoal/60 hover:text-charcoal font-inter text-sm"
            >
              ← Back to calendar
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
            <div className="bg-bone/50 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-charcoal font-inter text-sm">
                <strong>After booking on the calendar above:</strong>
                <br />
                Click the button below to enter your appointment details
              </p>
            </div>
            
            <button
              onClick={handleConfirmBooking}
              className="btn-primary px-8 py-3"
            >
              I've Selected My Time on Cal.com →
            </button>
            
            <div>
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
