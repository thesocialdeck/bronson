import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InlineEditor } from "@/components/editor";
import type { PeopleData, Person } from "@/lib/types";
import { CONTEXT_ICONS, getAvatarColor, getInitials } from "@/lib/colors";

interface PeopleViewProps {
  people: PeopleData | null;
  onNavigateToEditor?: (line: number) => void;
  onSavePersonSource?: (
    personId: string,
    newContent: string,
  ) => Promise<boolean>;
  personIds: string[];
  activityIds: string[];
}

// Helper to reconstruct a person's markdown block from parsed data
function personToMarkdown(person: Person): string {
  const lines: string[] = [];

  // Header line
  lines.push(
    `### ${person.name}${person.subtitle ? ` — ${person.subtitle}` : ""}`,
  );

  // Fields
  for (const [key, value] of Object.entries(person.fields)) {
    lines.push(`${key}: ${value}`);
  }

  // Members (for families)
  if (person.members && person.members.length > 0) {
    for (const member of person.members) {
      lines.push(`- ${member.name} #${member.id}`);
      for (const [key, value] of Object.entries(member.fields)) {
        lines.push(`  ${key}: ${value}`);
      }
    }
  }

  // Notes (indented lines)
  for (const note of person.notes) {
    lines.push(`  ${note}`);
  }

  // Log entries
  for (const entry of person.log) {
    lines.push(`[${entry.date}] ${entry.text}`);
  }

  return lines.join("\n");
}

export function PeopleView({
  people,
  onSavePersonSource,
  personIds,
  activityIds,
}: PeopleViewProps) {
  const [filter, setFilter] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Handle person selection - show detail on mobile
  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setShowDetail(true);
  };

  // Handle back navigation on mobile
  const handleBackToList = () => {
    setShowDetail(false);
  };

  if (!people) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--foreground-muted)" }}
      >
        No people data
      </div>
    );
  }

  const filterPerson = (person: Person): boolean => {
    if (!filter.trim()) return true;

    const lowerFilter = filter.toLowerCase();
    return (
      person.name.toLowerCase().includes(lowerFilter) ||
      person.id.toLowerCase().includes(lowerFilter) ||
      person.subtitle?.toLowerCase().includes(lowerFilter) ||
      person.notes.some((n) => n.toLowerCase().includes(lowerFilter)) ||
      Object.values(person.fields).some((v) =>
        v.toLowerCase().includes(lowerFilter),
      )
    );
  };

  const filteredContexts = people.contexts
    .map((ctx) => ({
      ...ctx,
      people: ctx.people.filter(filterPerson),
    }))
    .filter(
      (ctx) =>
        ctx.people.length > 0 &&
        (!selectedContext || ctx.id === selectedContext),
    );

  const allPeople = people.contexts.flatMap((ctx) => ctx.people);

  return (
    <div className="flex h-full">
      {/* Sidebar - full width on mobile, fixed width on desktop */}
      <div
        className={`flex flex-col min-h-0 md:w-72 ${
          showDetail ? "hidden md:flex" : "w-full"
        }`}
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <label htmlFor="people-search" className="sr-only">
              Search people
            </label>
            <input
              id="people-search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search people..."
              className="quick-add-input w-full px-3 py-2.5 pl-9 rounded-lg text-sm"
            />
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--foreground-muted)" }}
              aria-hidden="true"
            >
              🔍
            </span>
          </div>
        </div>

        {/* Context filters */}
        <div className="px-3 pb-3 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedContext(null)}
            className="px-2.5 py-1 rounded-md text-xs transition-colors"
            style={{
              border: `1px solid ${selectedContext === null ? "var(--primary)" : "var(--border)"}`,
              backgroundColor:
                selectedContext === null
                  ? "var(--primary-muted)"
                  : "transparent",
              color:
                selectedContext === null
                  ? "var(--primary)"
                  : "var(--foreground-muted)",
            }}
          >
            All
          </button>
          {people.contexts.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() =>
                setSelectedContext(selectedContext === ctx.id ? null : ctx.id)
              }
              className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
              style={{
                border: `1px solid ${selectedContext === ctx.id ? "var(--primary)" : "var(--border)"}`,
                backgroundColor:
                  selectedContext === ctx.id
                    ? "var(--primary-muted)"
                    : "transparent",
                color:
                  selectedContext === ctx.id
                    ? "var(--primary)"
                    : "var(--foreground-muted)",
              }}
            >
              <span>{CONTEXT_ICONS[ctx.id] || "👤"}</span>
              {ctx.name}
            </button>
          ))}
        </div>

        {/* People list */}
        <ScrollArea className="flex-1 h-0">
          <div className="px-3 pb-3">
            {filteredContexts.map((context) => (
              <div key={context.id} className="mb-4">
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  <span>{CONTEXT_ICONS[context.id] || "👤"}</span>
                  {context.name}
                  <span style={{ opacity: 0.5 }}>
                    ({context.people.length})
                  </span>
                </div>
                {context.people.map((person) => {
                  const color = getAvatarColor(person.name);
                  return (
                    <div
                      key={person.id}
                      onClick={() => handlePersonClick(person)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors"
                      style={{
                        backgroundColor:
                          selectedPerson?.id === person.id
                            ? "var(--secondary)"
                            : "transparent",
                      }}
                    >
                      <div
                        className="avatar w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                          color,
                        }}
                      >
                        {getInitials(person.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-sm truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {person.name}
                        </div>
                        {person.subtitle && (
                          <div
                            className="text-xs truncate"
                            style={{ color: "var(--foreground-muted)" }}
                          >
                            {person.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredContexts.length === 0 && (
              <div
                className="text-center py-10"
                style={{ color: "var(--foreground-muted)" }}
              >
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm">No people found</div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Stats */}
        <div
          className="px-3 py-2 text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--foreground-muted)",
          }}
        >
          {allPeople.length} people in {people.contexts.length} groups
        </div>
      </div>

      {/* Detail panel - full width on mobile when shown, flex-1 on desktop */}
      <div
        className={`flex-1 min-h-0 flex flex-col ${
          showDetail ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedPerson ? (
          <>
            {/* Mobile back button */}
            <button
              onClick={handleBackToList}
              className="md:hidden flex items-center gap-2 px-4 py-3 text-sm font-medium border-b transition-colors hover:bg-secondary"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground-muted)",
              }}
              aria-label="Back to people list"
            >
              <span aria-hidden="true">←</span>
              <span>Back to list</span>
            </button>
            <ScrollArea className="flex-1 h-0">
              <PersonDetail
                person={selectedPerson}
                contextName={
                  people.contexts.find((c) =>
                    c.people.some((p) => p.id === selectedPerson.id),
                  )?.name || ""
                }
                contextId={
                  people.contexts.find((c) =>
                    c.people.some((p) => p.id === selectedPerson.id),
                  )?.id || ""
                }
                onSaveSource={onSavePersonSource}
                personIds={personIds}
                activityIds={activityIds}
              />
            </ScrollArea>
          </>
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">👤</div>
              <div className="text-sm">Select a person to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonDetailProps {
  person: Person;
  contextName: string;
  contextId: string;
  onSaveSource?: (personId: string, newContent: string) => Promise<boolean>;
  personIds: string[];
  activityIds: string[];
}

function PersonDetail({
  person,
  contextName,
  contextId,
  onSaveSource,
  personIds,
  activityIds,
}: PersonDetailProps) {
  const color = getAvatarColor(person.name);

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{
            backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
            color,
          }}
        >
          {getInitials(person.name)}
        </div>
        <div className="flex-1">
          <h2
            className="text-xl font-semibold mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--foreground)",
            }}
          >
            {person.name}
          </h2>
          {person.subtitle && (
            <div
              className="text-sm mb-2"
              style={{ color: "var(--foreground-muted)" }}
            >
              {person.subtitle}
            </div>
          )}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground-muted)",
            }}
          >
            {CONTEXT_ICONS[contextId] || "👤"} {contextName}
          </div>
        </div>
      </div>

      {/* Fields */}
      {Object.keys(person.fields).length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Details
          </h3>
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--secondary)" }}
          >
            {Object.entries(person.fields).map(([key, value], idx, arr) => (
              <div
                key={key}
                className="flex px-4 py-3"
                style={{
                  borderBottom:
                    idx < arr.length - 1
                      ? "1px solid var(--border)"
                      : undefined,
                }}
              >
                <div
                  className="w-24 text-xs capitalize"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {key}
                </div>
                <div
                  className="flex-1 text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  {formatFieldValue(key, value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members (for families) */}
      {person.members && person.members.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Members
          </h3>
          <div className="space-y-3">
            {person.members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {member.name.charAt(0)}
                  </span>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "var(--foreground)" }}
                    >
                      {member.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      #{member.id}
                    </div>
                  </div>
                </div>
                {Object.keys(member.fields).length > 0 && (
                  <div
                    className="mt-2 pt-2 space-y-1"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    {Object.entries(member.fields).map(([key, value]) => (
                      <div key={key} className="flex text-sm">
                        <span
                          className="w-20 capitalize"
                          style={{ color: "var(--foreground-muted)" }}
                        >
                          {key}
                        </span>
                        <span style={{ color: "var(--foreground)" }}>
                          {formatFieldValue(key, value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Notes
          </h3>
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--warning-muted)",
              borderLeft: "4px solid var(--warning)",
            }}
          >
            {person.notes.map((note, idx) => (
              <div
                key={idx}
                className="text-sm"
                style={{
                  color: "var(--foreground)",
                  marginBottom: idx < person.notes.length - 1 ? "8px" : 0,
                }}
              >
                • {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Log */}
      {person.log.length > 0 && (
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Interaction Log
          </h3>
          <div className="space-y-2">
            {person.log.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <span
                  className="text-xs w-20 shrink-0"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {formatLogDate(entry.date)}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  {entry.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(person.fields).length === 0 &&
        (!person.members || person.members.length === 0) &&
        person.notes.length === 0 &&
        person.log.length === 0 && (
          <div
            className="text-center py-10"
            style={{ color: "var(--foreground-muted)" }}
          >
            No additional information
          </div>
        )}

      {/* Source editor */}
      {onSaveSource && (
        <div
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <InlineEditor
            value={personToMarkdown(person)}
            onSave={async (newContent) => {
              return await onSaveSource(person.id, newContent);
            }}
            language="people"
            personIds={personIds}
            activityIds={activityIds}
            label="Source"
          />
        </div>
      )}
    </div>
  );
}

// Calculate age from a date string that contains a year
function calculateAge(dateStr: string): number | null {
  // Try to extract a year from various formats
  // Formats: "1990", "15 Jan 1990", "1990-01-15", "Jan 15, 1990", "15/01/1990"

  // Try full date parsing first
  const date = new Date(dateStr);
  if (
    !isNaN(date.getTime()) &&
    date.getFullYear() > 1900 &&
    date.getFullYear() < 2100
  ) {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }
    return age;
  }

  // Try to extract just a year (4-digit number)
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const birthYear = parseInt(yearMatch[0], 10);
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }

  return null;
}

function formatFieldValue(key: string, value: string): React.ReactNode {
  // Format phone numbers as links
  if (key === "phone" || key === "mobile") {
    return (
      <a
        href={`tel:${value.replace(/\s/g, "")}`}
        style={{ color: "var(--primary)" }}
        className="hover:underline"
      >
        {value}
      </a>
    );
  }

  // Format email as link
  if (key === "email") {
    return (
      <a
        href={`mailto:${value}`}
        style={{ color: "var(--primary)" }}
        className="hover:underline"
      >
        {value}
      </a>
    );
  }

  // Format birthday/born with emoji and calculate age if year is present
  if (key === "birthday" || key === "born") {
    const age = calculateAge(value);
    if (age !== null) {
      return (
        <span>
          🎂 {value} ({age} years old)
        </span>
      );
    }
    return <span>🎂 {value}</span>;
  }

  // Format URLs as links
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--primary)" }}
        className="hover:underline"
      >
        {value}
      </a>
    );
  }

  return value;
}

function formatLogDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
