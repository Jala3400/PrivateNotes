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
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
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
    type KeyBinding,
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
import {
    tableRendererPlugin,
    tableStateField,
    TableWidget,
} from "./TableRendererPlugin";
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

export class CodeMirrorEditor {
    private view: EditorView | null = null;
    private config: EditorConfig;
    private markdownHighlighting: Extension;
    private customKeymaps: KeyBinding[] = [];
    private customExtensions: Extension[] = [];

    constructor(config: EditorConfig = {}) {
        this.config = config;

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
    mount(
        parent: HTMLElement,
        initialContent: string = "",
        keymaps: KeyBinding[] = [],
        extensions: Extension[] = [],
        config?: EditorConfig
    ): EditorView {
        if (config) {
            this.config = { ...this.config, ...config };
        }

        this.customKeymaps = keymaps;
        this.customExtensions = extensions;

        const state = EditorState.create({
            doc: initialContent,
            extensions: this.buildExtensions(),
        });

        this.view = new EditorView({
            state,
            parent,
        });

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
        this.reconfigureExtensions();
    }

    /**
     * Update custom keymaps
     */
    updateKeymaps(keymaps: KeyBinding[]): void {
        this.customKeymaps = keymaps;
        this.reconfigureExtensions();
    }

    /**
     * Update custom extensions
     */
    updateExtensions(extensions: Extension[]): void {
        this.customExtensions = extensions;
        this.reconfigureExtensions();
    }

    /**
     * Reconfigure editor extensions by dispatching effects
     */
    private reconfigureExtensions(): void {
        if (this.view) {
            this.view.dispatch({
                effects: [StateEffect.reconfigure.of(this.buildExtensions())],
            });
        }
    }

    /**
     * Build all extensions combining custom extensions, config-based extensions, and custom keymaps
     */
    private buildExtensions(): Extension[] {
        return this.customExtensions.concat(
            this.createExtensions(this.customKeymaps)
        );
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
     * Get the table widget and cell position if cursor is in a table cell
     */
    getTableContext(): {
        widget: TableWidget;
        row: number;
        col: number;
    } | null {
        if (!this.view) return null;

        const field = this.view.state.field(tableStateField, false);
        if (!field) return null;

        // Check if the active element is a table cell
        const activeElement = document.activeElement;
        if (
            !activeElement ||
            !activeElement.classList.contains("md-editable-cell")
        ) {
            return null;
        }

        // Find the table widget containing this cell
        let foundWidget: TableWidget | null = null;
        field.between(0, this.view.state.doc.length, (from, to, value) => {
            if (foundWidget) return false;
            if (value.spec.widget instanceof TableWidget) {
                const widget = value.spec.widget as TableWidget;
                // Check if the active cell is within this widget's DOM
                if (widget.widget && widget.widget.contains(activeElement)) {
                    foundWidget = widget;
                    return false;
                }
            }
        });

        if (!foundWidget) return null;

        // Type assertion to help TypeScript understand this is definitely a TableWidget
        const tableWidget = foundWidget as TableWidget;

        // Get cell position from the widget
        const cellPos = tableWidget.getCurrentCellPosition();
        if (!cellPos) return null;

        return { widget: tableWidget, row: cellPos.row, col: cellPos.col };
    }

    /**
     * Create extensions based on current configuration
     */
    private createExtensions(customKeymaps: KeyBinding[] = []): Extension[] {
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

        // Keymaps for wrapping selected text with markdown characters
        const wrapKeymaps: KeyBinding[] = ["*", "`", "_", "|", "~", "^"].map(
            (char) => ({
                key: char,
                run: (view: EditorView) => {
                    if (
                        view.state.selection.main.from !==
                        view.state.selection.main.to
                    ) {
                        this.wrapSelection(char, char);
                        return true;
                    }
                    return false;
                },
            })
        );

        // Create keymap array based on config
        const keymaps = [
            ...wrapKeymaps,
            ...customKeymaps,
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
