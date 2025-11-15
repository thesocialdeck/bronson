import { CheckCircle, Sparkles } from 'lucide-react';

interface CompletionStepProps {
  onNext: () => void;
  familyMembers: any[];
}

export function CompletionStep({ onNext, familyMembers }: CompletionStepProps) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          You're all set!
        </h2>
        <p className="text-lg text-gray-600">
          Your family is ready to get organized
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Your Family</h3>
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          {familyMembers.map((member, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full bg-${member.color}-500 flex items-center justify-center text-white font-bold text-xl mb-2 shadow-lg`}>
                {member.avatar}
              </div>
              <p className="text-sm font-medium text-gray-700">{member.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-8 text-left">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-sm font-bold">1</span>
          </div>
          <div>
            <p className="text-sm text-gray-900">
              <strong>Start adding events</strong> - Use the + button or paste messages
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-sm font-bold">2</span>
          </div>
          <div>
            <p className="text-sm text-gray-900">
              <strong>Check your week</strong> - See the week view for conflicts and planning
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-sm font-bold">3</span>
          </div>
          <div>
            <p className="text-sm text-gray-900">
              <strong>Morning prep</strong> - Get your pack lists ready the night before
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all text-lg"
      >
        Start Using Bronson!
      </button>
    </div>
  );
}
