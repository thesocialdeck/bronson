# CodeMirror Editor Migration Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the custom textarea+overlay editor with CodeMirror 6 to enable text wrapping, proper mobile editing, and robust autocomplete.

**Architecture:** Single CodeMirror wrapper component (`BronsonEditor`) used for both full-file editors (desktop) and inline source editors (mobile-friendly). Three language modes share common highlighting patterns. Theme reads from existing CSS variables.

**Tech Stack:** CodeMirror 6, React, TypeScript, existing Tailwind/CSS variables

---

## Background

### Problem
- Current editor uses textarea + overlay for syntax highlighting
- Requires `white-space: nowrap` - no text wrapping
- Horizontal scroll is clunky on mobile
- Custom autocomplete is fragile

### Solution
- Adopt CodeMirror 6 for all editing
- Native wrapping support with syntax highlighting
- Built-in autocomplete infrastructure
- Same code works in full editor and inline editors

### Current Functionality to Preserve
1. Load/save file content with dirty state tracking
2. Cmd+S keyboard shortcut for save
3. Syntax highlighting for calendar, people, activities files
4. Line numbers with current line highlighting
5. Scroll to specific line (for "Edit in Editor" navigation)
6. Click to select line
7. Syntax help sidebar (desktop only)
8. Autocomplete on `#`, `+`, `@` triggers
9. Person/activity colors in highlighting

---

## Component Architecture

```
src/components/editor/
  BronsonEditor.tsx           # Core CodeMirror wrapper
  InlineEditor.tsx            # Wrapper for detail views (collapsible)
  extensions/
    theme.ts                  # Light/dark theme from CSS vars
    calendar-language.ts      # Calendar syntax highlighting
    people-language.ts        # People syntax highlighting  
    activities-language.ts    # Activities syntax highlighting
    autocomplete.ts           # Shared autocomplete logic
    index.ts                  # Re-exports
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add CodeMirror packages**

```bash
bun add @codemirror/state @codemirror/view @codemirror/language @codemirror/commands @codemirror/autocomplete
```

**Step 2: Verify installation**

```bash
bun run build
```

Expected: Build succeeds with new dependencies

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add CodeMirror 6 dependencies"
```

---

## Task 2: Create Theme Extension

**Files:**
- Create: `src/components/editor/extensions/theme.ts`

**Step 1: Create the theme file**

```typescript
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Editor chrome theme - reads from CSS variables
export const bronsonEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: 'var(--editor-cursor)',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--editor-gutter)',
    color: 'var(--foreground-subtle)',
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  },
  '.cm-gutter-lineNumbers .cm-gutterElement': {
    padding: '0 8px',
    minWidth: '40px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--editor-line-highlight)',
    color: 'var(--foreground)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--editor-line-highlight)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--editor-cursor)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--primary-muted)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'var(--secondary)',
    },
  },
});

// Syntax highlighting styles - using custom tags
export const bronsonHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, color: 'var(--syntax-heading-1)', fontWeight: '600' },
  { tag: tags.heading2, color: 'var(--syntax-heading-2)', fontWeight: '600' },
  { tag: tags.heading3, color: 'var(--syntax-heading-3)', fontWeight: '600' },
  { tag: tags.comment, color: 'var(--syntax-comment)' },
  { tag: tags.emphasis, color: 'var(--syntax-note)', fontStyle: 'italic' },
  { tag: tags.keyword, color: 'var(--syntax-recurrence)' },
  { tag: tags.labelName, color: 'var(--syntax-field-key)' },
  { tag: tags.string, color: 'var(--syntax-time)' },
  { tag: tags.atom, color: 'var(--syntax-modifier)' },
  { tag: tags.link, color: 'var(--syntax-location)' },
  // Custom tags for our syntax - will define in language files
]);

export function bronsonTheme(): Extension {
  return [bronsonEditorTheme, syntaxHighlighting(bronsonHighlightStyle)];
}
```

**Step 2: Create index re-export**

Create `src/components/editor/extensions/index.ts`:

```typescript
export { bronsonTheme, bronsonEditorTheme, bronsonHighlightStyle } from './theme';
```

**Step 3: Verify TypeScript**

```bash
cd bronson-app && bunx tsc --noEmit
```

Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add CodeMirror theme extension"
```

---

## Task 3: Create Autocomplete Extension

**Files:**
- Create: `src/components/editor/extensions/autocomplete.ts`

**Step 1: Create autocomplete logic**

```typescript
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { getPersonColor, getActivityColor, getActivityIcon } from '@/lib/colors';

export interface AutocompleteData {
  personIds: string[];
  activityIds: string[];
  locationIds: string[];
}

function createCompletions(
  context: CompletionContext,
  data: AutocompleteData
): CompletionResult | null {
  // Match #, +, or @ followed by word characters
  const word = context.matchBefore(/[#@+]\w*/);
  if (!word) return null;
  
  const trigger = word.text[0];
  const query = word.text.slice(1).toLowerCase();
  
  let options: Completion[] = [];
  
  if (trigger === '#') {
    options = data.personIds
      .filter(id => id.toLowerCase().includes(query))
      .map(id => ({
        label: `#${id}`,
        displayLabel: id.charAt(0).toUpperCase() + id.slice(1),
        type: 'variable',
        boost: id.toLowerCase().startsWith(query) ? 1 : 0,
        info: () => {
          const el = document.createElement('span');
          el.style.color = getPersonColor(id);
          el.textContent = `Person: ${id}`;
          return el;
        },
      }));
  } else if (trigger === '+') {
    options = data.activityIds
      .filter(id => id.toLowerCase().includes(query))
      .map(id => ({
        label: `+${id}`,
        displayLabel: `${getActivityIcon(id)} ${id.charAt(0).toUpperCase() + id.slice(1)}`,
        type: 'type',
        boost: id.toLowerCase().startsWith(query) ? 1 : 0,
        info: () => {
          const el = document.createElement('span');
          el.style.color = getActivityColor(id);
          el.textContent = `Activity: ${id}`;
          return el;
        },
      }));
  } else if (trigger === '@') {
    options = data.locationIds
      .filter(loc => loc.toLowerCase().includes(query))
      .map(loc => ({
        label: loc.includes(' ') ? `@"${loc}"` : `@${loc}`,
        displayLabel: `📍 ${loc}`,
        type: 'text',
        boost: loc.toLowerCase().startsWith(query) ? 1 : 0,
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
  });
}
```

**Step 2: Update index**

```typescript
export { bronsonTheme, bronsonEditorTheme, bronsonHighlightStyle } from './theme';
export { bronsonAutocomplete, type AutocompleteData } from './autocomplete';
```

**Step 3: Verify TypeScript**

```bash
bunx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add autocomplete extension"
```

---

## Task 4: Create Calendar Language Extension

**Files:**
- Create: `src/components/editor/extensions/calendar-language.ts`

**Step 1: Create calendar syntax**

```typescript
import { StreamLanguage, StringStream } from '@codemirror/language';
import { tags, Tag } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { getPersonColor, getActivityColor } from '@/lib/colors';

// Custom tags for calendar-specific tokens
export const calendarTags = {
  person: Tag.define(),
  activity: Tag.define(),
  location: Tag.define(),
  time: Tag.define(),
  date: Tag.define(),
  recurrence: Tag.define(),
  modifier: Tag.define(),
};

interface CalendarState {
  inNote: boolean;
}

export const calendarLanguage = StreamLanguage.define<CalendarState>({
  name: 'bronson-calendar',
  startState: () => ({ inNote: false }),
  token(stream: StringStream, state: CalendarState): string | null {
    // Start of line checks
    if (stream.sol()) {
      state.inNote = false;
      
      // Year heading
      if (stream.match(/^# .*/)) {
        return 'heading1';
      }
      // Month heading
      if (stream.match(/^## .*/)) {
        return 'heading2';
      }
      // Comment
      if (stream.match(/^<!--.*-->/)) {
        return 'comment';
      }
      // Indented note
      if (stream.match(/^    /)) {
        state.inNote = true;
        stream.skipToEnd();
        return 'emphasis';
      }
      // Recurrence at start of line
      if (stream.match(/^every\s+[\w\s]+?(?=:)/i)) {
        return 'keyword';
      }
    }
    
    // Inside a note line
    if (state.inNote) {
      stream.skipToEnd();
      return 'emphasis';
    }
    
    // Person tag
    if (stream.match(/#\w+/)) {
      return 'variableName';
    }
    
    // Activity tag
    if (stream.match(/\+\w+/)) {
      return 'typeName';
    }
    
    // Location (unquoted)
    if (stream.match(/@[\w]+/)) {
      return 'link';
    }
    
    // Modifier [tentative], [cancelled], etc.
    if (stream.match(/\[[^\]]+\]/)) {
      return 'atom';
    }
    
    // Time: 9am, 2:30pm, 9am-5pm
    if (stream.match(/\d{1,2}(:\d{2})?(am|pm)(-\d{1,2}(:\d{2})?(am|pm)?)?/i)) {
      return 'string';
    }
    
    // Skip to next interesting character
    if (stream.match(/[^#@+\[\d]+/)) {
      return null;
    }
    
    stream.next();
    return null;
  },
});

// Dynamic highlighting that uses actual person/activity colors
export function calendarHighlighting(personIds: string[], activityIds: string[]): Extension {
  // Build highlight rules dynamically based on known IDs
  const styles = HighlightStyle.define([
    { tag: tags.heading1, color: 'var(--syntax-heading-1)', fontWeight: '600' },
    { tag: tags.heading2, color: 'var(--syntax-heading-2)', fontWeight: '600' },
    { tag: tags.comment, color: 'var(--syntax-comment)' },
    { tag: tags.emphasis, color: 'var(--syntax-note)', fontStyle: 'italic' },
    { tag: tags.keyword, color: 'var(--syntax-recurrence)' },
    { tag: tags.variableName, color: 'var(--person-default)', fontWeight: '600' },
    { tag: tags.typeName, color: 'var(--activity-default)', fontWeight: '600' },
    { tag: tags.link, color: 'var(--syntax-location)' },
    { tag: tags.atom, color: 'var(--syntax-modifier)' },
    { tag: tags.string, color: 'var(--syntax-time)' },
  ]);
  
  return syntaxHighlighting(styles);
}

export function calendarExtension(personIds: string[], activityIds: string[]): Extension {
  return [
    calendarLanguage,
    calendarHighlighting(personIds, activityIds),
  ];
}
```

**Step 2: Update index**

Add to `extensions/index.ts`:

```typescript
export { calendarLanguage, calendarExtension } from './calendar-language';
```

**Step 3: Verify TypeScript**

```bash
bunx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add calendar language extension"
```

---

## Task 5: Create People Language Extension

**Files:**
- Create: `src/components/editor/extensions/people-language.ts`

**Step 1: Create people syntax**

```typescript
import { StreamLanguage, StringStream } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';

interface PeopleState {
  inNote: boolean;
}

export const peopleLanguage = StreamLanguage.define<PeopleState>({
  name: 'bronson-people',
  startState: () => ({ inNote: false }),
  token(stream: StringStream, state: PeopleState): string | null {
    if (stream.sol()) {
      state.inNote = false;
      
      // File heading
      if (stream.match(/^# .*/)) {
        return 'heading1';
      }
      // Context heading
      if (stream.match(/^## .*/)) {
        return 'heading2';
      }
      // Person heading
      if (stream.match(/^### .*/)) {
        return 'heading3';
      }
      // Indented note
      if (stream.match(/^    /)) {
        state.inNote = true;
        stream.skipToEnd();
        return 'emphasis';
      }
      // Field: value
      if (stream.match(/^\w+(?:\s+\w+)?(?=\s*:)/)) {
        return 'labelName';
      }
    }
    
    if (state.inNote) {
      stream.skipToEnd();
      return 'emphasis';
    }
    
    // Colon after field name
    if (stream.match(/:\s*/)) {
      return 'punctuation';
    }
    
    stream.next();
    return null;
  },
});

export const peopleHighlighting = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.heading1, color: 'var(--syntax-heading-1)', fontWeight: '600' },
  { tag: tags.heading2, color: 'var(--syntax-heading-2)', fontWeight: '600' },
  { tag: tags.heading3, color: 'var(--syntax-heading-3)', fontWeight: '600' },
  { tag: tags.emphasis, color: 'var(--syntax-note)', fontStyle: 'italic' },
  { tag: tags.labelName, color: 'var(--syntax-field-key)' },
  { tag: tags.punctuation, color: 'var(--syntax-comment)' },
]));

export function peopleExtension(): Extension {
  return [peopleLanguage, peopleHighlighting];
}
```

**Step 2: Update index**

```typescript
export { peopleLanguage, peopleExtension } from './people-language';
```

**Step 3: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add people language extension"
```

---

## Task 6: Create Activities Language Extension

**Files:**
- Create: `src/components/editor/extensions/activities-language.ts`

**Step 1: Create activities syntax**

```typescript
import { StreamLanguage, StringStream } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';

interface ActivitiesState {
  // none needed currently
}

export const activitiesLanguage = StreamLanguage.define<ActivitiesState>({
  name: 'bronson-activities',
  startState: () => ({}),
  token(stream: StringStream): string | null {
    if (stream.sol()) {
      // File heading
      if (stream.match(/^# .*/)) {
        return 'heading1';
      }
      // Section heading
      if (stream.match(/^## .*/)) {
        return 'heading2';
      }
      // Activity heading
      if (stream.match(/^### \+.*/)) {
        return 'heading3';
      }
      // Checked item
      if (stream.match(/^- \[x\]/)) {
        return 'bool';
      }
      // Unchecked item
      if (stream.match(/^- \[ \]/)) {
        return 'punctuation';
      }
      // Field: value
      if (stream.match(/^\w+(?=\s*:)/)) {
        return 'labelName';
      }
    }
    
    // Colon
    if (stream.match(/:\s*/)) {
      return 'punctuation';
    }
    
    stream.next();
    return null;
  },
});

export const activitiesHighlighting = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.heading1, color: 'var(--syntax-heading-1)', fontWeight: '600' },
  { tag: tags.heading2, color: 'var(--syntax-heading-2)', fontWeight: '600' },
  { tag: tags.heading3, color: 'var(--activity-sport)', fontWeight: '600' },
  { tag: tags.bool, color: 'var(--success)' },
  { tag: tags.punctuation, color: 'var(--syntax-comment)' },
  { tag: tags.labelName, color: 'var(--syntax-time)' },
]));

export function activitiesExtension(): Extension {
  return [activitiesLanguage, activitiesHighlighting];
}
```

**Step 2: Update index**

```typescript
export { activitiesLanguage, activitiesExtension } from './activities-language';
```

**Step 3: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add activities language extension"
```

---

## Task 7: Create BronsonEditor Component

**Files:**
- Create: `src/components/editor/BronsonEditor.tsx`

**Step 1: Create the component**

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bronsonTheme } from './extensions/theme';
import { bronsonAutocomplete, AutocompleteData } from './extensions/autocomplete';
import { calendarExtension } from './extensions/calendar-language';
import { peopleExtension } from './extensions/people-language';
import { activitiesExtension } from './extensions/activities-language';

export interface BronsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'calendar' | 'people' | 'activities';
  personIds: string[];
  activityIds: string[];
  locationIds?: string[];
  showLineNumbers?: boolean;
  lineWrapping?: boolean;
  minHeight?: string;
  maxHeight?: string;
  scrollToLine?: number;
  onLineClick?: (line: number) => void;
  readonly?: boolean;
  className?: string;
}

export function BronsonEditor({
  value,
  onChange,
  language,
  personIds,
  activityIds,
  locationIds = [],
  showLineNumbers = true,
  lineWrapping = false,
  minHeight,
  maxHeight,
  scrollToLine,
  onLineClick,
  readonly = false,
  className = '',
}: BronsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated
  onChangeRef.current = onChange;
  
  // Build extensions based on props
  const getExtensions = useCallback((): Extension[] => {
    const extensions: Extension[] = [
      bronsonTheme(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];
    
    if (showLineNumbers) {
      extensions.push(lineNumbers());
    }
    
    if (lineWrapping) {
      extensions.push(EditorView.lineWrapping);
    }
    
    if (readonly) {
      extensions.push(EditorState.readOnly.of(true));
    }
    
    // Language extension
    if (language === 'calendar') {
      extensions.push(calendarExtension(personIds, activityIds));
    } else if (language === 'people') {
      extensions.push(peopleExtension());
    } else if (language === 'activities') {
      extensions.push(activitiesExtension());
    }
    
    // Autocomplete (not in readonly mode)
    if (!readonly) {
      extensions.push(bronsonAutocomplete({ personIds, activityIds, locationIds }));
    }
    
    // Click handler
    if (onLineClick) {
      extensions.push(EditorView.domEventHandlers({
        click: (event, view) => {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos !== null) {
            const line = view.state.doc.lineAt(pos).number;
            onLineClick(line);
          }
          return false;
        },
      }));
    }
    
    return extensions;
  }, [language, personIds, activityIds, locationIds, showLineNumbers, lineWrapping, readonly, onLineClick]);
  
  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    const state = EditorState.create({
      doc: value,
      extensions: getExtensions(),
    });
    
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    
    viewRef.current = view;
    
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount
  
  // Update content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    
    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);
  
  // Reconfigure extensions when dependencies change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    
    view.dispatch({
      effects: EditorView.reconfigure.of(getExtensions()),
    });
  }, [getExtensions]);
  
  // Scroll to line
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !scrollToLine) return;
    
    const line = view.state.doc.line(Math.min(scrollToLine, view.state.doc.lines));
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    });
  }, [scrollToLine]);
  
  const style: React.CSSProperties = {
    minHeight: minHeight || '100%',
    maxHeight: maxHeight,
    overflow: maxHeight ? 'auto' : undefined,
  };
  
  return (
    <div
      ref={containerRef}
      className={`bronson-editor ${className}`}
      style={style}
    />
  );
}
```

**Step 2: Add CSS for editor container**

Add to `App.css`:

```css
.bronson-editor {
  background: var(--editor-bg);
}

.bronson-editor .cm-editor {
  height: 100%;
}

.bronson-editor .cm-scroller {
  font-family: var(--font-mono);
}
```

**Step 3: Verify TypeScript**

```bash
bunx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/editor/ src/App.css
git commit -m "feat(editor): add BronsonEditor CodeMirror wrapper"
```

---

## Task 8: Create InlineEditor Component

**Files:**
- Create: `src/components/editor/InlineEditor.tsx`

**Step 1: Create the component**

```typescript
import { useState, useCallback } from 'react';
import { BronsonEditor } from './BronsonEditor';
import { Button } from '@/components/ui/button';

export interface InlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<boolean>;
  language: 'calendar' | 'people' | 'activities';
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
  label = 'Source',
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
  
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--foreground-muted)' }}
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
              border: '1px solid var(--border)',
              minHeight: '80px',
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
              minHeight="80px"
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
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-3 font-mono text-xs overflow-x-auto"
          style={{
            backgroundColor: 'var(--editor-bg)',
            color: 'var(--syntax-text)',
            border: '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
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
```

**Step 2: Export from editor index**

Create `src/components/editor/index.ts`:

```typescript
export { BronsonEditor } from './BronsonEditor';
export type { BronsonEditorProps } from './BronsonEditor';
export { InlineEditor } from './InlineEditor';
export type { InlineEditorProps } from './InlineEditor';
```

**Step 3: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add InlineEditor component"
```

---

## Task 9: Update EditorView to Use BronsonEditor

**Files:**
- Modify: `src/components/EditorView.tsx`

**Step 1: Replace the editor implementation**

The EditorView component keeps its existing interface but uses BronsonEditor internally. Preserve:
- File header with dirty state
- Save button with Cmd+S
- Syntax help sidebar
- Scroll to line functionality

Key changes:
- Remove textarea + overlay
- Remove manual scroll sync
- Use BronsonEditor with `showLineNumbers={true}`, `lineWrapping={false}`
- Pass through personIds/activityIds from App

**Step 2: Update App.tsx to pass autocomplete data**

EditorView needs personIds and activityIds passed through.

**Step 3: Test all three editors**

- Calendar editor: highlighting for dates, times, people, activities, locations
- People editor: highlighting for headings, fields, notes
- Activities editor: highlighting for headings, checklists, fields

**Step 4: Commit**

```bash
git add src/components/EditorView.tsx src/App.tsx
git commit -m "refactor(editor): migrate EditorView to CodeMirror"
```

---

## Task 10: Add InlineEditor to EventDetail

**Files:**
- Modify: `src/components/EventDetail.tsx`

**Step 1: Add InlineEditor to source section**

Replace the static `<code>{event.raw_line}</code>` with:

```tsx
<InlineEditor
  value={event.raw_line}
  onSave={async (newValue) => {
    // Call Tauri command to update the line in the file
    const success = await updateEventLine(event.line_number, newValue);
    return success;
  }}
  language="calendar"
  personIds={personIds}
  activityIds={activityIds}
  locationIds={locationIds}
/>
```

**Step 2: Add update function**

Need to add a Tauri command or use existing `writeCalendarFile` to update a specific line.

**Step 3: Pass required props through from App**

EventDetail needs personIds, activityIds, locationIds passed down.

**Step 4: Test**

- View event detail
- See syntax-highlighted source
- Click Edit
- Modify with autocomplete working
- Save and verify file updated

**Step 5: Commit**

```bash
git add src/components/EventDetail.tsx src/App.tsx
git commit -m "feat(EventDetail): add inline source editor"
```

---

## Task 11: Add InlineEditor to PersonDetail

**Files:**
- Modify: `src/components/PeopleView.tsx`

**Step 1: Calculate person block content**

Need to extract the full block (### Name through end of fields/notes) from the people file.

**Step 2: Add InlineEditor**

```tsx
<InlineEditor
  value={personBlockContent}
  onSave={async (newValue) => {
    // Replace the block in the file
    const success = await updatePersonBlock(person.id, newValue);
    return success;
  }}
  language="people"
  personIds={personIds}
  activityIds={activityIds}
/>
```

**Step 3: Add update function**

Function to find and replace a person's block in people.md.

**Step 4: Test**

- View person detail
- Edit source with fields
- Save and verify

**Step 5: Commit**

```bash
git add src/components/PeopleView.tsx
git commit -m "feat(PeopleView): add inline source editor to PersonDetail"
```

---

## Task 12: Create ActivitiesView

**Files:**
- Create: `src/components/ActivitiesView.tsx`

**Step 1: Create component structure**

Similar to PeopleView:
- List of activities with icons and colors
- ActivityDetail panel
- InlineEditor for source

```tsx
export function ActivitiesView({ activities }: ActivitiesViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  return (
    <div className="flex h-full">
      {/* List */}
      <div className={`... ${showDetail ? 'hidden md:flex' : 'w-full'}`}>
        {/* Activity list */}
      </div>
      
      {/* Detail */}
      <div className={`... ${showDetail ? 'flex' : 'hidden md:flex'}`}>
        {selectedActivity && (
          <ActivityDetail activity={selectedActivity} ... />
        )}
      </div>
    </div>
  );
}

function ActivityDetail({ activity, onSave, ... }) {
  return (
    <div>
      {/* Header with icon, name, color */}
      {/* Metadata fields */}
      {/* Checklist preview */}
      {/* InlineEditor for source */}
    </div>
  );
}
```

**Step 2: Add to App.tsx**

- Add ActivitiesView import
- Add to view routing
- Update mobile nav

**Step 3: Test**

- Navigate to Activities view
- See list of activities
- Tap to see detail
- Edit source

**Step 4: Commit**

```bash
git add src/components/ActivitiesView.tsx src/App.tsx
git commit -m "feat: add ActivitiesView with inline editor"
```

---

## Task 13: Update Mobile Navigation

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update mobile nav items**

Change from 7 items to 5:
- Month
- Agenda  
- Directory
- Activities (new)
- Year

Hide editor tabs (Calendar, People, Activities editors) on mobile.

**Step 2: Update desktop nav**

Keep all 7 items on desktop - editors still useful for power users and bulk editing.

**Step 3: Test at mobile widths**

- 320px, 375px: 5 nav items
- 768px+: All 7 items

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: update mobile nav with Activities view, hide editors"
```

---

## Task 14: Final Testing & Polish

**Step 1: Test matrix**

| View | Desktop | Mobile |
|------|---------|--------|
| Calendar Editor | BronsonEditor, no wrap | Hidden |
| People Editor | BronsonEditor, no wrap | Hidden |
| Activities Editor | BronsonEditor, no wrap | Hidden |
| Month View | Unchanged | Unchanged |
| Agenda View | Unchanged | Unchanged |
| Year View | Unchanged | Unchanged |
| Directory | PersonDetail with InlineEditor | Mobile list/detail + InlineEditor |
| Activities | ActivityDetail with InlineEditor | Mobile list/detail + InlineEditor |
| EventDetail | InlineEditor | InlineEditor |

**Step 2: Test autocomplete**

- Type `#` → person suggestions appear
- Type `+` → activity suggestions appear
- Type `@` → location suggestions appear
- Arrow keys + Enter to select
- Works in full editor and inline editors

**Step 3: Test syntax highlighting**

All token types colored correctly:
- Headings (3 levels)
- Dates, times
- People tags (with person-specific colors)
- Activity tags (with activity-specific colors)
- Locations
- Modifiers
- Recurrence patterns
- Notes (italic)
- Fields
- Checklists

**Step 4: Test save flow**

- Edit in inline editor
- Save writes to correct location in file
- File watcher picks up change
- UI updates

**Step 5: Build verification**

```bash
bun run build
```

Expected: Build succeeds, bundle size reasonable (~150KB increase for CodeMirror)

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete CodeMirror editor migration"
```

---

## Verification Checklist

- [ ] All three file editors work with syntax highlighting
- [ ] Autocomplete works for #people, +activities, @locations
- [ ] Line numbers display correctly
- [ ] Scroll to line works (from "Edit in Editor" button)
- [ ] Cmd+S saves in full editor
- [ ] Dirty state indicator works
- [ ] EventDetail inline editor saves correctly
- [ ] PersonDetail inline editor saves correctly  
- [ ] ActivityDetail inline editor saves correctly
- [ ] Mobile nav shows 5 items (no editors)
- [ ] Desktop nav shows all 7 items
- [ ] Light/dark theme works
- [ ] Build passes
- [ ] No TypeScript errors
