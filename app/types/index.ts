export interface FamilyMember {
  name: string;
  color: string;
  avatar: string;
}

export interface ActivityType {
  icon: string;
  color: string;
  underlineStyle: 'wavy' | 'dotted' | 'solid';
}

export interface ScheduleEvent {
  id: string;
  person: string;
  activity: string;
  activityType: string;
  date?: string; // ISO date for one-off events
  time: string; // HH:MM
  endTime?: string;
  duration?: number;
  location?: string;
  notes?: string;
  checklist?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: string;
    until?: string;
  };
}

export interface RecurringEvent {
  id: string;
  person: string;
  activity: string;
  type: string;
  day: string; // Monday, Tuesday, etc.
  time: string;
  duration?: number;
  location?: string;
  checklist?: string;
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  parents?: string[];
  phone?: string;
  email?: string;
  address?: string;
  birthday?: string; // YYYY-MM-DD format
  notes?: string;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  person: string;
  type: string;
  items: ChecklistItem[];
}

export interface GiftItem {
  id: string;
  person: string;
  item: string;
  list: string;
  priority?: 'low' | 'medium' | 'high';
  budget?: number;
  purchased?: boolean;
  notes?: string;
}

// Claude API response types
export type ParseAction = 'create' | 'update' | 'delete';
export type ParseType = 'event' | 'contact' | 'checklist' | 'gift' | 'note';

export interface MatchedEntry {
  id: string;
  fields?: Record<string, { old: any; new: any }>;
}

export interface NewActivityType {
  id: string;
  icon: string;
  color: string;
  underlineStyle: 'wavy' | 'dotted' | 'solid';
}

export interface ParseResponse {
  action: ParseAction;
  type: ParseType;
  confidence: number;
  matchedEntry?: MatchedEntry;
  data: any;
  confirmationMessage: string;
  newActivityType?: NewActivityType;
  relatedActions?: Array<{
    action: ParseAction;
    type: ParseType;
    data: any;
  }>;
  questions?: Array<{
    id: string;
    question: string;
    options?: string[];
  }>;
  suggestions?: string[];
}

export interface SaveRequest {
  action: ParseAction;
  type: ParseType;
  id?: string;
  data: any;
  newActivityType?: NewActivityType;
  relatedActions?: Array<{
    action: ParseAction;
    type: ParseType;
    data: any;
  }>;
}

export interface SaveResponse {
  success: boolean;
  message: string;
  redirect?: string;
}

// Inbox/Review Later types
export interface InboxItem {
  id: string;
  rawText: string;
  createdAt: string;
  source: 'manual' | 'sms' | 'email' | 'voice';

  // Parsed data (null until reviewed)
  parsed?: ParseResponse;
  parsedAt?: string;

  // Status
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}
