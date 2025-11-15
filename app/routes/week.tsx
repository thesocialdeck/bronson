import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { DayCard } from '~/components/week/DayCard';
import { WeekOverview } from '~/components/week/WeekOverview';
import { WeekTimeline } from '~/components/week/WeekTimeline';
import { getWeekSchedule, calculateWeekStats, detectConflicts } from '~/lib/scheduler.server';
import { getActivityTypes } from '~/lib/markdown.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';
import { getTodayInfo } from '~/lib/utils';
import { LayoutGrid, List } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const weekData = await getWeekSchedule();
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };
  const today = getTodayInfo();

  // Enrich events with activity types and detect conflicts
  const enrichedWeek = weekData.map((day) => {
    const enrichedEvents = day.events.map((event: any) => ({
      ...event,
      activityType: allActivities[event.type] || DEFAULT_ACTIVITIES.school,
    }));

    const conflicts = detectConflicts(enrichedEvents);

    return {
      ...day,
      isToday: day.date === today.date,
      events: enrichedEvents,
      conflicts,
    };
  });

  // Calculate week statistics
  const stats = calculateWeekStats(enrichedWeek);

  return json({ week: enrichedWeek, stats });
}

export default function WeekRoute() {
  const { week, stats } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        title="This Week"
        rightElement={
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Timeline view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {/* Week Overview */}
        <WeekOverview
          days={stats.daySummaries}
          totalEvents={stats.totalEvents}
          conflictCount={stats.conflictCount}
          busiestDay={stats.busiestDay}
        />

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <WeekTimeline days={week} />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {week.map((day) => (
              <DayCard
                key={day.date}
                day={day.dayShort}
                date={day.dayNum}
                isToday={day.isToday}
                events={day.events}
                conflicts={day.conflicts}
              />
            ))}
          </div>
        )}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
