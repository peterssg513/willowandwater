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
  Home
} from 'lucide-react';
import { formatPrice, formatFrequency } from '../../utils/pricingLogic';
import { formatDate, formatTimeSlot } from '../../utils/scheduling';

/**
 * ConfirmationStep - Booking success + referral sharing
 */
const ConfirmationStep = ({ data, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
