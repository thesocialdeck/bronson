import { useState, useCallback, useEffect } from "react";
import { useCalendar } from "@/hooks/useCalendar";
import { usePeople } from "@/hooks/usePeople";
import { useActivities } from "@/hooks/useActivities";
import { QuickAdd } from "@/components/QuickAdd";
import { QuickAddPerson } from "@/components/QuickAddPerson";
import { QuickAddActivity } from "@/components/QuickAddActivity";
import {
  EditorView,
  CalendarSyntaxHelp,
  PeopleSyntaxHelp,
  ActivitiesSyntaxHelp,
} from "@/components/EditorView";
import { YearView } from "@/components/YearView";
import { MonthView } from "@/components/MonthView";
import { AgendaView } from "@/components/AgendaView";
import { PeopleView } from "@/components/PeopleView";
import { ActivitiesView } from "@/components/ActivitiesView";
import { EventDetail } from "@/components/EventDetail";
import { ToastProvider } from "@/components/Toast";
import type { Event } from "@/lib/types";
import "./App.css";

type ViewType =
  | "calendar"
  | "people-editor"
  | "activities-editor"
  | "year"
  | "month"
  | "agenda"
  | "people"
  | "activities";

// View configurations for cleaner rendering
const FILE_VIEWS = [
  { id: "calendar" as const, icon: "📅", label: "Calendar" },
  { id: "people-editor" as const, icon: "👥", label: "People" },
  { id: "activities-editor" as const, icon: "🏷️", label: "Activities" },
];

const CALENDAR_VIEWS = [
  { id: "year" as const, icon: "📊", label: "Year" },
  { id: "month" as const, icon: "📆", label: "Month" },
  { id: "agenda" as const, icon: "📋", label: "Agenda" },
  { id: "people" as const, icon: "📇", label: "Directory" },
  { id: "activities" as const, icon: "🏷️", label: "Activities" },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const {
    calendar,
    loading: calendarLoading,
    error: calendarError,
    insertEvent,
    readCalendarFile,
    writeCalendarFile,
  } = useCalendar();

  const {
    people,
    loading: peopleLoading,
    getAllPersonIds,
    getFamilyMembers,
    getPerson,
    readPeopleFile,
    writePeopleFile,
    loadPeople,
  } = usePeople();

  const {
    activities,
    loading: activitiesLoading,
    getAllActivityIds,
    getActivity,
    readActivitiesFile,
    writeActivitiesFile,
    loadActivities,
  } = useActivities();

  const loading = calendarLoading || peopleLoading || activitiesLoading;

  // Navigate to calendar editor and highlight a specific line
  const navigateToCalendarEditor = useCallback((line: number) => {
    setSelectedLine(line);
    setSelectedEvent(null);
    setCurrentView("calendar");
  }, []);

  // Handle event selection - show detail view
  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);

  // Close event detail
  const handleCloseEventDetail = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Update a specific line in the calendar file
  const handleSaveEventSource = useCallback(
    async (lineNumber: number, newContent: string): Promise<boolean> => {
      const content = await readCalendarFile();
      if (!content) return false;

      const lines = content.split("\n");
      // lineNumber is 1-indexed
      if (lineNumber < 1 || lineNumber > lines.length) return false;

      lines[lineNumber - 1] = newContent;
      const success = await writeCalendarFile(lines.join("\n"));
      return success;
    },
    [readCalendarFile, writeCalendarFile],
  );

  // Update a person's block in the people file
  const handleSavePersonSource = useCallback(
    async (personId: string, newContent: string): Promise<boolean> => {
      const content = await readPeopleFile();
      if (!content) return false;

      const lines = content.split("\n");

      // Find the person's block by looking for their ### header
      // Person blocks start with ### Name and continue until the next ### or ## or end
      let blockStart = -1;
      let blockEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line starts the person's block
        // Match ### Name where the ID would be derived from name
        if (line.startsWith("### ")) {
          const nameMatch = line.match(/^### ([^—]+)/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            const derivedId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
            if (
              derivedId === personId ||
              name.toLowerCase().replace(/\s+/g, "-") === personId
            ) {
              blockStart = i;
              // Find the end of this block
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].startsWith("### ") || lines[j].startsWith("## ")) {
                  blockEnd = j;
                  break;
                }
              }
              if (blockEnd === -1) {
                blockEnd = lines.length;
              }
              break;
            }
          }
        }
      }

      if (blockStart === -1) return false;

      // Remove trailing empty lines from the block
      while (blockEnd > blockStart + 1 && lines[blockEnd - 1].trim() === "") {
        blockEnd--;
      }

      // Replace the block with new content
      const newLines = newContent.split("\n");
      lines.splice(blockStart, blockEnd - blockStart, ...newLines);

      const success = await writePeopleFile(lines.join("\n"));
      if (success) {
        await loadPeople();
      }
      return success;
    },
    [readPeopleFile, writePeopleFile, loadPeople],
  );

  // Update an activity's block in the activities file
  const handleSaveActivitySource = useCallback(
    async (activityId: string, newContent: string): Promise<boolean> => {
      const content = await readActivitiesFile();
      if (!content) return false;

      const lines = content.split("\n");

      // Find the activity's block by looking for ### +activityId
      // Activity blocks start with ### +id and continue until next ### or ## or end
      let blockStart = -1;
      let blockEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line starts the activity's block
        if (line.startsWith(`### +${activityId}`)) {
          blockStart = i;
          // Find the end of this block
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith("### ") || lines[j].startsWith("## ")) {
              blockEnd = j;
              break;
            }
          }
          if (blockEnd === -1) {
            blockEnd = lines.length;
          }
          break;
        }
      }

      if (blockStart === -1) return false;

      // Remove trailing empty lines from the block
      while (blockEnd > blockStart + 1 && lines[blockEnd - 1].trim() === "") {
        blockEnd--;
      }

      // Replace the block with new content
      const newLines = newContent.split("\n");
      lines.splice(blockStart, blockEnd - blockStart, ...newLines);

      const success = await writeActivitiesFile(lines.join("\n"));
      if (success) {
        await loadActivities();
      }
      return success;
    },
    [readActivitiesFile, writeActivitiesFile, loadActivities],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading your calendar...
          </p>
        </div>
      </div>
    );
  }

  if (calendarError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-4">📁</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Couldn't load calendar
          </h2>
          <p className="text-muted-foreground text-sm">{calendarError}</p>
        </div>
      </div>
    );
  }

  const personIds = getAllPersonIds();
  const activityIds = getAllActivityIds();

  // Determine which quick add to show based on current view
  const showEventQuickAdd =
    !selectedEvent &&
    ["calendar", "year", "month", "agenda"].includes(currentView);
  const showPeopleQuickAdd =
    !selectedEvent &&
    (currentView === "people-editor" || currentView === "people");
  const showActivitiesQuickAdd =
    !selectedEvent && currentView === "activities-editor";

  // Check if we should show event detail panel
  const showEventDetail = selectedEvent !== null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Desktop */}
      <header className="app-header hidden md:flex items-center gap-3 px-4 py-2.5">
        {/* Logo */}
        <h1
          className="text-lg tracking-tight mr-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="text-primary font-semibold">bronson</span>
        </h1>

        {/* Navigation - Files */}
        <nav className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {FILE_VIEWS.map((view) => (
            <NavButton
              key={view.id}
              active={currentView === view.id}
              onClick={() => {
                setCurrentView(view.id);
                setSelectedEvent(null);
              }}
              icon={view.icon}
              label={view.label}
            />
          ))}
        </nav>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Navigation - Views */}
        <nav className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {CALENDAR_VIEWS.map((view) => (
            <NavButton
              key={view.id}
              active={currentView === view.id}
              onClick={() => {
                setCurrentView(view.id);
                setSelectedEvent(null);
              }}
              icon={view.icon}
              label={view.label}
            />
          ))}
        </nav>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* Family avatars */}
        <FamilyAvatars members={getFamilyMembers()} />
      </header>

      {/* Header - Mobile */}
      <header className="app-header flex md:hidden items-center justify-between px-3 py-2">
        <h1 className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-primary font-semibold">bronson</span>
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-sm"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <FamilyAvatars compact members={getFamilyMembers()} />
        </div>
      </header>

      {/* Quick Add Bar - contextual (hidden when event detail is shown) */}
      {showEventQuickAdd && (
        <div className="quick-add-bar px-3 md:px-4 py-2.5">
          <QuickAdd
            onAdd={insertEvent}
            personIds={personIds}
            activityIds={activityIds}
            getActivity={getActivity}
            getPerson={getPerson}
          />
        </div>
      )}
      {showPeopleQuickAdd && (
        <div className="quick-add-bar px-3 md:px-4 py-2.5">
          <QuickAddPerson
            onAdd={async (personContent, contextLabel) => {
              const currentContent = await readPeopleFile();
              if (currentContent) {
                // Find the context section and insert the person there
                const lines = currentContent.split("\n");
                const contextPattern = new RegExp(
                  `^## ${contextLabel}\\s*$`,
                  "i",
                );
                const nextSectionPattern = /^## /;

                let contextLineIndex = -1;
                let insertIndex = -1;

                // Find the context section
                for (let i = 0; i < lines.length; i++) {
                  if (contextPattern.test(lines[i])) {
                    contextLineIndex = i;
                    // Find where to insert (before next ## section or end of file)
                    for (let j = i + 1; j < lines.length; j++) {
                      if (nextSectionPattern.test(lines[j])) {
                        // Insert before this section, with blank line
                        insertIndex = j;
                        break;
                      }
                    }
                    if (insertIndex === -1) {
                      // No next section, insert at end
                      insertIndex = lines.length;
                    }
                    break;
                  }
                }

                let newContent: string;
                if (contextLineIndex !== -1) {
                  // Context exists - insert person before next section
                  lines.splice(insertIndex, 0, "", personContent);
                  newContent = lines.join("\n");
                } else {
                  // Context doesn't exist - append new section at end
                  newContent =
                    currentContent +
                    `\n\n## ${contextLabel}\n\n${personContent}`;
                }

                await writePeopleFile(newContent);
                await loadPeople();
              }
            }}
          />
        </div>
      )}
      {showActivitiesQuickAdd && (
        <div className="quick-add-bar px-3 md:px-4 py-2.5">
          <QuickAddActivity
            onAdd={async (content) => {
              const currentContent = await readActivitiesFile();
              if (currentContent) {
                await writeActivitiesFile(currentContent + "\n" + content);
                await loadActivities();
              }
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden app-main-content">
        {/* Event Detail Panel - shown as overlay/sidebar on larger screens */}
        {showEventDetail ? (
          <div className="h-full flex">
            {/* Main view (narrower when detail is shown on tablet+) */}
            <div className="hidden md:block flex-1 overflow-hidden border-r border-border">
              {currentView === "month" && (
                <div className="h-full p-3 md:p-4">
                  <MonthView
                    calendar={calendar}
                    selectedMonth={selectedMonth}
                    onChangeMonth={setSelectedMonth}
                    getActivity={getActivity}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEvent?.id}
                  />
                </div>
              )}
              {currentView === "agenda" && (
                <div className="h-full p-3 md:p-4 flex flex-col overflow-hidden">
                  <AgendaView
                    calendar={calendar}
                    personIds={personIds}
                    activityIds={activityIds}
                    getActivity={getActivity}
                    getPerson={getPerson}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEvent?.id}
                  />
                </div>
              )}
              {currentView === "year" && (
                <div className="h-full p-3 md:p-4 overflow-auto">
                  <YearView
                    calendar={calendar}
                    onSelectMonth={(month) => {
                      setSelectedMonth(month);
                      setCurrentView("month");
                    }}
                  />
                </div>
              )}
            </div>

            {/* Event Detail Panel - responsive widths */}
            <div
              className="w-full md:w-[340px] lg:w-[420px] xl:w-[480px] shrink-0 overflow-hidden h-full"
              style={{ background: "var(--background)" }}
            >
              <EventDetail
                event={selectedEvent}
                activity={
                  selectedEvent?.activity
                    ? getActivity(selectedEvent.activity)
                    : null
                }
                onClose={handleCloseEventDetail}
                onEdit={navigateToCalendarEditor}
                onSaveSource={handleSaveEventSource}
                personIds={personIds}
                activityIds={activityIds}
                getPerson={getPerson}
              />
            </div>
          </div>
        ) : (
          <>
            {currentView === "calendar" && (
              <EditorView
                fileName="2026.md"
                readFile={readCalendarFile}
                writeFile={writeCalendarFile}
                selectedLine={selectedLine}
                onLineSelect={setSelectedLine}
                language="calendar"
                personIds={personIds}
                activityIds={activityIds}
                getPerson={getPerson}
                syntaxHelp={
                  <CalendarSyntaxHelp
                    personIds={personIds}
                    activityIds={activityIds}
                    getPerson={getPerson}
                  />
                }
              />
            )}

            {currentView === "people-editor" && (
              <EditorView
                fileName="people.md"
                readFile={readPeopleFile}
                writeFile={writePeopleFile}
                language="people"
                personIds={personIds}
                activityIds={activityIds}
                getPerson={getPerson}
                syntaxHelp={<PeopleSyntaxHelp />}
              />
            )}

            {currentView === "activities-editor" && (
              <EditorView
                fileName="activities.md"
                readFile={readActivitiesFile}
                writeFile={writeActivitiesFile}
                language="activities"
                personIds={personIds}
                activityIds={activityIds}
                getPerson={getPerson}
                syntaxHelp={<ActivitiesSyntaxHelp />}
              />
            )}

            {currentView === "year" && (
              <div className="h-full p-3 md:p-4 overflow-auto">
                <YearView
                  calendar={calendar}
                  onSelectMonth={(month) => {
                    setSelectedMonth(month);
                    setCurrentView("month");
                  }}
                />
              </div>
            )}

            {currentView === "month" && (
              <div className="h-full p-3 md:p-4">
                <MonthView
                  calendar={calendar}
                  selectedMonth={selectedMonth}
                  onChangeMonth={setSelectedMonth}
                  getActivity={getActivity}
                  onEventSelect={handleEventSelect}
                />
              </div>
            )}

            {currentView === "agenda" && (
              <div className="h-full p-3 md:p-4 flex flex-col overflow-hidden">
                <AgendaView
                  calendar={calendar}
                  personIds={personIds}
                  activityIds={activityIds}
                  getActivity={getActivity}
                  getPerson={getPerson}
                  onEventSelect={handleEventSelect}
                />
              </div>
            )}

            {currentView === "people" && (
              <div className="h-full overflow-hidden">
                <PeopleView
                  people={people}
                  onSavePersonSource={handleSavePersonSource}
                  personIds={personIds}
                  activityIds={activityIds}
                />
              </div>
            )}

            {currentView === "activities" && (
              <div className="h-full overflow-hidden">
                <ActivitiesView
                  activities={activities}
                  onSaveActivitySource={handleSaveActivitySource}
                  personIds={personIds}
                  activityIds={activityIds}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation - only calendar views, no editor tabs */}
      <nav className="app-nav-container md:hidden" aria-label="Main navigation">
        <div className="mobile-bottom-nav" role="menubar">
          {CALENDAR_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => {
                setCurrentView(view.id);
                setSelectedEvent(null);
              }}
              className="mobile-nav-button"
              data-active={currentView === view.id}
              aria-label={view.label}
              aria-current={currentView === view.id ? "page" : undefined}
              role="menuitem"
            >
              <span className="mobile-nav-icon" aria-hidden="true">
                {view.icon}
              </span>
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Status Bar - Desktop only */}
      <footer className="status-bar hidden md:flex items-center gap-3 px-4 py-1.5">
        <span>
          {calendar?.months.reduce((sum, m) => sum + m.events.length, 0) ?? 0}{" "}
          events
        </span>
        <span className="text-border">•</span>
        <span>
          {people?.contexts.reduce((sum, c) => sum + c.people.length, 0) ?? 0}{" "}
          contacts
        </span>
        {selectedLine && currentView === "calendar" && (
          <>
            <span className="text-border">•</span>
            <span>Ln {selectedLine}</span>
          </>
        )}
        {selectedEvent && (
          <>
            <span className="text-border">•</span>
            <span>Viewing: {selectedEvent.title}</span>
          </>
        )}
        <div className="flex-1" />
        <span className="text-foreground-muted">~/FamilyCalendar</span>
      </footer>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className="nav-button flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
      style={{
        backgroundColor: active ? "var(--primary-muted)" : "transparent",
        color: active ? "var(--primary)" : "var(--foreground-muted)",
      }}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

// Default colors for family avatars when no color is set
const DEFAULT_AVATAR_COLORS = [
  "#c9a87c", // warm gold
  "#8fbc8f", // sage green
  "#b08968", // terracotta
  "#7eb8da", // soft blue
  "#d4a5a5", // dusty rose
  "#9b8bb4", // muted purple
];

function FamilyAvatars({
  compact = false,
  members,
}: {
  compact?: boolean;
  members: Array<{ id: string; name: string; color: string | null }>;
}) {
  const size = compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-[11px]";

  if (members.length === 0) return null;

  return (
    <div className="flex -space-x-1.5">
      {members.map((p, index) => (
        <div
          key={p.id}
          title={p.name}
          className={`avatar ${size} rounded-full flex items-center justify-center cursor-pointer ring-2 ring-background`}
          style={{
            backgroundColor:
              p.color ||
              DEFAULT_AVATAR_COLORS[index % DEFAULT_AVATAR_COLORS.length],
            color: "var(--background)",
          }}
        >
          {p.name[0]}
        </div>
      ))}
    </div>
  );
}

function AppWithProviders() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

export default AppWithProviders;
