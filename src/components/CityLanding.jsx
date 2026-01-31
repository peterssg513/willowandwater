import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, MapPin, Check, Phone, Shield, Star, ArrowRight } from 'lucide-react';
import Navbar from './Navbar';
import PricingCalculator from './PricingCalculator';
import FAQ from './FAQ';
import Contact from './Contact';

// City-specific data for SEO
const cityData = {
  'st-charles': {
    name: 'St. Charles',
    state: 'IL',
    zip: '60174',
    tagline: 'Trusted by St. Charles families since 2024',
    description: 'Professional organic house cleaning services in St. Charles, Illinois. Our eco-friendly cleaning team serves homes throughout St. Charles, from downtown to the Fox River area.',
    neighborhoods: ['Downtown St. Charles', 'Fox River Shores', 'Pheasant Run', 'Timber Trails', 'Royal Fox'],
    nearbyAreas: ['Geneva', 'Batavia', 'Wayne'],
    facts: [
      'Located along the beautiful Fox River',
      'Home to many families with children and pets',
      'Growing demand for non-toxic cleaning solutions',
    ],
  },
  'geneva': {
    name: 'Geneva',
    state: 'IL',
    zip: '60134',
    tagline: 'Geneva\'s premier organic cleaning service',
    description: 'Premium organic house cleaning in Geneva, Illinois. We bring eco-friendly, non-toxic cleaning to homes throughout Geneva\'s charming neighborhoods.',
    neighborhoods: ['Downtown Geneva', 'Mill Creek', 'Settler\'s Hill', 'Fox Bend', 'Cambridge Lakes'],
    nearbyAreas: ['St. Charles', 'Batavia', 'West Chicago'],
    facts: [
      'Known for its historic downtown and Swedish heritage',
      'High standards for home care among residents',
      'Perfect for families seeking chemical-free cleaning',
    ],
  },
  'batavia': {
    name: 'Batavia',
    state: 'IL',
    zip: '60510',
    tagline: 'Batavia\'s trusted organic cleaning team',
    description: 'Eco-friendly house cleaning services in Batavia, Illinois. Our organic cleaning team serves Batavia homes with safe, non-toxic products.',
    neighborhoods: ['Downtown Batavia', 'Tanglewood Hills', 'Prairie Lakes', 'Fox Valley Villages', 'Windmill Creek'],
    nearbyAreas: ['Geneva', 'St. Charles', 'Aurora'],
    facts: [
      'Known as the "City of Energy" with a focus on sustainability',
      'Strong community of environmentally-conscious families',
      'Growing preference for green cleaning alternatives',
    ],
  },
  'wayne': {
    name: 'Wayne',
    state: 'IL',
    zip: '60184',
    tagline: 'Premium organic cleaning for Wayne homes',
    description: 'Organic house cleaning services for Wayne, Illinois. We specialize in cleaning larger homes and estates with our eco-friendly, non-toxic approach.',
    neighborhoods: ['Wayne Village', 'Dunham Woods', 'Brewster Creek', 'Army Trail'],
    nearbyAreas: ['St. Charles', 'Geneva', 'West Chicago'],
    facts: [
      'Known for beautiful estate properties and horse farms',
      'Residents value premium, personalized services',
      'Ideal for eco-conscious homeowners with larger spaces',
    ],
  },
  'campton-hills': {
    name: 'Campton Hills',
    state: 'IL',
    zip: '60175',
    tagline: 'Campton Hills\' organic cleaning specialists',
    description: 'Professional organic cleaning services in Campton Hills, Illinois. Our team brings non-toxic, eco-friendly cleaning to your Campton Hills home.',
    neighborhoods: ['Gray Willows', 'Campton Crossings', 'Corron Farm', 'Burlington Woods'],
    nearbyAreas: ['St. Charles', 'Elburn', 'Geneva'],
    facts: [
      'Rural charm with growing family communities',
      'Residents appreciate attention to detail',
      'Perfect setting for families seeking natural living',
    ],
  },
  'elburn': {
    name: 'Elburn',
    state: 'IL',
    zip: '60119',
    tagline: 'Elburn\'s preferred organic cleaning service',
    description: 'Eco-friendly house cleaning in Elburn, Illinois. We provide professional organic cleaning services to homes throughout the Elburn community.',
    neighborhoods: ['Downtown Elburn', 'Hughes Creek', 'Blackberry Oaks', 'Prairie Green'],
    nearbyAreas: ['Campton Hills', 'St. Charles', 'Geneva'],
    facts: [
      'Small-town atmosphere with strong community ties',
      'Growing families seeking healthier home environments',
      'Appreciation for personalized, trustworthy service',
    ],
  },
};

const CityLanding = ({ citySlug }) => {
  const city = cityData[citySlug];

  // Set page title and meta for SEO
  useEffect(() => {
    if (city) {
      document.title = `Organic House Cleaning ${city.name} IL | Willow & Water - Non-Toxic Cleaning`;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 
          `Professional organic house cleaning in ${city.name}, ${city.state}. 100% non-toxic, eco-friendly products safe for kids & pets. Serving ${city.neighborhoods.slice(0, 3).join(', ')} and more. Get instant quote!`
        );
      }

      // Update canonical
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', `https://willowandwater.vercel.app/${citySlug}`);
      }

      // Add city-specific LocalBusiness schema
      const existingSchema = document.querySelector('script[data-city-schema]');
      if (existingSchema) existingSchema.remove();

      const citySchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Willow & Water Organic Cleaning - ${city.name}`,
        "description": city.description,
        "url": `https://willowandwater.vercel.app/${citySlug}`,
        "telephone": "+1-630-267-0096",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressRegion": city.state,
          "postalCode": city.zip,
          "addressCountry": "US"
        },
        "areaServed": {
          "@type": "City",
          "name": city.name
        },
        "priceRange": "$$"
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-city-schema', 'true');
      script.textContent = JSON.stringify(citySchema);
      document.head.appendChild(script);
    }

    return () => {
      const scriptToRemove = document.querySelector('script[data-city-schema]');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [city, citySlug]);

  if (!city) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-playfair text-charcoal mb-4">City not found</h1>
          <Link to="/" className="btn-primary">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      
      {/* City-Specific Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-sage/10 to-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              <span className="font-inter text-sm font-medium">Serving {city.name}, {city.state}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-semibold text-charcoal mb-6">
              Organic House Cleaning in {city.name}, Illinois
            </h1>
            
            <p className="text-lg sm:text-xl text-charcoal/70 font-inter mb-8">
              {city.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#pricing" className="btn-primary text-lg px-8 py-4">
                Get Instant Quote
              </a>
              <a href="tel:6302670096" className="btn-secondary text-lg px-8 py-4">
                <Phone className="w-5 h-5 mr-2" />
                (630) 267-0096
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-y border-charcoal/5">
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
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-sage" />
              <span className="font-inter text-sm text-charcoal">Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us for This City */}
      <section className="py-16 bg-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-playfair font-semibold text-charcoal text-center mb-8">
              Why {city.name} Families Choose Willow & Water
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-2">Local {city.name} Team</h3>
                <p className="text-charcoal/70 font-inter text-sm">
                  Our cleaners know {city.name} neighborhoods. We understand the unique needs of homes in {city.neighborhoods[0]}, {city.neighborhoods[1]}, and beyond.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-2">Safe for Your Family</h3>
                <p className="text-charcoal/70 font-inter text-sm">
                  We use only Branch Basics non-toxic cleaners. Perfect for {city.name} families with children, pets, or anyone with chemical sensitivities.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-2">Flexible Scheduling</h3>
                <p className="text-charcoal/70 font-inter text-sm">
                  We work around your schedule. Whether you're in {city.name} during the day or prefer cleaning while you're at work, we've got you covered.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-2">Transparent Pricing</h3>
                <p className="text-charcoal/70 font-inter text-sm">
                  Get an instant quote for your {city.name} home. No hidden fees, no surprises. Just honest, upfront pricing for quality organic cleaning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas We Serve */}
      <section className="py-12 bg-sage/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-playfair font-semibold text-charcoal text-center mb-6">
            {city.name} Neighborhoods We Serve
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {city.neighborhoods.map((neighborhood, index) => (
              <span 
                key={index}
                className="bg-white px-4 py-2 rounded-full font-inter text-sm text-charcoal border border-charcoal/10"
              >
                {neighborhood}
              </span>
            ))}
          </div>
          
          <p className="text-center mt-8 text-charcoal/60 font-inter">
            Also serving nearby: {city.nearbyAreas.map((area, i) => (
              <Link 
                key={area} 
                to={`/${area.toLowerCase().replace(' ', '-')}`}
                className="text-sage hover:underline"
              >
                {area}{i < city.nearbyAreas.length - 1 ? ', ' : ''}
              </Link>
            ))}
          </p>
        </div>
      </section>

      {/* Pricing Calculator */}
      <PricingCalculator />

      {/* FAQ */}
      <FAQ />

      {/* Contact */}
      <Contact />

      {/* City-Specific Footer CTA */}
      <section className="py-12 bg-sage">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-bone mb-4">
            Ready for a Cleaner, Healthier {city.name} Home?
          </h2>
          <p className="text-bone/80 font-inter mb-6">
            Join other {city.name} families who've made the switch to organic cleaning.
          </p>
          <a href="#pricing" className="inline-flex items-center gap-2 bg-bone text-charcoal px-8 py-4 rounded-lg font-inter font-medium hover:bg-bone/90 transition-colors">
            Get Your Free Quote
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-bone mb-3">
                Willow & Water
              </h3>
              <p className="text-bone/60 font-inter text-sm">
                Organic home cleaning for {city.name} and Fox Valley families. Safe for kids, pets, and the planet.
              </p>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Service Areas</h4>
              <ul className="space-y-2">
                {Object.entries(cityData).map(([slug, data]) => (
                  <li key={slug}>
                    <Link 
                      to={`/${slug}`} 
                      className={`text-sm font-inter transition-colors ${
                        slug === citySlug ? 'text-sage' : 'text-bone/60 hover:text-bone'
                      }`}
                    >
                      {data.name}, IL
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact Us</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li>
                  <a href="tel:6302670096" className="hover:text-bone transition-colors">
                    (630) 267-0096
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@willowandwater.com" className="hover:text-bone transition-colors">
                    hello@willowandwater.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-bone/10 pt-8 text-center">
            <p className="text-bone/40 font-inter text-sm">
              © {new Date().getFullYear()} Willow & Water Organic Cleaning. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CityLanding;
