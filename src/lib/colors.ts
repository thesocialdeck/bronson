// Shared color and icon utilities for consistent styling across components

// Person colors - maps person ID to CSS variable
export function getPersonColor(id: string): string {
  const mapping: Record<string, string> = {
    marcus: "var(--person-marcus)",
    ella: "var(--person-ella)",
    sarah: "var(--person-sarah)",
    steven: "var(--person-steven)",
    family: "var(--person-family)",
  };
  return mapping[id] || "var(--person-default)";
}

// Activity colors - maps activity ID to CSS variable
export function getActivityColor(id: string): string {
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

// Activity icons - emoji representations
export function getActivityIcon(id: string): string {
  const icons: Record<string, string> = {
    sport: "⚽",
    school: "🎒",
    social: "🎉",
    appointment: "🗓️",
    celebration: "🎂",
    reminder: "🔔",
    errand: "🛒",
    health: "💪",
  };
  return icons[id] || "🏷️";
}

// Activity display names - human-readable labels
export function getActivityDisplay(id: string): string {
  const displays: Record<string, string> = {
    sport: "Sport",
    school: "School",
    social: "Social",
    appointment: "Appointments",
    celebration: "Celebration",
    reminder: "Reminder",
    errand: "Errand",
    health: "Health",
  };
  return displays[id] || id;
}

// Context icons for people groups
export const CONTEXT_ICONS: Record<string, string> = {
  family: "👨‍👩‍👧‍👦",
  neighbours: "🏠",
  "school-parents": "🎒",
  "work-contacts": "💼",
  "kids-activities": "⚽",
  services: "🔧",
  "extended-family": "👴",
};

// Avatar colors for people list
export const AVATAR_COLORS = [
  "var(--person-marcus)",
  "var(--person-ella)",
  "var(--person-sarah)",
  "var(--person-steven)",
  "var(--person-family)",
  "var(--activity-social)",
  "var(--activity-sport)",
  "var(--activity-school)",
  "var(--activity-appointment)",
  "var(--activity-health)",
];

// Generate avatar color from name (deterministic)
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(/[\s&]+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
