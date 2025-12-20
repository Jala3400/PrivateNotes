import type { CodeMirrorEditor } from "$lib/editor/EditorCore";
import type { TableWidget } from "$lib/editor/TableRendererPlugin";
import {
    contextMenu as contextMenu,
    type ContextMenuItem,
} from "$lib/stores/contextMenu";

/**
 * Editor-specific context menu manager that builds menu items
 * based on the editor context and uses the global context menu store
 */
export class EditorContextMenuManager {
    private editor: CodeMirrorEditor;
    private defaultMenuItems: ContextMenuItem[];

    constructor(editor: CodeMirrorEditor) {
        this.editor = editor;

        // Create default menu items once
        this.defaultMenuItems = [
            {
                text: "Wrap with Italic",
                action: () => this.wrapWithItalic(),
            },
            { text: "Wrap with Bold", action: () => this.wrapWithBold() },
            {
                text: "Wrap with Strikethrough",
                action: () => this.wrapWithStrikethrough(),
            },
            {
                text: "Wrap with Inline Code",
                action: () => this.wrapWithInlineCode(),
            },
            { text: "Wrap with Spoiler", action: () => this.wrapWithSpoiler() },
            {
                text: "Wrap with Superscript",
                action: () => this.wrapWithSuperScript(),
            },
            {
                text: "Wrap with Subscript",
                action: () => this.wrapWithSubScript(),
            },
            {
                text: "Wrap with Code Block",
                action: () => this.wrapWithCodeBlock(),
            },

            { type: "separator" },

            { text: "Insert Table", action: () => this.insertTable() },
            {
                text: "Insert Task List",
                action: () => this.insertTaskList(),
            },
            {
                text: "Insert Numbered List",
                action: () => this.insertNumberedList(),
            },
            {
                text: "Insert Bulleted List",
                action: () => this.insertBulletedList(),
            },
            {
                text: "Insert Blockquote",
                action: () => this.insertBlockquote(),
            },
            {
                text: "Insert Horizontal Rule",
                action: () => this.insertHorizontalRule(),
            },
            { text: "Insert Link", action: () => this.insertLink() },
        ];
    }

    /**
     * Build table context menu items dynamically based on current table context
     */
    private buildTableMenuItems(
        widget: TableWidget,
        row: number,
        col: number
    ): ContextMenuItem[] {
        return [
            { text: "Add Row Above", action: () => widget.addRow(row) },
            { text: "Add Row Below", action: () => widget.addRow(row + 1) },
            { text: "Add Column Left", action: () => widget.addColumn(col) },
            {
                text: "Add Column Right",
                action: () => widget.addColumn(col + 1),
            },

            { type: "separator" },

            { text: "Move Row Up", action: () => widget.moveRowUp(row) },
            { text: "Move Row Down", action: () => widget.moveRowDown(row) },
            {
                text: "Move Column Left",
                action: () => widget.moveColumnLeft(col),
            },
            {
                text: "Move Column Right",
                action: () => widget.moveColumnRight(col),
            },

            { type: "separator" },

            { text: "Delete Row", action: () => widget.deleteRow(row) },
            { text: "Delete Column", action: () => widget.deleteColumn(col) },
        ];
    }

    // * Wrap selection
    /**
     * Wrap selection with italic markers
     */
    private wrapWithItalic(): void {
        this.editor.wrapSelection("*", "*");
    }

    /**
     * Wrap selection with bold markers
     */
    private wrapWithBold(): void {
        this.editor.wrapSelection("**", "**");
    }

    /**
     * Wrap selection with strikethrough markers
     */
    private wrapWithStrikethrough(): void {
        this.editor.wrapSelection("~~", "~~");
    }

    /**
     * Wrap selection with inline code markers
     */
    private wrapWithInlineCode(): void {
        this.editor.wrapSelection("`", "`");
    }
    /**
     * Wrap selection with spoiler markers
     */
    private wrapWithSpoiler(): void {
        this.editor.wrapSelection("||", "||");
    }

    /**
     * Wrap selection with superscript markers
     */
    private wrapWithSuperScript(): void {
        this.editor.wrapSelection("^", "^");
    }

    /**
     * Wrap selection with subscript markers
     */
    private wrapWithSubScript(): void {
        this.editor.wrapSelection("~", "~");
    }

    /**
     * Wrap selection with code block markers
     */
    private wrapWithCodeBlock(): void {
        this.editor.wrapSelection("```\n", "\n```");
    }

    // * Insert elements

    /**
     * Insert a table template at the cursor position
     */
    private insertTable(): void {
        const tableTemplate = `
| Header | Header |
|--------|---------|
| Cell   | Cell   |
`;
        this.editor.insertText(tableTemplate);
    }

    /**
     * Insert a task list at the beginning of the current line
     */
    private insertTaskList(): void {
        this.editor.insertAtLineStart("- [ ] ");
    }

    /**
     * Insert a numbered list at the beginning of the current line
     */
    private insertNumberedList(): void {
        this.editor.insertAtLineStart("1. ");
    }

    /**
     * Insert a bulleted list at the beginning of the current line
     */
    private insertBulletedList(): void {
        this.editor.insertAtLineStart("- ");
    }

    /**
     * Insert a blockquote at the beginning of the current line
     */
    private insertBlockquote(): void {
        this.editor.insertAtLineStart("> ");
    }

    /**
     * Insert a horizontal rule at the cursor position
     */
    private insertHorizontalRule(): void {
        this.editor.insertText("\n---\n");
    }

    /**
     * Insert a link at the cursor position
     */
    private insertLink(): void {
        this.editor.insertText("[Link Text](http://example.com)");
    }

    /**
     * Show context menu at the given position
     */
    show(x: number, y: number): void {
        const tableContext = this.editor.getTableContext();

        const items = tableContext
            ? this.buildTableMenuItems(
                  tableContext.widget,
                  tableContext.row,
                  tableContext.col
              )
            : this.defaultMenuItems;

        contextMenu.show(x, y, items);
    }

    /**
     * Hide context menu
     */
    hide(): void {
        contextMenu.hide();
    }
}
