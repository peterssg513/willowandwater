import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          message: formData.message,
          status: 'unread',
        }]);

      if (insertError) throw insertError;

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Error submitting message:', err);
      setError('Failed to send message. Please try calling us instead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-sage/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-4">
            Get In Touch
          </h2>
          <p className="text-charcoal/70 font-inter max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Reach out anytime and we'll 
            get back to you within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-charcoal/5">
            <h3 className="text-xl font-playfair font-semibold text-charcoal mb-6">
              Contact Information
            </h3>
            
            <div className="space-y-5">
              <a 
                href="tel:6302670096"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-sage/5 transition-colors group"
              >
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center group-hover:bg-sage group-hover:text-bone transition-colors">
                  <Phone className="w-5 h-5 text-sage group-hover:text-bone" />
                </div>
                <div>
                  <p className="font-inter font-semibold text-charcoal">(630) 267-0096</p>
                  <p className="text-sm text-charcoal/60 font-inter">Call or text anytime</p>
                </div>
              </a>

              <a 
                href="mailto:hello@willowandwaterorganiccleaning.com"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-sage/5 transition-colors group"
              >
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center group-hover:bg-sage group-hover:text-bone transition-colors">
                  <Mail className="w-5 h-5 text-sage group-hover:text-bone" />
                </div>
                <div>
                  <p className="font-inter font-semibold text-charcoal">hello@willowandwaterorganiccleaning.com</p>
                  <p className="text-sm text-charcoal/60 font-inter">Email us anytime</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-3">
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <p className="font-inter font-semibold text-charcoal">Fox Valley Area</p>
                  <p className="text-sm text-charcoal/60 font-inter">
                    St. Charles, Geneva, Batavia, Wayne, Campton Hills, Elburn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3">
                <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <p className="font-inter font-semibold text-charcoal">Response Time</p>
                  <p className="text-sm text-charcoal/60 font-inter">
                    We respond within 24 hours, usually much faster
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Message */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-charcoal/5">
            <h3 className="text-xl font-playfair font-semibold text-charcoal mb-6">
              Send a Quick Message
            </h3>
            
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-playfair text-xl font-semibold text-charcoal mb-2">
                  Message Sent!
                </h4>
                <p className="text-charcoal/60 font-inter mb-4">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sage hover:text-charcoal font-inter text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block font-inter text-sm font-medium text-charcoal mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                               font-inter text-charcoal placeholder:text-charcoal/40
                               focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block font-inter text-sm font-medium text-charcoal mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                               font-inter text-charcoal placeholder:text-charcoal/40
                               focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block font-inter text-sm font-medium text-charcoal mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl
                               font-inter text-charcoal placeholder:text-charcoal/40
                               focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                               resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm font-inter">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-charcoal/50 font-inter">
              Or just call us—we love talking to our neighbors!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
