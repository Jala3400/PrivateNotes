import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { Extension, Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

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
                const { state } = view;
                const { doc } = state;

                // Use syntax tree iteration for better performance
                syntaxTree(state).iterate({
                    enter: (node) => {
                        // Check if we're in a task node
                        if (node.name !== "Task") return;

                        const lineStart = doc.lineAt(node.from).from;
                        const lineEnd = doc.lineAt(node.to).to;
                        const lineText = doc.sliceString(lineStart, lineEnd);

                        // Check for task list patterns: - [ ] or - [x]
                        const taskMatch = lineText.match(/^(\s*)- \[([ x])\]/i);

                        // If no task list pattern is found, skip this line
                        if (!taskMatch) return;

                        const isChecked = taskMatch[2].toLowerCase() === "x";
                        const checkboxStart =
                            lineStart + taskMatch[1].length + 2; // Position of the [
                        const checkboxEnd = checkboxStart + 3; // Length of the checkbox "[ ]" or "[x]"

                        // Add styling decoration for the entire task line
                        const lineClass = isChecked
                            ? "md-task-item-checked"
                            : "md-task-item-unchecked";

                        const lineDecoration = Decoration.line({
                            class: lineClass,
                        });

                        decorations.push(lineDecoration.range(lineStart));

                        // Check if the line is selected or active
                        const selections = state.selection.ranges;
                        const isCheckboxSelected = selections.some(
                            ({ from, to }) =>
                                from <= checkboxEnd && to >= checkboxStart
                        );

                        // Only create widget decoration if the checkbox is not selected
                        if (!isCheckboxSelected) {
                            const widget = new TaskCheckboxWidget(
                                isChecked,
                                lineStart
                            );

                            const decoration = Decoration.replace({
                                widget,
                                side: -1,
                            });

                            decorations.push(
                                decoration.range(checkboxStart, checkboxEnd)
                            );
                        }

                        // Stop further iteration for this node
                        return true;
                    },
                });

                return Decoration.set(decorations);
            }
        },
        {
            decorations: (v) => v.decorations,
        }
    );
}
