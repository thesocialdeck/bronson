import { getRecurringEvents, getEvents, getContacts } from './markdown.server';
import { getTodayInfo, getDayOfWeek, getWeekDays, getTomorrowInfo } from './utils';
import type { ScheduleEvent, Contact } from '~/types';
import { parseISO, differenceInDays, format, addYears, isBefore, startOfDay } from 'date-fns';

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

// Get upcoming birthdays (next 14 days)
export async function getUpcomingBirthdays(daysAhead: number = 14) {
  const contacts = await getContacts();
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();

  const upcomingBirthdays = contacts
    .filter(contact => contact.birthday) // Only contacts with birthdays
    .map(contact => {
      const birthdayDate = parseISO(contact.birthday!);
      const birthYear = birthdayDate.getFullYear();

      // Get this year's birthday
      let nextBirthday = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());

      // If birthday already passed this year, use next year
      if (isBefore(nextBirthday, today)) {
        nextBirthday = addYears(nextBirthday, 1);
      }

      const daysUntil = differenceInDays(startOfDay(nextBirthday), today);
      const age = nextBirthday.getFullYear() - birthYear;

      return {
        contact,
        daysUntil,
        age,
        nextBirthday,
        formattedDate: format(nextBirthday, 'EEEE, MMMM d'),
      };
    })
    .filter(birthday => birthday.daysUntil <= daysAhead) // Only next X days
    .sort((a, b) => a.daysUntil - b.daysUntil); // Sort by soonest first

  return upcomingBirthdays;
}

// Detect scheduling conflicts within a day's events
export function detectConflicts(events: any[]) {
  const conflicts: Array<{ event1: any; event2: any }> = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];

      // Parse times
      const [h1, m1] = event1.time.split(':').map(Number);
      const start1 = h1 * 60 + m1;
      const end1 = event1.endTime
        ? (() => {
            const [eh1, em1] = event1.endTime.split(':').map(Number);
            return eh1 * 60 + em1;
          })()
        : start1 + (event1.duration || 60);

      const [h2, m2] = event2.time.split(':').map(Number);
      const start2 = h2 * 60 + m2;
      const end2 = event2.endTime
        ? (() => {
            const [eh2, em2] = event2.endTime.split(':').map(Number);
            return eh2 * 60 + em2;
          })()
        : start2 + (event2.duration || 60);

      // Check for overlap
      const overlaps = (start1 < end2 && start2 < end1);

      if (overlaps) {
        conflicts.push({ event1, event2 });
      }
    }
  }

  return conflicts;
}

// Calculate week statistics
export function calculateWeekStats(weekData: any[]) {
  let totalEvents = 0;
  let totalConflicts = 0;
  let busiestDay = '';
  let maxEvents = 0;

  const daySummaries = weekData.map(day => {
    const eventCount = day.events.length;
    totalEvents += eventCount;

    const conflicts = detectConflicts(day.events);
    totalConflicts += conflicts.length;

    if (eventCount > maxEvents) {
      maxEvents = eventCount;
      busiestDay = day.dayName;
    }

    return {
      day: day.dayName,
      dayShort: day.dayShort,
      eventCount,
      isBusy: eventCount >= 3, // 3+ events = busy day
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  });

  return {
    totalEvents,
    conflictCount: totalConflicts,
    busiestDay,
    daySummaries,
  };
}
