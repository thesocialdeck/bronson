import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InlineEditor } from "@/components/editor";
import type { Event, Activity, ChecklistItem, Person } from "@/lib/types";
import {
  getPersonColor,
  getActivityColor,
  getActivityIcon,
} from "@/lib/colors";

interface EventDetailProps {
  event: Event;
  activity: Activity | null;
  onClose: () => void;
  onEdit: (lineNumber: number) => void;
  onSaveSource?: (lineNumber: number, newContent: string) => Promise<boolean>;
  personIds: string[];
  activityIds: string[];
  getPerson?: (id: string) => Person | null;
  onChecklistChange?: (itemIndex: number, checked: boolean) => void;
}

export function EventDetail({
  event,
  activity,
  onClose,
  onEdit,
  onSaveSource,
  personIds,
  activityIds,
  getPerson,
}: EventDetailProps) {
  // Local checklist state (would persist to file in real implementation)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Reset checked items when event changes
  useEffect(() => {
    setCheckedItems(new Set());
  }, [event.id]);

  const toggleChecklist = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Format date for display
  const formatDate = (): string => {
    if (event.date.type === "Single") {
      const date = new Date(event.date.value);
      return date.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (event.date.type === "Range") {
      const start = new Date(event.date.value.start);
      const end = new Date(event.date.value.end);
      return `${start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return "";
  };

  // Format time for display
  const formatTime = (): string | null => {
    if (!event.time) return null;

    if (event.time.type === "Point") {
      return event.time.value;
    }
    if (event.time.type === "Range") {
      return `${event.time.value.start} - ${event.time.value.end}`;
    }
    if (event.time.type === "Fuzzy") {
      return event.time.value;
    }
    return null;
  };

  // Get activity color and icon
  const activityColor = event.activity
    ? getActivityColor(event.activity)
    : activity?.color || "var(--activity-default)";
  const activityIcon = event.activity
    ? getActivityIcon(event.activity)
    : activity?.icon || "📅";

  // Get checklist from activity
  const checklist = activity?.checklist || [];
  const hasChecklist = checklist.length > 0;

  // Calculate checklist progress
  const checklistProgress = hasChecklist
    ? Math.round((checkedItems.size / checklist.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Mobile back header */}
      <div
        className="md:hidden flex items-center gap-2 px-4 py-3 border-b"
        style={{
          borderColor: "var(--border)",
          background: "var(--background-elevated)",
        }}
      >
        <button
          onClick={onClose}
          className="p-1 -ml-1 rounded-lg transition-colors hover:bg-secondary"
          style={{ color: "var(--foreground-muted)" }}
          aria-label="Back to calendar"
        >
          <span className="text-lg" aria-hidden="true">
            ←
          </span>
        </button>
        <span
          className="text-sm font-medium truncate flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {event.title}
        </span>
      </div>

      {/* Header */}
      <div
        className="flex items-start gap-4 p-4 md:p-6"
        style={{
          background: "var(--background-elevated)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Activity icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{
            backgroundColor: `color-mix(in oklch, ${activityColor} 20%, transparent)`,
          }}
        >
          {activityIcon}
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="text-xl font-semibold mb-1 truncate"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--foreground)",
            }}
          >
            {event.title}
          </h2>

          {/* Date and time */}
          <div
            className="flex items-center gap-3 text-sm mb-2"
            style={{ color: "var(--foreground-muted)" }}
          >
            <span>📅 {formatDate()}</span>
            {formatTime() && <span>🕐 {formatTime()}</span>}
          </div>

          {/* People */}
          {event.people.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {event.people.map((p) => {
                const color = getPersonColor(p, getPerson);
                return (
                  <span
                    key={p}
                    className="person-badge px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                      color,
                    }}
                  >
                    #{p}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-secondary hidden md:block"
          style={{ color: "var(--foreground-muted)" }}
          aria-label="Close event details"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-6">
          {/* Details section */}
          <section>
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
              {/* Activity */}
              {event.activity && (
                <DetailRow label="Activity">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium text-sm"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${activityColor} 20%, transparent)`,
                      color: activityColor,
                    }}
                  >
                    {activityIcon} +{event.activity}
                  </span>
                </DetailRow>
              )}

              {/* Location */}
              {event.location && (
                <DetailRow label="Location">
                  <span className="flex items-center gap-1.5 text-sm">
                    📍 {event.location}
                  </span>
                </DetailRow>
              )}

              {/* Status */}
              {event.status !== "None" && (
                <DetailRow label="Status">
                  <StatusBadge status={event.status} />
                </DetailRow>
              )}

              {/* Recurrence */}
              {event.recurrence && (
                <DetailRow label="Repeats">
                  <span className="text-sm">
                    🔄 {formatRecurrence(event.recurrence)}
                  </span>
                </DetailRow>
              )}

              {/* Priority */}
              {event.priority !== "None" && (
                <DetailRow label="Priority" isLast>
                  <PriorityBadge priority={event.priority} />
                </DetailRow>
              )}

              {/* If nothing else, show line number */}
              {!event.activity &&
                !event.location &&
                event.status === "None" &&
                !event.recurrence &&
                event.priority === "None" && (
                  <DetailRow label="Line" isLast>
                    <span
                      className="text-sm font-mono"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {event.line_number}
                    </span>
                  </DetailRow>
                )}
            </div>
          </section>

          {/* Notes section */}
          {event.notes.length > 0 && (
            <section>
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
                {event.notes.map((note, idx) => (
                  <p
                    key={idx}
                    className="text-sm"
                    style={{
                      color: "var(--foreground)",
                      marginBottom:
                        idx < event.notes.length - 1 ? "8px" : undefined,
                    }}
                  >
                    {note}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Checklist section */}
          {hasChecklist && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Checklist
                </h3>
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      checklistProgress === 100
                        ? "var(--success)"
                        : "var(--foreground-muted)",
                  }}
                >
                  {checkedItems.size}/{checklist.length} ({checklistProgress}%)
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 rounded-full mb-4 overflow-hidden"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${checklistProgress}%`,
                    backgroundColor:
                      checklistProgress === 100
                        ? "var(--success)"
                        : "var(--primary)",
                  }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-1">
                {checklist.map((item, idx) => (
                  <ChecklistItemRow
                    key={idx}
                    item={item}
                    checked={checkedItems.has(idx)}
                    onToggle={() => toggleChecklist(idx)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Source editor */}
          <InlineEditor
            value={event.raw_line}
            onSave={async (newContent) => {
              if (onSaveSource) {
                return await onSaveSource(event.line_number, newContent);
              }
              return false;
            }}
            language="calendar"
            personIds={personIds}
            activityIds={activityIds}
            label="Source"
          />
        </div>
      </ScrollArea>

      {/* Footer with actions */}
      <div
        className="flex items-center justify-between p-4 gap-3"
        style={{
          background: "var(--background-elevated)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => onEdit(event.line_number)}
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Edit in Editor
        </Button>
      </div>
    </div>
  );
}

// Helper components

function DetailRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center px-4 py-3"
      style={{
        borderBottom: isLast ? undefined : "1px solid var(--border)",
      }}
    >
      <span
        className="w-24 text-xs shrink-0"
        style={{ color: "var(--foreground-muted)" }}
      >
        {label}
      </span>
      <div className="flex-1" style={{ color: "var(--foreground)" }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: string }> = {
    Tentative: { color: "var(--warning)", icon: "❓" },
    Confirmed: { color: "var(--success)", icon: "✓" },
    Cancelled: { color: "var(--destructive)", icon: "✕" },
    Done: { color: "var(--success)", icon: "✓" },
  };

  const { color, icon } = config[status] || {
    color: "var(--foreground-muted)",
    icon: "",
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
        color,
      }}
    >
      {icon} {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    Low: { color: "var(--foreground-muted)", label: "Low" },
    Medium: { color: "var(--warning)", label: "Medium" },
    High: { color: "var(--destructive)", label: "High !" },
  };

  const { color, label } = config[priority] || {
    color: "var(--foreground-muted)",
    label: priority,
  };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ChecklistItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors"
        style={{
          backgroundColor: checked
            ? "var(--success-muted)"
            : "var(--secondary)",
        }}
      >
        <span
          className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{
            borderColor: checked ? "var(--success)" : "var(--border-strong)",
            backgroundColor: checked ? "var(--success)" : "transparent",
            color: checked ? "var(--background)" : "transparent",
          }}
        >
          {checked && "✓"}
        </span>
        <span
          className="text-sm flex-1"
          style={{
            color: checked ? "var(--foreground-muted)" : "var(--foreground)",
            textDecoration: checked ? "line-through" : undefined,
          }}
        >
          {item.text}
        </span>
      </button>

      {/* Sub-items */}
      {item.sub_items.length > 0 && (
        <div className="ml-8 space-y-1">
          {item.sub_items.map((subItem, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
              style={{
                backgroundColor: "var(--muted)",
                color: "var(--foreground-muted)",
              }}
            >
              <span>•</span>
              <span>{subItem}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRecurrence(recurrence: Event["recurrence"]): string {
  if (!recurrence) return "";

  const { frequency, interval, by_day } = recurrence;

  let base = "";
  if (interval === 1) {
    base =
      frequency === "Daily"
        ? "Daily"
        : frequency === "Weekly"
          ? "Weekly"
          : frequency === "Monthly"
            ? "Monthly"
            : "Yearly";
  } else {
    base = `Every ${interval} ${frequency.toLowerCase().replace("ly", "")}s`;
  }

  if (by_day && by_day.length > 0) {
    base += ` on ${by_day.join(", ")}`;
  }

  return base;
}
