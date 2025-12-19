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
                text: "Insert Superscript",
                action: () => this.editor.insertSuperscript(),
            },
            {
                text: "Insert Subscript",
                action: () => this.editor.insertSubscript(),
            },
            { type: "separator" },
            { text: "Insert Table", action: () => this.editor.insertTable() },
            {
                text: "Insert Task List",
                action: () => this.editor.insertTaskList(),
            },
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
            { type: "separator" },
            {
                text: "Insert Superscript",
                action: () => this.editor.insertSuperscript(),
            },
            {
                text: "Insert Subscript",
                action: () => this.editor.insertSubscript(),
            },
        ];
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
