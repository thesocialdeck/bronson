import { getTodaySchedule } from './scheduler.server';
import { getChecklists } from './markdown.server';
import type { Checklist } from '~/types';

// Activity type to pack list mapping
const PACK_LIST_TEMPLATES: Record<string, string[]> = {
  soccer: ['⚽ Soccer ball', '👟 Cleats', '🧦 Shin guards', '💧 Water bottle', '👕 Team uniform'],
  football: ['🏈 Football', '👟 Cleats', '🧦 Pads & helmet', '💧 Water bottle', '👕 Team uniform'],
  basketball: ['🏀 Basketball', '👟 Basketball shoes', '💧 Water bottle', '👕 Team jersey'],
  swimming: ['🏊 Swimsuit', '🥽 Goggles', '🧴 Towel', '🧴 Sunscreen', '💧 Water bottle'],
  dance: ['🩰 Dance shoes', '👗 Dance outfit', '🎀 Hair ties', '💧 Water bottle'],
  piano: ['🎹 Sheet music', '📚 Practice book', '✏️ Pencil'],
  music: ['🎵 Instrument', '📚 Music books', '✏️ Pencil'],
  school: ['🎒 Backpack', '📚 Homework', '🍎 Lunch box', '✏️ Pencils & supplies', '📓 Notebooks'],
  tutoring: ['📚 Textbooks', '📓 Notebook', '✏️ Pencils', '🎒 Backpack'],
  art: ['🎨 Art supplies', '🖌️ Brushes', '👕 Art smock', '💧 Water bottle'],
  karate: ['🥋 Gi (uniform)', '🥊 Belt', '💧 Water bottle'],
  gym: ['👟 Gym shoes', '👕 Gym clothes', '🧴 Towel', '💧 Water bottle'],
  birthday: ['🎁 Gift', '💌 Card', '🎈 (Party supplies if bringing)'],
  playdate: ['🧸 Toy to share', '🍪 Snack (if requested)', '👕 Change of clothes'],
  default: ['🎒 Bag', '💧 Water bottle', '📱 Phone'],
};

interface PackItem {
  item: string;
  packed: boolean;
  priority: 'high' | 'normal';
}

interface MorningEvent {
  id?: string;
  person: string;
  activity: string;
  type: string;
  time: string;
  location?: string;
  packList: PackItem[];
}

export async function getMorningPrep() {
  const today = await getTodaySchedule();
  const checklists = await getChecklists();

  // Get morning events (before 10am)
  const morningEvents = today.events.filter(event => {
    const [hours] = event.time.split(':').map(Number);
    return hours >= 6 && hours < 10;
  });

  // Get events needing preparation (up to 2pm)
  const prepEvents = today.events.filter(event => {
    const [hours] = event.time.split(':').map(Number);
    return hours < 14;
  });

  // Generate pack lists for events
  const eventsWithPackLists: MorningEvent[] = prepEvents.map(event => {
    const activityType = event.type.toLowerCase();
    const template = PACK_LIST_TEMPLATES[activityType] || PACK_LIST_TEMPLATES.default;

    const packList: PackItem[] = template.map(item => ({
      item,
      packed: false,
      priority: 'normal' as const,
    }));

    return {
      ...event,
      packList,
    };
  });

  // Get active checklists for today
  const activeChecklists = checklists.filter(
    checklist => checklist.items.some(item => !item.checked)
  );

  // Calculate time to first event
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  let nextEvent: MorningEvent | null = null;
  let minutesUntilNext = Infinity;

  eventsWithPackLists.forEach(event => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventTimeInMinutes = hours * 60 + minutes;
    const diff = eventTimeInMinutes - currentTimeInMinutes;

    if (diff > 0 && diff < minutesUntilNext) {
      minutesUntilNext = diff;
      nextEvent = event;
    }
  });

  return {
    morningEvents: eventsWithPackLists.filter(e => {
      const [hours] = e.time.split(':').map(Number);
      return hours >= 6 && hours < 10;
    }),
    allTodayEvents: eventsWithPackLists,
    checklists: activeChecklists,
    nextEvent,
    minutesUntilNext: minutesUntilNext === Infinity ? null : minutesUntilNext,
    currentTime: {
      hour: currentHour,
      minute: currentMinute,
      isMorning: currentHour >= 6 && currentHour < 12,
    },
  };
}

export function generatePackList(activityType: string): string[] {
  const type = activityType.toLowerCase();
  return PACK_LIST_TEMPLATES[type] || PACK_LIST_TEMPLATES.default;
}
