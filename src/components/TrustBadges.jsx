import { Shield, Award, Heart, Leaf, Star, Users, CheckCircle } from 'lucide-react';

/**
 * Trust Badges - Credibility indicators shown below hero
 */
const TrustBadges = () => {
  const badges = [
    {
      icon: <Shield className="w-5 h-5" />,
      text: 'Fully Insured',
      subtext: '& Bonded',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: '100% Satisfaction',
      subtext: 'Guaranteed',
    },
    {
      icon: <Leaf className="w-5 h-5" />,
      text: 'Non-Toxic',
      subtext: 'Products Only',
    },
    {
      icon: <Heart className="w-5 h-5" />,
      text: 'Family-Owned',
      subtext: 'Local Business',
    },
    {
      icon: <Star className="w-5 h-5" />,
      text: '5-Star Rated',
      subtext: 'Service',
    },
  ];

  return (
    <section className="py-6 bg-white border-y border-charcoal/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Scrollable */}
        <div className="flex overflow-x-auto gap-6 pb-2 md:pb-0 md:justify-center md:flex-wrap scrollbar-hide">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-3 flex-shrink-0"
            >
              <div className="text-sage">
                {badge.icon}
              </div>
              <div className="text-left">
                <p className="font-inter font-semibold text-charcoal text-sm whitespace-nowrap">
                  {badge.text}
                </p>
                <p className="font-inter text-charcoal/50 text-xs whitespace-nowrap">
                  {badge.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
