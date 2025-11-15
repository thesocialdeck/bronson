import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { DayCard } from '~/components/week/DayCard';
import { getWeekSchedule } from '~/lib/scheduler.server';
import { getActivityTypes } from '~/lib/markdown.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';
import { getTodayInfo, formatTime } from '~/lib/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const weekData = await getWeekSchedule();
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };
  const today = getTodayInfo();

  const enrichedWeek = weekData.map((day) => ({
    ...day,
    isToday: day.date === today.date,
    events: day.events.map((event: any) => ({
      ...event,
      time: formatTime(event.time),
      activityType: allActivities[event.type] || DEFAULT_ACTIVITIES.school,
    })),
  }));

  return json({ week: enrichedWeek });
}

export default function WeekRoute() {
  const { week } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header title="This Week" />

      <div className="flex-1 p-4 space-y-3 overflow-auto pb-20">
        {week.map((day) => (
          <DayCard
            key={day.date}
            day={day.dayShort}
            date={day.dayNum}
            isToday={day.isToday}
            events={day.events}
          />
        ))}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
