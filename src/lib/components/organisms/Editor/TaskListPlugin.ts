import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { Extension, Range } from "@codemirror/state";

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
        checkbox.className = "task-checkbox";

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

/**
 * Plugin to render interactive task list checkboxes
 */
export function taskListPlugin(): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.selectionSet
                ) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const decorations: Range<Decoration>[] = [];
                const doc = view.state.doc;

                // Iterate through visible lines
                for (let pos = 0; pos < doc.length; ) {
                    const line = doc.lineAt(pos);
                    const lineText = line.text;

                    // Check for task list patterns: - [ ] or - [x]
                    const taskMatch = lineText.match(/^(\s*)- \[([ x])\]/i);

                    if (taskMatch) {
                        const isChecked = taskMatch[2].toLowerCase() === "x";
                        const checkboxStart =
                            line.from + taskMatch[1].length + 2; // Position of the [
                        const checkboxEnd = checkboxStart + 3; // Length of the checkbox "[ ]" or "[x]"

                        // Add styling decoration for the entire task line
                        const lineClass = isChecked
                            ? "task-item-checked"
                            : "task-item-unchecked";

                        const lineDecoration = Decoration.line({
                            class: lineClass,
                        });

                        decorations.push(lineDecoration.range(line.from));

                        // Check if the line is selected or active
                        const selections = view.state.selection.ranges;
                        const isCheckboxSelected = selections.some(
                            ({ from, to }) =>
                                from <= checkboxEnd && to >= checkboxStart
                        );

                        // Only create widget decoration if the checkbox is not selected
                        if (!isCheckboxSelected) {
                            const widget = new TaskCheckboxWidget(
                                isChecked,
                                line.from
                            );

                            const decoration = Decoration.replace({
                                widget,
                                side: -1,
                            });

                            decorations.push(
                                decoration.range(checkboxStart, checkboxEnd)
                            );
                        } else {
                            console.log("skip");
                        }
                    }

                    pos = line.to + 1;
                }

                return Decoration.set(decorations);
            }
        },
        {
            decorations: (v) => v.decorations,
        }
    );
}
