import type { EditorView } from "@codemirror/view";
import type { StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { findTableWidgetAtCursor } from "./tableHelpers";

/**
 * Create keymap functions with the table state field
 */
export function createTableKeymapFunctions(
    tableStateField: StateField<DecorationSet>
) {
    /**
     * Enter table from the top when pressing down or right arrow
     */
    function enterTableFromTopKeymap(view: EditorView): boolean {
        const widget = findTableWidgetAtCursor(
            view,
            tableStateField,
            (w, pos) => w.shouldEnterTableFromTop(pos)
        );
        if (widget) {
            widget.enterTableFromTop();
            return true;
        }
        return false;
    }

    /**
     * Enter table from the bottom when pressing up arrow
     */
    function enterTableFromBottomKeymap(view: EditorView): boolean {
        const widget = findTableWidgetAtCursor(
            view,
            tableStateField,
            (w, pos) => w.shouldEnterTableFromBottom(pos)
        );
        if (widget) {
            widget.enterTableFromBottom();
            return true;
        }
        return false;
    }

    /**
     * Enter table from the left when pressing left arrow
     */
    function enterTableFromLeftKeymap(view: EditorView): boolean {
        const widget = findTableWidgetAtCursor(
            view,
            tableStateField,
            (w, pos) => w.shouldEnterTableFromBottom(pos)
        );
        if (widget) {
            widget.enterTableFromLeft();
            return true;
        }
        return false;
    }

    return {
        enterTableFromTopKeymap,
        enterTableFromBottomKeymap,
        enterTableFromLeftKeymap,
    };
}

/**
 * Create keymap configuration for table navigation
 */
export function createTableKeymap(tableStateField: StateField<DecorationSet>) {
    const { enterTableFromTopKeymap, enterTableFromBottomKeymap, enterTableFromLeftKeymap } =
        createTableKeymapFunctions(tableStateField);

    return [
        {
            key: "ArrowRight",
            run: (view: EditorView) => {
                // Enter table from top when pressing right arrow
                return enterTableFromTopKeymap(view);
            },
        },
        {
            key: "ArrowDown",
            run: (view: EditorView) => {
                // Enter table from top when pressing down arrow
                return enterTableFromTopKeymap(view);
            },
        },
        {
            key: "ArrowLeft",
            run: (view: EditorView) => {
                // Enter table from left when pressing left arrow
                return enterTableFromLeftKeymap(view);
            },
        },
        {
            key: "ArrowUp",
            run: (view: EditorView) => {
                // Enter table from bottom when pressing up arrow
                return enterTableFromBottomKeymap(view);
            },
        },
    ];
}
