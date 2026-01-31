import { Check } from 'lucide-react';

const steps = [
  { id: 'quote', label: 'Quote' },
  { id: 'contact', label: 'Contact' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'payment', label: 'Payment' },
  { id: 'recurring', label: 'Recurring' },
];

const StepIndicator = ({ currentStep }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                    font-inter text-xs sm:text-sm font-medium transition-all duration-300
                    ${isCompleted 
                      ? 'bg-sage text-bone' 
                      : isCurrent 
                        ? 'bg-sage text-bone ring-2 sm:ring-4 ring-sage/20' 
                        : 'bg-charcoal/10 text-charcoal/40'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Step Label */}
                <span
                  className={`
                    mt-1 sm:mt-2 text-[10px] sm:text-xs font-inter font-medium
                    ${isCurrent ? 'text-charcoal' : isCompleted ? 'text-sage' : 'text-charcoal/40'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-4 sm:w-8 md:w-12 h-0.5 mx-1 sm:mx-2 mt-[-1.25rem] sm:mt-[-1.5rem]
                    ${index < currentIndex ? 'bg-sage' : 'bg-charcoal/10'}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;
