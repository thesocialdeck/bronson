import { CheckSquare } from 'lucide-react';
import { ActivityIcon } from '../shared/ActivityIcon';
import { formatTime } from '~/lib/utils';
import type { ActivityType } from '~/types';

interface EventItemProps {
  activity: string;
  time: string;
  activityType: ActivityType;
  notes?: string;
  checklist?: string;
  location?: string;
}

export function EventItem({
  activity,
  time,
  activityType,
  notes,
  checklist,
  location,
}: EventItemProps) {
  const underlineClass = `decoration-${activityType.underlineStyle}`;

  return (
    <div className="flex items-start space-x-3">
      <ActivityIcon icon={activityType.icon} color={activityType.color} />
      <div className="flex-1">
        <p
          className={`font-medium underline decoration-4 decoration-${activityType.color}-400 ${underlineClass}`}
        >
          {activity} {formatTime(time)}
        </p>
        {location && <p className="text-sm text-gray-600 mt-1">{location}</p>}
        {checklist && (
          <div className="mt-1 flex items-center space-x-2">
            <CheckSquare className={`w-4 h-4 text-${activityType.color}-600`} />
            <span className="text-sm text-gray-600">{checklist}</span>
          </div>
        )}
        {notes && <p className="text-sm text-gray-600 mt-1">{notes}</p>}
      </div>
    </div>
  );
}
