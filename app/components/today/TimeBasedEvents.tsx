import { Clock, AlertCircle } from 'lucide-react';
import { PersonDayCard } from './PersonDayCard';
import { FamilyEventCard } from './FamilyEventCard';
import type { FamilyMember } from '~/types';

interface TimeBasedEventsProps {
  grouped: Record<string, any[]>;
  family: any[];
  timeCategory: 'now' | 'soon' | 'later';
  familyMembers: FamilyMember[];
}

export function TimeBasedEvents({ grouped, family, timeCategory, familyMembers }: TimeBasedEventsProps) {
  const hasEvents = Object.keys(grouped).length > 0 || family.length > 0;

  if (!hasEvents) return null;

  const categoryConfig = {
    now: {
      title: 'Happening Now',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    soon: {
      title: 'Coming Up (Next 2 Hours)',
      icon: Clock,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    later: {
      title: 'Later Today',
      icon: Clock,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  };

  const config = categoryConfig[timeCategory];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{config.title}</h3>
      </div>

      <div className="space-y-3">
        {familyMembers.map((member: FamilyMember) => {
          const events = grouped[member.name];
          if (!events || events.length === 0) return null;

          return (
            <PersonDayCard key={member.name} person={member} events={events} />
          );
        })}

        {family.map((event: any, idx: number) => (
          <FamilyEventCard
            key={idx}
            activity={event.activity}
            time={event.time}
            activityType={event.activityType}
            people={event.person}
            location={event.location}
            notes={event.notes}
          />
        ))}
      </div>
    </div>
  );
}
