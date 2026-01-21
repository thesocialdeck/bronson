// Calendar types matching Rust structures

export interface Calendar {
  year: number;
  config: CalendarConfig;
  recurring: Event[];
  months: Month[];
}

export interface CalendarConfig {
  family: FamilyMember[];
  custom_types: CustomType[];
}

export interface FamilyMember {
  id: string;
  display_name: string;
  color: string;
}

export interface CustomType {
  id: string;
  color: string;
  icon: string;
  keywords: string[];
}

export interface Month {
  name: string;
  events: Event[];
}

export interface Event {
  id: string;
  raw_line: string;
  line_number: number;
  date: DateSpec;
  time: TimeSpec | null;
  recurrence: Recurrence | null;
  title: string;
  people: string[];
  location: string | null;
  activity: string | null;
  person_links: string[];
  status: EventStatus;
  reminders: Reminder[];
  priority: Priority;
  notes: string[];
}

export type DateSpec =
  | { type: "Single"; value: string }
  | { type: "Range"; value: { start: string; end: string } }
  | { type: "Relative"; value: RelativeDate };

export type RelativeDate =
  | { type: "Today" }
  | { type: "Tomorrow" }
  | { type: "Weekday"; day: string; next: boolean };

export type TimeSpec =
  | { type: "Point"; value: string }
  | { type: "Range"; value: { start: string; end: string } }
  | { type: "Fuzzy"; value: FuzzyTime };

export type FuzzyTime = "Morning" | "Afternoon" | "Evening" | "Night";

export interface Recurrence {
  frequency: Frequency;
  interval: number;
  by_day: string[] | null;
  by_month_day: number | null;
  by_set_pos: number | null;
  until: RecurrenceEnd | null;
}

export type Frequency = "Daily" | "Weekly" | "Monthly" | "Yearly";

export type RecurrenceEnd =
  | { type: "Date"; value: string }
  | { type: "Count"; value: number };

export type EventStatus =
  | "None"
  | "Tentative"
  | "Confirmed"
  | "Cancelled"
  | "Done";

export interface Reminder {
  trigger: ReminderTrigger;
}

export type ReminderTrigger =
  | { type: "Before"; value: string }
  | { type: "At"; value: string };

export type Priority = "None" | "Low" | "Medium" | "High";

// People types
export interface PeopleData {
  contexts: Context[];
}

export interface Context {
  name: string;
  id: string;
  people: Person[];
}

export interface Person {
  id: string;
  name: string;
  subtitle: string | null;
  fields: Record<string, string>;
  notes: string[];
  log: LogEntry[];
  members: PersonMember[];
  line_number: number;
}

export interface PersonMember {
  id: string;
  name: string;
  fields: Record<string, string>;
}

export interface LogEntry {
  date: string;
  text: string;
}

// Activities types
export interface ActivitiesData {
  categories: ActivityCategory[];
}

export interface ActivityCategory {
  name: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  icon: string;
  color: string;
  keywords: string[];
  extends: string | null;
  checklist: ChecklistItem[];
  person_checklists: Record<string, ChecklistItem[]>;
  condition_checklists: Record<string, ChecklistItem[]>;
}

export interface ChecklistItem {
  text: string;
  section: string | null;
  sub_items: string[];
}

// Parse result types
export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
  errors: ParseError[];
}

export interface ParseWarning {
  line: number;
  message: string;
  suggestion: string | null;
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  raw_line: string;
}

// View types for the UI
export type ViewType = "editor" | "year" | "month" | "agenda" | "people";

export interface CalendarDay {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface FilterState {
  people: string[];
  activities: string[];
  locations: string[];
  dateRange: { start: Date; end: Date } | null;
  searchQuery: string;
}
