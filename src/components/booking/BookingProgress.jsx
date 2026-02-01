import { Check } from 'lucide-react';

/**
 * BookingProgress - Visual step indicator for booking flow
 */
const BookingProgress = ({ steps, currentStep }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${isCompleted 
                    ? 'bg-sage text-white' 
                    : isCurrent 
                      ? 'bg-sage text-white ring-4 ring-sage/20' 
                      : 'bg-charcoal/10 text-charcoal/40'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`
                  mt-1.5 text-xs font-inter hidden sm:block
                  ${isCurrent ? 'text-charcoal font-medium' : 'text-charcoal/50'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-2 transition-colors duration-200
                  ${isCompleted ? 'bg-sage' : 'bg-charcoal/10'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookingProgress;
