import { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  CreditCard, 
  Gift, 
  Copy, 
  Check,
  MessageSquare,
  Mail,
  Home,
  Repeat,
  CalendarDays,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatPrice, formatFrequency, formatTimeSlot } from '../../utils/pricingLogic';
import { formatDate } from '../../utils/scheduling';

/**
 * ConfirmationStep - Booking success + referral sharing + recurring setup
 */
const ConfirmationStep = ({ data, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Recurring setup state
  const [showRecurringSetup, setShowRecurringSetup] = useState(false);
  const [recurringSetupComplete, setRecurringSetupComplete] = useState(false);
  const [recurringData, setRecurringData] = useState(null);
  const [settingUpRecurring, setSettingUpRecurring] = useState(false);
  const [recurringError, setRecurringError] = useState(null);
  const [recurringForm, setRecurringForm] = useState({
    frequency: 'biweekly',
    preferredDay: 'monday',
    preferredTime: 'morning',
  });

  const referralCode = data.customer?.referral_code || 'LOADING';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaText = () => {
    const message = `I just booked Willow & Water for organic home cleaning and it was so easy! Use my code ${referralCode} to get $25 off your first clean: ${referralLink}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const shareViaEmail = () => {
    const subject = 'Get $25 off organic home cleaning!';
    const body = `Hi!\n\nI just booked Willow & Water for organic home cleaning and wanted to share my referral code with you.\n\nUse code ${referralCode} to get $25 off your first clean!\n\nBook here: ${referralLink}\n\nThey use all non-toxic, eco-friendly products which is perfect if you have kids or pets.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Handle recurring setup
  const handleSetupRecurring = async () => {
    setSettingUpRecurring(true);
    setRecurringError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-recurring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerId: data.customerId,
          frequency: recurringForm.frequency,
          preferredDay: recurringForm.preferredDay,
          preferredTime: recurringForm.preferredTime,
          basePrice: data.pricing?.recurringPrice || data.pricing?.firstCleanPrice * 0.8,
          monthsAhead: 3,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set up recurring cleanings');
      }

      setRecurringData(result);
      setRecurringSetupComplete(true);
      setShowRecurringSetup(false);
    } catch (err) {
      console.error('Recurring setup error:', err);
      setRecurringError(err.message);
    } finally {
      setSettingUpRecurring(false);
    }
  };

  const FREQUENCY_OPTIONS = [
    { value: 'weekly', label: 'Weekly', discount: '35% off', description: 'Every week' },
    { value: 'biweekly', label: 'Bi-Weekly', discount: '20% off', description: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly', discount: '10% off', description: 'Once a month' },
  ];

  const DAY_OPTIONS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
  ];

  const TIME_OPTIONS = [
    { value: 'morning', label: 'Morning', time: '9am - 12pm' },
    { value: 'afternoon', label: 'Afternoon', time: '1pm - 5pm' },
  ];

  const pricing = data.pricing;
  const depositAmount = Math.round((pricing?.firstCleanTotal - (data.referralDiscount || 0)) * 0.2);
  const remainingAmount = (pricing?.firstCleanTotal - (data.referralDiscount || 0)) - depositAmount;

  return (
    <div className="text-center space-y-8 py-4">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-sage" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-3xl font-playfair font-semibold text-charcoal mb-3">
          Booking Confirmed!
        </h2>
        <p className="text-charcoal/70 font-inter">
          Thank you, {data.customer?.name?.split(' ')[0]}! Your cleaning is scheduled.
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="bg-white rounded-2xl border border-charcoal/10 p-6 text-left max-w-md mx-auto">
        <h3 className="font-inter font-semibold text-charcoal mb-4">Booking Details</h3>
        
        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-sage mt-0.5" />
            <div>
              <p className="font-inter font-medium text-charcoal">
                {formatDate(data.selectedDate)}
              </p>
              <p className="text-sm text-charcoal/60">
                {formatTimeSlot(data.selectedTime)}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-sage mt-0.5" />
            <div>
              <p className="font-inter font-medium text-charcoal">
                {data.customer?.address}
              </p>
              <p className="text-sm text-charcoal/60">
                {data.customer?.city}, IL {data.customer?.zip}
              </p>
            </div>
          </div>

          {/* Service */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-sage mt-0.5" />
            <div>
              <p className="font-inter font-medium text-charcoal">
                First Deep Clean
              </p>
              {data.frequency !== 'onetime' && (
                <p className="text-sm text-sage">
                  {formatFrequency(data.frequency)} service starts after
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-sage mt-0.5" />
            <div>
              <p className="font-inter font-medium text-charcoal">
                Deposit paid: {formatPrice(depositAmount + (data.tipAmount || 0))}
              </p>
              <p className="text-sm text-charcoal/60">
                Remaining {formatPrice(remainingAmount)} due {formatDate(data.selectedDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-sage/5 rounded-2xl p-6 text-left max-w-md mx-auto">
        <h3 className="font-inter font-semibold text-charcoal mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sage" />
          What Happens Next
        </h3>
        <ol className="space-y-3 text-sm text-charcoal/70">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <span>You'll receive a confirmation email with all the details</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <span>We'll text you the day before with your cleaner's name</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <span>Your cleaner will text when they're on their way</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-xs font-medium">4</span>
            <span>Remaining balance charged the morning of your clean</span>
          </li>
        </ol>
      </div>

      {/* Recurring Cleanings Setup */}
      {!recurringSetupComplete && data.frequency === 'onetime' && (
        <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-6 text-left max-w-md mx-auto border border-sage/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-inter font-semibold text-charcoal">
                Want Recurring Cleanings?
              </h3>
              <p className="text-sm text-charcoal/60">
                Save up to 35% with a subscription
              </p>
            </div>
          </div>

          {!showRecurringSetup ? (
            <button
              onClick={() => setShowRecurringSetup(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-sage/30 hover:border-sage hover:bg-sage/5 transition-all group"
            >
              <span className="font-inter font-medium text-charcoal">Set up recurring cleanings</span>
              <ChevronRight className="w-5 h-5 text-sage group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="space-y-5">
              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">How often?</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map(freq => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setRecurringForm(prev => ({ ...prev, frequency: freq.value }))}
                      className={`
                        p-3 rounded-xl border-2 text-center transition-all
                        ${recurringForm.frequency === freq.value
                          ? 'border-sage bg-sage/10'
                          : 'border-charcoal/10 hover:border-sage/50 bg-white'
                        }
                      `}
                    >
                      <p className="font-inter text-sm font-medium text-charcoal">{freq.label}</p>
                      <p className="text-xs text-sage font-medium mt-0.5">{freq.discount}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Preferred day</label>
                <select
                  value={recurringForm.preferredDay}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, preferredDay: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  {DAY_OPTIONS.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Preferred time</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map(time => (
                    <button
                      key={time.value}
                      type="button"
                      onClick={() => setRecurringForm(prev => ({ ...prev, preferredTime: time.value }))}
                      className={`
                        p-3 rounded-xl border-2 text-center transition-all
                        ${recurringForm.preferredTime === time.value
                          ? 'border-sage bg-sage/10'
                          : 'border-charcoal/10 hover:border-sage/50 bg-white'
                        }
                      `}
                    >
                      <p className="font-inter text-sm font-medium text-charcoal">{time.label}</p>
                      <p className="text-xs text-charcoal/50">{time.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-white rounded-xl p-4 border border-sage/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-charcoal/70">Price per cleaning</span>
                  <span className="font-inter font-semibold text-charcoal">
                    {formatPrice(pricing?.recurringPrice || 0)}
                  </span>
                </div>
                <p className="text-xs text-charcoal/50">
                  Your card on file will be automatically charged the morning of each cleaning.
                </p>
              </div>

              {/* Error */}
              {recurringError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {recurringError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRecurringSetup(false)}
                  className="flex-1 px-4 py-3 border border-charcoal/20 rounded-xl font-inter font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleSetupRecurring}
                  disabled={settingUpRecurring}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {settingUpRecurring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" />
                      Start Recurring
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recurring Setup Success */}
      {recurringSetupComplete && recurringData && (
        <div className="bg-green-50 rounded-2xl p-6 text-left max-w-md mx-auto border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-inter font-semibold text-green-800">
                Recurring Cleanings Set Up!
              </h3>
              <p className="text-sm text-green-600">
                {recurringData.jobsCreated} cleanings scheduled
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal/70">Frequency</span>
              <span className="font-medium text-charcoal capitalize">{recurringData.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Day</span>
              <span className="font-medium text-charcoal capitalize">{recurringData.preferredDay}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Next Cleaning</span>
              <span className="font-medium text-charcoal">{formatDate(new Date(recurringData.nextCleaningDate))}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-100">
              <span className="text-charcoal/70">Price per visit</span>
              <span className="font-semibold text-green-600">{formatPrice(recurringData.pricePerVisit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Already has recurring from booking */}
      {data.frequency !== 'onetime' && !recurringSetupComplete && (
        <div className="bg-sage/5 rounded-2xl p-6 text-left max-w-md mx-auto border border-sage/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center">
              <Repeat className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h3 className="font-inter font-semibold text-charcoal">
                {formatFrequency(data.frequency)} Service Starting Soon
              </h3>
              <p className="text-sm text-charcoal/60">
                After your first clean, we'll schedule your recurring visits
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral Section */}
      <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-6 text-left max-w-md mx-auto border border-sage/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-charcoal">
              Give $25, Get $25
            </h3>
            <p className="text-sm text-charcoal/60">
              Share with friends and earn credits
            </p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="mb-4">
          <label className="text-xs text-charcoal/50 uppercase tracking-wide">
            Your Referral Code
          </label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-white rounded-xl px-4 py-3 font-mono text-lg font-semibold text-charcoal border border-charcoal/10">
              {referralCode}
            </div>
            <button
              onClick={() => copyToClipboard(referralCode, 'code')}
              className="p-3 bg-white rounded-xl border border-charcoal/10 hover:bg-charcoal/5 transition-colors"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-sage" />
              ) : (
                <Copy className="w-5 h-5 text-charcoal/50" />
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareViaText}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white 
                       rounded-xl border border-charcoal/10 hover:bg-charcoal/5 
                       transition-colors font-inter text-sm font-medium text-charcoal"
          >
            <MessageSquare className="w-4 h-4" />
            Text a Friend
          </button>
          <button
            onClick={shareViaEmail}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white 
                       rounded-xl border border-charcoal/10 hover:bg-charcoal/5 
                       transition-colors font-inter text-sm font-medium text-charcoal"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
        </div>

        {/* Copy Link */}
        <button
          onClick={() => copyToClipboard(referralLink, 'link')}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 
                     text-sage hover:text-sage/80 transition-colors font-inter text-sm"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Share Link
            </>
          )}
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="btn-primary px-12"
      >
        Back to Home
      </button>
    </div>
  );
};

export default ConfirmationStep;
