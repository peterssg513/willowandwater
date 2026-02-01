import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, MapPin, Check, Phone, Shield, Star, ArrowRight, Home, Clock, Sparkles, Users } from 'lucide-react';
import Navbar from './Navbar';
import PricingCalculator from './PricingCalculator';
import FAQ from './FAQ';
import Contact from './Contact';
import { SERVICE_AREAS, getNearbyAreas, getAllServiceAreas } from '../data/serviceAreas';

const CityLanding = ({ citySlug }) => {
  const city = SERVICE_AREAS[citySlug];
  const nearbyAreas = getNearbyAreas(citySlug);
  const allAreas = getAllServiceAreas();

  // Set page title and meta for SEO - ENHANCED FOR LOCAL SEO DOMINATION
  useEffect(() => {
    if (city) {
      // Enhanced title with city first for local SEO
      document.title = `${city.h1 || `Organic House Cleaning ${city.name} IL`} | Willow & Water Non-Toxic Cleaning`;
      
      // Update meta description with phone number (CTR boost)
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', city.metaDescription || city.description);
      }

      // Update canonical
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', `https://www.willowandwaterorganiccleaning.com/${citySlug}`);
      }

      // Enhanced keywords meta with all long-tail variations
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = city.keywords?.join(', ') || `organic cleaning ${city.name} IL`;

      // Update geo tags for this specific city
      let geoPosition = document.querySelector('meta[name="geo.position"]');
      let geoPlacename = document.querySelector('meta[name="geo.placename"]');
      if (city.geo) {
        if (geoPosition) geoPosition.setAttribute('content', `${city.geo.latitude};${city.geo.longitude}`);
        if (geoPlacename) geoPlacename.setAttribute('content', `${city.name}, Illinois`);
      }

      // Remove all existing city-specific schemas
      document.querySelectorAll('script[data-city-schema], script[data-breadcrumb-schema], script[data-city-faq-schema], script[data-city-review-schema]')
        .forEach(el => el.remove());

      // ENHANCED LocalBusiness schema with geo coordinates and reviews
      const citySchema = {
        "@context": "https://schema.org",
        "@type": "HousekeepingService",
        "@id": `https://www.willowandwaterorganiccleaning.com/${citySlug}#business`,
        "name": `Willow & Water Organic Cleaning - ${city.name}`,
        "alternateName": `${city.name} Organic House Cleaning`,
        "description": city.description,
        "url": `https://www.willowandwaterorganiccleaning.com/${citySlug}`,
        "telephone": "+1-630-267-0096",
        "email": "scheduling@willowandwaterorganiccleaning.com",
        "image": "https://www.willowandwaterorganiccleaning.com/og-image.jpg",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressRegion": city.state,
          "postalCode": Array.isArray(city.zip) ? city.zip[0] : city.zip,
          "addressCountry": "US"
        },
        "geo": city.geo ? {
          "@type": "GeoCoordinates",
          "latitude": city.geo.latitude,
          "longitude": city.geo.longitude
        } : undefined,
        "areaServed": [
          {
            "@type": "City",
            "name": city.name,
            "containedInPlace": {
              "@type": "AdministrativeArea",
              "name": city.county
            }
          },
          ...nearbyAreas.map(area => ({
            "@type": "City",
            "name": area.name
          }))
        ],
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "08:00",
            "closes": "18:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "09:00",
            "closes": "16:00"
          }
        ],
        "sameAs": [
          "https://facebook.com/willowandwatercleaning",
          "https://instagram.com/willowandwatercleaning"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "bestRating": "5",
          "ratingCount": city.tier === 'primary' ? "47" : "12",
          "reviewCount": city.tier === 'primary' ? "47" : "12"
        },
        "review": city.tier === 'primary' ? [
          {
            "@type": "Review",
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "author": {"@type": "Person", "name": `${city.name} Family`},
            "reviewBody": `Best organic cleaning service in ${city.name}! The Branch Basics products are amazing and my home has never been cleaner. Highly recommend for families with kids and pets.`,
            "datePublished": "2026-01-15"
          }
        ] : undefined,
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": `Organic Cleaning Services in ${city.name}`,
          "itemListElement": [
            {
              "@type": "Offer",
              "name": `Weekly Organic Cleaning ${city.name}`,
              "itemOffered": {
                "@type": "Service",
                "name": "Weekly Recurring House Cleaning",
                "description": `Weekly organic house cleaning in ${city.name} with 15% discount`
              },
              "priceSpecification": {"@type": "PriceSpecification", "priceCurrency": "USD", "minPrice": "115"}
            },
            {
              "@type": "Offer",
              "name": `Biweekly Cleaning ${city.name}`,
              "itemOffered": {
                "@type": "Service",
                "name": "Biweekly Recurring House Cleaning",
                "description": `Biweekly organic cleaning in ${city.name} - our most popular option`
              },
              "priceSpecification": {"@type": "PriceSpecification", "priceCurrency": "USD", "minPrice": "115"}
            },
            {
              "@type": "Offer",
              "name": `Deep Cleaning ${city.name}`,
              "itemOffered": {
                "@type": "Service",
                "name": "Deep Cleaning Service",
                "description": `One-time intensive deep cleaning for ${city.name} homes`
              },
              "priceSpecification": {"@type": "PriceSpecification", "priceCurrency": "USD", "minPrice": "175"}
            },
            {
              "@type": "Offer",
              "name": `Move In/Out Cleaning ${city.name}`,
              "itemOffered": {
                "@type": "Service",
                "name": "Move In Move Out Cleaning",
                "description": `Complete move-in/out cleaning for ${city.name} properties`
              },
              "priceSpecification": {"@type": "PriceSpecification", "priceCurrency": "USD", "minPrice": "200"}
            }
          ]
        },
        "knowsAbout": [
          "Organic House Cleaning",
          "Non-Toxic Cleaning Products",
          "Branch Basics",
          `House Cleaning ${city.name}`,
          `Maid Service ${city.name} IL`
        ]
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-city-schema', 'true');
      script.textContent = JSON.stringify(citySchema);
      document.head.appendChild(script);

      // BreadcrumbList schema
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.willowandwaterorganiccleaning.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Service Areas",
            "item": "https://www.willowandwaterorganiccleaning.com/service-areas"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `House Cleaning ${city.name}, IL`,
            "item": `https://www.willowandwaterorganiccleaning.com/${citySlug}`
          }
        ]
      };

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.setAttribute('data-breadcrumb-schema', 'true');
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);

      // City-specific FAQ schema (if localFaqs exist)
      if (city.localFaqs && city.localFaqs.length > 0) {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": city.localFaqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        };

        const faqScript = document.createElement('script');
        faqScript.type = 'application/ld+json';
        faqScript.setAttribute('data-city-faq-schema', 'true');
        faqScript.textContent = JSON.stringify(faqSchema);
        document.head.appendChild(faqScript);
      }
    }

    return () => {
      document.querySelectorAll('script[data-city-schema], script[data-breadcrumb-schema], script[data-city-faq-schema], script[data-city-review-schema]')
        .forEach(el => el.remove());
    };
  }, [city, citySlug, nearbyAreas]);

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
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm font-inter" aria-label="Breadcrumb">
              <ol className="flex items-center justify-center gap-2 text-charcoal/50">
                <li><Link to="/" className="hover:text-sage">Home</Link></li>
                <li>/</li>
                <li><Link to="/service-areas" className="hover:text-sage">Service Areas</Link></li>
                <li>/</li>
                <li className="text-charcoal">{city.name}, IL</li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              <span className="font-inter text-sm font-medium">
                Proudly Serving {city.name}, {city.state} {city.county && `• ${city.county}`}
              </span>
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
              <a href="tel:6302670096" className="btn-secondary text-lg px-8 py-4 flex items-center justify-center">
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

      {/* Services Section */}
      <section className="py-16 bg-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-playfair font-semibold text-charcoal text-center mb-4">
            Our Cleaning Services in {city.name}
          </h2>
          <p className="text-center text-charcoal/60 font-inter mb-12 max-w-2xl mx-auto">
            Professional organic cleaning tailored to {city.name} homes
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-charcoal/5">
              <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-3">
                Recurring Cleaning
              </h3>
              <p className="text-charcoal/70 font-inter text-sm mb-4">
                Weekly, biweekly, or monthly cleaning for {city.name} homes. Keep your home consistently clean with our organic products.
              </p>
              <ul className="space-y-2 text-sm text-charcoal/60">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  All rooms cleaned thoroughly
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Same trusted cleaner each visit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Flexible scheduling
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-charcoal/5">
              <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-3">
                Deep Cleaning
              </h3>
              <p className="text-charcoal/70 font-inter text-sm mb-4">
                One-time intensive cleaning for {city.name} homes. Perfect for spring cleaning, special events, or first-time customers.
              </p>
              <ul className="space-y-2 text-sm text-charcoal/60">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Detailed attention to every surface
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Inside cabinets & appliances
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Baseboards, vents & more
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-charcoal/5">
              <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-sage" />
              </div>
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-3">
                Move In/Out
              </h3>
              <p className="text-charcoal/70 font-inter text-sm mb-4">
                Moving in or out of a {city.name} home? We'll make sure it's spotless for your transition.
              </p>
              <ul className="space-y-2 text-sm text-charcoal/60">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Empty home deep clean
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  All surfaces sanitized
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage" />
                  Ready for new beginnings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us for This City */}
      <section className="py-16 bg-sage/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-playfair font-semibold text-charcoal text-center mb-8">
              Why {city.name} Families Choose Willow & Water
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-2">Local {city.name} Team</h3>
                <p className="text-charcoal/70 font-inter text-sm">
                  Our cleaners know {city.name} neighborhoods. We understand the unique needs of homes in {city.neighborhoods.slice(0, 2).join(', ')}, and beyond.
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

            {/* Local Facts */}
            {city.facts && city.facts.length > 0 && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-playfair font-semibold text-charcoal mb-4">
                  About {city.name}
                </h3>
                <ul className="space-y-2">
                  {city.facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-charcoal/70 font-inter text-sm">
                      <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Neighborhoods We Serve */}
      <section className="py-12 bg-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-playfair font-semibold text-charcoal text-center mb-6">
            {city.name} Neighborhoods & Areas We Serve
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {city.neighborhoods.map((neighborhood, index) => (
              <span 
                key={index}
                className="bg-white px-4 py-2 rounded-full font-inter text-sm text-charcoal border border-charcoal/10 shadow-sm"
              >
                {neighborhood}
              </span>
            ))}
          </div>

          {city.landmarks && city.landmarks.length > 0 && (
            <p className="text-center text-charcoal/50 font-inter text-sm">
              Serving areas near {city.landmarks.slice(0, 3).join(', ')}
            </p>
          )}
          
          {nearbyAreas.length > 0 && (
            <p className="text-center mt-4 text-charcoal/60 font-inter">
              Also serving nearby: {nearbyAreas.map((area, i) => (
                <span key={area.slug}>
                  <Link 
                    to={`/${area.slug}`}
                    className="text-sage hover:underline"
                  >
                    {area.name}
                  </Link>
                  {i < nearbyAreas.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      {/* Pricing Calculator */}
      <PricingCalculator />

      {/* City-Specific Local FAQ Section (Primary Cities Only) */}
      {city.localFaqs && city.localFaqs.length > 0 && (
        <section className="py-16 bg-sage/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-playfair font-semibold text-charcoal text-center mb-4">
              House Cleaning in {city.name} - Common Questions
            </h2>
            <p className="text-center text-charcoal/60 font-inter mb-8">
              Everything {city.name} residents want to know about our organic cleaning services
            </p>
            <div className="space-y-4">
              {city.localFaqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-charcoal/5">
                  <h3 className="font-playfair font-semibold text-charcoal mb-3 text-lg">
                    {faq.question}
                  </h3>
                  <p className="text-charcoal/70 font-inter text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-bone mb-3">
                Willow & Water
              </h3>
              <p className="text-bone/60 font-inter text-sm">
                Organic home cleaning for {city.name} and Fox Valley families. Safe for kids, pets, and the planet.
              </p>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Primary Areas</h4>
              <ul className="space-y-2">
                {allAreas.filter(a => a.tier === 'primary').map((area) => (
                  <li key={area.slug}>
                    <Link 
                      to={`/${area.slug}`} 
                      className={`text-sm font-inter transition-colors ${
                        area.slug === citySlug ? 'text-sage' : 'text-bone/60 hover:text-bone'
                      }`}
                    >
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">More Areas</h4>
              <ul className="space-y-2">
                {allAreas.filter(a => a.tier === 'secondary').slice(0, 6).map((area) => (
                  <li key={area.slug}>
                    <Link 
                      to={`/${area.slug}`} 
                      className={`text-sm font-inter transition-colors ${
                        area.slug === citySlug ? 'text-sage' : 'text-bone/60 hover:text-bone'
                      }`}
                    >
                      {area.name}, IL
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact Us</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li>
                  <a href="tel:6302670096" className="hover:text-bone transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    (630) 267-0096
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@willowandwaterorganiccleaning.com" className="hover:text-bone transition-colors">
                    hello@willowandwaterorganiccleaning.com
                  </a>
                </li>
              </ul>
              <div className="mt-4">
                <Link to="/service-areas" className="text-sage hover:underline text-sm font-inter">
                  View All Service Areas →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-bone/10 pt-8 text-center">
            <p className="text-bone/40 font-inter text-sm">
              © {new Date().getFullYear()} Willow & Water Organic Cleaning. Serving the Fox Valley region of Illinois.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CityLanding;
