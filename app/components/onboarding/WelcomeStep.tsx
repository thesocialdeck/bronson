import { Sparkles, Calendar, Users, Sunrise } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center mb-4 transform rotate-3">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Bronson!
        </h1>
        <p className="text-lg text-gray-600">
          Your family's intelligent scheduling assistant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-2xl p-6">
          <Calendar className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
          <p className="text-sm text-gray-600">
            Parse messages, detect conflicts, manage your week
          </p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-6">
          <Sunrise className="w-8 h-8 text-purple-600 mb-3 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Morning Prep</h3>
          <p className="text-sm text-gray-600">
            Auto-generated pack lists and countdown timers
          </p>
        </div>

        <div className="bg-pink-50 rounded-2xl p-6">
          <Users className="w-8 h-8 text-pink-600 mb-3 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Family First</h3>
          <p className="text-sm text-gray-600">
            Built for busy parents juggling multiple kids
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all"
      >
        Let's Get Started!
      </button>

      <p className="text-xs text-gray-500 mt-4">Takes less than 2 minutes</p>
    </div>
  );
}
