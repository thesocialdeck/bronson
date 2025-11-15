import { Users } from 'lucide-react';
import { ActivityIcon } from '../shared/ActivityIcon';
import { formatTime } from '~/lib/utils';
import type { ActivityType } from '~/types';

interface FamilyEventCardProps {
  activity: string;
  time: string;
  activityType: ActivityType;
  people: string;
  location?: string;
  notes?: string;
}

export function FamilyEventCard({
  activity,
  time,
  activityType,
  people,
  location,
  notes,
}: FamilyEventCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-purple-200">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Family</h2>
      </div>

      <div className="flex items-start space-x-3">
        <ActivityIcon icon={activityType.icon} color={activityType.color} />
        <div className="flex-1">
          <p
            className={`font-medium underline decoration-4 decoration-${activityType.color}-400 decoration-${activityType.underlineStyle}`}
          >
            {activity}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatTime(time)} {location && `• ${location}`}
          </p>
          {notes && <p className="text-sm text-gray-600 mt-1">{notes}</p>}
        </div>
      </div>
    </div>
  );
}
