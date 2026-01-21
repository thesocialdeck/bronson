import { StreamLanguage, StringStream } from "@codemirror/language";
import { Extension } from "@codemirror/state";

export const activitiesLanguage = StreamLanguage.define({
  name: "bronson-activities",
  startState: () => ({}),
  token(stream: StringStream): string | null {
    if (stream.sol()) {
      // File heading: # Activities
      if (stream.match(/^# .*/)) {
        return "heading1";
      }
      // Section heading: ## Sports
      if (stream.match(/^## .*/)) {
        return "heading2";
      }
      // Activity heading: ### +soccer
      if (stream.match(/^### \+.*/)) {
        return "heading3";
      }
      // Checked checklist item: - [x] Pack bag
      if (stream.match(/^- \[x\]/)) {
        return "bool";
      }
      // Unchecked checklist item: - [ ] Bring water
      if (stream.match(/^- \[ \]/)) {
        return "punctuation";
      }
      // Sub-item (indented): - Item
      if (stream.match(/^  - /)) {
        return "punctuation";
      }
      // Field name: icon, color, keywords, checklist
      if (stream.match(/^\w+(?=\s*:)/)) {
        return "labelName";
      }
    }

    // Colon separator
    if (stream.match(/:\s*/)) {
      return "punctuation";
    }

    // Skip rest
    stream.next();
    return null;
  },
});

export function activitiesExtension(): Extension {
  return activitiesLanguage;
}
