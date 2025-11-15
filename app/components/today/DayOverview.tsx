import { Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';

interface DayOverviewProps {
  eventCount: number;
  checklistCount: number;
  upcomingCount: number;
  urgentCount: number;
}

export function DayOverview({
  eventCount,
  checklistCount,
  upcomingCount,
  urgentCount,
}: DayOverviewProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-purple-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{eventCount}</p>
            <p className="text-xs text-gray-600">Events</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{checklistCount}</p>
            <p className="text-xs text-gray-600">To-Do</p>
          </div>
        </div>

        {urgentCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              <p className="text-xs text-gray-600">Urgent</p>
            </div>
          </div>
        )}

        {upcomingCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{upcomingCount}</p>
              <p className="text-xs text-gray-600">Tomorrow</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
