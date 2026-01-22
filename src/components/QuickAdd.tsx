import { useState, useRef, useEffect, useMemo } from "react";
import { parseQuickAdd, type QuickAddResult } from "@/lib/parser";
import { useToast } from "@/components/Toast";
import {
  getPersonColor,
  getActivityColor,
  getActivityIcon,
} from "@/lib/colors";
import type { Activity, Person } from "@/lib/types";

interface QuickAddProps {
  onAdd: (line: string, month: string, year?: number) => Promise<number | null>;
  personIds: string[];
  activityIds: string[];
  getActivity?: (id: string) => Activity | null;
  getPerson?: (id: string) => Person | null;
}

interface AutocompleteItem {
  id: string;
  display: string;
  color?: string;
  icon?: string;
}

// Example inputs to show users the possibilities
const EXAMPLE_INPUTS = [
  "tomorrow 2pm Soccer practice #marcus +sport",
  "next saturday BBQ with neighbours #family +social @home",
  "fri 9am Dentist #ella +appointment @Dr Smith",
  "in 3 days Pick up dry cleaning +errand",
  "jan 15 School carnival #family +school",
  "apr 4 - 30 Holiday to Vietnam #family",
];

interface HighlightedToken {
  text: string;
  type:
    | "date"
    | "time"
    | "title"
    | "person"
    | "location"
    | "activity"
    | "colon"
    | "text";
  color?: string;
}

// Use the parsed result to build highlighted tokens
function tokenizeWithParsedResult(
  input: string,
  parsed: QuickAddResult,
  getPerson?: (id: string) => Person | null,
): HighlightedToken[] {
  if (!input) return [];

  const tokens: HighlightedToken[] = [];
  let remaining = input;
  let pos = 0;

  // Helper to add token and advance
  const addToken = (
    text: string,
    type: HighlightedToken["type"],
    color?: string,
  ) => {
    if (text) {
      tokens.push({ text, type, color });
    }
  };

  // Find and highlight date portion
  if (parsed.date) {
    // The date in parsed result is normalized (e.g., "feb 8"), but input might be "8 feb"
    // So we need to find where the date ends in the original input
    // Look for the colon or time to determine where date ends

    const colonIdx = input.indexOf(":");
    let dateEndIdx = colonIdx > 0 ? colonIdx : input.length;

    // If there's a time, find where it starts
    if (parsed.time) {
      const timePatterns = [
        /\d{1,2}(:\d{2})?(am|pm)/i,
        /\d{1,2}:\d{2}/,
        /\b(morning|afternoon|evening|night|noon|midday|midnight)\b/i,
      ];
      for (const pattern of timePatterns) {
        const match = input.match(pattern);
        if (match && match.index !== undefined && match.index < dateEndIdx) {
          dateEndIdx = match.index;
          break;
        }
      }
    }

    // Extract the date portion
    const datePortion = input.slice(0, dateEndIdx).trim();
    if (datePortion) {
      // Preserve leading whitespace
      const leadingWs = input.match(/^(\s*)/)?.[1] || "";
      if (leadingWs) {
        addToken(leadingWs, "text");
        pos = leadingWs.length;
      }
      addToken(datePortion, "date", "var(--syntax-date)");
      pos = dateEndIdx;
    }
  }

  // Find and highlight time portion
  if (parsed.time) {
    const timePatterns = [
      /(\d{1,2}(:\d{2})?(am|pm)(-\d{1,2}(:\d{2})?(am|pm)?)?)/i,
      /(\d{1,2}:\d{2}(-\d{1,2}:\d{2})?)/,
      /\b(morning|afternoon|evening|night|noon|midday|midnight)\b/i,
    ];

    for (const pattern of timePatterns) {
      const match = input.slice(pos).match(pattern);
      if (match && match.index !== undefined) {
        // Add any text between date and time
        if (match.index > 0) {
          addToken(input.slice(pos, pos + match.index), "text");
        }
        addToken(match[0], "time", "var(--syntax-time)");
        pos = pos + match.index + match[0].length;
        break;
      }
    }
  }

  // Find and highlight colon
  const colonIdx = input.indexOf(":", pos);
  if (colonIdx >= pos) {
    // Add any text before colon
    if (colonIdx > pos) {
      const beforeColon = input.slice(pos, colonIdx);
      // This might be remaining date/time not yet highlighted
      if (beforeColon.trim()) {
        addToken(beforeColon, "text");
      } else {
        addToken(beforeColon, "text");
      }
    }
    addToken(":", "colon", "var(--foreground-muted)");
    pos = colonIdx + 1;
  }

  // Process remaining content after colon
  remaining = input.slice(pos);

  // Handle quoted locations first
  const quotedLocMatch = remaining.match(/@"([^"]+)"/);
  let quotedLocation: { text: string; start: number; end: number } | null =
    null;
  if (quotedLocMatch && quotedLocMatch.index !== undefined) {
    quotedLocation = {
      text: quotedLocMatch[0],
      start: quotedLocMatch.index,
      end: quotedLocMatch.index + quotedLocMatch[0].length,
    };
  }

  // Split remaining by whitespace, preserving whitespace
  const parts = remaining.split(/(\s+)/);
  let inLocation = false;
  let currentPos = 0;

  for (const part of parts) {
    // Check if we're inside a quoted location
    if (
      quotedLocation &&
      currentPos >= quotedLocation.start &&
      currentPos < quotedLocation.end
    ) {
      if (currentPos === quotedLocation.start) {
        addToken(quotedLocation.text, "location", "var(--syntax-location)");
        currentPos = quotedLocation.end;
        continue;
      } else {
        currentPos += part.length;
        continue;
      }
    }

    // Preserve whitespace
    if (/^\s+$/.test(part)) {
      addToken(part, "text");
      currentPos += part.length;
      continue;
    }

    if (!part) {
      currentPos += part.length;
      continue;
    }

    // Check for tags
    if (part.startsWith("#")) {
      inLocation = false;
      const personId = part.slice(1).toLowerCase();
      addToken(part, "person", getPersonColor(personId, getPerson));
    } else if (part.startsWith("+")) {
      inLocation = false;
      const activityId = part.slice(1).toLowerCase();
      addToken(part, "activity", getActivityColor(activityId));
    } else if (part.startsWith("@") && !part.startsWith('@"')) {
      inLocation = true;
      addToken(part, "location", "var(--syntax-location)");
    } else if (inLocation && !part.startsWith("#") && !part.startsWith("+")) {
      // Continue collecting multi-word location
      addToken(part, "location", "var(--syntax-location)");
    } else {
      inLocation = false;
      addToken(part, "title", "var(--foreground)");
    }

    currentPos += part.length;
  }

  return tokens;
}

export function QuickAdd({
  onAdd,
  personIds,
  activityIds,
  getActivity,
  getPerson,
}: QuickAddProps) {
  const [value, setValue] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<
    "#" | "+" | "@" | null
  >(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [placeholder, setPlaceholder] = useState(EXAMPLE_INPUTS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((prev) => {
        const currentIndex = EXAMPLE_INPUTS.indexOf(prev);
        return EXAMPLE_INPUTS[(currentIndex + 1) % EXAMPLE_INPUTS.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const parsed = parseQuickAdd(value);

  // Tokenize input for syntax highlighting using parsed result
  const highlightedTokens = useMemo(
    () => tokenizeWithParsedResult(value, parsed, getPerson),
    [value, parsed, getPerson],
  );

  // Sync scroll between input and overlay
  const handleScroll = () => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  // Known locations from recent events (could be expanded)
  const knownLocations = [
    "home",
    "work",
    "school",
    "Timbrell Park",
    "Dance Studio",
    "Dr Smith",
    "Homebush",
    "King George",
    "St Lukes",
  ];

  // Get autocomplete suggestions
  const getSuggestions = (): AutocompleteItem[] => {
    const q = autocompleteQuery.toLowerCase();

    if (autocompleteType === "#") {
      // Add "family" to suggestions if not in personIds
      const allPeople = personIds.includes("family")
        ? personIds
        : [...personIds, "family"];
      return allPeople
        .filter((id) => id.toLowerCase().includes(q))
        .map((id) => ({
          id,
          display: id.charAt(0).toUpperCase() + id.slice(1),
          color: getPersonColor(id, getPerson),
        }));
    }

    if (autocompleteType === "+") {
      return activityIds
        .filter((id) => id.toLowerCase().includes(q))
        .map((id) => ({
          id,
          display: id.charAt(0).toUpperCase() + id.slice(1),
          color: getActivityColor(id),
          icon: getActivityIcon(id),
        }));
    }

    if (autocompleteType === "@") {
      return knownLocations
        .filter((loc) => loc.toLowerCase().includes(q))
        .map((loc) => ({
          id: loc.includes(" ") ? `"${loc}"` : loc,
          display: loc,
        }));
    }

    return [];
  };

  const suggestions = getSuggestions();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Check for autocomplete triggers
    const cursorPos = e.target.selectionStart ?? newValue.length;
    const textBeforeCursor = newValue.slice(0, cursorPos);

    // Match trigger followed by optional query (including inside quotes for locations)
    const triggerMatch = textBeforeCursor.match(/([#@+])(")?(\w*)$/);

    if (triggerMatch) {
      setShowAutocomplete(true);
      setAutocompleteType(triggerMatch[1] as "#" | "+" | "@");
      setAutocompleteQuery(triggerMatch[3] || "");
      setAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
      setAutocompleteType(null);
    }
  };

  const selectAutocomplete = (item: AutocompleteItem) => {
    if (!autocompleteType) return;

    // Find the trigger position
    const triggerPos = value.lastIndexOf(autocompleteType);
    if (triggerPos === -1) return;

    const beforeTrigger = value.slice(0, triggerPos);
    // Find where the current token ends
    let endPos = triggerPos + 1 + autocompleteQuery.length;
    // If we're in a quoted location, skip past any quote
    if (value[triggerPos + 1] === '"') {
      endPos++;
    }
    const afterQuery = value.slice(endPos);

    const newValue =
      beforeTrigger + autocompleteType + item.id + " " + afterQuery.trimStart();

    setValue(newValue);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocompleteIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocompleteIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectAutocomplete(suggestions[autocompleteIndex]);
      } else if (e.key === "Escape") {
        setShowAutocomplete(false);
      }
    } else if (e.key === "Enter" && parsed.isValid) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!parsed.isValid || isAdding) return;

    setIsAdding(true);

    // Use the month and year from the parser
    const month =
      parsed.month || new Date().toLocaleString("default", { month: "long" });
    const year = parsed.year ?? undefined;

    const result = await onAdd(parsed.formattedLine, month, year);
    if (result !== null) {
      const dateLabel =
        parsed.dateDisplay || parsed.date || parsed.recurrenceDisplay || month;
      const yearLabel =
        year && year !== new Date().getFullYear() ? ` ${year}` : "";
      addToast(
        `Added "${parsed.title}" to ${dateLabel}${yearLabel}`,
        "success",
      );
      setValue("");
    }
    setIsAdding(false);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowAutocomplete(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-start">
        <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
          {/* Input container with overlay */}
          <div className="relative">
            {/* Sparkle icon */}
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none z-10"
              style={{ opacity: 0.6 }}
            >
              ✨
            </span>

            {/* Syntax highlighting overlay */}
            <div
              ref={overlayRef}
              className="absolute inset-0 pl-9 pr-3 py-2.5 pointer-events-none overflow-hidden whitespace-nowrap"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
              }}
              aria-hidden="true"
            >
              {highlightedTokens.map((token, idx) => (
                <span
                  key={idx}
                  style={{ color: token.color || "var(--foreground)" }}
                >
                  {token.text}
                </span>
              ))}
            </div>

            {/* Actual input (transparent text, visible caret) */}
            <input
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              placeholder={placeholder}
              className="quick-add-input w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
              style={{
                fontFamily: "var(--font-mono)",
                color: value ? "transparent" : "var(--foreground-muted)",
                caretColor: "var(--foreground)",
                borderColor: parsed.isValid
                  ? "var(--primary)"
                  : "var(--border)",
                transition: "border-color 0.2s ease",
                background: "var(--background)",
              }}
            />
          </div>

          {/* Autocomplete dropdown */}
          {showAutocomplete && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
              style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => selectAutocomplete(item)}
                  className="px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors"
                  style={{
                    backgroundColor:
                      idx === autocompleteIndex
                        ? "var(--secondary)"
                        : "transparent",
                  }}
                >
                  {autocompleteType === "#" && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {autocompleteType === "+" && (
                    <span className="text-sm">{item.icon}</span>
                  )}
                  {autocompleteType === "@" && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--syntax-location)" }}
                    >
                      📍
                    </span>
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        autocompleteType === "@"
                          ? "var(--foreground)"
                          : item.color,
                    }}
                  >
                    {autocompleteType}
                    {item.display}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!parsed.isValid || isAdding}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0"
          style={{
            backgroundColor: parsed.isValid
              ? "var(--primary)"
              : "var(--secondary)",
            color: parsed.isValid
              ? "var(--primary-foreground)"
              : "var(--foreground-muted)",
            cursor: parsed.isValid ? "pointer" : "not-allowed",
            opacity: isAdding ? 0.7 : 1,
          }}
        >
          {isAdding ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : (
            "Add"
          )}
        </button>
      </div>

      {/* Parse preview - show what we understood (show partial feedback even before valid) */}
      {(parsed.isValid || parsed.date || parsed.time || parsed.recurrence) && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs flex-wrap animate-fade-in"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          {/* Recurrence display */}
          {parsed.recurrence && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor:
                  "color-mix(in oklch, var(--syntax-recurrence) 15%, transparent)",
                color: "var(--syntax-recurrence)",
              }}
            >
              🔄 {parsed.recurrenceDisplay || parsed.recurrence}
            </span>
          )}

          {/* Date display - the key feedback */}
          {parsed.date &&
            (() => {
              const isNextYear =
                parsed.year && parsed.year !== new Date().getFullYear();
              const yearSuffix = isNextYear ? ` ${parsed.year}` : "";
              return (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: "var(--success-muted)",
                    color: "var(--success)",
                  }}
                >
                  📅{" "}
                  {parsed.isDateRange
                    ? `${parsed.dateDisplay || parsed.date} → ${parsed.dateEndDisplay || parsed.dateEnd}${yearSuffix}`
                    : `${parsed.dateDisplay || parsed.date}${yearSuffix}`}
                </span>
              );
            })()}

          {parsed.time && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  "color-mix(in oklch, var(--syntax-time) 15%, transparent)",
                color: "var(--syntax-time)",
              }}
            >
              🕐 {parsed.time}
            </span>
          )}

          <span style={{ color: "var(--foreground)" }} className="font-medium">
            {parsed.title}
          </span>

          {parsed.people.map((p) => {
            const color = getPersonColor(p, getPerson);
            return (
              <span
                key={p}
                className="person-badge px-1.5 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                  color,
                }}
              >
                #{p}
              </span>
            );
          })}

          {parsed.activity &&
            (() => {
              const activity = getActivity?.(parsed.activity);
              const icon = activity?.icon || getActivityIcon(parsed.activity);
              const color =
                activity?.color || getActivityColor(parsed.activity);
              return (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                    color: color,
                  }}
                >
                  <span className="text-sm">{icon}</span> +{parsed.activity}
                </span>
              );
            })()}

          {parsed.location && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor:
                  "color-mix(in oklch, var(--syntax-location) 15%, transparent)",
                color: "var(--syntax-location)",
              }}
            >
              📍 {parsed.location}
            </span>
          )}

          {/* Show what's missing if not valid yet */}
          {!parsed.isValid && (parsed.date || parsed.time) && !parsed.title && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: "var(--warning-muted)",
                color: "var(--warning)",
              }}
            >
              + add title
            </span>
          )}

          {/* Show the formatted markdown line when valid */}
          {parsed.isValid && (
            <span
              className="ml-auto text-[10px] font-mono hidden md:inline"
              style={{ color: "var(--foreground-muted)", opacity: 0.7 }}
            >
              → {parsed.formattedLine}
            </span>
          )}
        </div>
      )}

      {/* Hints when input is empty */}
      {!value && (
        <div
          className="text-[11px] px-1 hidden md:block"
          style={{ color: "var(--foreground-muted)" }}
        >
          Try: <span style={{ fontFamily: "var(--font-mono)" }}>tomorrow</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>next saturday</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>in 3 days</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>jan 15</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>apr 4 - 30</span> •
          Use <span style={{ fontFamily: "var(--font-mono)" }}>#person</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>+activity</span>,{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>@location</span>
        </div>
      )}
    </div>
  );
}
