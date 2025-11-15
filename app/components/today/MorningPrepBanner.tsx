import { Link } from '@remix-run/react';
import { Sunrise, ChevronRight } from 'lucide-react';

interface MorningPrepBannerProps {
  eventCount: number;
}

export function MorningPrepBanner({ eventCount }: MorningPrepBannerProps) {
  const now = new Date();
  const currentHour = now.getHours();

  // Only show in morning hours (6am-11am)
  const isMorning = currentHour >= 6 && currentHour < 11;

  if (!isMorning) {
    return null;
  }

  return (
    <Link
      to="/morning"
      className="block bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow text-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Sunrise className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Morning Prep</h3>
            <p className="text-sm opacity-90">
              {eventCount === 0
                ? 'No events today - relax!'
                : `${eventCount} event${eventCount > 1 ? 's' : ''} to prep for`}
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6" />
      </div>
    </Link>
  );
}
