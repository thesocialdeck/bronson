import { PersonAvatar } from '../shared/PersonAvatar';
import { EventItem } from './EventItem';
import { PERSON_COLORS } from '~/lib/config';
import type { FamilyMember, ActivityType } from '~/types';

interface PersonDayCardProps {
  person: FamilyMember;
  events: Array<{
    activity: string;
    time: string;
    activityType: ActivityType;
    notes?: string;
    checklist?: string;
    location?: string;
  }>;
}

export function PersonDayCard({ person, events }: PersonDayCardProps) {
  const colors = PERSON_COLORS[person.color as keyof typeof PERSON_COLORS] || PERSON_COLORS.blue;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${colors.border}`}>
      <div className="flex items-center space-x-3 mb-3">
        <PersonAvatar
          name={person.name}
          color={person.color}
          avatar={person.avatar}
        />
        <h2 className="text-lg font-semibold text-gray-800">{person.name}</h2>
      </div>

      <div className="space-y-3">
        {events.map((event, idx) => (
          <EventItem key={idx} {...event} />
        ))}
      </div>
    </div>
  );
}
