import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import type { EditorState, Range, StateField } from "@codemirror/state";
import type { EditorView, DecorationSet } from "@codemirror/view";
import { TableWidget } from "./TableWidget";
import { ParsedTable } from "./tableParser";

/**
 * Build table decorations for the given editor state
 */
export function buildTableDecorations(
    state: EditorState,
    from?: number,
    to?: number
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
        from,
        to,
        enter(node) {
            // Check if the node is a Table node
            if (node.name !== "Table") return;

            // Parse the table and get valid end position
            const text = state.doc.sliceString(node.from, node.to);
            const parsedTable = new ParsedTable(text);
            const endPos = parsedTable.getEndPosition(node.from);

            const widget = new TableWidget(
                parsedTable,
                node.from,
                endPos
            );

            const decoration = Decoration.replace({
                widget,
                block: true,
            });

            // Add the decoration to the decorations array
            decorations.push(decoration.range(node.from, endPos));
        },
    });

    return decorations;
}

/**
 * Find a table widget at the cursor position that matches the predicate
 */
export function findTableWidgetAtCursor(
    view: EditorView,
    tableStateField: StateField<DecorationSet>,
    predicate: (widget: TableWidget, cursorPos: number) => boolean
): TableWidget | null {
    const cursorPos = view.state.selection.main.head;
    const field = view.state.field(tableStateField, false);
    if (!field) return null;

    let foundWidget: TableWidget | null = null;
    field.between(0, view.state.doc.length, (from, to, value) => {
        if (foundWidget) return false; // Stop iteration if found
        if (value.spec.widget instanceof TableWidget) {
            const widget = value.spec.widget as TableWidget;
            if (predicate(widget, cursorPos) && widget.widget) {
                foundWidget = widget;
                return false; // Stop iteration
            }
        }
    });
    return foundWidget;
}
