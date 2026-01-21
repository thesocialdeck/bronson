// Quick add parsing utilities for the frontend

export interface QuickAddResult {
  raw: string;
  date: string | null;
  dateDisplay: string | null; // Human-friendly date display
  dateEnd: string | null; // End date for ranges (markdown format)
  dateEndDisplay: string | null; // Human-friendly end date display
  isDateRange: boolean;
  recurrence: string | null; // e.g., "every monday", "every fri"
  recurrenceDisplay: string | null; // Human-friendly recurrence display
  time: string | null;
  title: string;
  people: string[];
  location: string | null;
  activity: string | null;
  isValid: boolean;
  formattedLine: string;
  month: string | null; // Which month section to insert into
  year: number | null; // Which year the event is for
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const WEEKDAY_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Get today's date (can be overridden for testing)
function getToday(): Date {
  return new Date();
}

export function parseQuickAdd(input: string): QuickAddResult {
  const result: QuickAddResult = {
    raw: input,
    date: null,
    dateDisplay: null,
    dateEnd: null,
    dateEndDisplay: null,
    isDateRange: false,
    recurrence: null,
    recurrenceDisplay: null,
    time: null,
    title: "",
    people: [],
    location: null,
    activity: null,
    isValid: false,
    formattedLine: "",
    month: null,
    year: null,
  };

  if (!input.trim()) {
    return result;
  }

  // Pre-process: extract quoted locations first
  let processedInput = input;
  const quotedLocationMatch = input.match(/@"([^"]+)"/);
  let quotedLocation: string | null = null;
  if (quotedLocationMatch) {
    quotedLocation = quotedLocationMatch[1];
    processedInput = input.replace(/@"[^"]+"/, "").trim();
  }

  const words = processedInput.trim().split(/\s+/);
  const titleParts: string[] = [];
  let i = 0;

  // Try to parse recurrence first (e.g., "every friday", "every mon and wed")
  const recurrenceResult = tryParseRecurrence(words, i);
  if (recurrenceResult) {
    result.recurrence = recurrenceResult.recurrence;
    result.recurrenceDisplay = recurrenceResult.display;
    result.month = "Recurring"; // Goes in Recurring section
    i = recurrenceResult.nextIndex;

    // After recurrence, try to parse time
    const timeResult = tryParseTime(words, i);
    if (timeResult) {
      result.time = timeResult.time;
      i = timeResult.nextIndex;
    }
  } else {
    // Try to parse time first (e.g., "7am 7 february")
    const earlyTimeResult = tryParseTime(words, i);
    let timeParsedFirst = false;
    if (earlyTimeResult) {
      // Check if next word(s) look like a date
      const potentialDateResult = tryParseDate(
        words,
        earlyTimeResult.nextIndex,
      );
      if (potentialDateResult) {
        // Time came before date - use both
        result.time = earlyTimeResult.time;
        result.date = potentialDateResult.date;
        result.dateDisplay = potentialDateResult.display;
        result.month = potentialDateResult.month;
        result.year = potentialDateResult.year;
        i = potentialDateResult.nextIndex;
        timeParsedFirst = true;
      }
    }

    if (!timeParsedFirst) {
      // Try to parse date range first (e.g., "4 apr - 30 apr" or "apr 4-30")
      const dateRangeResult = tryParseDateRange(words, i);
      if (dateRangeResult) {
        result.date = dateRangeResult.startDate;
        result.dateDisplay = dateRangeResult.startDisplay;
        result.dateEnd = dateRangeResult.endDate;
        result.dateEndDisplay = dateRangeResult.endDisplay;
        result.isDateRange = true;
        result.month = dateRangeResult.month;
        result.year = dateRangeResult.year;
        i = dateRangeResult.nextIndex;
      } else {
        // Try to parse single date (handles multi-word dates like "next saturday", "in 3 days")
        const dateResult = tryParseDate(words, i);
        if (dateResult) {
          result.date = dateResult.date;
          result.dateDisplay = dateResult.display;
          result.month = dateResult.month;
          result.year = dateResult.year;
          i = dateResult.nextIndex;
        }
      }

      // Try to parse time after date
      const timeResult = tryParseTime(words, i);
      if (timeResult) {
        result.time = timeResult.time;
        i = timeResult.nextIndex;
      }
    }
  }

  // Parse remaining words - handle multi-word locations
  let collectingLocation = false;
  let locationParts: string[] = [];

  for (; i < words.length; i++) {
    const word = words[i];

    // Start collecting location if we see @
    if (word.startsWith("@") && !quotedLocation) {
      collectingLocation = true;
      const locationStart = word.slice(1);
      if (locationStart) {
        locationParts.push(locationStart);
      }
      continue;
    }

    // If collecting location, check if this word is a new tag or continue location
    if (collectingLocation) {
      if (word.startsWith("#") || word.startsWith("+")) {
        // End location collection
        result.location = locationParts.join(" ");
        collectingLocation = false;
        locationParts = [];
        // Process this word as a tag
      } else if (/^[A-Z]/.test(word) || locationParts.length === 0) {
        // Continue collecting if starts with capital or we haven't collected anything
        locationParts.push(word);
        continue;
      } else {
        // Lowercase word that's not a tag - end location and add to title
        result.location = locationParts.join(" ");
        collectingLocation = false;
        locationParts = [];
        titleParts.push(word);
        continue;
      }
    }

    if (word.startsWith("#")) {
      const person = word.slice(1);
      if (person) result.people.push(person.toLowerCase());
    } else if (word.startsWith("+")) {
      result.activity = word.slice(1).toLowerCase() || null;
    } else {
      titleParts.push(word);
    }
  }

  // Handle remaining location parts
  if (collectingLocation && locationParts.length > 0) {
    result.location = locationParts.join(" ");
  }

  // Use quoted location if found
  if (quotedLocation) {
    result.location = quotedLocation;
  }

  result.title = titleParts.join(" ");

  // Validation: need a title and either date, time, or recurrence
  result.isValid =
    result.title.length > 0 &&
    (result.date !== null ||
      result.time !== null ||
      result.recurrence !== null);

  // Format the line for insertion into markdown
  const parts: string[] = [];
  if (result.recurrence) {
    parts.push(result.recurrence);
  } else if (result.date) {
    if (result.isDateRange && result.dateEnd) {
      parts.push(`${result.date} - ${result.dateEnd}`);
    } else {
      parts.push(result.date);
    }
  }
  if (result.time) parts.push(result.time);
  parts.push(":");
  parts.push(result.title);
  result.people.forEach((p) => parts.push(`#${p}`));
  if (result.activity) parts.push(`+${result.activity}`);
  if (result.location) {
    // Quote location if it has spaces
    if (result.location.includes(" ")) {
      parts.push(`@"${result.location}"`);
    } else {
      parts.push(`@${result.location}`);
    }
  }

  result.formattedLine = parts.join(" ").replace(" :", ":");

  return result;
}

interface DateParseResult {
  date: string; // The markdown format (e.g., "jan 15")
  display: string; // Human display (e.g., "Saturday, January 15")
  month: string; // Month name for insertion (e.g., "January")
  year: number; // The year for the event
  nextIndex: number;
}

interface RecurrenceParseResult {
  recurrence: string; // The markdown format (e.g., "every monday", "every tue and thu")
  display: string; // Human display (e.g., "Every Monday", "Every Tuesday and Thursday")
  nextIndex: number;
}

// Try to parse recurrence like "every friday", "every mon", "every tue and thu"
function tryParseRecurrence(
  words: string[],
  startIndex: number,
): RecurrenceParseResult | null {
  if (startIndex >= words.length) return null;

  const word = words[startIndex].toLowerCase();

  // Must start with "every"
  if (word !== "every") return null;

  if (startIndex + 1 >= words.length) return null;

  const collectedDays: string[] = [];
  let i = startIndex + 1;

  while (i < words.length) {
    const current = words[i].toLowerCase().replace(/:$/, "");

    // Check if it's a weekday
    let weekdayIndex = WEEKDAY_NAMES.indexOf(current);
    if (weekdayIndex === -1) weekdayIndex = WEEKDAY_SHORT.indexOf(current);

    if (weekdayIndex !== -1) {
      collectedDays.push(WEEKDAY_SHORT[weekdayIndex]);
      i++;

      // Check for "and" connector
      if (i < words.length && words[i].toLowerCase() === "and") {
        i++;
        continue;
      }

      // Check if next word is also a weekday (without "and")
      if (i < words.length) {
        const nextWord = words[i].toLowerCase().replace(/:$/, "");
        let nextWeekday = WEEKDAY_NAMES.indexOf(nextWord);
        if (nextWeekday === -1) nextWeekday = WEEKDAY_SHORT.indexOf(nextWord);
        if (nextWeekday !== -1) {
          continue; // Keep collecting days
        }
      }

      break; // No more days
    } else {
      break; // Not a weekday, stop
    }
  }

  if (collectedDays.length === 0) return null;

  // Build the recurrence string
  const recurrence = `every ${collectedDays.join(" and ")}`;

  // Build human-friendly display
  const displayDays = collectedDays.map((d) => {
    const idx = WEEKDAY_SHORT.indexOf(d);
    return idx !== -1 ? capitalize(WEEKDAY_NAMES[idx]) : d;
  });
  const display = `Every ${displayDays.join(" and ")}`;

  return {
    recurrence,
    display,
    nextIndex: i,
  };
}

interface DateRangeParseResult {
  startDate: string; // The markdown format for start (e.g., "apr 4")
  startDisplay: string; // Human display for start
  endDate: string; // The markdown format for end (e.g., "apr 30")
  endDisplay: string; // Human display for end
  month: string; // Month name for insertion (start month)
  year: number; // The year for the start date
  nextIndex: number;
}

// Try to parse a date range like "4 apr - 30 apr", "apr 4-30", "apr 4 - apr 30"
function tryParseDateRange(
  words: string[],
  startIndex: number,
): DateRangeParseResult | null {
  if (startIndex >= words.length) return null;

  const today = getToday();

  // Pattern 1: "apr 4-30" (month day-day in single word)
  const word = words[startIndex].toLowerCase().replace(/:$/, "");
  const monthNum = MONTH_NAMES[word];
  if (monthNum !== undefined && startIndex + 1 < words.length) {
    const dayRangeWord = words[startIndex + 1].replace(/:$/, "");
    const dayRangeMatch = dayRangeWord.match(/^(\d{1,2})-(\d{1,2})$/);
    if (dayRangeMatch) {
      const startDay = parseInt(dayRangeMatch[1], 10);
      const endDay = parseInt(dayRangeMatch[2], 10);
      if (startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
        let year = today.getFullYear();
        const candidateDate = new Date(year, monthNum, startDay);
        if (candidateDate < today) {
          year++;
        }
        const startDate = new Date(year, monthNum, startDay);
        const endDate = new Date(year, monthNum, endDay);
        return makeDateRangeResult(startDate, endDate, startIndex + 2);
      }
    }
  }

  // Pattern 2: "4 apr - 30 apr" or "apr 4 - apr 30" (full dates with separator)
  // First, try to parse the start date
  const startResult = tryParseDate(words, startIndex);
  if (!startResult) return null;

  let i = startResult.nextIndex;

  // Look for "-" separator (could be standalone or attached)
  if (i >= words.length) return null;

  let foundSeparator = false;
  if (words[i] === "-" || words[i] === "–" || words[i] === "to") {
    foundSeparator = true;
    i++;
  } else if (words[i].startsWith("-") || words[i].startsWith("–")) {
    // Separator attached to next word like "-30"
    foundSeparator = true;
    // Check if it's just a day number after the dash
    const afterDash = words[i].slice(1);
    const dayNum = parseInt(afterDash, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      // Same month range: "jan 15 -17" -> jan 15-17
      const startDateParts = startResult.date.split(" ");
      const startMonth = MONTH_NAMES[startDateParts[0]];
      if (startMonth !== undefined) {
        let year = today.getFullYear();
        const startDay = parseInt(startDateParts[1], 10);
        const candidateDate = new Date(year, startMonth, startDay);
        if (candidateDate < today) {
          year++;
        }
        const startDate = new Date(year, startMonth, startDay);
        const endDate = new Date(year, startMonth, dayNum);
        return makeDateRangeResult(startDate, endDate, i + 1);
      }
    }
    i++;
  }

  if (!foundSeparator) return null;
  if (i >= words.length) return null;

  // Try to parse end date
  const endResult = tryParseDate(words, i);
  if (endResult) {
    // Parse actual dates from the results
    const startDateParts = startResult.date.split(" ");
    const endDateParts = endResult.date.split(" ");

    const startMonth = MONTH_NAMES[startDateParts[0]];
    const endMonth = MONTH_NAMES[endDateParts[0]];
    const startDay = parseInt(startDateParts[1], 10);
    const endDay = parseInt(endDateParts[1], 10);

    if (startMonth !== undefined && endMonth !== undefined) {
      let year = today.getFullYear();
      const candidateDate = new Date(year, startMonth, startDay);
      if (candidateDate < today) {
        year++;
      }
      const startDate = new Date(year, startMonth, startDay);
      // Handle year rollover for end date
      let endYear = year;
      if (endMonth < startMonth) {
        endYear++;
      }
      const endDate = new Date(endYear, endMonth, endDay);
      return makeDateRangeResult(startDate, endDate, endResult.nextIndex);
    }
  }

  // Try to parse just a day number for same-month range
  const endDayWord = words[i].replace(/(st|nd|rd|th)?:?$/i, "");
  const endDayNum = parseInt(endDayWord, 10);
  if (!isNaN(endDayNum) && endDayNum >= 1 && endDayNum <= 31) {
    const startDateParts = startResult.date.split(" ");
    const startMonth = MONTH_NAMES[startDateParts[0]];
    if (startMonth !== undefined) {
      let year = today.getFullYear();
      const startDay = parseInt(startDateParts[1], 10);
      const candidateDate = new Date(year, startMonth, startDay);
      if (candidateDate < today) {
        year++;
      }
      const startDate = new Date(year, startMonth, startDay);
      const endDate = new Date(year, startMonth, endDayNum);
      return makeDateRangeResult(startDate, endDate, i + 1);
    }
  }

  return null;
}

function makeDateRangeResult(
  startDate: Date,
  endDate: Date,
  nextIndex: number,
): DateRangeParseResult {
  const startWeekday = WEEKDAY_NAMES[startDate.getDay()];
  const startMonthShort = MONTH_SHORT[startDate.getMonth()];
  const startMonthFull = getMonthName(startDate.getMonth());
  const year = startDate.getFullYear();

  const endWeekday = WEEKDAY_NAMES[endDate.getDay()];
  const endMonthShort = MONTH_SHORT[endDate.getMonth()];
  const endMonthFull = getMonthName(endDate.getMonth());

  return {
    startDate: `${startMonthShort} ${startDate.getDate()}`,
    startDisplay: `${capitalize(startWeekday)}, ${startMonthFull} ${startDate.getDate()}`,
    endDate: `${endMonthShort} ${endDate.getDate()}`,
    endDisplay: `${capitalize(endWeekday)}, ${endMonthFull} ${endDate.getDate()}`,
    month: startMonthFull,
    year,
    nextIndex,
  };
}

function tryParseDate(
  words: string[],
  startIndex: number,
): DateParseResult | null {
  if (startIndex >= words.length) return null;

  const today = getToday();
  // Strip trailing colon from word (handles "saturday:" or "tomorrow:")
  const word = words[startIndex].toLowerCase().replace(/:$/, "");

  // "today"
  if (word === "today") {
    return makeDateResult(today, startIndex + 1);
  }

  // "tomorrow" or "tmrw" or "tmr"
  if (word === "tomorrow" || word === "tmrw" || word === "tmr") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return makeDateResult(tomorrow, startIndex + 1);
  }

  // "yesterday" (rare but useful for logging)
  if (word === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return makeDateResult(yesterday, startIndex + 1);
  }

  // Weekday names (e.g., "saturday", "sat")
  let weekdayIndex = WEEKDAY_NAMES.indexOf(word);
  if (weekdayIndex === -1) weekdayIndex = WEEKDAY_SHORT.indexOf(word);
  if (weekdayIndex !== -1) {
    const targetDate = getNextWeekday(weekdayIndex);
    return makeDateResult(targetDate, startIndex + 1);
  }

  // "next [weekday]" or "next [week/month]"
  if (word === "next" && startIndex + 1 < words.length) {
    const nextWord = words[startIndex + 1].toLowerCase();

    // "next week" - next Monday
    if (nextWord === "week") {
      const nextMonday = getNextWeekday(1, true); // Monday, always next week
      return makeDateResult(nextMonday, startIndex + 2);
    }

    // "next month" - 1st of next month
    if (nextWord === "month") {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return makeDateResult(nextMonth, startIndex + 2);
    }

    // "next [weekday]"
    let wdIndex = WEEKDAY_NAMES.indexOf(nextWord);
    if (wdIndex === -1) wdIndex = WEEKDAY_SHORT.indexOf(nextWord);
    if (wdIndex !== -1) {
      const targetDate = getNextWeekday(wdIndex, true);
      return makeDateResult(targetDate, startIndex + 2);
    }
  }

  // "this [weekday]"
  if (word === "this" && startIndex + 1 < words.length) {
    const nextWord = words[startIndex + 1].toLowerCase();

    // "this week" - today
    if (nextWord === "week") {
      return makeDateResult(today, startIndex + 2);
    }

    // "this [weekday]" - same as just weekday (coming occurrence)
    let wdIndex = WEEKDAY_NAMES.indexOf(nextWord);
    if (wdIndex === -1) wdIndex = WEEKDAY_SHORT.indexOf(nextWord);
    if (wdIndex !== -1) {
      const targetDate = getNextWeekday(wdIndex, false);
      // If today is that weekday, use today
      if (today.getDay() === wdIndex) {
        return makeDateResult(today, startIndex + 2);
      }
      return makeDateResult(targetDate, startIndex + 2);
    }
  }

  // "in X days/weeks/months"
  if (word === "in" && startIndex + 2 < words.length) {
    const numWord = words[startIndex + 1];
    const unitWord = words[startIndex + 2].toLowerCase();
    const num = parseInt(numWord, 10);

    if (!isNaN(num) && num > 0) {
      const result = new Date(today);

      if (unitWord === "day" || unitWord === "days") {
        result.setDate(result.getDate() + num);
        return makeDateResult(result, startIndex + 3);
      }
      if (unitWord === "week" || unitWord === "weeks") {
        result.setDate(result.getDate() + num * 7);
        return makeDateResult(result, startIndex + 3);
      }
      if (unitWord === "month" || unitWord === "months") {
        result.setMonth(result.getMonth() + num);
        return makeDateResult(result, startIndex + 3);
      }
    }
  }

  // Month + day: "jan 15" or "january 15th" or "feb 8:"
  const monthNum = MONTH_NAMES[word];
  if (monthNum !== undefined && startIndex + 1 < words.length) {
    // Strip trailing colon from day word (e.g., "8:" -> "8")
    const dayWord = words[startIndex + 1].replace(/(st|nd|rd|th)?:?$/i, "");
    const dayNum = parseInt(dayWord, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      // Determine year - if month is in the past, use next year
      let year = today.getFullYear();
      const candidateDate = new Date(year, monthNum, dayNum);
      if (candidateDate < today) {
        year++;
      }
      const targetDate = new Date(year, monthNum, dayNum);
      return makeDateResult(targetDate, startIndex + 2);
    }
  }

  // Day + month: "15 jan" or "15th january" or "8 feb:"
  const dayFirst = parseInt(word.replace(/(st|nd|rd|th)$/i, ""), 10);
  if (
    !isNaN(dayFirst) &&
    dayFirst >= 1 &&
    dayFirst <= 31 &&
    startIndex + 1 < words.length
  ) {
    // Strip trailing colon from month word (e.g., "feb:" -> "feb")
    const monthWord = words[startIndex + 1].toLowerCase().replace(/:$/, "");
    const monthIdx = MONTH_NAMES[monthWord];
    if (monthIdx !== undefined) {
      let year = today.getFullYear();
      const candidateDate = new Date(year, monthIdx, dayFirst);
      if (candidateDate < today) {
        year++;
      }
      const targetDate = new Date(year, monthIdx, dayFirst);
      return makeDateResult(targetDate, startIndex + 2);
    }
  }

  // Day only: "15" or "15th" - assumes current or next month
  const dayOnly = parseInt(word.replace(/(st|nd|rd|th)$/i, ""), 10);
  if (!isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31) {
    let month = today.getMonth();
    let year = today.getFullYear();

    // If the day has passed this month, use next month
    if (dayOnly < today.getDate()) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    const targetDate = new Date(year, month, dayOnly);
    return makeDateResult(targetDate, startIndex + 1);
  }

  // ISO format: "2026-01-15"
  const isoMatch = word.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const targetDate = new Date(year, month, day);
    return makeDateResult(targetDate, startIndex + 1);
  }

  // Date with slashes: "15/1" or "1/15" (detect based on which is valid)
  const slashMatch = word.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);

    let day: number, month: number;

    // Try DD/MM first (Australian format)
    if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
      day = first;
      month = second - 1;
    }
    // Try MM/DD (US format)
    else if (second >= 1 && second <= 31 && first >= 1 && first <= 12) {
      day = second;
      month = first - 1;
    } else {
      return null;
    }

    let year = today.getFullYear();
    const candidateDate = new Date(year, month, day);
    if (candidateDate < today) {
      year++;
    }
    const targetDate = new Date(year, month, day);
    return makeDateResult(targetDate, startIndex + 1);
  }

  return null;
}

function makeDateResult(date: Date, nextIndex: number): DateParseResult {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const monthName = MONTH_SHORT[date.getMonth()];
  const monthFull = getMonthName(date.getMonth());
  const year = date.getFullYear();

  return {
    date: `${monthName} ${date.getDate()}`,
    display: `${capitalize(weekday)}, ${monthFull} ${date.getDate()}`,
    month: monthFull,
    year,
    nextIndex,
  };
}

interface TimeParseResult {
  time: string;
  nextIndex: number;
}

function tryParseTime(
  words: string[],
  startIndex: number,
): TimeParseResult | null {
  if (startIndex >= words.length) return null;

  const word = words[startIndex].toLowerCase();

  // Fuzzy times
  if (["morning", "afternoon", "evening", "night"].includes(word)) {
    return { time: word, nextIndex: startIndex + 1 };
  }

  // "noon" / "midday"
  if (word === "noon" || word === "midday") {
    return { time: "12pm", nextIndex: startIndex + 1 };
  }

  // "midnight"
  if (word === "midnight") {
    return { time: "12am", nextIndex: startIndex + 1 };
  }

  // 12-hour format: 9am, 9:30am, 9.30am
  const match12h = word.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm)$/i);
  if (match12h) {
    const hour = parseInt(match12h[1], 10);
    const min = match12h[2] || "00";
    const meridiem = match12h[3].toLowerCase();
    if (hour >= 1 && hour <= 12) {
      return {
        time: min === "00" ? `${hour}${meridiem}` : `${hour}:${min}${meridiem}`,
        nextIndex: startIndex + 1,
      };
    }
  }

  // 24-hour format: 14:00, 14.00
  const match24h = word.match(/^(\d{1,2})[:.](\d{2})$/);
  if (match24h) {
    const hour = parseInt(match24h[1], 10);
    const min = match24h[2];
    if (hour >= 0 && hour <= 23) {
      return { time: `${hour}:${min}`, nextIndex: startIndex + 1 };
    }
  }

  // Time range: 9am-5pm, 9:00-17:00
  const matchRange = word.match(
    /^(\d{1,2}(?:[:.]?\d{2})?(?:am|pm)?)-(\d{1,2}(?:[:.]?\d{2})?(?:am|pm)?)$/i,
  );
  if (matchRange) {
    return { time: word.replace(".", ":"), nextIndex: startIndex + 1 };
  }

  // "at X" - sometimes people write "at 3pm"
  if (word === "at" && startIndex + 1 < words.length) {
    const timeResult = tryParseTime(words, startIndex + 1);
    if (timeResult) {
      return { time: timeResult.time, nextIndex: timeResult.nextIndex };
    }
  }

  return null;
}

function getNextWeekday(targetDay: number, alwaysNextWeek = false): Date {
  const today = getToday();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;

  if (daysUntil <= 0 || alwaysNextWeek) {
    daysUntil += 7;
  }

  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Syntax highlighting helpers
export interface HighlightSegment {
  text: string;
  type:
    | "date"
    | "time"
    | "title"
    | "person"
    | "location"
    | "activity"
    | "modifier"
    | "text";
}

export function highlightLine(line: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  const colonIndex = line.indexOf(":");

  if (colonIndex === -1) {
    segments.push({ text: line, type: "text" });
    return segments;
  }

  // Everything before colon is date/time
  const beforeColon = line.slice(0, colonIndex);
  const afterColon = line.slice(colonIndex + 1).trim();

  // Parse date/time portion
  const dateTimeParts = beforeColon.trim().split(/\s+/);
  for (const part of dateTimeParts) {
    const lower = part.toLowerCase();
    const isTime =
      /^\d{1,2}(:\d{2})?(am|pm)?$/i.test(part) ||
      /^\d{1,2}(:\d{2})?(am|pm)?-\d{1,2}(:\d{2})?(am|pm)?$/i.test(part) ||
      ["morning", "afternoon", "evening", "night"].includes(lower);

    if (isTime) {
      segments.push({ text: part + " ", type: "time" });
    } else {
      segments.push({ text: part + " ", type: "date" });
    }
  }

  segments.push({ text: ": ", type: "text" });

  // Parse content after colon - handle quoted locations
  let remaining = afterColon;
  const quotedMatch = remaining.match(/@"([^"]+)"/);
  if (quotedMatch) {
    // Replace quoted location temporarily
    remaining = remaining.replace(/@"[^"]+"/, "@__QUOTED_LOCATION__");
  }

  const words = remaining.split(/\s+/);
  for (const word of words) {
    if (word === "@__QUOTED_LOCATION__" && quotedMatch) {
      segments.push({ text: `@"${quotedMatch[1]}" `, type: "location" });
    } else if (word.startsWith("#")) {
      segments.push({ text: word + " ", type: "person" });
    } else if (word.startsWith("@")) {
      segments.push({ text: word + " ", type: "location" });
    } else if (word.startsWith("+")) {
      segments.push({ text: word + " ", type: "activity" });
    } else if (word.startsWith("[") && word.endsWith("]")) {
      segments.push({ text: word + " ", type: "modifier" });
    } else {
      segments.push({ text: word + " ", type: "title" });
    }
  }

  return segments;
}

export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month] || "";
}

export function getMonthFromName(name: string): number {
  const lower = name.toLowerCase();
  return MONTH_NAMES[lower] ?? 0;
}

// Recurrence expansion utilities
import type { Event, Recurrence } from "./types";

// Day name to JS day index (0 = Sunday)
const DAY_NAME_TO_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/**
 * Expand recurring events into instances for a specific month
 */
export function expandRecurringEvents(
  recurringEvents: Event[],
  year: number,
  month: number, // 0-indexed
): Event[] {
  const expanded: Event[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  for (const event of recurringEvents) {
    if (!event.recurrence) continue;

    const instances = getRecurrenceInstancesInRange(
      event,
      event.recurrence,
      monthStart,
      monthEnd,
    );

    for (const instanceDate of instances) {
      // Create a virtual event instance with the specific date
      const instance: Event = {
        ...event,
        id: `${event.id}-${instanceDate.toISOString().split("T")[0]}`,
        date: {
          type: "Single",
          value: instanceDate.toISOString().split("T")[0],
        },
      };
      expanded.push(instance);
    }
  }

  return expanded;
}

/**
 * Get all dates a recurring event occurs within a date range
 */
function getRecurrenceInstancesInRange(
  _event: Event,
  recurrence: Recurrence,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const instances: Date[] = [];
  const { frequency, interval, by_day, by_month_day, by_set_pos } = recurrence;

  // Weekly recurrence with specific days
  if (frequency === "Weekly" && by_day && by_day.length > 0) {
    const current = new Date(rangeStart);
    // Start from the beginning of the week containing rangeStart
    const dayOfWeek = current.getDay();
    current.setDate(current.getDate() - dayOfWeek);

    while (current <= rangeEnd) {
      for (const dayName of by_day) {
        const dayIndex = DAY_NAME_TO_INDEX[dayName.toLowerCase()];
        if (dayIndex !== undefined) {
          const instanceDate = new Date(current);
          instanceDate.setDate(current.getDate() + dayIndex);

          if (instanceDate >= rangeStart && instanceDate <= rangeEnd) {
            // Check interval (every N weeks)
            if (
              interval === 1 ||
              shouldIncludeWeek(
                instanceDate,
                interval,
                rangeStart.getFullYear(),
              )
            ) {
              instances.push(new Date(instanceDate));
            }
          }
        }
      }
      // Move to next week
      current.setDate(current.getDate() + 7);
    }
  }

  // Daily recurrence
  else if (frequency === "Daily") {
    const current = new Date(rangeStart);
    let count = 0;
    while (current <= rangeEnd) {
      if (count % interval === 0) {
        instances.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
      count++;
    }
  }

  // Monthly recurrence
  else if (frequency === "Monthly") {
    // by_month_day: specific day of month (e.g., 15th)
    if (by_month_day !== null) {
      const instanceDate = new Date(
        rangeStart.getFullYear(),
        rangeStart.getMonth(),
        by_month_day,
      );
      if (instanceDate >= rangeStart && instanceDate <= rangeEnd) {
        instances.push(instanceDate);
      }
    }
    // by_set_pos with by_day: e.g., "2nd thursday" (by_set_pos=2, by_day=["thu"])
    else if (by_set_pos !== null && by_day && by_day.length > 0) {
      const dayIndex = DAY_NAME_TO_INDEX[by_day[0].toLowerCase()];
      if (dayIndex !== undefined) {
        const nthDay = getNthWeekdayOfMonth(
          rangeStart.getFullYear(),
          rangeStart.getMonth(),
          dayIndex,
          by_set_pos,
        );
        if (nthDay && nthDay >= rangeStart && nthDay <= rangeEnd) {
          instances.push(nthDay);
        }
      }
    }
  }

  // Yearly recurrence
  else if (frequency === "Yearly") {
    // Would need original event date to determine which day of year
    // For now, skip yearly - less common for family calendars
  }

  return instances;
}

/**
 * Check if a date falls in a week that should be included based on interval
 */
function shouldIncludeWeek(
  date: Date,
  interval: number,
  year: number,
): boolean {
  // Calculate week number from start of year
  const startOfYear = new Date(year, 0, 1);
  const diffMs = date.getTime() - startOfYear.getTime();
  const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return weekNumber % interval === 0;
}

/**
 * Get the Nth occurrence of a weekday in a month
 * e.g., 2nd Thursday of January 2026
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number, // 0 = Sunday
  n: number, // 1 = 1st, 2 = 2nd, etc.
): Date | null {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();

  // Calculate days until first occurrence of target weekday
  let daysUntilFirst = weekday - firstWeekday;
  if (daysUntilFirst < 0) daysUntilFirst += 7;

  // Calculate the date of the Nth occurrence
  const dayOfMonth = 1 + daysUntilFirst + (n - 1) * 7;

  // Check if it's still in the same month
  const result = new Date(year, month, dayOfMonth);
  if (result.getMonth() !== month) {
    return null; // Nth occurrence doesn't exist in this month
  }

  return result;
}
