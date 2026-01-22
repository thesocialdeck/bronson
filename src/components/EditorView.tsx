import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BronsonEditor } from "@/components/editor";
import {
  getPersonColor,
  getActivityColor,
  getActivityIcon,
} from "@/lib/colors";
import type { Person } from "@/lib/types";

interface EditorViewProps {
  fileName: string;
  readFile: () => Promise<string | null>;
  writeFile: (content: string) => Promise<boolean>;
  selectedLine?: number | null;
  onLineSelect?: (line: number | null) => void;
  language: "calendar" | "people" | "activities";
  personIds: string[];
  activityIds: string[];
  locationIds?: string[];
  getPerson?: (id: string) => Person | null;
  syntaxHelp?: React.ReactNode;
}

export function EditorView({
  fileName,
  readFile,
  writeFile,
  selectedLine,
  onLineSelect,
  language,
  personIds,
  activityIds,
  locationIds = [],
  getPerson,
  syntaxHelp,
}: EditorViewProps) {
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load file content
  useEffect(() => {
    const load = async () => {
      setIsLoaded(false);
      const text = await readFile();
      if (text !== null) {
        setContent(text);
        setIsDirty(false);
        setIsLoaded(true);
      }
    };
    load();
  }, [readFile]);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const success = await writeFile(content);
    if (success) {
      setIsDirty(false);
    }
    setIsSaving(false);
  }, [writeFile, content]);

  const handleLineClick = useCallback(
    (line: number) => {
      if (onLineSelect) {
        onLineSelect(line);
      }
    },
    [onLineSelect],
  );

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, handleSave]);

  return (
    <div className="flex h-full">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File header */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0"
          style={{
            background: "var(--background-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="text-sm font-medium"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {fileName}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: isDirty ? "var(--warning)" : "var(--success)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isDirty ? "var(--warning)" : "var(--success)",
              }}
            />
            {isDirty ? "Modified" : "Saved"}
          </span>
          <div className="flex-1" />
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            size="sm"
            className="h-7 px-2 sm:px-3 text-xs font-medium"
            style={{
              backgroundColor: isDirty ? "var(--primary)" : "var(--secondary)",
              color: isDirty
                ? "var(--primary-foreground)"
                : "var(--foreground-muted)",
            }}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <span className="hidden sm:inline">Save </span>⌘S
              </>
            )}
          </Button>
        </div>

        {/* Editor area - CodeMirror */}
        <div className="editor-container flex-1 overflow-hidden">
          {isLoaded && (
            <BronsonEditor
              value={content}
              onChange={handleChange}
              language={language}
              personIds={personIds}
              activityIds={activityIds}
              locationIds={locationIds}
              getPerson={getPerson}
              showLineNumbers={true}
              lineWrapping={false}
              scrollToLine={selectedLine ?? undefined}
              onLineClick={handleLineClick}
            />
          )}
        </div>
      </div>

      {/* Syntax reference sidebar - hidden on mobile/tablet */}
      {syntaxHelp && (
        <aside className="syntax-help w-48 p-3 overflow-auto shrink-0 hidden lg:block">
          {syntaxHelp}
        </aside>
      )}
    </div>
  );
}

// Syntax help components - kept for backward compatibility and sidebar display
export function CalendarSyntaxHelp({
  personIds = [],
  activityIds = [],
  getPerson,
}: {
  personIds?: string[];
  activityIds?: string[];
  getPerson?: (id: string) => Person | null;
}) {
  // Use provided IDs or fall back to defaults for display purposes
  const people = personIds.length > 0 ? personIds.slice(0, 6) : ["family"];
  const activities =
    activityIds.length > 0
      ? activityIds.slice(0, 8)
      : ["sport", "school", "social", "appointment"];

  return (
    <>
      <div className="syntax-help-heading mb-3">Syntax</div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          People
        </div>
        {people.map((id) => (
          <div key={id} className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getPersonColor(id, getPerson) }}
            />
            <span
              className="text-[11px]"
              style={{
                color: getPersonColor(id, getPerson),
                fontFamily: "var(--font-mono)",
              }}
            >
              #{id}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Activities
        </div>
        {activities.map((id) => (
          <div key={id} className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs">{getActivityIcon(id)}</span>
            <span
              className="text-[11px]"
              style={{
                color: getActivityColor(id),
                fontFamily: "var(--font-mono)",
              }}
            >
              +{id}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Locations
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-location)",
            fontFamily: "var(--font-mono)",
          }}
        >
          @place
        </div>
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Times
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-time)",
            fontFamily: "var(--font-mono)",
          }}
        >
          9am
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-time)",
            fontFamily: "var(--font-mono)",
          }}
        >
          2:30pm
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-time)",
            fontFamily: "var(--font-mono)",
          }}
        >
          9am-5pm
        </div>
      </div>

      <div>
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Recurring
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-recurrence)",
            fontFamily: "var(--font-mono)",
          }}
        >
          every mon
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-recurrence)",
            fontFamily: "var(--font-mono)",
          }}
        >
          every 2nd thu
        </div>
      </div>
    </>
  );
}

export function PeopleSyntaxHelp() {
  return (
    <>
      <div className="syntax-help-heading mb-3">Syntax</div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Structure
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-heading-2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ## Context
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--syntax-heading-3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ### Name
        </div>
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Fields
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-field-key)" }}>phone</span>
          <span style={{ color: "var(--syntax-comment)" }}>: </span>
          <span style={{ color: "var(--syntax-text)" }}>0412...</span>
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-field-key)" }}>email</span>
          <span style={{ color: "var(--syntax-comment)" }}>: </span>
          <span style={{ color: "var(--syntax-text)" }}>@...</span>
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-field-key)" }}>birthday</span>
          <span style={{ color: "var(--syntax-comment)" }}>: </span>
          <span style={{ color: "var(--syntax-text)" }}>jan 15</span>
        </div>
      </div>

      <div>
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Notes
        </div>
        <div
          className="text-[11px] italic"
          style={{
            color: "var(--syntax-note)",
            fontFamily: "var(--font-mono)",
          }}
        >
          &nbsp;&nbsp;indented
        </div>
      </div>
    </>
  );
}

export function ActivitiesSyntaxHelp() {
  return (
    <>
      <div className="syntax-help-heading mb-3">Syntax</div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Activity
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--activity-sport)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ### +name
        </div>
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Metadata
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-time)" }}>icon</span>
          <span style={{ color: "var(--syntax-comment)" }}>: </span>
          <span style={{ color: "var(--syntax-text)" }}>⚽</span>
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-time)" }}>color</span>
          <span style={{ color: "var(--syntax-comment)" }}>: </span>
          <span style={{ color: "var(--syntax-text)" }}>#10B981</span>
        </div>
      </div>

      <div>
        <div
          className="text-[10px] mb-1.5"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Checklist
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--syntax-comment)" }}>- [ ] </span>
          <span style={{ color: "var(--syntax-text)" }}>todo</span>
        </div>
        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--success)" }}>- [x] </span>
          <span className="italic" style={{ color: "var(--syntax-note)" }}>
            done
          </span>
        </div>
      </div>
    </>
  );
}
