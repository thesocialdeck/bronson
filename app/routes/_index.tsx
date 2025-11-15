import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { DayOverview } from '~/components/today/DayOverview';
import { TimeBasedEvents } from '~/components/today/TimeBasedEvents';
import { ActiveChecklistsSection } from '~/components/today/ActiveChecklistsSection';
import { TomorrowPreview } from '~/components/today/TomorrowPreview';
import { UpcomingBirthdaysSection } from '~/components/today/UpcomingBirthdaysSection';
import { MorningPrepBanner } from '~/components/today/MorningPrepBanner';
import { EmptyEvents } from '~/components/shared/EmptyState';
import { getTodaySchedule, getTomorrowSchedule, groupEventsByPerson, categorizeEventsByTime, getUpcomingBirthdays } from '~/lib/scheduler.server';
import { getActivityTypes, getChecklists } from '~/lib/markdown.server';
import { getFamilyMembers } from '~/lib/family.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';
import { Sun } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const familyMembers = await getFamilyMembers();
  const todayData = await getTodaySchedule();
  const tomorrowData = await getTomorrowSchedule();
  const checklists = await getChecklists();
  const upcomingBirthdays = await getUpcomingBirthdays(14); // Next 14 days
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };

  // Add activity type details to events
  const enrichEvent = (event: any) => ({
    ...event,
    activityType: allActivities[event.type] || DEFAULT_ACTIVITIES.school,
  });

  // Enrich all today's events
  const enrichedTodayEvents = todayData.events.map(enrichEvent);

  // Categorize today's events by time
  const { nowEvents, soonEvents, laterEvents } = categorizeEventsByTime(enrichedTodayEvents);

  // Group each time category by person
  const nowGrouped = groupEventsByPerson(nowEvents);
  const soonGrouped = groupEventsByPerson(soonEvents);
  const laterGrouped = groupEventsByPerson(laterEvents);

  // Enrich tomorrow's events
  const enrichedTomorrowEvents = tomorrowData.events.map(enrichEvent);

  // Enrich checklists
  const enrichedChecklists = checklists.map((checklist) => ({
    ...checklist,
    activityType: allActivities[checklist.type] || DEFAULT_ACTIVITIES.school,
  }));

  // Filter active checklists (incomplete ones)
  const activeChecklists = enrichedChecklists.filter(
    checklist => checklist.items.some(item => !item.checked)
  );

  return json({
    familyMembers,
    today: todayData,
    tomorrow: tomorrowData,
    nowGrouped,
    soonGrouped,
    laterGrouped,
    tomorrowEvents: enrichedTomorrowEvents,
    checklists: activeChecklists,
    upcomingBirthdays,
    eventCount: enrichedTodayEvents.length,
    checklistCount: activeChecklists.length,
    upcomingCount: enrichedTomorrowEvents.length,
    urgentCount: nowEvents.length,
    birthdayCount: upcomingBirthdays.length,
  });
}

export default function Index() {
  const {
    familyMembers,
    today,
    tomorrow,
    nowGrouped,
    soonGrouped,
    laterGrouped,
    tomorrowEvents,
    checklists,
    upcomingBirthdays,
    eventCount,
    checklistCount,
    upcomingCount,
    urgentCount,
    birthdayCount,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const hasEvents = eventCount > 0;
  const hasNowEvents = Object.keys(nowGrouped.grouped).length > 0 || nowGrouped.family.length > 0;
  const hasSoonEvents = Object.keys(soonGrouped.grouped).length > 0 || soonGrouped.family.length > 0;
  const hasLaterEvents = Object.keys(laterGrouped.grouped).length > 0 || laterGrouped.family.length > 0;

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
        {/* Day Overview */}
        {(hasEvents || checklistCount > 0 || upcomingCount > 0 || birthdayCount > 0) && (
          <DayOverview
            eventCount={eventCount}
            checklistCount={checklistCount}
            upcomingCount={upcomingCount}
            urgentCount={urgentCount}
          />
        )}

        {/* Morning Prep Banner */}
        <MorningPrepBanner eventCount={eventCount} />

        {/* No events at all */}
        {!hasEvents && checklistCount === 0 && upcomingCount === 0 && birthdayCount === 0 && (
          <EmptyEvents onAdd={() => navigate('/add')} />
        )}

        {/* Happening Now */}
        {hasNowEvents && (
          <TimeBasedEvents
            grouped={nowGrouped.grouped}
            family={nowGrouped.family}
            timeCategory="now"
            familyMembers={familyMembers}
          />
        )}

        {/* Coming Soon */}
        {hasSoonEvents && (
          <TimeBasedEvents
            grouped={soonGrouped.grouped}
            family={soonGrouped.family}
            timeCategory="soon"
            familyMembers={familyMembers}
          />
        )}

        {/* Upcoming Birthdays */}
        {birthdayCount > 0 && (
          <UpcomingBirthdaysSection birthdays={upcomingBirthdays} />
        )}

        {/* Active Checklists */}
        {checklistCount > 0 && (
          <ActiveChecklistsSection checklists={checklists} />
        )}

        {/* Later Today */}
        {hasLaterEvents && (
          <TimeBasedEvents
            grouped={laterGrouped.grouped}
            family={laterGrouped.family}
            timeCategory="later"
            familyMembers={familyMembers}
          />
        )}

        {/* Tomorrow Preview */}
        {upcomingCount > 0 && (
          <TomorrowPreview
            date={tomorrow.fullDate}
            dayName={tomorrow.dayName}
            events={tomorrowEvents}
          />
        )}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
