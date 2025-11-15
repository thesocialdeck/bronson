import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useFetcher } from '@remix-run/react';
import { ArrowLeft, Check } from 'lucide-react';
import { getChecklist, updateChecklist, getActivityTypes } from '~/lib/markdown.server';
import { DEFAULT_ACTIVITIES } from '~/lib/config';
import * as Icons from 'lucide-react';

export async function loader({ params }: LoaderFunctionArgs) {
  const checklist = await getChecklist(params.id!);
  if (!checklist) {
    throw new Response('Not Found', { status: 404 });
  }

  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };
  const activityType = allActivities[checklist.type] || DEFAULT_ACTIVITIES.school;

  return json({ checklist, activityType });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const itemIndex = parseInt(formData.get('itemIndex') as string, 10);
  const checked = formData.get('checked') === 'true';

  const checklist = await getChecklist(params.id!);
  if (!checklist) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  const newItems = [...checklist.items];
  newItems[itemIndex] = { ...newItems[itemIndex], checked };

  await updateChecklist(params.id!, { items: newItems });

  return json({ success: true });
}

export default function ChecklistDetailRoute() {
  const { checklist, activityType } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const IconComponent = (Icons as any)[activityType.icon] as any;
  const completed = checklist.items.filter((i: any) => i.checked).length;
  const total = checklist.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colorClasses = {
    cyan: { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-600', check: 'text-cyan-500' },
    green: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600', check: 'text-green-500' },
    yellow: { border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-600', check: 'text-yellow-500' },
    blue: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600', check: 'text-blue-500' },
    purple: { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-600', check: 'text-purple-500' },
  };

  const c = colorClasses[activityType.color as keyof typeof colorClasses] || colorClasses.blue;

  const handleToggle = (itemIndex: number, currentChecked: boolean) => {
    fetcher.submit(
      { itemIndex: itemIndex.toString(), checked: (!currentChecked).toString() },
      { method: 'post' }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-3"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className={`p-3 ${c.bg} rounded-xl`}>
            {IconComponent && <IconComponent className={`w-6 h-6 ${c.text}`} />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{checklist.title}</h1>
            <p className="text-sm text-gray-600">{checklist.person}</p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${c.text}`}>{percentage}%</span>
            <p className="text-xs text-gray-500">
              {completed}/{total}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 space-y-3">
          {checklist.items.map((item: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleToggle(idx, item.checked)}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  item.checked ? `${c.border} ${c.bg}` : 'border-gray-300'
                }`}
              >
                {item.checked && <Check className={`w-4 h-4 ${c.check}`} />}
              </div>
              <span
                className={`text-left ${
                  item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
