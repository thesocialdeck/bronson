import { getRecurringEvents, getEvents } from './markdown.server';
import { getTodayInfo, getDayOfWeek, getWeekDays } from './utils';
import type { ScheduleEvent } from '~/types';

export async function getTodaySchedule() {
  const today = getTodayInfo();
  const recurring = await getRecurringEvents();
  const events = await getEvents();

  // Get recurring events for today's day of week
  const todayRecurring = recurring.filter(e => e.day === today.dayName).map(e => ({
    ...e,
    date: today.date,
  }));

  // Get one-off events for today
  const todayEvents = events.filter(e => e.date === today.date);

  // Combine and sort by time
  const allEvents = [...todayRecurring, ...todayEvents].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  return {
    ...today,
    events: allEvents,
  };
}

export async function getWeekSchedule() {
  const week = getWeekDays();
  const recurring = await getRecurringEvents();
  const events = await getEvents();

  return week.map(day => {
    // Get recurring events for this day
    const dayRecurring = recurring.filter(e => e.day === day.dayName).map(e => ({
      ...e,
      date: day.date,
    }));

    // Get one-off events for this day
    const dayEvents = events.filter(e => e.date === day.date);

    // Combine and sort by time
    const allEvents = [...dayRecurring, ...dayEvents].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });

    return {
      ...day,
      events: allEvents,
    };
  });
}

// Group events by person for Today view
export function groupEventsByPerson(events: any[]) {
  const grouped: Record<string, any[]> = {};
  const family: any[] = [];

  events.forEach(event => {
    const people = event.person.split(',').map((p: string) => p.trim());

    if (people.length > 1) {
      // Multi-person event (family event)
      family.push(event);
    } else {
      const person = people[0];
      if (!grouped[person]) {
        grouped[person] = [];
      }
      grouped[person].push(event);
    }
  });

  return { grouped, family };
}
