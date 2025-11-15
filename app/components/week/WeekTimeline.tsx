import { FAMILY_MEMBERS, PERSON_COLORS } from '~/lib/config';
import { AlertTriangle } from 'lucide-react';
import type { ActivityType } from '~/types';

interface Event {
  id?: string;
  person: string;
  activity: string;
  time: string;
  endTime?: string;
  duration?: number;
  activityType: ActivityType;
}

interface DayData {
  date: string;
  dayName: string;
  dayShort: string;
  dayNum: string;
  isToday: boolean;
  events: Event[];
  conflicts: Array<{ event1: Event; event2: Event }>;
}

interface WeekTimelineProps {
  days: DayData[];
}

export function WeekTimeline({ days }: WeekTimelineProps) {
  // Time slots from 6am to 9pm (15 hours)
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 6); // 6-21 (6am-9pm)

  const getEventPosition = (event: Event) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const startMinutes = (hours - 6) * 60 + minutes; // Minutes from 6am

    // Calculate duration
    let durationMinutes = event.duration || 60;
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const endTotalMinutes = endHours * 60 + endMinutes;
      const startTotalMinutes = hours * 60 + minutes;
      durationMinutes = endTotalMinutes - startTotalMinutes;
    }

    // Each hour is represented as a slot, calculate position within the grid
    const top = (startMinutes / 60) * 64; // 64px per hour
    const height = Math.max((durationMinutes / 60) * 64, 48); // Minimum 48px height

    return { top, height };
  };

  const isInConflict = (event: Event, conflicts: DayData['conflicts']) => {
    return conflicts.some(
      c => c.event1 === event || c.event2 === event
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
        <div className="p-2 text-xs font-medium text-gray-500">Time</div>
        {days.map((day) => (
          <div
            key={day.date}
            className={`p-2 text-center ${
              day.isToday ? 'bg-purple-100' : ''
            }`}
          >
            <div className={`text-xs font-medium ${day.isToday ? 'text-purple-700' : 'text-gray-600'}`}>
              {day.dayShort}
            </div>
            <div className={`text-lg font-bold ${day.isToday ? 'text-purple-600' : 'text-gray-900'}`}>
              {day.dayNum}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="grid grid-cols-8 relative" style={{ minHeight: '960px' }}>
        {/* Time column */}
        <div className="border-r border-gray-200">
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-gray-100 px-2 py-1 text-xs text-gray-500"
            >
              {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => (
          <div key={day.date} className="border-r border-gray-200 relative">
            {/* Time slot grid lines */}
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-gray-100"
              />
            ))}

            {/* Events */}
            <div className="absolute inset-0 p-1">
              {day.events.map((event, eventIndex) => {
                const { top, height } = getEventPosition(event);
                const personColor = PERSON_COLORS[event.person.toLowerCase() as keyof typeof PERSON_COLORS] || PERSON_COLORS.blue;
                const hasConflict = isInConflict(event, day.conflicts);

                return (
                  <div
                    key={eventIndex}
                    className={`absolute left-1 right-1 rounded-lg p-1.5 text-xs overflow-hidden shadow-sm transition-all hover:shadow-md hover:z-10 ${
                      personColor.bg
                    } ${personColor.border} border-2 ${
                      hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''
                    }`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                  >
                    {hasConflict && (
                      <AlertTriangle className="w-3 h-3 text-red-600 absolute top-0.5 right-0.5" />
                    )}
                    <div className={`font-semibold ${personColor.text} truncate text-[10px]`}>
                      {event.person}
                    </div>
                    <div className="font-medium text-gray-900 truncate text-[10px] leading-tight">
                      {event.activity}
                    </div>
                    <div className="text-gray-600 text-[9px] mt-0.5">
                      {event.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
