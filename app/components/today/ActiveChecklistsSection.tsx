import { Link } from '@remix-run/react';
import { CheckSquare, ChevronRight } from 'lucide-react';
import type { Checklist, ActivityType } from '~/types';

interface ActiveChecklistsSectionProps {
  checklists: Array<Checklist & { activityType: ActivityType }>;
}

export function ActiveChecklistsSection({ checklists }: ActiveChecklistsSectionProps) {
  if (checklists.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-600" />
          Things to Remember
        </h3>
        <Link
          to="/lists"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {checklists.slice(0, 3).map((checklist) => {
          const completed = checklist.items.filter(item => item.checked).length;
          const total = checklist.items.length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <Link
              key={checklist.id}
              to={`/lists/${checklist.id}`}
              className="block bg-white rounded-xl p-3 shadow-sm border-2 border-gray-100 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xl">{checklist.activityType.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{checklist.title}</p>
                    <p className="text-sm text-gray-600">{checklist.person}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {checklists.length > 3 && (
        <p className="text-sm text-gray-500 text-center">
          + {checklists.length - 3} more checklist{checklists.length - 3 > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
