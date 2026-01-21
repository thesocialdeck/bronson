import { StreamLanguage, StringStream } from "@codemirror/language";
import { Extension } from "@codemirror/state";

interface PeopleState {
  inNote: boolean;
}

export const peopleLanguage = StreamLanguage.define<PeopleState>({
  name: "bronson-people",
  startState: () => ({ inNote: false }),
  token(stream: StringStream, state: PeopleState): string | null {
    if (stream.sol()) {
      state.inNote = false;

      // File heading: # People
      if (stream.match(/^# .*/)) {
        return "heading1";
      }
      // Context heading: ## Family, ## Work
      if (stream.match(/^## .*/)) {
        return "heading2";
      }
      // Person heading: ### Marcus
      if (stream.match(/^### .*/)) {
        return "heading3";
      }
      // Indented note (4 spaces)
      if (stream.match(/^    /)) {
        state.inNote = true;
        stream.skipToEnd();
        return "emphasis";
      }
      // Field name at start of line: phone, email, birthday, etc.
      if (stream.match(/^\w+(?:\s+\w+)?(?=\s*:)/)) {
        return "labelName";
      }
    }

    // Inside a note line
    if (state.inNote) {
      stream.skipToEnd();
      return "emphasis";
    }

    // Colon after field name
    if (stream.match(/:\s*/)) {
      return "punctuation";
    }

    // Skip rest
    stream.next();
    return null;
  },
});

export function peopleExtension(): Extension {
  return peopleLanguage;
}
