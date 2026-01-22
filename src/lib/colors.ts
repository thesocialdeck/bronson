// Shared color and icon utilities for consistent styling across components

import type { Person } from "./types";

// Default avatar colors for when no color is specified
export const DEFAULT_PERSON_COLORS = [
  "#c9a87c", // warm gold
  "#8fbc8f", // sage green
  "#b08968", // terracotta
  "#7eb8da", // soft blue
  "#d4a5a5", // dusty rose
  "#9b8bb4", // muted purple
  "#87ceeb", // sky blue
  "#deb887", // burlywood
];

// Generate a consistent color for a person based on their name
export function getDefaultColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_PERSON_COLORS[Math.abs(hash) % DEFAULT_PERSON_COLORS.length];
}

// Person colors - uses person's color if available, otherwise generates from name
export function getPersonColor(
  id: string,
  getPerson?: (id: string) => Person | null,
): string {
  // Try to get the person's color from the data
  if (getPerson) {
    const person = getPerson(id);
    if (person?.color) {
      return person.color;
    }
    // Generate consistent color based on name
    if (person?.name) {
      return getDefaultColorForName(person.name);
    }
  }

  // Fallback: generate color from ID
  return getDefaultColorForName(id);
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

// Generate avatar color from name (deterministic) - uses DEFAULT_PERSON_COLORS
export function getAvatarColor(name: string): string {
  return getDefaultColorForName(name);
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
