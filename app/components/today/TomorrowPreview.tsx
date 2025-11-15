import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from '@remix-run/react';
import { formatTime } from '~/lib/utils';
import type { ActivityType } from '~/types';

interface TomorrowEvent {
  person: string;
  activity: string;
  time: string;
  activityType: ActivityType;
  location?: string;
}

interface TomorrowPreviewProps {
  date: string;
  dayName: string;
  events: TomorrowEvent[];
}

export function TomorrowPreview({ date, dayName, events }: TomorrowPreviewProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          Prepare for Tomorrow
        </h3>
        <Link
          to="/week"
          className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
        >
          View Week
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{dayName}</p>
            <p className="text-xs text-gray-600">{date}</p>
          </div>
        </div>

        <div className="space-y-2">
          {events.slice(0, 4).map((event, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm bg-white/60 rounded-lg p-2"
            >
              <span className="text-lg">{event.activityType.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {event.person} • {event.activity}
                </p>
                <p className="text-xs text-gray-600">
                  {formatTime(event.time)}
                  {event.location && ` • ${event.location}`}
                </p>
              </div>
            </div>
          ))}

          {events.length > 4 && (
            <p className="text-xs text-gray-600 text-center pt-1">
              + {events.length - 4} more event{events.length - 4 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
