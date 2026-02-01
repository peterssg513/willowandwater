import { useState } from 'react';
import { Gift, Copy, Check, Share2, MessageCircle, Mail } from 'lucide-react';

/**
 * Referral Program - "Give $25, Get $25" referral section
 */
const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const referralCode = 'FRIEND25';
  const referralLink = 'https://www.willowandwaterorganiccleaning.com/?ref=FRIEND25';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = {
    sms: `sms:?body=${encodeURIComponent(`I've been using Willow & Water for organic house cleaning and love them! Get $25 off your first clean: ${referralLink}`)}`,
    email: `mailto:?subject=${encodeURIComponent('$25 off organic house cleaning!')}&body=${encodeURIComponent(`Hey!\n\nI wanted to share my favorite cleaning service with you. Willow & Water uses 100% non-toxic products - safe for kids and pets.\n\nUse my link to get $25 off your first clean:\n${referralLink}\n\nYou'll love them!`)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`I've been using Willow & Water for organic house cleaning and love them! Get $25 off your first clean: ${referralLink}`)}`,
  };

  return (
    <section className="py-16 bg-sage/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left - Info */}
            <div className="p-6 sm:p-8 md:p-10">
              <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full mb-4">
                <Gift className="w-4 h-4" />
                <span className="font-inter text-xs font-semibold uppercase tracking-wide">
                  Referral Program
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-charcoal mb-3">
                Give $25, Get $25
              </h2>
              
              <p className="text-charcoal/70 font-inter mb-6">
                Love our service? Share the clean! When your friend books their first cleaning, 
                you both get $25 off.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sage text-bone flex items-center justify-center flex-shrink-0 font-inter font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-inter font-medium text-charcoal">Share your link</p>
                    <p className="text-sm text-charcoal/60">Send to friends & family in Fox Valley</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sage text-bone flex items-center justify-center flex-shrink-0 font-inter font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-inter font-medium text-charcoal">They book a cleaning</p>
                    <p className="text-sm text-charcoal/60">They get $25 off their first clean</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sage text-bone flex items-center justify-center flex-shrink-0 font-inter font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-inter font-medium text-charcoal">You get credited</p>
                    <p className="text-sm text-charcoal/60">$25 off your next cleaning</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Share Actions */}
            <div className="bg-sage/5 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <p className="font-inter font-medium text-charcoal mb-3">Your referral link:</p>
              
              {/* Copy Link */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-white border border-charcoal/10 rounded-lg px-4 py-3 font-inter text-sm text-charcoal/70 truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`p-3 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-sage text-bone' 
                      : 'bg-white border border-charcoal/10 text-charcoal hover:bg-sage/10'
                  }`}
                  aria-label="Copy link"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              {copied && (
                <p className="text-sage font-inter text-sm mb-4 animate-in fade-in">
                  ✓ Link copied to clipboard!
                </p>
              )}
              
              <p className="font-inter text-sm text-charcoal/60 mb-3">Or share directly:</p>
              
              {/* Share Buttons */}
              <div className="flex gap-3">
                <a
                  href={shareLinks.sms}
                  className="flex-1 bg-white border border-charcoal/10 rounded-lg py-3 flex items-center justify-center gap-2 font-inter text-sm text-charcoal hover:bg-sage/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Text
                </a>
                <a
                  href={shareLinks.email}
                  className="flex-1 bg-white border border-charcoal/10 rounded-lg py-3 flex items-center justify-center gap-2 font-inter text-sm text-charcoal hover:bg-sage/10 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white border border-charcoal/10 rounded-lg py-3 flex items-center justify-center gap-2 font-inter text-sm text-charcoal hover:bg-sage/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </a>
              </div>
              
              {/* Referral Code */}
              <div className="mt-6 pt-6 border-t border-charcoal/10 text-center">
                <p className="font-inter text-xs text-charcoal/50 mb-1">Or use referral code:</p>
                <p className="font-inter font-bold text-lg text-sage">{referralCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReferralProgram;
