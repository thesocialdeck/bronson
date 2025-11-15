import { useState, useEffect } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { FamilySetupStep } from './FamilySetupStep';
import { FeatureTourStep } from './FeatureTourStep';
import { CompletionStep } from './CompletionStep';
import type { FamilyMember } from '~/types';

interface OnboardingModalProps {
  onComplete: (members: FamilyMember[]) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: FamilySetupStep, title: 'Your Family' },
    { component: FeatureTourStep, title: 'Quick Tour' },
    { component: CompletionStep, title: 'Ready!' },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      onComplete(familyMembers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <CurrentStepComponent
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
          />
        </div>

        {/* Step indicator */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-purple-500'
                    : index < currentStep
                    ? 'w-2 bg-purple-300'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
