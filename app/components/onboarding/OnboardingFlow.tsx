import { useState } from 'react';
import { useNavigate, useFetcher } from '@remix-run/react';
import { OnboardingModal } from './OnboardingModal';
import type { FamilyMember } from '~/types';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async (members: FamilyMember[]) => {
    setIsCompleting(true);

    // Save family members
    fetcher.submit(
      { members: JSON.stringify(members) },
      {
        method: 'POST',
        action: '/api/family',
        encType: 'application/json',
      }
    );

    // Wait a moment then reload to refresh the app
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (isCompleting) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Setting up your family...</p>
        </div>
      </div>
    );
  }

  return <OnboardingModal onComplete={handleComplete} />;
}
