import { MapPin } from 'lucide-react';

const ServiceAreas = () => {
  const areas = [
    'St. Charles',
    'Geneva',
    'Batavia',
    'Wayne',
    'Campton Hills',
    'Elburn',
  ];

  return (
    <section className="bg-charcoal py-6" aria-labelledby="service-areas-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Section Label */}
          <div className="flex items-center gap-2 text-bone/80">
            <MapPin className="w-5 h-5" aria-hidden="true" />
            <span 
              id="service-areas-heading"
              className="font-inter text-sm font-medium uppercase tracking-wider"
            >
              Serving
            </span>
          </div>

          {/* Divider for desktop */}
          <div className="hidden md:block w-px h-6 bg-bone/20" aria-hidden="true" />

          {/* Areas List */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {areas.map((area, index) => (
              <li 
                key={area}
                className="flex items-center gap-2"
              >
                <span className="font-inter text-bone text-sm md:text-base">
                  {area}
                </span>
                {index < areas.length - 1 && (
                  <span 
                    className="hidden sm:inline text-bone/30 ml-4"
                    aria-hidden="true"
                  >
                    •
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;
