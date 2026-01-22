import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Calendar, Event, Activity, Person } from "@/lib/types";
import { getMonthName, expandRecurringEvents } from "@/lib/parser";
import {
  getPersonColor,
  getActivityColor,
  getActivityIcon,
  getActivityDisplay,
} from "@/lib/colors";

interface AgendaViewProps {
  calendar: Calendar | null;
  personIds: string[];
  activityIds: string[];
  getActivity: (id: string) => Activity | null;
  getPerson?: (id: string) => Person | null;
  onEventSelect?: (event: Event) => void;
  selectedEventId?: string;
}

interface FilterPart {
  type: "person" | "activity" | "keyword" | "date" | "status";
  value: string;
  color?: string;
  icon?: string;
}

interface ParsedFilter {
  people: string[];
  activities: string[];
  keywords: string[];
  statuses: string[]; // Event statuses: tentative, cancelled, confirmed, done
  searchText: string; // General text search
  dateRange: { start: Date; end: Date; label: string } | null;
  parts: FilterPart[];
  description: string;
}

const EXAMPLE_QUERIES = [
  "What's #steven got next week",
  "birthdays this month",
  "#ella +sport",
  "#marcus appointments",
  "[tentative] this month",
];

export function AgendaView({
  calendar,
  personIds,
  activityIds,
  getActivity,
  getPerson,
  onEventSelect,
  selectedEventId,
}: AgendaViewProps) {
  const [filter, setFilter] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<
    "person" | "activity" | null
  >(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);

  // Autocomplete suggestion types
  type PersonSuggestion = { id: string; display: string; color: string };
  type ActivitySuggestion = {
    id: string;
    display: string;
    icon: string;
    color: string;
  };

  // Get autocomplete suggestions based on current trigger
  const autocompleteSuggestions = useMemo((): (
    | PersonSuggestion
    | ActivitySuggestion
  )[] => {
    if (!showAutocomplete || !autocompleteType) return [];

    const query = autocompleteQuery.toLowerCase();

    if (autocompleteType === "person") {
      const allPeople = [...new Set([...personIds, "family"])];
      return allPeople
        .filter((p) => p.toLowerCase().includes(query))
        .map(
          (p): PersonSuggestion => ({
            id: p,
            display: p.charAt(0).toUpperCase() + p.slice(1),
            color: getPersonColor(p, getPerson),
          }),
        );
    } else if (autocompleteType === "activity") {
      return activityIds
        .filter((a) => a.toLowerCase().includes(query))
        .map(
          (a): ActivitySuggestion => ({
            id: a,
            display: getActivityDisplay(a),
            icon: getActivityIcon(a),
            color: getActivityColor(a),
          }),
        );
    }

    return [];
  }, [
    showAutocomplete,
    autocompleteType,
    autocompleteQuery,
    personIds,
    activityIds,
  ]);

  // Handle input change with autocomplete detection
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);

    // Check for trigger characters
    const cursorPos = e.target.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Find the last trigger character
    const lastHash = textBeforeCursor.lastIndexOf("#");
    const lastPlus = textBeforeCursor.lastIndexOf("+");

    // Determine which trigger is active (most recent one that's not followed by a space)
    let activeTrigger: "person" | "activity" | null = null;
    let query = "";

    if (lastHash > lastPlus && lastHash !== -1) {
      const afterHash = textBeforeCursor.slice(lastHash + 1);
      if (!afterHash.includes(" ")) {
        activeTrigger = "person";
        query = afterHash;
      }
    } else if (lastPlus > lastHash && lastPlus !== -1) {
      const afterPlus = textBeforeCursor.slice(lastPlus + 1);
      if (!afterPlus.includes(" ")) {
        activeTrigger = "activity";
        query = afterPlus;
      }
    }

    if (activeTrigger) {
      setAutocompleteType(activeTrigger);
      setAutocompleteQuery(query);
      setShowAutocomplete(true);
      setSelectedAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
      setAutocompleteType(null);
      setAutocompleteQuery("");
    }
  };

  // Handle autocomplete selection
  const selectAutocomplete = (suggestion: { id: string }) => {
    const cursorPos = filter.length;
    const textBeforeCursor = filter.slice(0, cursorPos);

    // Find the trigger position
    const triggerChar = autocompleteType === "person" ? "#" : "+";
    const triggerPos = textBeforeCursor.lastIndexOf(triggerChar);

    if (triggerPos !== -1) {
      const beforeTrigger = filter.slice(0, triggerPos);
      const afterCursor = filter.slice(cursorPos);
      const newValue =
        `${beforeTrigger}${triggerChar}${suggestion.id} ${afterCursor}`.trim();
      setFilter(newValue);
    }

    setShowAutocomplete(false);
    setAutocompleteType(null);
    setAutocompleteQuery("");
  };

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedAutocompleteIndex((prev) =>
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedAutocompleteIndex((prev) =>
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (autocompleteSuggestions[selectedAutocompleteIndex]) {
        e.preventDefault();
        selectAutocomplete(autocompleteSuggestions[selectedAutocompleteIndex]);
      }
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  // Parse natural language filter
  const parsedFilter = useMemo((): ParsedFilter | null => {
    if (!filter.trim()) return null;

    // Use actual current date
    const now = new Date();
    const result: ParsedFilter = {
      people: [],
      activities: [],
      keywords: [],
      statuses: [],
      searchText: "",
      dateRange: null,
      parts: [],
      description: "",
    };

    let text = filter.toLowerCase();

    // Extract status modifiers [tentative], [cancelled], [confirmed], [done]
    const statusMatches = [
      ...text.matchAll(/\[(tentative|cancelled|confirmed|done)\]/gi),
    ];
    for (const m of statusMatches) {
      const status = m[1].toLowerCase();
      const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
      result.statuses.push(statusDisplay);

      const statusConfig: Record<string, { color: string; icon: string }> = {
        tentative: { color: "var(--warning)", icon: "❓" },
        cancelled: { color: "var(--destructive)", icon: "✕" },
        confirmed: { color: "var(--success)", icon: "✓" },
        done: { color: "var(--success)", icon: "✓" },
      };
      const config = statusConfig[status] || {
        color: "var(--foreground-muted)",
        icon: "",
      };

      result.parts.push({
        type: "status",
        value: statusDisplay,
        icon: config.icon,
        color: config.color,
      });
    }
    text = text
      .replace(/\[(tentative|cancelled|confirmed|done)\]/gi, "")
      .trim();

    // Extract person tags - accept any #tag notation
    const personMatches = [...text.matchAll(/#(\w+)/g)];
    for (const m of personMatches) {
      const personId = m[1];
      result.people.push(personId);
      result.parts.push({
        type: "person",
        value: personId.charAt(0).toUpperCase() + personId.slice(1),
        color: getPersonColor(personId, getPerson),
      });
    }
    text = text.replace(/#\w+/g, "").trim();

    // Extract activity tags - accept any +tag notation
    const actMatches = [...text.matchAll(/\+(\w+)/g)];
    for (const m of actMatches) {
      const actId = m[1];
      result.activities.push(actId);
      result.parts.push({
        type: "activity",
        value: getActivityDisplay(actId),
        icon: getActivityIcon(actId),
        color: getActivityColor(actId),
      });
    }
    text = text.replace(/\+\w+/g, "").trim();

    // Parse time ranges
    if (text.match(/\b(today)\b/i)) {
      result.dateRange = {
        start: new Date(now),
        end: new Date(now),
        label: "Today",
      };
      text = text.replace(/\btoday\b/i, "").trim();
    } else if (text.match(/\b(tomorrow)\b/i)) {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      result.dateRange = { start: tom, end: tom, label: "Tomorrow" };
      text = text.replace(/\btomorrow\b/i, "").trim();
    } else if (text.match(/\b(this week)\b/i)) {
      const start = new Date(now);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      result.dateRange = { start, end, label: "This week" };
      text = text.replace(/\bthis week\b/i, "").trim();
    } else if (text.match(/\b(next week)\b/i)) {
      const start = new Date(now);
      const dayOfWeek = start.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      start.setDate(start.getDate() + daysUntilMonday);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      result.dateRange = { start, end, label: "Next week" };
      text = text.replace(/\bnext week\b/i, "").trim();
    } else if (text.match(/\b(this month)\b/i)) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthName = getMonthName(now.getMonth());
      result.dateRange = { start, end, label: monthName };
      text = text.replace(/\bthis month\b/i, "").trim();
    } else if (text.match(/\b(next month)\b/i)) {
      const nextM = (now.getMonth() + 1) % 12;
      const year = nextM === 0 ? now.getFullYear() + 1 : now.getFullYear();
      const start = new Date(year, nextM, 1);
      const end = new Date(year, nextM + 1, 0);
      const monthName = getMonthName(nextM);
      result.dateRange = { start, end, label: monthName };
      text = text.replace(/\bnext month\b/i, "").trim();
    } else if (text.match(/\b(upcoming|coming up)\b/i)) {
      const start = new Date(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 14);
      result.dateRange = { start, end, label: "Next 2 weeks" };
      text = text.replace(/\b(upcoming|coming up)\b/i, "").trim();
    }

    // Check for keyword patterns
    if (text.match(/\b(birthday|birthdays|bday)\b/i)) {
      result.keywords.push("birthday");
      result.parts.push({ type: "keyword", value: "birthdays", icon: "🎂" });
      text = text.replace(/\b(birthday|birthdays|bday)\b/i, "").trim();
    }
    if (
      text.match(
        /\b(sport|sports|game|games|training|practice|soccer|basketball)\b/i,
      )
    ) {
      if (!result.activities.includes("sport")) {
        result.activities.push("sport");
        result.parts.push({
          type: "activity",
          value: "Sport",
          icon: "⚽",
          color: "var(--activity-sport)",
        });
      }
      text = text
        .replace(
          /\b(sport|sports|game|games|training|practice|soccer|basketball)\b/i,
          "",
        )
        .trim();
    }
    if (text.match(/\b(appointment|appointments|dentist|doctor)\b/i)) {
      if (!result.activities.includes("appointment")) {
        result.activities.push("appointment");
        result.parts.push({
          type: "activity",
          value: "Appointments",
          icon: "🗓️",
          color: "var(--activity-appointment)",
        });
      }
      text = text
        .replace(/\b(appointment|appointments|dentist|doctor)\b/i, "")
        .trim();
    }

    // Any remaining text becomes a general search term
    // Clean up common filler words
    const cleanedText = text
      .replace(
        /\b(what's|whats|what|show|get|got|find|search|for|the|a|an|in|on|at|is|are|has|have|my|me|all)\b/gi,
        "",
      )
      .trim();

    if (cleanedText) {
      result.searchText = cleanedText;
      result.parts.push({
        type: "keyword",
        value: `"${cleanedText}"`,
        icon: "🔍",
      });
    }

    // Build description
    const descParts: string[] = [];
    if (result.people.length > 0) {
      descParts.push(
        result.people
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" & "),
      );
    }
    if (result.parts.filter((p) => p.type !== "person").length > 0) {
      const what = result.parts
        .filter((p) => p.type !== "person")
        .map((p) => p.value);
      if (what.length > 0) descParts.push(what.join(", "));
    }
    if (result.dateRange) {
      descParts.push(result.dateRange.label.toLowerCase());
    }
    result.description = descParts.join(" • ") || "All events";

    return result;
  }, [filter]);

  // Expanded event includes info about whether it's part of a multi-day range
  type ExpandedEvent = Event & {
    monthName: string;
    displayDate: Date;
    isMultiDay: boolean;
    rangePosition?: "start" | "middle" | "end" | "only";
  };

  const allEvents = useMemo(() => {
    if (!calendar) return [];

    const events: ExpandedEvent[] = [];

    // Process regular month events
    for (const month of calendar.months) {
      for (const event of month.events) {
        if (event.date.type === "Single") {
          // Single day event
          events.push({
            ...event,
            monthName: month.name,
            displayDate: new Date(event.date.value),
            isMultiDay: false,
            rangePosition: "only",
          });
        } else if (event.date.type === "Range") {
          // Expand range event into multiple entries (one per day)
          const start = new Date(event.date.value.start);
          const end = new Date(event.date.value.end);
          const current = new Date(start);

          while (current <= end) {
            const isStart = current.getTime() === start.getTime();
            const isEnd = current.getTime() === end.getTime();
            const monthName = getMonthName(current.getMonth());

            events.push({
              ...event,
              monthName,
              displayDate: new Date(current),
              isMultiDay: true,
              rangePosition:
                isStart && isEnd
                  ? "only"
                  : isStart
                    ? "start"
                    : isEnd
                      ? "end"
                      : "middle",
            });

            current.setDate(current.getDate() + 1);
          }
        }
      }
    }

    // Expand recurring events for all months of the year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const recurringInstances = expandRecurringEvents(
        calendar.recurring,
        calendar.year,
        monthIndex,
      );

      for (const event of recurringInstances) {
        if (event.date.type === "Single") {
          const displayDate = new Date(event.date.value);
          events.push({
            ...event,
            monthName: getMonthName(monthIndex),
            displayDate,
            isMultiDay: false,
            rangePosition: "only",
          });
        }
      }
    }

    // Sort by display date
    events.sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());

    return events;
  }, [calendar]);

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (!parsedFilter) return allEvents;

    return allEvents.filter((evt) => {
      // Filter by people
      if (parsedFilter.people.length > 0) {
        const hasMatchingPerson = parsedFilter.people.some(
          (p) =>
            evt.people.some((ep) => ep.toLowerCase() === p) ||
            (p === "family" && evt.people.includes("family")),
        );
        if (!hasMatchingPerson) return false;
      }

      // Filter by activity
      if (parsedFilter.activities.length > 0) {
        if (!parsedFilter.activities.includes(evt.activity || "")) return false;
      }

      // Filter by date range - use displayDate for expanded events
      if (parsedFilter.dateRange) {
        const evtDate = evt.displayDate;
        if (
          evtDate < parsedFilter.dateRange.start ||
          evtDate > parsedFilter.dateRange.end
        ) {
          return false;
        }
      }

      // Filter by keywords
      if (parsedFilter.keywords.length > 0) {
        const titleLower = evt.title.toLowerCase();
        const hasKeyword = parsedFilter.keywords.some((k) =>
          titleLower.includes(k.toLowerCase()),
        );
        if (!hasKeyword) return false;
      }

      // Filter by status
      if (parsedFilter.statuses.length > 0) {
        if (!parsedFilter.statuses.includes(evt.status)) return false;
      }

      // Filter by general search text (searches title, location, people)
      if (parsedFilter.searchText) {
        const searchLower = parsedFilter.searchText.toLowerCase();
        const titleMatch = evt.title.toLowerCase().includes(searchLower);
        const locationMatch =
          evt.location?.toLowerCase().includes(searchLower) || false;
        const peopleMatch = evt.people.some((p) =>
          p.toLowerCase().includes(searchLower),
        );
        if (!titleMatch && !locationMatch && !peopleMatch) return false;
      }

      return true;
    });
  }, [allEvents, parsedFilter]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const grouped = new Map<string, ExpandedEvent[]>();

    for (const event of filteredEvents) {
      const date = event.displayDate;
      const key = `${event.monthName} ${date.getDate()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    }

    // Sort by date
    const monthOrder = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    return [...grouped.entries()].sort((a, b) => {
      const [monthA, dayA] = a[0].split(" ");
      const [monthB, dayB] = b[0].split(" ");
      const idxA = monthOrder.indexOf(monthA.toLowerCase());
      const idxB = monthOrder.indexOf(monthB.toLowerCase());
      if (idxA !== idxB) return idxA - idxB;
      return parseInt(dayA) - parseInt(dayB);
    });
  }, [filteredEvents]);

  if (!calendar) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No calendar data
      </div>
    );
  }

  const handleEventClick = (event: Event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filter bar */}
      <div>
        <div className="relative">
          <input
            value={filter}
            onChange={handleFilterChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            placeholder="Ask: What's #steven got next week? / birthdays next month / #ella +sport"
            className="quick-add-input w-full px-4 py-3 pl-10 rounded-xl text-sm"
            style={{
              borderColor: parsedFilter ? "var(--primary)" : "var(--border)",
            }}
          />
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base"
            style={{ opacity: 0.6 }}
          >
            🔍
          </span>

          {/* Autocomplete dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-50"
              style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
              }}
            >
              {autocompleteSuggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.id}
                  onClick={() => selectAutocomplete(suggestion)}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors"
                  style={{
                    background:
                      idx === selectedAutocompleteIndex
                        ? "var(--accent)"
                        : "transparent",
                  }}
                  onMouseEnter={() => setSelectedAutocompleteIndex(idx)}
                >
                  {autocompleteType === "person" ? (
                    <>
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${suggestion.color} 20%, transparent)`,
                          color: suggestion.color,
                        }}
                      >
                        {suggestion.display.charAt(0)}
                      </span>
                      <span style={{ color: "var(--foreground)" }}>
                        #{suggestion.id}
                      </span>
                      <span
                        style={{
                          color: "var(--foreground-muted)",
                          marginLeft: "auto",
                        }}
                      >
                        {suggestion.display}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">
                        {"icon" in suggestion ? suggestion.icon : "📅"}
                      </span>
                      <span style={{ color: "var(--foreground)" }}>
                        +{suggestion.id}
                      </span>
                      <span
                        style={{
                          color: "var(--foreground-muted)",
                          marginLeft: "auto",
                        }}
                      >
                        {suggestion.display}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter interpretation */}
        {parsedFilter && parsedFilter.parts.length > 0 && (
          <div className="mt-2 flex items-start gap-2 flex-wrap animate-fade-in">
            <span
              className="text-xs py-1"
              style={{ color: "var(--foreground-muted)" }}
            >
              Showing:
            </span>
            {parsedFilter.parts.map((part, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: part.color
                    ? `color-mix(in oklch, ${part.color} 15%, transparent)`
                    : "var(--secondary)",
                  color: part.color || "var(--foreground)",
                }}
              >
                {part.icon && <span>{part.icon}</span>}
                {part.value}
              </span>
            ))}
            {parsedFilter.dateRange && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                📅 {parsedFilter.dateRange.label}
              </span>
            )}
            <span
              className="text-xs py-1 w-full md:w-auto md:ml-auto"
              style={{ color: "var(--foreground-muted)" }}
            >
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Example queries - horizontal scroll on mobile, wrap on desktop */}
        {!filter && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
            {EXAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setFilter(q)}
                className="px-2.5 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 md:shrink"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--foreground-muted)",
                  background: "transparent",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--secondary)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {parsedFilter ? parsedFilter.description : "All Events"}
        </h2>
        {filter && (
          <Button variant="outline" size="sm" onClick={() => setFilter("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 min-h-0">
        {groupedEvents.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📭</div>
            <div
              className="text-sm"
              style={{ color: "var(--foreground-muted)" }}
            >
              No events match your filter
            </div>
          </div>
        ) : (
          <div className="space-y-5 pr-4">
            {groupedEvents.map(([date, events]) => (
              <div key={date} className="animate-fade-in">
                <div
                  className="text-xs font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {date}, 2026
                </div>
                {events.map((evt, evtIdx) => {
                  const activity = evt.activity
                    ? getActivity(evt.activity)
                    : null;
                  const color = evt.activity
                    ? getActivityColor(evt.activity)
                    : activity?.color || "var(--activity-default)";
                  const icon = evt.activity
                    ? getActivityIcon(evt.activity)
                    : activity?.icon || "📅";

                  const timeStr = evt.time
                    ? evt.time.type === "Point"
                      ? evt.time.value
                      : evt.time.type === "Range"
                        ? `${evt.time.value.start} - ${evt.time.value.end}`
                        : evt.time.type === "Fuzzy"
                          ? evt.time.value
                          : ""
                    : "";

                  const isSelected = selectedEventId === evt.id;
                  const isOngoing =
                    evt.isMultiDay && evt.rangePosition === "middle";
                  const isTentative = evt.status === "Tentative";
                  const isCancelled = evt.status === "Cancelled";

                  // Get date range info for multi-day events
                  let dateRangeLabel = "";
                  if (evt.isMultiDay && evt.date.type === "Range") {
                    const start = new Date(evt.date.value.start);
                    const end = new Date(evt.date.value.end);
                    const startStr = start.toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    });
                    const endStr = end.toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    });
                    dateRangeLabel = `${startStr} → ${endStr}`;
                  }

                  // Render ongoing events as compact bars
                  if (isOngoing) {
                    return (
                      <div
                        key={`${evt.id}-${evtIdx}`}
                        onClick={() => handleEventClick(evt)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md mb-1.5 cursor-pointer transition-colors"
                        style={{
                          background: isSelected
                            ? "var(--accent)"
                            : `color-mix(in oklch, ${color} 10%, transparent)`,
                          borderLeft: `3px ${isTentative ? "dashed" : "solid"} ${color}`,
                          boxShadow: isSelected
                            ? "0 0 0 2px var(--primary)"
                            : "none",
                          opacity: isCancelled ? 0.5 : isTentative ? 0.8 : 1,
                        }}
                        onMouseOver={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = `color-mix(in oklch, ${color} 18%, transparent)`;
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = `color-mix(in oklch, ${color} 10%, transparent)`;
                          }
                        }}
                      >
                        {isTentative && <span className="text-sm">❓</span>}
                        <span className="text-sm">{icon}</span>
                        <span
                          className="text-xs font-medium truncate"
                          style={{
                            color,
                            textDecoration: isCancelled
                              ? "line-through"
                              : undefined,
                          }}
                        >
                          {evt.title}
                        </span>
                        <span
                          className="text-[10px] ml-auto shrink-0"
                          style={{ color: "var(--foreground-muted)" }}
                        >
                          {dateRangeLabel}
                        </span>
                      </div>
                    );
                  }

                  // Regular events (single-day, start, or end of range)
                  return (
                    <div
                      key={`${evt.id}-${evtIdx}`}
                      onClick={() => handleEventClick(evt)}
                      className="flex gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-colors"
                      style={{
                        background: isSelected
                          ? "var(--accent)"
                          : evt.isMultiDay
                            ? `color-mix(in oklch, ${color} 8%, var(--secondary))`
                            : "var(--secondary)",
                        borderLeft: `4px ${isTentative ? "dashed" : "solid"} ${color}`,
                        boxShadow: isSelected
                          ? "0 0 0 2px var(--primary)"
                          : "none",
                        opacity: isCancelled ? 0.5 : isTentative ? 0.85 : 1,
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "var(--muted)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = evt.isMultiDay
                            ? `color-mix(in oklch, ${color} 8%, var(--secondary))`
                            : "var(--secondary)";
                        }
                      }}
                    >
                      <div className="text-xl">
                        {isTentative && <span className="mr-0.5">❓</span>}
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold"
                            style={{
                              color: "var(--foreground)",
                              textDecoration: isCancelled
                                ? "line-through"
                                : undefined,
                            }}
                          >
                            {evt.title}
                          </span>
                          {(isTentative || isCancelled) && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: isTentative
                                  ? "color-mix(in oklch, var(--warning) 20%, transparent)"
                                  : "color-mix(in oklch, var(--destructive) 20%, transparent)",
                                color: isTentative
                                  ? "var(--warning)"
                                  : "var(--destructive)",
                              }}
                            >
                              {isTentative ? "tentative" : "cancelled"}
                            </span>
                          )}
                          {evt.isMultiDay && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                                color,
                              }}
                            >
                              {evt.rangePosition === "start" && "starts"}
                              {evt.rangePosition === "end" && "ends"}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs mt-1 flex gap-3 flex-wrap"
                          style={{ color: "var(--foreground-muted)" }}
                        >
                          {evt.isMultiDay && dateRangeLabel && (
                            <span style={{ color }}>📅 {dateRangeLabel}</span>
                          )}
                          {timeStr && <span>🕐 {timeStr}</span>}
                          {evt.location && <span>📍 {evt.location}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap items-start">
                        {evt.people.map((p) => {
                          const pColor = getPersonColor(p, getPerson);
                          return (
                            <Badge
                              key={p}
                              variant="secondary"
                              className="person-badge"
                              style={{
                                backgroundColor: `color-mix(in oklch, ${pColor} 20%, transparent)`,
                                color: pColor,
                              }}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
