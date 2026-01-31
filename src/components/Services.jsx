import { Sparkles, Home, Leaf, CheckCircle } from 'lucide-react';

const services = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Standard Cleaning',
    description: 'Regular maintenance cleaning to keep your home fresh and tidy. Perfect for weekly or bi-weekly visits.',
    features: ['Dusting all surfaces', 'Vacuuming & mopping', 'Kitchen & bathroom cleaning', 'Trash removal'],
  },
  {
    icon: <Home className="w-6 h-6" />,
    title: 'Deep Cleaning',
    description: 'Thorough top-to-bottom cleaning that reaches every corner. Ideal for first-time clients or seasonal refreshes.',
    features: ['Inside appliances', 'Baseboards & door frames', 'Light fixtures', 'Inside cabinets'],
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-bone">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full mb-4">
            <Leaf className="w-4 h-4" />
            <span className="font-inter text-sm font-medium">100% Organic Products</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-4">
            Our Services
          </h2>
          <p className="text-charcoal/70 font-inter max-w-2xl mx-auto">
            Every cleaning uses only Branch Basics non-toxic products. Safe for your family, pets, and the planet.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-charcoal/5 
                         hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center text-sage mb-4">
                {service.icon}
              </div>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-2">
                {service.title}
              </h3>
              <p className="text-charcoal/60 font-inter text-sm mb-4">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-charcoal/70">
                    <CheckCircle className="w-4 h-4 text-sage flex-shrink-0" />
                    <span className="font-inter">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* What We Bring */}
        <div className="bg-sage/5 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl font-playfair font-semibold text-charcoal mb-4 text-center">
            We Bring Everything
          </h3>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              'Branch Basics Cleaners',
              'Professional Vacuum',
              'Microfiber Mops',
              'All Supplies & Tools',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-charcoal/70">
                <CheckCircle className="w-4 h-4 text-sage" />
                <span className="font-inter text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-charcoal/50 font-inter text-sm mt-4">
            You don't need to provide anything—just open the door and we handle the rest.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Services;
