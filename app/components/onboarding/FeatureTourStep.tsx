import { Calendar, Sunrise, List, MessageSquare, Users } from 'lucide-react';

interface FeatureTourStepProps {
  onNext: () => void;
  onBack?: () => void;
}

export function FeatureTourStep({ onNext, onBack }: FeatureTourStepProps) {
  const features = [
    {
      icon: Calendar,
      color: 'blue',
      title: 'Today View',
      description: 'See all of today\'s events organized by time and person',
    },
    {
      icon: List,
      color: 'purple',
      title: 'Week View',
      description: 'Visual timeline with conflict detection across your whole week',
    },
    {
      icon: Sunrise,
      color: 'orange',
      title: 'Morning Prep',
      description: 'Auto-generated pack lists and countdown timers for busy mornings',
    },
    {
      icon: MessageSquare,
      color: 'pink',
      title: 'Quick Add',
      description: 'Paste text messages and let AI parse them into events',
    },
    {
      icon: Users,
      color: 'emerald',
      title: 'People & Lists',
      description: 'Manage contacts and create checklists for activities',
    },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Here's what you can do
        </h2>
        <p className="text-gray-600">
          A quick tour of Bronson's main features
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 text-${feature.color}-600`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6">
        <p className="text-sm text-purple-900">
          <strong>💡 Pro tip:</strong> Use the <strong>+</strong> button (bottom-right) to quickly add events from anywhere in the app!
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
