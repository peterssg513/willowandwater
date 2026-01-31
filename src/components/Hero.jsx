import { Leaf, Check } from 'lucide-react';

const Hero = () => {
  const benefits = [
    'Non-toxic & eco-friendly products',
    'Safe for children & pets',
    'Licensed & insured professionals',
  ];

  return (
    <section className="relative bg-bone overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sage/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sage/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full mb-6">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              <span className="font-inter text-sm font-medium">
                100% Organic Cleaning Products
              </span>
            </div>

            {/* Main Heading - SEO Optimized H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-semibold text-charcoal leading-tight mb-6">
              Organic Home Cleaning for{' '}
              <span className="text-sage">Fox Valley Families</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-charcoal/70 font-inter leading-relaxed mb-8 max-w-2xl mx-auto">
              Premium, non-toxic cleaning services in the Fox Valley. 
              Safe for kids, pets, and the planet.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a href="#pricing" className="btn-primary w-full sm:w-auto text-center">
                Get a Quote and Book Now!
              </a>
              <a href="#services" className="btn-secondary w-full sm:w-auto text-center">
                Our Services
              </a>
            </div>

            {/* Benefits List */}
            <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {benefits.map((benefit) => (
                <li 
                  key={benefit}
                  className="flex items-center gap-2 text-charcoal/70"
                >
                  <Check 
                    className="w-5 h-5 text-sage flex-shrink-0" 
                    aria-hidden="true" 
                  />
                  <span className="font-inter text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
