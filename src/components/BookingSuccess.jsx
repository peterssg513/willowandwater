import { useState } from 'react';
import { 
  CheckCircle, 
  Bell, 
  MessageSquare, 
  Sparkles, 
  ChevronDown, 
  Phone, 
  Home,
  Dog,
  DollarSign,
  Leaf,
  HelpCircle,
  Clock,
  Heart
} from 'lucide-react';

const BookingSuccess = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-bone py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-sage" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-3">
            You're All Set!
          </h1>
          <p className="text-charcoal/70 font-inter text-lg">
            Your first cleaning has been booked. Here's what happens next.
          </p>
        </div>

        {/* What to Expect Timeline */}
        <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-playfair font-semibold text-charcoal mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sage" />
            What to Expect
          </h2>
          
          <div className="space-y-6">
            {/* 24 Hours Before */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-sage" />
                </div>
                <div className="w-0.5 flex-1 bg-sage/20 my-2"></div>
              </div>
              <div className="flex-1 pb-2">
                <h3 className="font-inter font-semibold text-charcoal mb-1">24 Hours Before</h3>
                <p className="text-charcoal/60 font-inter text-sm">
                  You'll receive a friendly reminder about your upcoming cleaning appointment.
                </p>
              </div>
            </div>

            {/* 1 Hour Before */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-sage" />
                </div>
                <div className="w-0.5 flex-1 bg-sage/20 my-2"></div>
              </div>
              <div className="flex-1 pb-2">
                <h3 className="font-inter font-semibold text-charcoal mb-1">1 Hour Before</h3>
                <p className="text-charcoal/60 font-inter text-sm">
                  Another reminder so you're all prepared for our arrival.
                </p>
              </div>
            </div>

            {/* 15 Minutes Before */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-sage" />
                </div>
                <div className="w-0.5 flex-1 bg-sage/20 my-2"></div>
              </div>
              <div className="flex-1 pb-2">
                <h3 className="font-inter font-semibold text-charcoal mb-1">15 Minutes Before</h3>
                <p className="text-charcoal/60 font-inter text-sm">
                  Your cleaner will text you personally to let you know they're on their way. They'll have your number to coordinate arrival.
                </p>
              </div>
            </div>

            {/* Cleaning Time */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-bone" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-inter font-semibold text-charcoal mb-1">We Clean!</h3>
                <p className="text-charcoal/60 font-inter text-sm">
                  Our professional team arrives and transforms your home using only premium, non-toxic products. Sit back and relax!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg shadow-charcoal/5 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-playfair font-semibold text-charcoal mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sage" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <FAQItem 
              icon={<Home className="w-5 h-5" />}
              question="What if I'm not home during the cleaning?"
              answer="No problem! Many of our clients aren't home during their cleanings. Just text or call us and we can figure out the details—whether that's a lockbox code, hidden key, or smart lock access. We clean homes when folks aren't there all the time."
            />
            
            <FAQItem 
              icon={<Leaf className="w-5 h-5" />}
              question="What cleaning products do you use?"
              answer="We exclusively use Branch Basics cleaners—premium, non-toxic, and safe for your family and pets. We also bring our own vacuum, mops, and all necessary equipment. You don't need to provide anything!"
            />
            
            <FAQItem 
              icon={<Dog className="w-5 h-5" />}
              question="Are you pet friendly?"
              answer="Absolutely! We love furry friends. However, if you sense your dog might be uncomfortable with cleaners in the home, we recommend securing them in a comfortable, safe space during the cleaning. Cats usually do their own thing!"
            />
            
            <FAQItem 
              icon={<DollarSign className="w-5 h-5" />}
              question="Do you accept tips?"
              answer="Tips are wonderful and always appreciated! We try to pay our cleaners enough to live comfortably without relying on tips, but we happily accept them. You can tip via Venmo or cash directly to your cleaner."
            />
            
            <FAQItem 
              icon={<Phone className="w-5 h-5" />}
              question="What if I have issues or questions?"
              answer={
                <>
                  We're here for you! Call or text Peter & Claira directly at{' '}
                  <a href="tel:6302670096" className="text-sage font-semibold hover:underline">
                    (630) 267-0096
                  </a>
                  {' '}for any questions or concerns. We'll get back to you ASAP—always within 24 hours.
                </>
              }
            />
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-sage/10 rounded-2xl p-6 text-center mb-8">
          <h3 className="font-playfair font-semibold text-charcoal mb-2">Need to reach us?</h3>
          <p className="text-charcoal/70 font-inter text-sm mb-4">
            We're always happy to help with questions, rescheduling, or special requests.
          </p>
          <a 
            href="tel:6302670096" 
            className="inline-flex items-center gap-2 btn-primary"
          >
            <Phone className="w-4 h-4" />
            Call (630) 267-0096
          </a>
        </div>

        {/* Thank You Note */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sage mb-2">
            <Heart className="w-4 h-4" />
            <span className="font-inter font-medium text-sm">Thank you for choosing us</span>
            <Heart className="w-4 h-4" />
          </div>
          <p className="text-charcoal/50 font-inter text-sm">
            We're excited to make your home sparkle with our organic cleaning services.
          </p>
          
          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 btn-secondary"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// FAQ Accordion Item Component
const FAQItem = ({ icon, question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-charcoal/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-sage/5 transition-colors"
      >
        <div className="text-sage flex-shrink-0">
          {icon}
        </div>
        <span className="flex-1 font-inter font-medium text-charcoal">
          {question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-charcoal/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pl-12">
          <p className="text-charcoal/70 font-inter text-sm leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingSuccess;
