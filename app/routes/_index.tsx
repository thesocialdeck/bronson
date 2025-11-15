import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { PersonDayCard } from '~/components/today/PersonDayCard';
import { FamilyEventCard } from '~/components/today/FamilyEventCard';
import { getTodaySchedule } from '~/lib/scheduler.server';
import { groupEventsByPerson } from '~/lib/scheduler.server';
import { getActivityTypes } from '~/lib/markdown.server';
import { FAMILY_MEMBERS, DEFAULT_ACTIVITIES } from '~/lib/config';
import { Sun } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const todayData = await getTodaySchedule();
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };

  const { grouped, family } = groupEventsByPerson(todayData.events);

  // Add activity type details to events
  const enrichEvent = (event: any) => ({
    ...event,
    activityType: allActivities[event.type] || DEFAULT_ACTIVITIES.school,
  });

  const enrichedGrouped = Object.fromEntries(
    Object.entries(grouped).map(([person, events]: [string, any]) => [
      person,
      (events as any[]).map(enrichEvent),
    ])
  );

  const enrichedFamily = family.map(enrichEvent);

  return json({
    today: todayData,
    grouped: enrichedGrouped,
    family: enrichedFamily,
  });
}

export default function Index() {
  const { today, grouped, family } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        title={today.dayName}
        subtitle={today.fullDate}
        rightElement={
          <div className="flex items-center space-x-2 text-gray-600">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium">18°C</span>
          </div>
        }
      />

      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {FAMILY_MEMBERS.map((member) => {
          const events = grouped[member.name];
          if (!events || events.length === 0) return null;

          return (
            <PersonDayCard key={member.name} person={member} events={events} />
          );
        })}

        {family.map((event, idx) => (
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

        {Object.keys(grouped).length === 0 && family.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events today</p>
            <p className="text-gray-400 text-sm mt-2">
              Tap + to add something
            </p>
          </div>
        )}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
