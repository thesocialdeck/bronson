import { StreamLanguage, StringStream } from "@codemirror/language";
import { Extension } from "@codemirror/state";

interface CalendarState {
  inNote: boolean;
}

export const calendarLanguage = StreamLanguage.define<CalendarState>({
  name: "bronson-calendar",
  startState: () => ({ inNote: false }),
  token(stream: StringStream, state: CalendarState): string | null {
    // Start of line checks
    if (stream.sol()) {
      state.inNote = false;

      // Year heading: # 2026
      if (stream.match(/^# .*/)) {
        return "heading1";
      }
      // Month heading: ## January
      if (stream.match(/^## .*/)) {
        return "heading2";
      }
      // HTML comment
      if (stream.match(/^<!--.*-->/)) {
        return "comment";
      }
      // Indented note (4 spaces)
      if (stream.match(/^    /)) {
        state.inNote = true;
        stream.skipToEnd();
        return "emphasis";
      }
      // Recurrence at start: every monday, every 2nd thu
      if (stream.match(/^every\s+[\w\s]+?(?=:)/i)) {
        return "keyword";
      }
    }

    // Inside a note line - rest is all note text
    if (state.inNote) {
      stream.skipToEnd();
      return "emphasis";
    }

    // Person tag: #marcus, #ella
    if (stream.match(/#\w+/)) {
      return "variableName";
    }

    // Activity tag: +sport, +school
    if (stream.match(/\+\w+/)) {
      return "typeName";
    }

    // Quoted location: @"Flip Out Prestons"
    if (stream.match(/@"[^"]*"/)) {
      return "link";
    }

    // Simple location: @home, @school
    if (stream.match(/@\w+/)) {
      return "link";
    }

    // Modifier: [tentative], [cancelled], [confirmed]
    if (stream.match(/\[[^\]]+\]/)) {
      return "atom";
    }

    // Time patterns: 9am, 2:30pm, 9am-5pm, 14:00
    if (
      stream.match(/\d{1,2}(:\d{2})?(am|pm)(-\d{1,2}(:\d{2})?(am|pm)?)?/i) ||
      stream.match(/\d{1,2}:\d{2}(-\d{1,2}:\d{2})?/)
    ) {
      return "string";
    }

    // Fuzzy time: morning, afternoon, evening
    if (stream.match(/\b(morning|afternoon|evening|night|noon|midday)\b/i)) {
      return "string";
    }

    // Skip to next interesting character or end
    if (stream.match(/[^#@+\[\d\s]+/)) {
      return null;
    }

    // Skip whitespace
    if (stream.match(/\s+/)) {
      return null;
    }

    // Move forward one character if nothing matched
    stream.next();
    return null;
  },
});

export function calendarExtension(): Extension {
  return calendarLanguage;
}
