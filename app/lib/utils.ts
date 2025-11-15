import { format, parseISO, isToday, startOfWeek, addDays } from 'date-fns';

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatTime(time: string): string {
  // Convert 24h to 12h format for display
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minutes}${ampm}`;
}

export function isTodayDate(dateString: string): boolean {
  return isToday(parseISO(dateString));
}

export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE'); // Monday, Tuesday, etc.
}

export function getWeekDays(): Array<{ date: string; dayName: string; dayShort: string; dayNum: string }> {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: formatDate(date),
      dayName: format(date, 'EEEE'),
      dayShort: format(date, 'EEE'),
      dayNum: format(date, 'd'),
    };
  });
}

export function getTodayInfo() {
  const today = new Date();
  return {
    date: formatDate(today),
    dayName: format(today, 'EEEE'),
    dayShort: format(today, 'EEE'),
    dayNum: format(today, 'd'),
    fullDate: format(today, 'MMMM d, yyyy'),
  };
}

// Get activity color classes
export function getActivityClasses(color: string) {
  return {
    icon: `text-${color}-500`,
    bg: `bg-${color}-50`,
    underline: `decoration-${color}-400`,
    border: `border-${color}-300`,
    light: `bg-${color}-100`,
    text: `text-${color}-600`,
  };
}
