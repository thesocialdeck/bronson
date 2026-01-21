import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from "@codemirror/autocomplete";
import { Extension } from "@codemirror/state";
import {
  getPersonColor,
  getActivityColor,
  getActivityIcon,
} from "@/lib/colors";

export interface AutocompleteData {
  personIds: string[];
  activityIds: string[];
  locationIds: string[];
}

function createCompletions(
  context: CompletionContext,
  data: AutocompleteData,
): CompletionResult | null {
  // Match #, +, or @ followed by optional word characters
  const word = context.matchBefore(/[#@+]\w*/);
  if (!word) return null;

  const trigger = word.text[0];
  const query = word.text.slice(1).toLowerCase();

  let options: Completion[] = [];

  if (trigger === "#") {
    // Add "family" to suggestions if not in personIds
    const allPeople = data.personIds.includes("family")
      ? data.personIds
      : [...data.personIds, "family"];

    options = allPeople
      .filter((id) => id.toLowerCase().includes(query))
      .map((id) => ({
        label: `#${id}`,
        displayLabel: `#${id}`,
        type: "variable",
        boost: id.toLowerCase().startsWith(query) ? 1 : 0,
        detail: "person",
        apply: `#${id} `,
      }));
  } else if (trigger === "+") {
    options = data.activityIds
      .filter((id) => id.toLowerCase().includes(query))
      .map((id) => ({
        label: `+${id}`,
        displayLabel: `${getActivityIcon(id)} +${id}`,
        type: "type",
        boost: id.toLowerCase().startsWith(query) ? 1 : 0,
        detail: "activity",
        apply: `+${id} `,
      }));
  } else if (trigger === "@") {
    options = data.locationIds
      .filter((loc) => loc.toLowerCase().includes(query))
      .map((loc) => ({
        label: loc.includes(" ") ? `@"${loc}"` : `@${loc}`,
        displayLabel: `📍 ${loc}`,
        type: "text",
        boost: loc.toLowerCase().startsWith(query) ? 1 : 0,
        detail: "location",
        apply: loc.includes(" ") ? `@"${loc}" ` : `@${loc} `,
      }));
  }

  if (options.length === 0) return null;

  return {
    from: word.from,
    options,
    validFor: /^[#@+]?\w*$/,
  };
}

export function bronsonAutocomplete(data: AutocompleteData): Extension {
  return autocompletion({
    override: [(context) => createCompletions(context, data)],
    icons: false,
    addToOptions: [
      {
        render: (completion) => {
          const span = document.createElement("span");
          span.className = "cm-completion-color-dot";

          // Add color indicator for people and activities
          if (completion.type === "variable" && completion.label.startsWith("#")) {
            const id = completion.label.slice(1);
            span.style.backgroundColor = getPersonColor(id);
            span.style.width = "8px";
            span.style.height = "8px";
            span.style.borderRadius = "50%";
            span.style.display = "inline-block";
            span.style.marginRight = "8px";
          } else if (completion.type === "type" && completion.label.startsWith("+")) {
            const id = completion.label.slice(1);
            span.style.backgroundColor = getActivityColor(id);
            span.style.width = "8px";
            span.style.height = "8px";
            span.style.borderRadius = "50%";
            span.style.display = "inline-block";
            span.style.marginRight = "8px";
          }

          return span;
        },
        position: 20,
      },
    ],
  });
}
