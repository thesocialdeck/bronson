import { getRecurringEvents, getEvents } from './markdown.server';
import { getTodayInfo, getDayOfWeek, getWeekDays, getTomorrowInfo } from './utils';
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

export async function getTomorrowSchedule() {
  const tomorrow = getTomorrowInfo();
  const recurring = await getRecurringEvents();
  const events = await getEvents();

  // Get recurring events for tomorrow's day of week
  const tomorrowRecurring = recurring.filter(e => e.day === tomorrow.dayName).map(e => ({
    ...e,
    date: tomorrow.date,
  }));

  // Get one-off events for tomorrow
  const tomorrowEvents = events.filter(e => e.date === tomorrow.date);

  // Combine and sort by time
  const allEvents = [...tomorrowRecurring, ...tomorrowEvents].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  return {
    ...tomorrow,
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

// Categorize events by time (now, soon, later)
export function categorizeEventsByTime(events: any[]) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const nowEvents: any[] = [];
  const soonEvents: any[] = [];
  const laterEvents: any[] = [];

  events.forEach(event => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventTimeInMinutes = hours * 60 + minutes;
    const eventEndTimeInMinutes = event.endTime
      ? (() => {
          const [endHours, endMinutes] = event.endTime.split(':').map(Number);
          return endHours * 60 + endMinutes;
        })()
      : eventTimeInMinutes + (event.duration || 60);

    // Happening now: current time is between start and end time
    if (currentTimeInMinutes >= eventTimeInMinutes && currentTimeInMinutes <= eventEndTimeInMinutes) {
      nowEvents.push(event);
    }
    // Coming soon: within next 2 hours
    else if (eventTimeInMinutes > currentTimeInMinutes && eventTimeInMinutes <= currentTimeInMinutes + 120) {
      soonEvents.push(event);
    }
    // Later today: more than 2 hours away
    else if (eventTimeInMinutes > currentTimeInMinutes + 120) {
      laterEvents.push(event);
    }
  });

  return { nowEvents, soonEvents, laterEvents };
}
