import { useEffect, useRef, useCallback, useMemo } from "react";
import { EditorState, Extension, Compartment } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bronsonTheme } from "./extensions/theme";
import {
  bronsonAutocomplete,
  type AutocompleteData,
} from "./extensions/autocomplete";
import { calendarExtension } from "./extensions/calendar-language";
import { peopleExtension } from "./extensions/people-language";
import { activitiesExtension } from "./extensions/activities-language";

export interface BronsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "calendar" | "people" | "activities";
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
  className = "",
}: BronsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated to avoid recreating extensions
  onChangeRef.current = onChange;

  // Compartments for reconfigurable extensions
  const languageCompartment = useRef(new Compartment());
  const autocompleteCompartment = useRef(new Compartment());
  const readonlyCompartment = useRef(new Compartment());
  const lineNumbersCompartment = useRef(new Compartment());
  const lineWrappingCompartment = useRef(new Compartment());

  // Get language extension based on prop
  const getLanguageExtension = useCallback(() => {
    switch (language) {
      case "calendar":
        return calendarExtension();
      case "people":
        return peopleExtension();
      case "activities":
        return activitiesExtension();
      default:
        return [];
    }
  }, [language]);

  // Get autocomplete extension
  const getAutocompleteExtension = useCallback(() => {
    if (readonly) return [];
    const data: AutocompleteData = { personIds, activityIds, locationIds };
    return bronsonAutocomplete(data);
  }, [personIds, activityIds, locationIds, readonly]);

  // Build initial extensions
  const getInitialExtensions = useCallback((): Extension[] => {
    return [
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
      // Reconfigurable compartments
      languageCompartment.current.of(getLanguageExtension()),
      autocompleteCompartment.current.of(getAutocompleteExtension()),
      readonlyCompartment.current.of(
        readonly ? EditorState.readOnly.of(true) : [],
      ),
      lineNumbersCompartment.current.of(showLineNumbers ? lineNumbers() : []),
      lineWrappingCompartment.current.of(
        lineWrapping ? EditorView.lineWrapping : [],
      ),
      // Click handler for line selection
      EditorView.domEventHandlers({
        click: (event, view) => {
          if (onLineClick) {
            const pos = view.posAtCoords({
              x: event.clientX,
              y: event.clientY,
            });
            if (pos !== null) {
              const line = view.state.doc.lineAt(pos).number;
              onLineClick(line);
            }
          }
          return false;
        },
      }),
    ];
  }, [
    getLanguageExtension,
    getAutocompleteExtension,
    readonly,
    showLineNumbers,
    lineWrapping,
    onLineClick,
  ]);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: getInitialExtensions(),
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
    // Only create once on mount - we handle updates via dispatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Reconfigure language when it changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: languageCompartment.current.reconfigure(getLanguageExtension()),
    });
  }, [language, getLanguageExtension]);

  // Reconfigure autocomplete when data changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: autocompleteCompartment.current.reconfigure(
        getAutocompleteExtension(),
      ),
    });
  }, [personIds, activityIds, locationIds, readonly, getAutocompleteExtension]);

  // Reconfigure readonly
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: readonlyCompartment.current.reconfigure(
        readonly ? EditorState.readOnly.of(true) : [],
      ),
    });
  }, [readonly]);

  // Reconfigure line numbers
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: lineNumbersCompartment.current.reconfigure(
        showLineNumbers ? lineNumbers() : [],
      ),
    });
  }, [showLineNumbers]);

  // Reconfigure line wrapping
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: lineWrappingCompartment.current.reconfigure(
        lineWrapping ? EditorView.lineWrapping : [],
      ),
    });
  }, [lineWrapping]);

  // Scroll to line
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !scrollToLine) return;

    const lineCount = view.state.doc.lines;
    const targetLine = Math.min(scrollToLine, lineCount);
    const line = view.state.doc.line(targetLine);

    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
  }, [scrollToLine]);

  const style = useMemo<React.CSSProperties>(
    () => ({
      minHeight: minHeight || "100%",
      maxHeight: maxHeight,
      overflow: maxHeight ? "hidden" : undefined,
    }),
    [minHeight, maxHeight],
  );

  return (
    <div
      ref={containerRef}
      className={`bronson-editor ${className}`}
      style={style}
    />
  );
}
