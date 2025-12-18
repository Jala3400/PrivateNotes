import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    foldKeymap,
    HighlightStyle,
    indentOnInput,
    indentUnit,
    syntaxHighlighting,
} from "@codemirror/language";
import {
    highlightSelectionMatches,
    searchKeymap,
} from "@codemirror/search";
import { EditorState, StateEffect } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import {
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
} from "@codemirror/view";
import { classHighlighter, tags } from "@lezer/highlight";
import {
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TaskList,
} from "@lezer/markdown";
import { vim } from "@replit/codemirror-vim";
import { selectedLinePlugin } from "./SelectedLinePlugin";
import { syntaxCorePlugin } from "./SyntaxCorePlugin";
import { tableRendererPlugin } from "./TableRendererPlugin";
import { spoilerExtension } from "./SpoilerParser";

export interface EditorConfig {
    renderMd?: boolean;
    vimMode?: boolean;
    lineNumbers?: boolean;
    lineWrapping?: boolean;
    autoCloseBrackets?: boolean;
    foldGutter?: boolean;
    tabSize?: number;
}

export interface EditorCallbacks {
    onContentChange?: () => void;
    onContextMenu?: (event: MouseEvent) => void;
}

export class CodeMirrorEditor {
    private view: EditorView | null = null;
    private config: EditorConfig;
    private callbacks: EditorCallbacks;
    private markdownHighlighting: Extension;

    constructor(config: EditorConfig = {}, callbacks: EditorCallbacks = {}) {
        this.config = config;
        this.callbacks = callbacks;

        // Create custom markdown highlighting style
        const highlightStyle = HighlightStyle.define([
            { tag: tags.heading1, class: "md-h1" },
            { tag: tags.heading2, class: "md-h2" },
            { tag: tags.heading3, class: "md-h3" },
            { tag: tags.heading4, class: "md-h4" },
            { tag: tags.heading5, class: "md-h5" },
            { tag: tags.heading6, class: "md-h6" },
            { tag: tags.monospace, class: "md-code-inline" },
            { tag: tags.quote, class: "md-quote" },
            { tag: tags.list, class: "md-list-item" },
            { tag: tags.strikethrough, class: "md-strikethrough" },
        ]);
        this.markdownHighlighting = syntaxHighlighting(highlightStyle);
    }

    /**
     * Initialize the editor and attach it to a DOM element
     */
    mount(parent: HTMLElement, initialContent: string = ""): EditorView {
        const state = EditorState.create({
            doc: initialContent,
            extensions: this.createExtensions(),
        });

        this.view = new EditorView({
            state,
            parent,
        });

        // Add context menu event listener if callback provided
        if (this.callbacks.onContextMenu) {
            this.view.dom.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                this.callbacks.onContextMenu?.(event);
            });
        }

        return this.view;
    }

    /**
     * Destroy the editor and clean up resources
     */
    destroy(): void {
        if (this.view) {
            this.view.destroy();
            this.view = null;
        }
    }

    /**
     * Get the current editor content
     */
    getContent(): string {
        return this.view ? this.view.state.doc.toString() : "";
    }

    /**
     * Set the editor content
     */
    setContent(content: string): void {
        if (!this.view) return;

        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: content,
            },
        });
    }

    /**
     * Update the editor configuration
     */
    updateConfig(newConfig: EditorConfig): void {
        this.config = { ...this.config, ...newConfig };
        
        if (this.view) {
            this.view.dispatch({
                effects: [StateEffect.reconfigure.of(this.createExtensions())],
            });
        }
    }

    /**
     * Get the EditorView instance
     */
    getView(): EditorView | null {
        return this.view;
    }

    /**
     * Focus the editor
     */
    focus(): void {
        this.view?.focus();
    }

    /**
     * Insert text at the current cursor position
     */
    insertText(text: string): void {
        if (!this.view) return;

        const pos = this.view.state.selection.main.head;
        this.view.dispatch({
            changes: { from: pos, insert: text },
        });
    }

    /**
     * Insert text at the beginning of the current line
     */
    insertAtLineStart(text: string): void {
        if (!this.view) return;

        const pos = this.view.state.selection.main.head;
        const line = this.view.state.doc.lineAt(pos);
        const lineStart = line.from;

        this.view.dispatch({
            changes: { from: lineStart, insert: text },
            selection: { anchor: lineStart + text.length },
        });
    }

    /**
     * Wrap the current selection with the given strings
     */
    wrapSelection(before: string, after: string): void {
        if (!this.view) return;

        const selection = this.view.state.selection.main;
        const selectedText = this.view.state.doc.sliceString(
            selection.from,
            selection.to
        );

        const wrappedText = selectedText
            ? `${before}${selectedText}${after}`
            : `${before}${after}`;

        this.view.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: wrappedText,
            },
            selection: selectedText
                ? {
                      anchor: selection.from,
                      head: selection.from + wrappedText.length,
                  }
                : {
                      anchor: selection.from + before.length,
                      head: selection.from + before.length,
                  },
        });
    }

    /**
     * Create extensions based on current configuration
     */
    private createExtensions(): Extension[] {
        const extensions: Extension[] = [
            // Only render custom markdown plugins if renderMd is enabled
            ...(this.config.renderMd
                ? [
                      markdown({
                          extensions: [
                              Table,
                              Strikethrough,
                              TaskList,
                              Superscript,
                              Subscript,
                              spoilerExtension,
                          ],
                      }),
                      syntaxHighlighting(classHighlighter),
                      this.markdownHighlighting,
                      tableRendererPlugin(),
                      syntaxCorePlugin(),
                  ]
                : []),

            // Basic editor features
            selectedLinePlugin(),
            highlightSpecialChars(),
            history(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            rectangularSelection(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            highlightSelectionMatches(),
        ];

        // Add content change listener
        if (this.callbacks.onContentChange) {
            extensions.push(
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        this.callbacks.onContentChange?.();
                    }
                })
            );
        }

        // Add vim mode if enabled
        if (this.config.vimMode) {
            extensions.unshift(vim());
        }

        // Add line numbers if enabled
        if (this.config.lineNumbers) {
            extensions.push(lineNumbers());
        }

        // Add line wrapping if enabled
        if (this.config.lineWrapping) {
            extensions.push(EditorView.lineWrapping);
        }

        // Add auto-close brackets if enabled
        if (this.config.autoCloseBrackets) {
            extensions.push(closeBrackets());
            extensions.push(autocompletion());
        }

        // Add fold gutter if enabled
        if (this.config.foldGutter) {
            extensions.push(foldGutter());
        }

        // Create keymap array based on config
        const keymaps = [
            {
                key: "Ctrl-g",
                run: () => true,
                // It is used in the front end to save a copy of the note
            },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
            ...completionKeymap,
            ...searchKeymap,
        ];

        if (this.config.autoCloseBrackets) {
            keymaps.push(...closeBracketsKeymap);
        }

        if (this.config.foldGutter) {
            keymaps.push(...foldKeymap);
        }

        extensions.push(keymap.of(keymaps));

        // Set tab size/indent unit
        const tabSize = this.config.tabSize || 4;
        extensions.push(indentUnit.of(" ".repeat(tabSize)));

        return extensions;
    }
}
