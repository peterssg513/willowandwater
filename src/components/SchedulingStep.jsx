import { useState } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Clock } from 'lucide-react';

const SchedulingStep = ({ bookingData, onBack, onScheduled }) => {
  const [hasBooked, setHasBooked] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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
    // Validate date and time are entered
    if (!selectedDate || !selectedTime) {
      alert('Please enter the date and time you selected on Cal.com');
      return;
    }

    // User confirms they completed the booking on Cal.com
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
      <div className="mt-6">
        {/* If user booked externally, they can confirm */}
        {!hasBooked ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6">
            <h3 className="font-inter font-semibold text-charcoal mb-4 text-center">
              Confirm Your Appointment Details
            </h3>
            <p className="text-charcoal/60 text-sm font-inter mb-4 text-center">
              Please enter the date and time you selected on Cal.com
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
                onClick={() => setHasBooked(false)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedDate || !selectedTime}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
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
