import { useState, useMemo, useCallback } from "react";
import type { Calendar, Activity } from "@/lib/types";
import type { BirthdayEvent } from "@/hooks/usePeople";
import "./NeatocalPrintView.css";

interface NeatocalPrintViewProps {
  calendar: Calendar | null;
  getActivity: (id: string) => Activity | undefined;
  birthdays?: BirthdayEvent[];
  onClose: () => void;
}

// View options
type ViewMode = "year" | "half" | "quarter" | "month";

const VIEW_OPTIONS: { id: ViewMode; label: string; months: number }[] = [
  { id: "year", label: "Full Year", months: 12 },
  { id: "half", label: "6 Months", months: 6 },
  { id: "quarter", label: "3 Months", months: 3 },
  { id: "month", label: "1 Month", months: 1 },
];

// Short month codes
const MONTH_CODES = [
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

// Day codes
const DAY_CODES = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

// Map lowercase day names to day numbers (0 = Sunday)
const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Get number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get day of week for a date (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

// Parse date string to month/day
function parseDate(dateStr: string): { month: number; day: number } | null {
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return { month: parseInt(match[2], 10) - 1, day: parseInt(match[3], 10) };
  }
  return null;
}

// Get the nth weekday of a month (for monthly recurrence with by_set_pos)
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number,
): number | null {
  const daysInMonth = getDaysInMonth(year, month);
  let count = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    if (getDayOfWeek(year, month, day) === weekday) {
      count++;
      if (count === n) {
        return day;
      }
    }
  }
  return null;
}

// Build events map from calendar data
function buildEventsMap(
  calendar: Calendar | null,
  birthdays: BirthdayEvent[],
  startMonth: number,
  numMonths: number,
): Map<
  string,
  { title: string; isRecurring?: boolean; isBirthday?: boolean }[]
> {
  const eventsMap = new Map<
    string,
    { title: string; isRecurring?: boolean; isBirthday?: boolean }[]
  >();

  if (!calendar) return eventsMap;

  const endMonth = startMonth + numMonths - 1;

  const addEvent = (
    month: number,
    day: number,
    event: { title: string; isRecurring?: boolean; isBirthday?: boolean },
  ) => {
    // Only add if within our view range
    if (month < startMonth || month > endMonth) return;

    const key = `${month}-${day}`;
    if (!eventsMap.has(key)) {
      eventsMap.set(key, []);
    }
    // Avoid duplicates
    const existing = eventsMap.get(key)!;
    if (!existing.some((e) => e.title === event.title)) {
      existing.push(event);
    }
  };

  // Process regular events from each month
  for (const monthData of calendar.months) {
    for (const event of monthData.events) {
      if (event.date.type === "Single") {
        const parsed = parseDate(event.date.value);
        if (parsed) {
          addEvent(parsed.month, parsed.day, {
            title: event.title,
          });
        }
      } else if (event.date.type === "Range") {
        // Add event to each day in the range
        const startParsed = parseDate(event.date.value.start);
        const endParsed = parseDate(event.date.value.end);
        if (startParsed && endParsed) {
          const startDate = new Date(
            calendar.year,
            startParsed.month,
            startParsed.day,
          );
          const endDate = new Date(
            calendar.year,
            endParsed.month,
            endParsed.day,
          );
          const current = new Date(startDate);
          while (current <= endDate) {
            addEvent(current.getMonth(), current.getDate(), {
              title: event.title,
            });
            current.setDate(current.getDate() + 1);
          }
        }
      }
    }
  }

  // Process recurring events - expand them into each applicable day
  for (const recurring of calendar.recurring) {
    if (recurring.recurrence) {
      const { frequency, by_day, by_set_pos } = recurring.recurrence;

      if (frequency === "Weekly" && by_day) {
        // Weekly recurrence on specific days
        for (const dayName of by_day) {
          const targetDay = DAY_NAME_MAP[dayName.toLowerCase()];
          if (targetDay === undefined) continue;

          // Go through each month in the view range
          for (let month = startMonth; month <= endMonth; month++) {
            const daysInMonth = getDaysInMonth(calendar.year, month);
            for (let day = 1; day <= daysInMonth; day++) {
              if (getDayOfWeek(calendar.year, month, day) === targetDay) {
                addEvent(month, day, {
                  title: recurring.title,
                  isRecurring: true,
                });
              }
            }
          }
        }
      } else if (frequency === "Monthly" && by_day && by_set_pos) {
        // Monthly recurrence on nth weekday (e.g., "2nd Thursday")
        for (const dayName of by_day) {
          const targetDay = DAY_NAME_MAP[dayName.toLowerCase()];
          if (targetDay === undefined) continue;

          for (let month = startMonth; month <= endMonth; month++) {
            const day = getNthWeekdayOfMonth(
              calendar.year,
              month,
              targetDay,
              by_set_pos,
            );
            if (day) {
              addEvent(month, day, {
                title: recurring.title,
                isRecurring: true,
              });
            }
          }
        }
      } else if (frequency === "Daily") {
        // Daily recurrence
        for (let month = startMonth; month <= endMonth; month++) {
          const daysInMonth = getDaysInMonth(calendar.year, month);
          for (let day = 1; day <= daysInMonth; day++) {
            addEvent(month, day, {
              title: recurring.title,
              isRecurring: true,
            });
          }
        }
      }
    }
  }

  // Add birthdays
  for (const birthday of birthdays) {
    addEvent(birthday.date.month, birthday.date.day, {
      title: `🎂 ${birthday.personName}`,
      isBirthday: true,
    });
  }

  return eventsMap;
}

export function NeatocalPrintView({
  calendar,
  getActivity,
  birthdays = [],
  onClose,
}: NeatocalPrintViewProps) {
  const year = calendar?.year || new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const [startMonth, setStartMonth] = useState(0);

  // Get number of months to display
  const numMonths = VIEW_OPTIONS.find((v) => v.id === viewMode)?.months || 12;

  // Build events map for visible months
  const eventsMap = useMemo(
    () => buildEventsMap(calendar, birthdays, startMonth, numMonths),
    [calendar, birthdays, startMonth, numMonths],
  );

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle view mode change
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Reset start month based on current date
    if (mode === "year") {
      setStartMonth(0);
    } else if (mode === "half") {
      setStartMonth(currentMonth < 6 ? 0 : 6);
    } else if (mode === "quarter") {
      setStartMonth(Math.floor(currentMonth / 3) * 3);
    } else {
      setStartMonth(currentMonth);
    }
  };

  // Navigation for non-year views
  const canGoBack = startMonth > 0;
  const canGoForward = startMonth + numMonths < 12;

  const goBack = () => {
    setStartMonth(Math.max(0, startMonth - numMonths));
  };

  const goForward = () => {
    setStartMonth(Math.min(12 - numMonths, startMonth + numMonths));
  };

  // Generate visible month indices
  const visibleMonths = useMemo(() => {
    return Array.from({ length: numMonths }, (_, i) => startMonth + i);
  }, [startMonth, numMonths]);

  // Generate table rows - 31 rows for days
  const rows = useMemo(() => {
    const result: JSX.Element[] = [];

    for (let dayNum = 1; dayNum <= 31; dayNum++) {
      const cells: JSX.Element[] = [];

      for (const month of visibleMonths) {
        const daysInMonth = getDaysInMonth(year, month);

        if (dayNum <= daysInMonth) {
          const dayOfWeek = getDayOfWeek(year, month, dayNum);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const dayCode = DAY_CODES[dayOfWeek];

          // Get events for this day
          const dayEvents = eventsMap.get(`${month}-${dayNum}`) || [];

          // Determine max events to show based on view
          const maxEvents =
            viewMode === "month" ? 4 : viewMode === "quarter" ? 3 : 2;

          cells.push(
            <td
              key={`${month}-${dayNum}`}
              className={`neatocal-cell ${isWeekend ? "weekend" : ""}`}
            >
              <div className="cell-content">
                <span className="date">{dayNum}</span>
                <span className="day">{dayCode}</span>
                <div className="events-container">
                  {dayEvents.slice(0, maxEvents).map((event, idx) => (
                    <span
                      key={idx}
                      className={`event ${event.isRecurring ? "recurring" : ""} ${event.isBirthday ? "birthday" : ""}`}
                      title={event.title}
                    >
                      {event.title.length > (viewMode === "month" ? 20 : 12)
                        ? event.title.slice(0, viewMode === "month" ? 19 : 11) +
                          "…"
                        : event.title}
                    </span>
                  ))}
                  {dayEvents.length > maxEvents && (
                    <span className="event-overflow">
                      +{dayEvents.length - maxEvents}
                    </span>
                  )}
                </div>
              </div>
            </td>,
          );
        } else {
          // Empty cell for days that don't exist in this month
          cells.push(
            <td key={`${month}-${dayNum}`} className="neatocal-cell empty" />,
          );
        }
      }

      result.push(<tr key={dayNum}>{cells}</tr>);
    }

    return result;
  }, [year, visibleMonths, eventsMap, viewMode]);

  // Generate title based on view
  const getTitle = () => {
    if (viewMode === "year") {
      return `${year}`;
    } else if (viewMode === "month") {
      return `${MONTH_CODES[startMonth]} ${year}`;
    } else {
      const endMonth = startMonth + numMonths - 1;
      return `${MONTH_CODES[startMonth]} – ${MONTH_CODES[endMonth]} ${year}`;
    }
  };

  return (
    <div className={`neatocal-container view-${viewMode}`}>
      {/* Print controls - hidden when printing */}
      <div className="neatocal-controls no-print">
        <button onClick={onClose} className="neatocal-btn secondary">
          ← Back
        </button>

        {/* View mode selector */}
        <div className="view-selector">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleViewChange(option.id)}
              className={`view-btn ${viewMode === option.id ? "active" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Navigation for non-year views */}
        {viewMode !== "year" && (
          <div className="month-nav">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="nav-btn"
              aria-label="Previous"
            >
              ←
            </button>
            <span className="nav-label">{getTitle()}</span>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="nav-btn"
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}

        <button onClick={handlePrint} className="neatocal-btn primary">
          🖨️ Print
        </button>
      </div>

      {/* Calendar table */}
      <div className="neatocal-wrapper">
        <table className="neatocal-table">
          <thead>
            <tr className="month-header">
              {visibleMonths.map((monthIdx) => (
                <th key={monthIdx} className="month-cell">
                  {MONTH_CODES[monthIdx]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="neatocal-footer no-print">
        <p>
          Tip: For best results, print in{" "}
          <strong>
            {viewMode === "month" ? "portrait" : "landscape"} orientation
          </strong>{" "}
          and disable headers/footers.
        </p>
      </div>
    </div>
  );
}
