import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { getPrimaryServiceAreas, getServiceAreasByTier } from '../data/serviceAreas';

const ServiceAreas = () => {
  const primaryAreas = getPrimaryServiceAreas();
  const secondaryAreas = getServiceAreasByTier('secondary').slice(0, 3);
  const displayAreas = [...primaryAreas, ...secondaryAreas];

  return (
    <section className="bg-charcoal py-6" aria-labelledby="service-areas-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          {/* Section Label */}
          <div className="flex items-center gap-2 text-bone/80">
            <MapPin className="w-5 h-5" aria-hidden="true" />
            <span 
              id="service-areas-heading"
              className="font-inter text-sm font-medium uppercase tracking-wider"
            >
              Serving Fox Valley
            </span>
          </div>

          {/* Divider for desktop */}
          <div className="hidden md:block w-px h-6 bg-bone/20" aria-hidden="true" />

          {/* Areas List */}
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {displayAreas.map((area, index) => (
              <li 
                key={area.slug}
                className="flex items-center"
              >
                <Link 
                  to={`/${area.slug}`}
                  className="font-inter text-bone text-sm md:text-base hover:text-sage transition-colors"
                >
                  {area.name}
                </Link>
                {index < displayAreas.length - 1 && (
                  <span 
                    className="text-bone/30 ml-4"
                    aria-hidden="true"
                  >
                    •
                  </span>
                )}
              </li>
            ))}
            <li className="flex items-center">
              <span className="text-bone/30 mr-2" aria-hidden="true">•</span>
              <Link 
                to="/service-areas"
                className="font-inter text-sage text-sm md:text-base hover:underline flex items-center gap-1"
              >
                +15 more
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;
