import type { Calendar, Event } from "@/lib/types";
import { getMonthName } from "@/lib/parser";

// Activity color mapping using CSS variables
function getActivityColor(id: string): string {
  const mapping: Record<string, string> = {
    sport: "var(--activity-sport)",
    school: "var(--activity-school)",
    social: "var(--activity-social)",
    appointment: "var(--activity-appointment)",
    celebration: "var(--activity-celebration)",
    reminder: "var(--activity-reminder)",
    errand: "var(--activity-errand)",
    health: "var(--activity-health)",
  };
  return mapping[id] || "var(--activity-default)";
}

interface YearViewProps {
  calendar: Calendar | null;
  onSelectMonth: (month: number) => void;
}

export function YearView({ calendar, onSelectMonth }: YearViewProps) {
  if (!calendar) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No calendar data
      </div>
    );
  }

  const year = calendar.year;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  // Get events for each month
  const getEventsForMonth = (monthIndex: number): Event[] => {
    const monthName = getMonthName(monthIndex).toLowerCase();
    const month = calendar.months.find(
      (m) => m.name.toLowerCase() === monthName,
    );
    return month?.events ?? [];
  };

  // Get days in a month
  const getDaysInMonth = (monthIndex: number): number => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  // Get first day of month (adjusted for Monday start)
  const getFirstDayOfMonth = (monthIndex: number): number => {
    const day = new Date(year, monthIndex, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
  };

  // Check if a day has events
  const getEventsForDay = (monthIndex: number, day: number): Event[] => {
    const events = getEventsForMonth(monthIndex);
    return events.filter((event) => {
      if (event.date.type === "Single") {
        const date = new Date(event.date.value);
        return date.getDate() === day && date.getMonth() === monthIndex;
      }
      return false;
    });
  };

  const today = new Date();
  const isCurrentYear = today.getFullYear() === year;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 h-full">
      {months.map((monthName, monthIndex) => {
        const daysInMonth = getDaysInMonth(monthIndex);
        const firstDay = getFirstDayOfMonth(monthIndex);
        const isCurrentMonth = isCurrentYear && today.getMonth() === monthIndex;

        // Build calendar grid
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length < 42) cells.push(null);

        return (
          <div
            key={monthIndex}
            onClick={() => onSelectMonth(monthIndex)}
            className="rounded-lg p-2.5 md:p-3 cursor-pointer transition-all hover:shadow-md"
            style={{
              background: isCurrentMonth
                ? "var(--primary-muted)"
                : "var(--secondary)",
              border: isCurrentMonth
                ? "2px solid var(--primary)"
                : "1px solid var(--border)",
            }}
          >
            <div
              className="font-semibold text-sm mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: isCurrentMonth ? "var(--primary)" : "var(--foreground)",
              }}
            >
              {monthName}
            </div>
            <div className="grid grid-cols-7 gap-px text-[9px] md:text-[10px]">
              {/* Day headers */}
              {dayNames.map((d, i) => (
                <div
                  key={i}
                  className="text-center font-semibold py-0.5"
                  style={{
                    color:
                      i >= 5
                        ? "var(--calendar-weekend)"
                        : "var(--foreground-subtle)",
                  }}
                >
                  {d}
                </div>
              ))}

              {/* Calendar cells */}
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="py-0.5" />;
                }

                const events = getEventsForDay(monthIndex, day);
                const isWeekend = idx % 7 >= 5;
                const isToday = isCurrentMonth && today.getDate() === day;

                return (
                  <div
                    key={idx}
                    className="text-center py-0.5 relative rounded-sm"
                    style={{
                      backgroundColor: isToday
                        ? "var(--primary)"
                        : isWeekend
                          ? "var(--calendar-event-bg)"
                          : "transparent",
                      color: isToday
                        ? "var(--primary-foreground)"
                        : isWeekend
                          ? "var(--calendar-weekend)"
                          : "var(--foreground)",
                      fontWeight: isToday ? "600" : "normal",
                    }}
                  >
                    {day}
                    {events.length > 0 && !isToday && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-px">
                        {events.slice(0, 3).map((e, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor: getActivityColor(
                                e.activity || "",
                              ),
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
