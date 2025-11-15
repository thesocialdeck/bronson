import { formatTime } from '~/lib/utils';
import { PERSON_COLORS } from '~/lib/config';
import * as Icons from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface DayCardProps {
  day: string;
  date: string;
  isToday?: boolean;
  events: Array<{
    person: string;
    activity: string;
    time: string;
    activityType: { icon: string; color: string; underlineStyle: string };
  }>;
  conflicts?: Array<{ event1: any; event2: any }>;
}

export function DayCard({ day, date, isToday, events, conflicts = [] }: DayCardProps) {
  const isInConflict = (event: any) => {
    return conflicts.some(c => c.event1 === event || c.event2 === event);
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm ${
        isToday
          ? 'border-2 border-purple-400 ring-4 ring-purple-100'
          : 'border border-gray-200'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className={`text-center ${isToday ? 'text-purple-600' : 'text-gray-600'}`}>
          <div className="text-sm font-medium">{day}</div>
          <div
            className={`text-2xl font-bold ${
              isToday
                ? 'bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center'
                : ''
            }`}
          >
            {date}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-gray-400">No events</p>
          ) : (
            events.map((event, idx) => {
              const IconComponent = (Icons as any)[event.activityType.icon] as any;
              const personColor = PERSON_COLORS[event.person.toLowerCase() as keyof typeof PERSON_COLORS];
              const hasConflict = isInConflict(event);

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-2 ${
                    hasConflict ? 'bg-red-50 p-2 rounded-lg border border-red-200' : ''
                  }`}
                >
                  {hasConflict && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  {IconComponent && (
                    <IconComponent className={`w-4 h-4 text-${event.activityType.color}-500`} />
                  )}
                  <span className={`text-sm font-medium ${personColor?.text || 'text-gray-700'}`}>
                    {event.person}
                  </span>
                  <span
                    className={`text-sm underline decoration-2 decoration-${event.activityType.color}-400`}
                  >
                    {event.activity}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(event.time)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
