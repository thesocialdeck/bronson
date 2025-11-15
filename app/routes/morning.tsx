import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { CountdownTimer } from '~/components/morning/CountdownTimer';
import { PackList } from '~/components/morning/PackList';
import { getMorningPrep } from '~/lib/morning-prep.server';
import { getActivityTypes } from '~/lib/markdown.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';
import { Sunrise, Coffee, ChevronRight, CheckSquare } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const morningData = await getMorningPrep();
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };

  // Enrich events with activity types
  const enrichedEvents = morningData.allTodayEvents.map((event: any) => ({
    ...event,
    activityType: allActivities[event.type] || DEFAULT_ACTIVITIES.school,
  }));

  return json({
    ...morningData,
    allTodayEvents: enrichedEvents,
  });
}

export default function MorningRoute() {
  const { allTodayEvents, checklists, nextEvent, minutesUntilNext, currentTime } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const isMorning = currentTime.isMorning;
  const greeting = currentTime.hour < 12 ? 'Good Morning' : 'Good Afternoon';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      <Header
        title={greeting}
        subtitle="Let's get ready for the day!"
        rightElement={
          <div className="flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentTime.hour}:{currentTime.minute.toString().padStart(2, '0')}
            </span>
          </div>
        }
      />

      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {/* Motivational Banner */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">
                {isMorning ? "You've got this!" : "Great day ahead!"}
              </h2>
              <p className="text-sm opacity-90">
                {allTodayEvents.length === 0
                  ? 'No events today - enjoy the free time!'
                  : `${allTodayEvents.length} event${allTodayEvents.length > 1 ? 's' : ''} to prepare for`}
              </p>
            </div>
          </div>
        </div>

        {/* Next Event Countdown */}
        {nextEvent && minutesUntilNext !== null && minutesUntilNext <= 120 && (
          <CountdownTimer
            eventName={nextEvent.activity}
            eventTime={nextEvent.time}
            person={nextEvent.person}
          />
        )}

        {/* Pack Lists */}
        {allTodayEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-orange-600" />
                Pack for Today
              </h3>
              <Link
                to="/"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Full Schedule
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {allTodayEvents.map((event: any, index: number) => (
              <PackList
                key={index}
                person={event.person}
                activity={event.activity}
                time={event.time}
                items={event.packList}
              />
            ))}
          </div>
        )}

        {/* Active Checklists */}
        {checklists.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Other Reminders
              </h3>
              <Link
                to="/lists"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-2">
              {checklists.slice(0, 2).map((checklist: any) => {
                const completed = checklist.items.filter((item: any) => item.checked).length;
                const total = checklist.items.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link
                    key={checklist.id}
                    to={`/lists/${checklist.id}`}
                    className="block bg-white rounded-xl p-3 shadow-sm border-2 border-gray-100 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{checklist.activityType.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{checklist.title}</p>
                          <p className="text-sm text-gray-600">{checklist.person}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {completed}/{total}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allTodayEvents.length === 0 && checklists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">☀️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Clear!</h2>
            <p className="text-gray-600 text-center mb-6">
              No events or checklists today.
              <br />
              Enjoy the free time!
            </p>
            <button
              onClick={() => navigate('/add')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Add Event
            </button>
          </div>
        )}

        {/* Morning Tips */}
        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-orange-600" />
            Morning Tip
          </h4>
          <p className="text-sm text-gray-600">
            Pack bags the night before to reduce morning stress. Set out clothes and prepare lunches
            after dinner to make mornings smoother!
          </p>
        </div>
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
