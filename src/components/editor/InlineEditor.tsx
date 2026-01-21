import { useState, useCallback } from "react";
import { BronsonEditor } from "./BronsonEditor";
import { Button } from "@/components/ui/button";

export interface InlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<boolean>;
  language: "calendar" | "people" | "activities";
  personIds: string[];
  activityIds: string[];
  locationIds?: string[];
  label?: string;
}

export function InlineEditor({
  value: initialValue,
  onSave,
  language,
  personIds,
  activityIds,
  locationIds = [],
  label = "Source",
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(initialValue);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(initialValue);
    setIsEditing(false);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const success = await onSave(editValue);
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  }, [editValue, onSave]);

  // Count lines for dynamic height
  const lineCount = editValue.split("\n").length;
  const editorMinHeight = Math.max(60, Math.min(lineCount * 22 + 24, 200));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--foreground-muted)" }}
        >
          {label}
        </h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 px-2 text-xs"
          >
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--primary)",
              minHeight: `${editorMinHeight}px`,
            }}
          >
            <BronsonEditor
              value={editValue}
              onChange={setEditValue}
              language={language}
              personIds={personIds}
              activityIds={activityIds}
              locationIds={locationIds}
              showLineNumbers={false}
              lineWrapping={true}
              minHeight={`${editorMinHeight}px`}
              maxHeight="300px"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
          }}
        >
          <BronsonEditor
            value={initialValue}
            onChange={() => {}}
            language={language}
            personIds={personIds}
            activityIds={activityIds}
            locationIds={locationIds}
            showLineNumbers={false}
            lineWrapping={true}
            readonly={true}
            minHeight="auto"
          />
        </div>
      )}
    </section>
  );
}
