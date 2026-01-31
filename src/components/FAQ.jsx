import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Home, Leaf, Dog, DollarSign, Phone, Clock, CreditCard, Calendar } from 'lucide-react';

const faqs = [
  {
    icon: <Home className="w-5 h-5" />,
    question: "What if I'm not home during the cleaning?",
    answer: "No problem at all! Many of our clients aren't home during their cleanings. Just text or call us to arrange access—whether that's a lockbox code, hidden key, or smart lock. We clean homes when folks aren't there all the time.",
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    question: "What cleaning products do you use?",
    answer: "We exclusively use Branch Basics cleaners—premium, plant-based, and completely non-toxic. They're safe for children, pets, and anyone with sensitivities. We also bring our own vacuum, mops, and all necessary equipment. You don't need to provide anything!",
  },
  {
    icon: <Dog className="w-5 h-5" />,
    question: "Are you pet friendly?",
    answer: "Absolutely! We love furry friends. However, if you sense your dog might be uncomfortable with cleaners in the home, we recommend securing them in a comfortable, safe space during the cleaning. Cats usually just do their own thing!",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    question: "How does payment work?",
    answer: "We collect a 20% deposit when you book to secure your appointment. The remaining 80% is automatically charged to your card on file on the day of your cleaning. Your deposit is fully refundable if you cancel more than 24 hours before your appointment.",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    question: "How do I reschedule or cancel?",
    answer: "Life happens! Just call or text us at (630) 267-0096 to reschedule or cancel. As long as you give us 24 hours notice, there's no fee. We'll work with you to find a time that works better.",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    question: "Do you accept tips?",
    answer: "Tips are wonderful and always appreciated! We pay our cleaners living wages so they don't depend on tips, but we happily accept them when offered. You can tip via Venmo or cash directly to your cleaner.",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    question: "How long does a cleaning take?",
    answer: "It depends on the size of your home and the type of cleaning. A standard cleaning for a typical home takes 2-4 hours. Deep cleans and first-time visits take longer. We'll give you an estimate when you book.",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    question: "What if I have issues or need support?",
    answer: "We're always here for you! Call or text Peter & Claira directly at (630) 267-0096 for any questions, concerns, or feedback. We'll get back to you ASAP—always within 24 hours, usually much faster.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Inject FAQ Schema markup for SEO
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[data-faq-schema]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add schema script to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-schema', 'true');
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-faq-schema]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <section id="faq" className="py-20 bg-bone">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full mb-4">
            <HelpCircle className="w-4 h-4" />
            <span className="font-inter text-sm font-medium">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-4">
            Common Questions
          </h2>
          <p className="text-charcoal/70 font-inter">
            Everything you need to know about our organic cleaning services
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm shadow-charcoal/5 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-sage/5 transition-colors"
              >
                <div className="text-sage flex-shrink-0">
                  {faq.icon}
                </div>
                <span className="flex-1 font-inter font-medium text-charcoal">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-charcoal/40 transition-transform duration-200 
                    ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 
                  ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-5 pb-5 pl-14">
                  <p className="text-charcoal/70 font-inter text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center bg-sage/5 rounded-2xl p-6">
          <h3 className="font-playfair font-semibold text-charcoal mb-2">
            Still have questions?
          </h3>
          <p className="text-charcoal/60 font-inter text-sm mb-4">
            We're happy to help! Reach out anytime.
          </p>
          <a
            href="tel:6302670096"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <Phone className="w-4 h-4" />
            Call (630) 267-0096
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
