import { promises as fs } from 'fs';
import path from 'path';
import { parseMarkdownEntries, stringifyMarkdownEntry, updateMarkdownEntry, deleteMarkdownEntry } from './parser.server';
import type { ScheduleEvent, RecurringEvent, Contact, Checklist, ActivityType } from '~/types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

// Activity types management
export async function getActivityTypes(): Promise<Record<string, ActivityType>> {
  const filePath = path.join(DATA_DIR, 'config', 'activities.json');
  try {
    const content = await readFile(filePath);
    return content ? JSON.parse(content) : {};
  } catch {
    return {};
  }
}

export async function saveActivityType(id: string, activityType: ActivityType): Promise<void> {
  const activities = await getActivityTypes();
  activities[id] = activityType;
  const filePath = path.join(DATA_DIR, 'config', 'activities.json');
  await writeFile(filePath, JSON.stringify(activities, null, 2));
}

// Recurring events
export async function getRecurringEvents(): Promise<RecurringEvent[]> {
  const filePath = path.join(DATA_DIR, 'schedule', 'recurring.md');
  const content = await readFile(filePath);
  return parseMarkdownEntries(content);
}

export async function saveRecurringEvent(event: RecurringEvent): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'recurring.md');
  const content = await readFile(filePath);
  const newContent = content + '\n' + stringifyMarkdownEntry(event);
  await writeFile(filePath, newContent);
}

export async function updateRecurringEvent(id: string, event: Partial<RecurringEvent>): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'recurring.md');
  const content = await readFile(filePath);
  const newContent = updateMarkdownEntry(content, id, event);
  await writeFile(filePath, newContent);
}

export async function deleteRecurringEvent(id: string): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'recurring.md');
  const content = await readFile(filePath);
  const newContent = deleteMarkdownEntry(content, id);
  await writeFile(filePath, newContent);
}

// One-off events
export async function getEvents(): Promise<ScheduleEvent[]> {
  const filePath = path.join(DATA_DIR, 'schedule', 'events.md');
  const content = await readFile(filePath);
  return parseMarkdownEntries(content);
}

export async function saveEvent(event: ScheduleEvent): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'events.md');
  const content = await readFile(filePath);
  const newContent = content + '\n' + stringifyMarkdownEntry(event);
  await writeFile(filePath, newContent);
}

export async function updateEvent(id: string, event: Partial<ScheduleEvent>): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'events.md');
  const content = await readFile(filePath);
  const newContent = updateMarkdownEntry(content, id, event);
  await writeFile(filePath, newContent);
}

export async function deleteEvent(id: string): Promise<void> {
  const filePath = path.join(DATA_DIR, 'schedule', 'events.md');
  const content = await readFile(filePath);
  const newContent = deleteMarkdownEntry(content, id);
  await writeFile(filePath, newContent);
}

// Contacts
export async function getContacts(): Promise<Contact[]> {
  const filePath = path.join(DATA_DIR, 'people', 'contacts.md');
  const content = await readFile(filePath);
  return parseMarkdownEntries(content);
}

export async function saveContact(contact: Contact): Promise<void> {
  const filePath = path.join(DATA_DIR, 'people', 'contacts.md');
  const content = await readFile(filePath);
  const newContent = content + '\n' + stringifyMarkdownEntry(contact);
  await writeFile(filePath, newContent);
}

export async function updateContact(id: string, contact: Partial<Contact>): Promise<void> {
  const filePath = path.join(DATA_DIR, 'people', 'contacts.md');
  const content = await readFile(filePath);
  const newContent = updateMarkdownEntry(content, id, contact);
  await writeFile(filePath, newContent);
}

export async function deleteContact(id: string): Promise<void> {
  const filePath = path.join(DATA_DIR, 'people', 'contacts.md');
  const content = await readFile(filePath);
  const newContent = deleteMarkdownEntry(content, id);
  await writeFile(filePath, newContent);
}

// Checklists
export async function getChecklists(): Promise<Checklist[]> {
  const listsDir = path.join(DATA_DIR, 'lists');
  await ensureDir(listsDir);

  const files = await fs.readdir(listsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  const checklists = await Promise.all(
    mdFiles.map(async (file) => {
      const content = await readFile(path.join(listsDir, file));
      const entries = parseMarkdownEntries(content);
      return entries[0] || null;
    })
  );

  return checklists.filter(Boolean);
}

export async function getChecklist(id: string): Promise<Checklist | null> {
  const checklists = await getChecklists();
  return checklists.find(c => c.id === id) || null;
}

export async function saveChecklist(checklist: Checklist): Promise<void> {
  const filePath = path.join(DATA_DIR, 'lists', `${checklist.id}.md`);
  const content = stringifyMarkdownEntry(checklist);
  await writeFile(filePath, content);
}

export async function updateChecklist(id: string, checklist: Partial<Checklist>): Promise<void> {
  const existing = await getChecklist(id);
  if (existing) {
    await saveChecklist({ ...existing, ...checklist });
  }
}

export async function deleteChecklist(id: string): Promise<void> {
  const filePath = path.join(DATA_DIR, 'lists', `${id}.md`);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File doesn't exist, ignore
  }
}
