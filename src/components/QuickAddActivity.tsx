import { useState, useRef } from "react";

interface QuickAddActivityProps {
  onAdd: (content: string) => Promise<void>;
}

const ICON_OPTIONS = [
  "⚽",
  "🏀",
  "🎾",
  "🏊",
  "🚴",
  "🎭",
  "🎨",
  "🎵",
  "📚",
  "💻",
  "🎮",
  "🎬",
  "✈️",
  "🏕️",
  "🎂",
  "🎉",
  "🗓️",
  "💼",
  "🏥",
  "🔧",
  "🛒",
  "🍳",
  "🧹",
  "💪",
  "🧘",
  "🎯",
  "📝",
  "💡",
  "🔔",
  "⭐",
];

const COLOR_OPTIONS = [
  { name: "Green", value: "var(--activity-sport)" },
  { name: "Blue", value: "var(--activity-appointment)" },
  { name: "Purple", value: "var(--activity-reminder)" },
  { name: "Pink", value: "var(--activity-social)" },
  { name: "Red", value: "var(--activity-celebration)" },
  { name: "Orange", value: "var(--person-steven)" },
  { name: "Yellow", value: "var(--activity-school)" },
  { name: "Teal", value: "var(--activity-health)" },
];

export function QuickAddActivity({ onAdd }: QuickAddActivityProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [colorIndex, setColorIndex] = useState(2); // Purple default
  const [keywords, setKeywords] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const color = COLOR_OPTIONS[colorIndex].value;

  // Sanitize name for ID (lowercase, no spaces)
  const activityId = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const isValid = activityId.length > 0;

  const handleSubmit = async () => {
    if (!isValid || isAdding) return;

    setIsAdding(true);

    // Build the markdown content
    const lines: string[] = [];
    lines.push(`### +${activityId}`);
    lines.push(`icon: ${icon}`);
    lines.push(`color: ${color}`);
    if (keywords.trim()) {
      lines.push(`keywords: ${keywords.trim()}`);
    }

    const content = `\n${lines.join("\n")}`;

    await onAdd(content);

    // Reset form
    setName("");
    setKeywords("");
    setIsAdding(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Icon picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
            className="w-11 h-11 rounded-lg text-xl flex items-center justify-center transition-all"
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
              border: "2px solid var(--border)",
            }}
          >
            {icon}
          </button>
          {showIconPicker && (
            <div
              className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-xl z-50 grid grid-cols-5 gap-1 w-48 animate-fade-in"
              style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
              }}
            >
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIcon(i);
                    setShowIconPicker(false);
                  }}
                  className="w-8 h-8 rounded flex items-center justify-center text-lg transition-colors"
                  style={{
                    backgroundColor:
                      icon === i ? "var(--secondary)" : "transparent",
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowIconPicker(false);
            }}
            className="w-11 h-11 rounded-lg transition-all"
            style={{
              backgroundColor: color,
              border: "2px solid var(--border)",
            }}
          />
          {showColorPicker && (
            <div
              className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-xl z-50 grid grid-cols-4 gap-1 animate-fade-in"
              style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
              }}
            >
              {COLOR_OPTIONS.map((c, idx) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setColorIndex(idx);
                    setShowColorPicker(false);
                  }}
                  title={c.name}
                  className="w-8 h-8 rounded transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    outline:
                      colorIndex === idx
                        ? "2px solid var(--foreground)"
                        : undefined,
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Name input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Activity name: Swimming"
            className="quick-add-input w-full px-3 py-2.5 rounded-lg text-sm"
            style={{
              borderColor: isValid ? "var(--success)" : "var(--border)",
            }}
          />
        </div>

        {/* Keywords input - full width on mobile */}
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Keywords: swim, pool, laps"
          className="quick-add-input w-full sm:w-48 px-3 py-2.5 rounded-lg text-sm order-last sm:order-none"
        />

        {/* Add button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || isAdding}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: isValid ? "var(--primary)" : "var(--secondary)",
            color: isValid
              ? "var(--primary-foreground)"
              : "var(--foreground-muted)",
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Preview */}
      {isValid && (
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs animate-fade-in"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <span style={{ color: "var(--success)" }}>✓</span>
          <span
            className="activity-badge px-2 py-1 rounded font-medium"
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
              color,
            }}
          >
            {icon} +{activityId}
          </span>
          {keywords && (
            <>
              <span style={{ color: "var(--foreground-subtle)" }}>
                keywords:
              </span>
              <span style={{ color: "var(--foreground-muted)" }}>
                {keywords}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
