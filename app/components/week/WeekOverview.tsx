import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';

interface DaySummary {
  day: string;
  dayShort: string;
  eventCount: number;
  isBusy: boolean;
  hasConflicts: boolean;
}

interface WeekOverviewProps {
  days: DaySummary[];
  totalEvents: number;
  conflictCount: number;
  busiestDay: string;
}

export function WeekOverview({ days, totalEvents, conflictCount, busiestDay }: WeekOverviewProps) {
  const avgEventsPerDay = totalEvents > 0 ? (totalEvents / 7).toFixed(1) : '0';
  const busyDays = days.filter(d => d.isBusy).length;
  const freeDays = 7 - busyDays;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-600" />
        Week at a Glance
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Total Events */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
            <p className="text-xs text-gray-600">Events</p>
          </div>
        </div>

        {/* Busy vs Free Days */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{busyDays}/{freeDays}</p>
            <p className="text-xs text-gray-600">Busy/Free</p>
          </div>
        </div>

        {/* Conflicts */}
        {conflictCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{conflictCount}</p>
              <p className="text-xs text-gray-600">Conflicts</p>
            </div>
          </div>
        )}

        {/* Average per day */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{avgEventsPerDay}</p>
            <p className="text-xs text-gray-600">Per Day</p>
          </div>
        </div>
      </div>

      {/* Busiest Day */}
      {busiestDay && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{busiestDay}</span> is your busiest day
          </p>
        </div>
      )}

      {/* Conflict Warning */}
      {conflictCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-2 bg-red-50 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              <strong>Scheduling conflicts detected!</strong> Two or more events overlap. Tap events to view details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
