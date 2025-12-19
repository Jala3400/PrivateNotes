import type { CodeMirrorEditor } from "./EditorCore";

export interface ContextMenuItem {
    id: string;
    text: string;
    action: (() => void) | null;
    type?: "item" | "separator";
}

export interface ContextMenuState {
    show: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
}

export class ContextMenuManager {
    private editor: CodeMirrorEditor;
    private state: ContextMenuState = {
        show: false,
        x: 0,
        y: 0,
        items: [],
    };
    private listeners: Set<(state: ContextMenuState) => void> = new Set();

    constructor(editor: CodeMirrorEditor) {
        this.editor = editor;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: ContextMenuState) => void): () => void {
        this.listeners.add(listener);
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state change
     */
    private notify(): void {
        this.listeners.forEach((listener) => listener({ ...this.state }));
    }

    /**
     * Build context menu items based on editor context
     */
    private buildMenuItems(): ContextMenuItem[] {
        const tableContext = this.editor.getTableContext();

        if (tableContext) {
            const { widget, row, col } = tableContext;
            return [
                {
                    id: "add-row-above",
                    text: "Add Row Above",
                    action: () => widget.addRow(row),
                    type: "item",
                },
                {
                    id: "add-row-below",
                    text: "Add Row Below",
                    action: () => widget.addRow(row + 1),
                    type: "item",
                },
                {
                    id: "add-col-left",
                    text: "Add Column Left",
                    action: () => widget.addColumn(col),
                    type: "item",
                },
                {
                    id: "add-col-right",
                    text: "Add Column Right",
                    action: () => widget.addColumn(col + 1),
                    type: "item",
                },
                {
                    id: "separator-1",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "move-row-up",
                    text: "Move Row Up",
                    action: () => widget.moveRowUp(row),
                    type: "item",
                },
                {
                    id: "move-row-down",
                    text: "Move Row Down",
                    action: () => widget.moveRowDown(row),
                    type: "item",
                },
                {
                    id: "move-col-left",
                    text: "Move Column Left",
                    action: () => widget.moveColumnLeft(col),
                    type: "item",
                },
                {
                    id: "move-col-right",
                    text: "Move Column Right",
                    action: () => widget.moveColumnRight(col),
                    type: "item",
                },
                {
                    id: "separator-2",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "delete-row",
                    text: "Delete Row",
                    action: () => widget.deleteRow(row),
                    type: "item",
                },
                {
                    id: "delete-col",
                    text: "Delete Column",
                    action: () => widget.deleteColumn(col),
                    type: "item",
                },
                {
                    id: "separator-3",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "superscript",
                    text: "Insert Superscript",
                    action: () => this.editor.insertSuperscript(),
                    type: "item",
                },
                {
                    id: "subscript",
                    text: "Insert Subscript",
                    action: () => this.editor.insertSubscript(),
                    type: "item",
                },
            ];
        } else {
            return [
                {
                    id: "superscript",
                    text: "Insert Superscript",
                    action: () => this.editor.insertSuperscript(),
                    type: "item",
                },
                {
                    id: "subscript",
                    text: "Insert Subscript",
                    action: () => this.editor.insertSubscript(),
                    type: "item",
                },
                {
                    id: "separator-1",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "table",
                    text: "Insert Table",
                    action: () => this.editor.insertTable(),
                    type: "item",
                },
                {
                    id: "tasklist",
                    text: "Insert Task List",
                    action: () => this.editor.insertTaskList(),
                    type: "item",
                },
            ];
        }
    }

    /**
     * Show context menu at the given position
     */
    show(x: number, y: number): void {
        this.state = {
            show: true,
            x,
            y,
            items: this.buildMenuItems(),
        };
        this.notify();
    }

    /**
     * Hide context menu
     */
    hide(): void {
        this.state = {
            ...this.state,
            show: false,
        };
        this.notify();
    }

    /**
     * Execute a menu item action
     */
    executeItem(itemId: string): void {
        const item = this.state.items.find((i) => i.id === itemId);
        if (item?.action) {
            item.action();
            this.hide();
            this.editor.focus();
        }
    }

    /**
     * Get current state
     */
    getState(): ContextMenuState {
        return { ...this.state };
    }
}
