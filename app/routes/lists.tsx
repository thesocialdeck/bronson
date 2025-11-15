import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { ChecklistCard } from '~/components/lists/ChecklistCard';
import { getChecklists, getActivityTypes } from '~/lib/markdown.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';

export async function loader({ request }: LoaderFunctionArgs) {
  const checklists = await getChecklists();
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };

  const enrichedChecklists = checklists.map((checklist) => ({
    ...checklist,
    activityType: allActivities[checklist.type] || DEFAULT_ACTIVITIES.school,
  }));

  return json({ checklists: enrichedChecklists });
}

export default function ListsRoute() {
  const { checklists } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header title="Checklists" />

      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {checklists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No checklists yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Tap + to create one
            </p>
          </div>
        ) : (
          checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              id={checklist.id}
              title={checklist.title}
              person={checklist.person}
              icon={checklist.activityType.icon}
              color={checklist.activityType.color}
              items={checklist.items}
            />
          ))
        )}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
