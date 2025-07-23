import type { Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";

/**
 * Widget for rendering interactive checkboxes in task lists
 */
class TaskCheckboxWidget extends WidgetType {
    readonly checked: boolean;
    readonly pos: number;

    constructor(checked: boolean, pos: number) {
        super();
        this.checked = checked;
        this.pos = pos;
    }

    toDOM(view: EditorView): HTMLElement {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.checked;
        checkbox.className = "md-task-checkbox";

        checkbox.onmousedown = (event) => {
            // Prevent default behavior to avoid focus issues
            event.preventDefault();
            // Stop propagation to avoid triggering other events
            event.stopPropagation();
        };

        checkbox.addEventListener("change", () => {
            const line = view.state.doc.lineAt(this.pos);
            const lineText = line.text;

            // Find the checkbox pattern and toggle it
            const newText = this.checked
                ? lineText.replace(/- \[x\]/i, "- [ ]")
                : lineText.replace(/- \[ \]/, "- [x]");

            view.dispatch({
                changes: {
                    from: line.from,
                    to: line.to,
                    insert: newText,
                },
                selection: { anchor: view.state.selection.main.anchor }, // Maintain cursor position
            });
        });

        return checkbox;
    }

    eq(other: TaskCheckboxWidget): boolean {
        return this.checked === other.checked && this.pos === other.pos;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// Handler for the core plugin
export function decorateTaskList(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const state = view.state;
    const doc = state.doc;
    const lineStart = doc.lineAt(node.from).from;
    const lineEnd = doc.lineAt(node.to).to;
    const lineText = doc.sliceString(lineStart, lineEnd);

    const taskMatch = lineText.match(/^(\s*)- \[([ x])\]/i);
    if (!taskMatch) return;

    const isChecked = taskMatch[2].toLowerCase() === "x";
    const checkboxStart = lineStart + taskMatch[1].length + 2;
    const checkboxEnd = checkboxStart + 3;

    const lineClass = isChecked
        ? "md-task-item-checked"
        : "md-task-item-unchecked";

    const lineDecoration = Decoration.line({ class: lineClass });
    decorations.push(lineDecoration.range(lineStart));
    const selections = state.selection.ranges;

    const isCheckboxSelected = selections.some(
        ({ from, to }) => from <= checkboxEnd && to >= checkboxStart
    );

    if (!isCheckboxSelected) {
        const widget = new TaskCheckboxWidget(isChecked, lineStart);

        // side: -1 means the widget will be placed before the text
        const decoration = Decoration.replace({ widget, side: -1 });

        decorations.push(decoration.range(checkboxStart, checkboxEnd));
    }
}
