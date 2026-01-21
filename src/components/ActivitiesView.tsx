import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InlineEditor } from "@/components/editor";
import type { ActivitiesData, Activity, ChecklistItem } from "@/lib/types";
import { getActivityColor, getActivityIcon } from "@/lib/colors";

interface ActivitiesViewProps {
  activities: ActivitiesData | null;
  onSaveActivitySource?: (
    activityId: string,
    newContent: string,
  ) => Promise<boolean>;
  personIds: string[];
  activityIds: string[];
}

// Helper to reconstruct an activity's markdown block from parsed data
function activityToMarkdown(activity: Activity): string {
  const lines: string[] = [];

  // Header line
  lines.push(`### +${activity.id}`);

  // Icon and color
  if (activity.icon) {
    lines.push(`icon: ${activity.icon}`);
  }
  if (activity.color) {
    lines.push(`color: ${activity.color}`);
  }

  // Keywords
  if (activity.keywords.length > 0) {
    lines.push(`keywords: ${activity.keywords.join(", ")}`);
  }

  // Extends
  if (activity.extends) {
    lines.push(`extends: +${activity.extends}`);
  }

  // Main checklist
  if (activity.checklist.length > 0) {
    lines.push("checklist:");
    for (const item of activity.checklist) {
      if (item.section) {
        lines.push(`  [${item.section}]`);
      }
      lines.push(`  - ${item.text}`);
      for (const subItem of item.sub_items) {
        lines.push(`    - ${subItem}`);
      }
    }
  }

  // Person checklists
  for (const [personId, items] of Object.entries(activity.person_checklists)) {
    lines.push(`checklist #${personId}:`);
    for (const item of items) {
      if (item.section) {
        lines.push(`  [${item.section}]`);
      }
      lines.push(`  - ${item.text}`);
      for (const subItem of item.sub_items) {
        lines.push(`    - ${subItem}`);
      }
    }
  }

  // Condition checklists
  for (const [condition, items] of Object.entries(
    activity.condition_checklists,
  )) {
    lines.push(`checklist "${condition}":`);
    for (const item of items) {
      if (item.section) {
        lines.push(`  [${item.section}]`);
      }
      lines.push(`  - ${item.text}`);
      for (const subItem of item.sub_items) {
        lines.push(`    - ${subItem}`);
      }
    }
  }

  return lines.join("\n");
}

export function ActivitiesView({
  activities,
  onSaveActivitySource,
  personIds,
  activityIds,
}: ActivitiesViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Handle activity selection - show detail on mobile
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetail(true);
  };

  // Handle back navigation on mobile
  const handleBackToList = () => {
    setShowDetail(false);
  };

  if (!activities) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--foreground-muted)" }}
      >
        No activities data
      </div>
    );
  }

  const filteredCategories = activities.categories.filter(
    (cat) => !selectedCategory || cat.name === selectedCategory,
  );

  const totalActivities = activities.categories.reduce(
    (sum, cat) => sum + cat.activities.length,
    0,
  );

  return (
    <div className="flex h-full">
      {/* Sidebar - full width on mobile, fixed width on desktop */}
      <div
        className={`flex flex-col min-h-0 md:w-72 ${
          showDetail ? "hidden md:flex" : "w-full"
        }`}
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* Category filters */}
        <div className="p-3 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-2.5 py-1 rounded-md text-xs transition-colors"
            style={{
              border: `1px solid ${selectedCategory === null ? "var(--primary)" : "var(--border)"}`,
              backgroundColor:
                selectedCategory === null
                  ? "var(--primary-muted)"
                  : "transparent",
              color:
                selectedCategory === null
                  ? "var(--primary)"
                  : "var(--foreground-muted)",
            }}
          >
            All
          </button>
          {activities.categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.name ? null : cat.name,
                )
              }
              className="px-2.5 py-1 rounded-md text-xs transition-colors"
              style={{
                border: `1px solid ${selectedCategory === cat.name ? "var(--primary)" : "var(--border)"}`,
                backgroundColor:
                  selectedCategory === cat.name
                    ? "var(--primary-muted)"
                    : "transparent",
                color:
                  selectedCategory === cat.name
                    ? "var(--primary)"
                    : "var(--foreground-muted)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Activities list */}
        <ScrollArea className="flex-1 h-0">
          <div className="px-3 pb-3">
            {filteredCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {category.name}
                  <span style={{ opacity: 0.5 }}>
                    {" "}
                    ({category.activities.length})
                  </span>
                </div>
                {category.activities.map((activity) => {
                  const color = activity.color || getActivityColor(activity.id);
                  const icon = activity.icon || getActivityIcon(activity.id);
                  return (
                    <div
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors"
                      style={{
                        backgroundColor:
                          selectedActivity?.id === activity.id
                            ? "var(--secondary)"
                            : "transparent",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                        }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-sm"
                          style={{ color: "var(--foreground)" }}
                        >
                          +{activity.id}
                        </div>
                        {activity.keywords.length > 0 && (
                          <div
                            className="text-xs truncate"
                            style={{ color: "var(--foreground-muted)" }}
                          >
                            {activity.keywords.slice(0, 3).join(", ")}
                            {activity.keywords.length > 3 && "..."}
                          </div>
                        )}
                      </div>
                      {activity.checklist.length > 0 && (
                        <div
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--secondary)",
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {activity.checklist.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div
                className="text-center py-10"
                style={{ color: "var(--foreground-muted)" }}
              >
                <div className="text-3xl mb-2">🏷️</div>
                <div className="text-sm">No activities found</div>
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
          {totalActivities} activities in {activities.categories.length}{" "}
          categories
        </div>
      </div>

      {/* Detail panel - full width on mobile when shown, flex-1 on desktop */}
      <div
        className={`flex-1 min-h-0 flex flex-col ${
          showDetail ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedActivity ? (
          <>
            {/* Mobile back button */}
            <button
              onClick={handleBackToList}
              className="md:hidden flex items-center gap-2 px-4 py-3 text-sm font-medium border-b transition-colors hover:bg-secondary"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground-muted)",
              }}
              aria-label="Back to activities list"
            >
              <span aria-hidden="true">←</span>
              <span>Back to list</span>
            </button>
            <ScrollArea className="flex-1 h-0">
              <ActivityDetail
                activity={selectedActivity}
                categoryName={
                  activities.categories.find((c) =>
                    c.activities.some((a) => a.id === selectedActivity.id),
                  )?.name || ""
                }
                onSaveSource={onSaveActivitySource}
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
              <div className="text-5xl mb-3">🏷️</div>
              <div className="text-sm">Select an activity to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityDetailProps {
  activity: Activity;
  categoryName: string;
  onSaveSource?: (activityId: string, newContent: string) => Promise<boolean>;
  personIds: string[];
  activityIds: string[];
}

function ActivityDetail({
  activity,
  categoryName,
  onSaveSource,
  personIds,
  activityIds,
}: ActivityDetailProps) {
  const color = activity.color || getActivityColor(activity.id);
  const icon = activity.icon || getActivityIcon(activity.id);

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{
            backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h2
            className="text-xl font-semibold mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--foreground)",
            }}
          >
            +{activity.id}
          </h2>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground-muted)",
            }}
          >
            {categoryName}
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="mb-6">
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--foreground-muted)" }}
        >
          Properties
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <div
            className="flex px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="w-24 text-xs"
              style={{ color: "var(--foreground-muted)" }}
            >
              Icon
            </div>
            <div className="flex-1 text-sm">{icon}</div>
          </div>
          <div
            className="flex px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="w-24 text-xs"
              style={{ color: "var(--foreground-muted)" }}
            >
              Color
            </div>
            <div className="flex-1 text-sm flex items-center gap-2">
              <span
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              {activity.color || "default"}
            </div>
          </div>
          {activity.keywords.length > 0 && (
            <div
              className="flex px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div
                className="w-24 text-xs"
                style={{ color: "var(--foreground-muted)" }}
              >
                Keywords
              </div>
              <div
                className="flex-1 text-sm"
                style={{ color: "var(--foreground)" }}
              >
                {activity.keywords.join(", ")}
              </div>
            </div>
          )}
          {activity.extends && (
            <div className="flex px-4 py-3">
              <div
                className="w-24 text-xs"
                style={{ color: "var(--foreground-muted)" }}
              >
                Extends
              </div>
              <div
                className="flex-1 text-sm"
                style={{ color: "var(--primary)" }}
              >
                +{activity.extends}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Checklist */}
      {activity.checklist.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Checklist
          </h3>
          <ChecklistDisplay items={activity.checklist} />
        </div>
      )}

      {/* Person-specific checklists */}
      {Object.keys(activity.person_checklists).length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Person Checklists
          </h3>
          {Object.entries(activity.person_checklists).map(
            ([personId, items]) => (
              <div key={personId} className="mb-4">
                <div
                  className="text-sm font-medium mb-2 flex items-center gap-1.5"
                  style={{ color: "var(--foreground)" }}
                >
                  <span style={{ color: "var(--person-default)" }}>
                    #{personId}
                  </span>
                </div>
                <ChecklistDisplay items={items} />
              </div>
            ),
          )}
        </div>
      )}

      {/* Condition checklists */}
      {Object.keys(activity.condition_checklists).length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Conditional Checklists
          </h3>
          {Object.entries(activity.condition_checklists).map(
            ([condition, items]) => (
              <div key={condition} className="mb-4">
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  "{condition}"
                </div>
                <ChecklistDisplay items={items} />
              </div>
            ),
          )}
        </div>
      )}

      {/* Empty state for no checklist */}
      {activity.checklist.length === 0 &&
        Object.keys(activity.person_checklists).length === 0 &&
        Object.keys(activity.condition_checklists).length === 0 && (
          <div
            className="text-center py-6"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm">No checklist defined</div>
          </div>
        )}

      {/* Source editor */}
      {onSaveSource && (
        <div
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <InlineEditor
            value={activityToMarkdown(activity)}
            onSave={async (newContent) => {
              return await onSaveSource(activity.id, newContent);
            }}
            language="activities"
            personIds={personIds}
            activityIds={activityIds}
            label="Source"
          />
        </div>
      )}
    </div>
  );
}

function ChecklistDisplay({ items }: { items: ChecklistItem[] }) {
  let currentSection: string | null = null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--secondary)" }}
    >
      {items.map((item, idx) => {
        const showSection = item.section && item.section !== currentSection;
        if (item.section) {
          currentSection = item.section;
        }

        return (
          <div key={idx}>
            {showSection && (
              <div
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: "var(--muted)",
                  color: "var(--foreground-muted)",
                }}
              >
                {item.section}
              </div>
            )}
            <div
              className="px-4 py-2.5"
              style={{
                borderBottom:
                  idx < items.length - 1
                    ? "1px solid var(--border)"
                    : undefined,
              }}
            >
              <div
                className="flex items-start gap-2 text-sm"
                style={{ color: "var(--foreground)" }}
              >
                <span
                  className="mt-0.5"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  ☐
                </span>
                <span>{item.text}</span>
              </div>
              {item.sub_items.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.sub_items.map((subItem, subIdx) => (
                    <div
                      key={subIdx}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      <span className="mt-0.5">◦</span>
                      <span>{subItem}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
