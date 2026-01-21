import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Calendar, Event, Activity } from "@/lib/types";
import { getMonthName, expandRecurringEvents } from "@/lib/parser";
import { getActivityColor, getActivityIcon } from "@/lib/colors";

// Helper to get all dates an event spans
function getEventDateRange(event: Event): { start: Date; end: Date } | null {
  if (event.date.type === "Single") {
    const date = new Date(event.date.value);
    return { start: date, end: date };
  }
  if (event.date.type === "Range") {
    return {
      start: new Date(event.date.value.start),
      end: new Date(event.date.value.end),
    };
  }
  return null;
}

// Check if event spans multiple days
function isMultiDayEvent(event: Event): boolean {
  if (event.date.type === "Range") {
    const start = new Date(event.date.value.start);
    const end = new Date(event.date.value.end);
    return start.getTime() !== end.getTime();
  }
  return false;
}

// Get days of month that an event covers
function getEventDaysInMonth(
  event: Event,
  year: number,
  month: number,
): number[] {
  const range = getEventDateRange(event);
  if (!range) return [];

  const days: number[] = [];
  const current = new Date(range.start);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  while (current <= range.end) {
    if (current >= monthStart && current <= monthEnd) {
      days.push(current.getDate());
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

interface SpanningEvent {
  event: Event;
  startDay: number;
  endDay: number;
  isStart: boolean; // Does it start in this month?
  isEnd: boolean; // Does it end in this month?
}

// Get spanning events for a specific week
function getSpanningEventsForWeek(
  events: Event[],
  weekDays: (number | null)[],
  year: number,
  month: number,
): SpanningEvent[] {
  const spanning: SpanningEvent[] = [];
  const validDays = weekDays.filter((d): d is number => d !== null);
  if (validDays.length === 0) return [];

  const weekStart = Math.min(...validDays);
  const weekEnd = Math.max(...validDays);

  for (const event of events) {
    if (!isMultiDayEvent(event)) continue;

    const daysInMonth = getEventDaysInMonth(event, year, month);
    if (daysInMonth.length === 0) continue;

    // Check if this event overlaps with this week
    const eventStart = Math.min(...daysInMonth);
    const eventEnd = Math.max(...daysInMonth);

    if (eventEnd >= weekStart && eventStart <= weekEnd) {
      const range = getEventDateRange(event);
      spanning.push({
        event,
        startDay: Math.max(eventStart, weekStart),
        endDay: Math.min(eventEnd, weekEnd),
        isStart: range
          ? range.start.getMonth() === month && eventStart >= weekStart
          : false,
        isEnd: range
          ? range.end.getMonth() === month && eventEnd <= weekEnd
          : false,
      });
    }
  }

  return spanning;
}

interface MonthViewProps {
  calendar: Calendar | null;
  selectedMonth: number;
  onChangeMonth: (month: number) => void;
  getActivity: (id: string) => Activity | null;
  onEventSelect?: (event: Event) => void;
  selectedEventId?: string;
}

export function MonthView({
  calendar,
  selectedMonth,
  onChangeMonth,
  getActivity,
  onEventSelect,
  selectedEventId,
}: MonthViewProps) {
  if (!calendar) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No calendar data
      </div>
    );
  }

  const year = calendar.year;
  const monthName = getMonthName(selectedMonth);

  // Get events for the selected month
  const month = calendar.months.find(
    (m) => m.name.toLowerCase() === monthName.toLowerCase(),
  );
  const monthEvents = month?.events ?? [];

  // Expand recurring events for this month and combine with regular events
  const recurringInstances = useMemo(
    () => expandRecurringEvents(calendar.recurring, year, selectedMonth),
    [calendar.recurring, year, selectedMonth],
  );
  const events = useMemo(
    () => [...monthEvents, ...recurringInstances],
    [monthEvents, recurringInstances],
  );

  // Calendar grid calculations
  const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
  const firstDay = new Date(year, selectedMonth, 1).getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  // Separate multi-day events from single-day events
  const multiDayEvents = useMemo(
    () => events.filter((e) => isMultiDayEvent(e)),
    [events],
  );

  const singleDayEvents = useMemo(
    () => events.filter((e) => !isMultiDayEvent(e)),
    [events],
  );

  // Group single-day events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Event[]>();
    for (const event of singleDayEvents) {
      if (event.date.type === "Single") {
        const date = new Date(event.date.value);
        if (date.getMonth() === selectedMonth) {
          const day = date.getDate();
          if (!map.has(day)) {
            map.set(day, []);
          }
          map.get(day)!.push(event);
        }
      }
    }
    return map;
  }, [singleDayEvents, selectedMonth]);

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === selectedMonth && today.getFullYear() === year;

  // Build calendar grid
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i);
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [...blanks.map(() => null)];

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleEventClick = (event: Event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChangeMonth(selectedMonth === 0 ? 11 : selectedMonth - 1)
          }
          className="text-lg hover:bg-secondary"
        >
          ←
        </Button>
        <h2
          className="text-xl font-semibold min-w-[200px] text-center"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {monthName} {year}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChangeMonth(selectedMonth === 11 ? 0 : selectedMonth + 1)
          }
          className="text-lg hover:bg-secondary"
        >
          →
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden">
        <div
          className="grid gap-px rounded-lg overflow-hidden h-full"
          style={{
            gridTemplateRows: "auto repeat(6, 1fr)",
            background: "var(--border)",
          }}
        >
          {/* Header row */}
          <div className="grid grid-cols-7 gap-px">
            {dayNames.map((d, i) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold"
                style={{
                  background: "var(--secondary)",
                  color:
                    i >= 5
                      ? "var(--calendar-weekend)"
                      : "var(--foreground-muted)",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {weeks.map((week, weekIndex) => {
            const spanningEvents = getSpanningEventsForWeek(
              multiDayEvents,
              week,
              year,
              selectedMonth,
            );

            return (
              <div key={weekIndex} className="relative grid grid-cols-7 gap-px">
                {/* Spanning event bars - rendered as overlay (hidden on mobile) */}
                {spanningEvents.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
                    <div className="relative h-full">
                      {spanningEvents.map((spanning, idx) => {
                        // Find the column indices for start and end
                        const startColIndex = week.findIndex(
                          (d) => d === spanning.startDay,
                        );
                        const endColIndex = week.findIndex(
                          (d) => d === spanning.endDay,
                        );

                        if (startColIndex === -1 || endColIndex === -1)
                          return null;

                        const activity = spanning.event.activity
                          ? getActivity(spanning.event.activity)
                          : null;
                        const color = spanning.event.activity
                          ? getActivityColor(spanning.event.activity)
                          : activity?.color || "var(--activity-default)";
                        const icon = spanning.event.activity
                          ? getActivityIcon(spanning.event.activity)
                          : activity?.icon || "";

                        const isSelected =
                          selectedEventId === spanning.event.id;
                        const isTentative =
                          spanning.event.status === "Tentative";
                        const isCancelled =
                          spanning.event.status === "Cancelled";

                        return (
                          <div
                            key={spanning.event.id}
                            onClick={() => handleEventClick(spanning.event)}
                            className="absolute pointer-events-auto cursor-pointer transition-all"
                            style={{
                              left: `calc(${(startColIndex / 7) * 100}% + 4px)`,
                              right: `calc(${((6 - endColIndex) / 7) * 100}% + 4px)`,
                              top: `calc(20px + ${idx * 22}px)`,
                              height: "18px",
                              backgroundColor: `color-mix(in oklch, ${color} ${isSelected ? "40%" : "25%"}, transparent)`,
                              borderLeft: spanning.isStart
                                ? `3px ${isTentative ? "dashed" : "solid"} ${color}`
                                : "none",
                              borderRight: spanning.isEnd
                                ? `3px ${isTentative ? "dashed" : "solid"} ${color}`
                                : "none",
                              opacity: isCancelled
                                ? 0.5
                                : isTentative
                                  ? 0.8
                                  : 1,
                              borderRadius:
                                spanning.isStart && spanning.isEnd
                                  ? "4px"
                                  : spanning.isStart
                                    ? "4px 0 0 4px"
                                    : spanning.isEnd
                                      ? "0 4px 4px 0"
                                      : "0",
                              boxShadow: isSelected
                                ? `0 0 0 2px ${color}`
                                : undefined,
                            }}
                          >
                            {spanning.isStart && (
                              <span
                                className="text-[10px] font-medium truncate px-1.5 leading-[18px] flex items-center gap-0.5"
                                style={{
                                  color,
                                  textDecoration: isCancelled
                                    ? "line-through"
                                    : undefined,
                                }}
                              >
                                {isTentative && <span>❓</span>}
                                {icon && <span>{icon}</span>}
                                {spanning.event.title}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        style={{ background: "var(--muted)" }}
                      />
                    );
                  }

                  const dayEvents = eventsByDay.get(day) ?? [];
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const isWeekend = dayIndex >= 5;

                  // Adjust top padding if there are spanning events
                  const spanningOffset = spanningEvents.length * 22;

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="calendar-day p-1.5 overflow-hidden flex flex-col"
                      style={{
                        boxShadow: isToday
                          ? "inset 0 0 0 2px var(--calendar-today-ring)"
                          : undefined,
                      }}
                    >
                      <div
                        className="calendar-day-number text-xs font-semibold mb-1"
                        style={{
                          color: isToday
                            ? "var(--primary)"
                            : isWeekend
                              ? "var(--calendar-weekend)"
                              : "var(--foreground)",
                        }}
                      >
                        {day}
                      </div>
                      {/* Spacer for spanning events - smaller on mobile */}
                      {spanningOffset > 0 && (
                        <div
                          className="hidden md:block"
                          style={{ height: spanningOffset }}
                        />
                      )}

                      {/* Mobile: colored dots */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 flex-wrap md:hidden mt-auto">
                          {dayEvents.slice(0, 4).map((event, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: event.activity
                                  ? getActivityColor(event.activity)
                                  : "var(--activity-default)",
                              }}
                            />
                          ))}
                          {dayEvents.length > 4 && (
                            <span
                              className="text-[8px] leading-none"
                              style={{ color: "var(--foreground-muted)" }}
                            >
                              +{dayEvents.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Desktop: event pills */}
                      <ScrollArea className="flex-1 hidden md:block">
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <EventPill
                              key={event.id}
                              event={event}
                              getActivity={getActivity}
                              onClick={() => handleEventClick(event)}
                              isSelected={selectedEventId === event.id}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div
                              className="text-[10px] pl-1"
                              style={{ color: "var(--foreground-muted)" }}
                            >
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface EventPillProps {
  event: Event;
  getActivity: (id: string) => Activity | null;
  onClick: () => void;
  isSelected?: boolean;
}

function EventPill({
  event,
  getActivity,
  onClick,
  isSelected,
}: EventPillProps) {
  const activity = event.activity ? getActivity(event.activity) : null;
  const color = event.activity
    ? getActivityColor(event.activity)
    : activity?.color || "var(--activity-default)";
  const icon = event.activity
    ? getActivityIcon(event.activity)
    : activity?.icon || "";

  const timeStr = event.time
    ? event.time.type === "Point"
      ? event.time.value
      : event.time.type === "Range"
        ? event.time.value.start
        : ""
    : "";

  const isTentative = event.status === "Tentative";
  const isCancelled = event.status === "Cancelled";

  return (
    <div
      onClick={onClick}
      className="event-pill px-1.5 py-0.5 rounded truncate cursor-pointer transition-all"
      style={{
        backgroundColor: isSelected
          ? `color-mix(in oklch, ${color} 30%, transparent)`
          : "var(--calendar-event-bg)",
        borderLeft: isTentative ? `2px dashed ${color}` : `2px solid ${color}`,
        color: color,
        boxShadow: isSelected ? `0 0 0 1px ${color}` : undefined,
        opacity: isCancelled ? 0.5 : isTentative ? 0.8 : 1,
        textDecoration: isCancelled ? "line-through" : undefined,
      }}
    >
      {isTentative && <span className="mr-0.5">❓</span>}
      {icon && <span className="mr-0.5">{icon}</span>}
      {timeStr && <span style={{ opacity: 0.7 }}>{timeStr} </span>}
      {event.title}
    </div>
  );
}
