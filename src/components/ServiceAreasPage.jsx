import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ArrowRight, Check, Leaf, Shield, Star } from 'lucide-react';
import Navbar from './Navbar';
import Contact from './Contact';
import { getAllServiceAreas, getServiceAreasByTier } from '../data/serviceAreas';

const ServiceAreasPage = () => {
  const primaryAreas = getServiceAreasByTier('primary');
  const secondaryAreas = getServiceAreasByTier('secondary');
  const tertiaryAreas = getServiceAreasByTier('tertiary');

  useEffect(() => {
    document.title = 'Service Areas | Willow & Water Organic Cleaning - Fox Valley IL';
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 
        'Willow & Water provides organic house cleaning throughout Fox Valley, IL. Serving St. Charles, Geneva, Batavia, Aurora, and 20+ surrounding communities with eco-friendly cleaning.'
      );
    }

    // Schema for service area list
    const existingSchema = document.querySelector('script[data-areas-schema]');
    if (existingSchema) existingSchema.remove();

    const allAreas = getAllServiceAreas();
    const areasSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Willow & Water Organic Cleaning",
      "description": "Professional organic house cleaning serving the Fox Valley region of Illinois",
      "url": "https://www.willowandwaterorganiccleaning.com",
      "telephone": "+1-630-267-0096",
      "areaServed": allAreas.map(area => ({
        "@type": "City",
        "name": area.name,
        "containedIn": {
          "@type": "State",
          "name": "Illinois"
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-areas-schema', 'true');
    script.textContent = JSON.stringify(areasSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-areas-schema]');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  const AreaCard = ({ area, featured = false }) => (
    <Link 
      to={`/${area.slug}`}
      className={`block bg-white rounded-xl p-6 shadow-sm border transition-all hover:shadow-md hover:border-sage/30 ${
        featured ? 'border-sage/20' : 'border-charcoal/5'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-playfair text-lg font-semibold text-charcoal">
            {area.name}, IL
          </h3>
          <p className="text-xs text-charcoal/50 font-inter">{area.county}</p>
        </div>
        {featured && (
          <span className="bg-sage/10 text-sage text-xs font-inter font-medium px-2 py-1 rounded-full">
            Primary
          </span>
        )}
      </div>
      <p className="text-sm text-charcoal/60 font-inter mb-4 line-clamp-2">
        {area.tagline}
      </p>
      <div className="flex items-center text-sage text-sm font-inter font-medium">
        View Services
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-sage/10 to-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              <span className="font-inter text-sm font-medium">Fox Valley, Illinois</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-playfair font-semibold text-charcoal mb-6">
              Areas We Serve
            </h1>
            
            <p className="text-lg text-charcoal/70 font-inter mb-8">
              Willow & Water provides professional organic house cleaning throughout the Fox Valley region. 
              From St. Charles to Aurora, we bring eco-friendly cleaning to your home.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-charcoal/60 font-inter">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sage" />
                <span>20+ Communities Served</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sage" />
                <span>Kane, DuPage & Kendall Counties</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sage" />
                <span>Same-Day Quotes Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 bg-white border-y border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-sage" />
              <span className="font-inter text-sm text-charcoal">100% Non-Toxic</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sage" />
              <span className="font-inter text-sm text-charcoal">Fully Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-sage" />
              <span className="font-inter text-sm text-charcoal">5-Star Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Service Areas */}
      <section className="py-16 bg-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-playfair font-semibold text-charcoal mb-3">
              Primary Service Areas
            </h2>
            <p className="text-charcoal/60 font-inter">
              Our core Fox Valley Tri-Cities area — fastest response times and most availability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {primaryAreas.map((area) => (
              <AreaCard key={area.slug} area={area} featured />
            ))}
          </div>

          <div className="bg-sage/5 rounded-xl p-6 border border-sage/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-playfair font-semibold text-charcoal">Live in St. Charles, Geneva, or Batavia?</h3>
                <p className="text-sm text-charcoal/60 font-inter">Get priority scheduling and same-day quote response.</p>
              </div>
              <a href="tel:6302670096" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Service Areas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-playfair font-semibold text-charcoal mb-3">
              Extended Service Areas
            </h2>
            <p className="text-charcoal/60 font-inter">
              Proudly serving these communities throughout Fox Valley and beyond
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryAreas.map((area) => (
              <AreaCard key={area.slug} area={area} />
            ))}
          </div>
        </div>
      </section>

      {/* Tertiary Service Areas */}
      {tertiaryAreas.length > 0 && (
        <section className="py-16 bg-bone">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-playfair font-semibold text-charcoal mb-3">
                Additional Service Areas
              </h2>
              <p className="text-charcoal/60 font-inter">
                We also serve these nearby communities — contact us for availability
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tertiaryAreas.map((area) => (
                <Link 
                  key={area.slug}
                  to={`/${area.slug}`}
                  className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-charcoal/5 hover:border-sage/30 transition-colors"
                >
                  <span className="font-inter text-charcoal">{area.name}, IL</span>
                  <ArrowRight className="w-4 h-4 text-sage" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map Section */}
      <section className="py-16 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-playfair font-semibold text-bone mb-4">
                Covering the Fox Valley Region
              </h2>
              <p className="text-bone/70 font-inter mb-6">
                From the banks of the Fox River in St. Charles to the growing communities of Kendall County, 
                Willow & Water brings professional organic cleaning to families across the western suburbs.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-bone/80 font-inter">
                  <Check className="w-5 h-5 text-sage" />
                  <span><strong>Kane County:</strong> St. Charles, Geneva, Batavia, Aurora, Elburn & more</span>
                </li>
                <li className="flex items-center gap-3 text-bone/80 font-inter">
                  <Check className="w-5 h-5 text-sage" />
                  <span><strong>DuPage County:</strong> Wayne, West Chicago, Wheaton, Warrenville</span>
                </li>
                <li className="flex items-center gap-3 text-bone/80 font-inter">
                  <Check className="w-5 h-5 text-sage" />
                  <span><strong>Kendall County:</strong> Oswego, Yorkville, Plano</span>
                </li>
              </ul>
              <Link to="/#pricing" className="btn-primary inline-flex items-center gap-2">
                Get Instant Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-bone/10 rounded-2xl p-8 text-center">
              <MapPin className="w-16 h-16 text-sage mx-auto mb-4" />
              <p className="text-bone font-playfair text-xl mb-2">Serving 20+ Communities</p>
              <p className="text-bone/60 font-inter text-sm">
                Don't see your town listed? Contact us — we may still be able to help!
              </p>
              <a href="tel:6302670096" className="inline-block mt-4 text-sage hover:underline font-inter">
                (630) 267-0096
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-bone">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-playfair font-semibold text-charcoal text-center mb-10">
            Service Area Questions
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-playfair font-semibold text-charcoal mb-2">
                Do you charge extra for areas outside St. Charles?
              </h3>
              <p className="text-charcoal/70 font-inter text-sm">
                No! We charge the same rates across all our service areas. Whether you're in downtown Geneva 
                or rural Kaneville, you get the same transparent pricing.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-playfair font-semibold text-charcoal mb-2">
                My town isn't listed. Can you still clean my home?
              </h3>
              <p className="text-charcoal/70 font-inter text-sm">
                Possibly! If you're within about 30 minutes of St. Charles, we'd be happy to discuss serving your area. 
                Give us a call at (630) 267-0096 and we'll work something out.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-playfair font-semibold text-charcoal mb-2">
                How quickly can you start service in my area?
              </h3>
              <p className="text-charcoal/70 font-inter text-sm">
                For our primary areas (St. Charles, Geneva, Batavia), we often have same-week availability. 
                Extended areas may require slightly more lead time depending on our current schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <Contact />

      {/* Footer */}
      <footer className="bg-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-bone mb-3">
                Willow & Water
              </h3>
              <p className="text-bone/60 font-inter text-sm">
                Organic home cleaning for Fox Valley families. Safe for kids, pets, and the planet.
              </p>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Primary Areas</h4>
              <ul className="space-y-2">
                {primaryAreas.map((area) => (
                  <li key={area.slug}>
                    <Link to={`/${area.slug}`} className="text-sm font-inter text-bone/60 hover:text-bone">
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Extended Areas</h4>
              <ul className="space-y-2">
                {secondaryAreas.slice(0, 5).map((area) => (
                  <li key={area.slug}>
                    <Link to={`/${area.slug}`} className="text-sm font-inter text-bone/60 hover:text-bone">
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/service-areas" className="text-sm font-inter text-sage hover:underline">
                    View all areas →
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li>
                  <a href="tel:6302670096" className="hover:text-bone">(630) 267-0096</a>
                </li>
                <li>
                  <a href="mailto:hello@willowandwaterorganiccleaning.com" className="hover:text-bone">hello@willowandwaterorganiccleaning.com</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-bone/10 pt-8 text-center">
            <p className="text-bone/40 font-inter text-sm">
              © {new Date().getFullYear()} Willow & Water Organic Cleaning. Serving the Fox Valley region.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServiceAreasPage;
