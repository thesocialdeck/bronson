import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Editor chrome theme - reads from CSS variables
export const bronsonEditorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    backgroundColor: "var(--editor-bg)",
  },
  ".cm-content": {
    padding: "12px 0",
    caretColor: "var(--editor-cursor)",
  },
  ".cm-line": {
    padding: "0 12px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--editor-gutter)",
    color: "var(--foreground-subtle)",
    border: "none",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  ".cm-gutter.cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px",
    minWidth: "40px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--editor-line-highlight)",
    color: "var(--foreground)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-line-highlight)",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--editor-cursor)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "var(--primary-muted)",
  },
  ".cm-scroller": {
    overflow: "auto",
    lineHeight: "22px",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-md)",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "var(--font-mono)",
      fontSize: "13px",
    },
    "& > ul > li": {
      padding: "6px 12px",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "var(--secondary)",
      color: "var(--foreground)",
    },
  },
  ".cm-completionLabel": {
    fontFamily: "var(--font-mono)",
  },
  ".cm-completionDetail": {
    fontStyle: "normal",
    color: "var(--foreground-muted)",
  },
});

// Syntax highlighting styles
export const bronsonHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, color: "var(--syntax-heading-1)", fontWeight: "600" },
  { tag: tags.heading2, color: "var(--syntax-heading-2)", fontWeight: "600" },
  { tag: tags.heading3, color: "var(--syntax-heading-3)", fontWeight: "600" },
  { tag: tags.comment, color: "var(--syntax-comment)" },
  { tag: tags.emphasis, color: "var(--syntax-note)", fontStyle: "italic" },
  { tag: tags.keyword, color: "var(--syntax-recurrence)" },
  { tag: tags.labelName, color: "var(--syntax-field-key)" },
  { tag: tags.string, color: "var(--syntax-time)" },
  { tag: tags.atom, color: "var(--syntax-modifier)" },
  { tag: tags.link, color: "var(--syntax-location)" },
  { tag: tags.variableName, color: "var(--person-default)", fontWeight: "600" },
  { tag: tags.typeName, color: "var(--activity-default)", fontWeight: "600" },
  { tag: tags.bool, color: "var(--success)" },
  { tag: tags.punctuation, color: "var(--syntax-comment)" },
]);

export function bronsonTheme(): Extension {
  return [bronsonEditorTheme, syntaxHighlighting(bronsonHighlightStyle)];
}
