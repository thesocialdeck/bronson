import { useState, useRef } from "react";

interface QuickAddPersonProps {
  onAdd: (personContent: string, contextLabel: string) => Promise<void>;
}

const CONTEXT_OPTIONS = [
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "Friends", icon: "👋" },
  { id: "neighbours", label: "Neighbours", icon: "🏠" },
  { id: "school-parents", label: "School Parents", icon: "🎒" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "services", label: "Services", icon: "🔧" },
];

export function QuickAddPerson({ onAdd }: QuickAddPersonProps) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("friends");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || isAdding) return;

    setIsAdding(true);

    // Build the markdown content for the person (without the context header)
    const lines: string[] = [];
    lines.push(`### ${name.trim()}`);
    if (phone.trim()) lines.push(`phone: ${phone.trim()}`);
    if (email.trim()) lines.push(`email: ${email.trim()}`);
    if (notes.trim()) {
      lines.push(`notes: ${notes.trim()}`);
    }

    const contextLabel =
      CONTEXT_OPTIONS.find((c) => c.id === context)?.label || context;
    const personContent = lines.join("\n");

    await onAdd(personContent, contextLabel);

    // Reset form
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setIsExpanded(false);
    setIsAdding(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && isValid) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Name input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add person: Jane Smith"
            className="quick-add-input w-full px-3 py-2.5 rounded-lg text-sm"
            style={{
              borderColor: isValid ? "var(--success)" : "var(--border)",
            }}
          />
          {isValid && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--success)" }}
            >
              ✓
            </span>
          )}
        </div>

        {/* Context selector and Add button - inline on desktop, row on mobile */}
        <div className="flex gap-2 sm:contents">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: "var(--input)",
              color: "var(--foreground)",
              border: "2px solid var(--border)",
            }}
          >
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>

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
      </div>

      {/* Expanded fields - stack vertically on mobile */}
      {isExpanded && name.trim() && (
        <div className="flex flex-col sm:flex-row gap-2 animate-fade-in">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="📱 Phone"
            className="quick-add-input flex-1 px-3 py-2 rounded-lg text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="✉️ Email"
            className="quick-add-input flex-1 px-3 py-2 rounded-lg text-sm"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="📝 Quick note"
            className="quick-add-input flex-1 px-3 py-2 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Preview */}
      {isValid && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <span style={{ color: "var(--success)" }}>✓</span>
          <span
            className="font-medium"
            style={{ color: "var(--syntax-heading-3)" }}
          >
            {name}
          </span>
          <span style={{ color: "var(--foreground-subtle)" }}>→</span>
          <span style={{ color: "var(--syntax-field-key)" }}>
            {CONTEXT_OPTIONS.find((c) => c.id === context)?.icon}{" "}
            {CONTEXT_OPTIONS.find((c) => c.id === context)?.label}
          </span>
          {phone && (
            <span style={{ color: "var(--foreground-muted)" }}>• {phone}</span>
          )}
          {email && (
            <span style={{ color: "var(--foreground-muted)" }}>• {email}</span>
          )}
        </div>
      )}
    </div>
  );
}
