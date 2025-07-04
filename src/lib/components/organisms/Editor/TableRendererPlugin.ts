import { Decoration, WidgetType, EditorView } from "@codemirror/view";
import { RangeSet, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

import type { DecorationSet } from "@codemirror/view";
import type { EditorState, Extension, Range } from "@codemirror/state";

class TableWidget extends WidgetType {
    rendered: string;
    private editorView: EditorView | null = null;
    public tablePosition: { from: number; to: number } | null = null;
    public isEditing: boolean = false;

    constructor(public source: string, from: number, to: number) {
        super();

        this.tablePosition = { from, to };

        // Parse the source as markdown table and convert to HTML
        const lines = source.split("\n");
        let html = '<table class="md-table">';

        for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
            const line = lines[rowIndex];
            const trimmed = line.trim();
            if (
                /^[\|\s\-:]+$/.test(trimmed) &&
                trimmed.includes("-") &&
                trimmed.includes("|")
            )
                continue; // Skip separator rows

            const cells = line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim());
            const tag = rowIndex === 0 ? "th" : "td";

            html += "<tr>";
            for (let colIndex = 0; colIndex < cells.length; colIndex++) {
                const cell = cells[colIndex];
                html += `<${tag} class="md-editable-cell" contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}">${cell}</${tag}>`;
            }
            html += "</tr>";
        }

        html += "</table>";
        this.rendered = html;
    }

    setEditorContext(editorView: EditorView | null) {
        this.editorView = editorView;
    }

    eq(widget: TableWidget): boolean {
        // Don't rerender if currently editing
        if (this.isEditing || widget.isEditing) return true;
        return (
            this.source === widget.source &&
            this.tablePosition === widget.tablePosition
        );
    }

    toDOM(): HTMLElement {
        let content = document.createElement("div");
        content.className = "cm-table-widget";
        content.innerHTML = this.rendered;

        // Store reference to this widget instance
        (content as any).__tableWidget = this;

        this.addCellEventListeners(content);
        this.addHoverButtons(content);

        return content;
    }

    private addCellEventListeners(container: HTMLElement): void {
        const cells = container.querySelectorAll(".md-editable-cell");
        cells.forEach((cell) => {
            cell.addEventListener("input", (event) =>
                this.onCellInput(event?.target as HTMLElement)
            );

            cell.addEventListener("focus", () => {
                this.isEditing = true;
            });

            cell.addEventListener("blur", () => {
                this.isEditing = false;
            });
        });
    }

    private addHoverButtons(content: HTMLElement) {
        const table = content.querySelector("table");
        if (!table) return;

        const addColBtn = document.createElement("button");
        addColBtn.className = "table-button add-col-btn";
        addColBtn.textContent = "+";
        addColBtn.onclick = () => {
            const firstRow = table.querySelector("tr");
            const colCount = firstRow
                ? firstRow.querySelectorAll("th, td").length
                : 0;
            this.addColumn(colCount);
        };

        content.appendChild(addColBtn);

        const addRowBtn = document.createElement("button");
        addRowBtn.className = "table-button add-row-btn";
        addRowBtn.textContent = "+";
        addRowBtn.onclick = () =>
            this.addRow(table.querySelectorAll("tr").length + 1); // + 1 to add for the separator row

        content.appendChild(addRowBtn);
    }

    private onCellInput(cell: HTMLElement) {
        if (!this.editorView || !this.tablePosition) return;

        // Get cell position data
        const row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");

        // Get the new cell content
        const newContent = cell.textContent || "";

        // Rebuild the entire table with the new content
        this.updateTableInEditor(newContent, row, col);
    }

    private updateTableInEditor(newContent: string, row: number, col: number) {
        if (!this.editorView || !this.tablePosition) return;

        // Adjust column index to account for leading pipe
        col = col + 1;

        // Parse current table and update specific cell
        const lines = this.source.split("\n");
        const line = lines[row];
        const cells = line.split("|");

        if (cells.length <= col) {
            console.warn("Column index out of bounds");
            return;
        }

        // Update the specific cell
        cells[col] = ` ${newContent} `;
        const updatedLine = `${cells.join("|")}`;

        // Reconstruct the entire table preserving original structure
        lines[row] = updatedLine;

        const newTableSource = lines.join("\n");

        // Dispatch transaction to update editor
        this.editorView.dispatch({
            changes: {
                from: this.tablePosition.from,
                to: this.tablePosition.to,
                insert: newTableSource,
            },
        });

        // Update the source
        this.source = newTableSource;

        // Update the table position for future edits
        const newToPosition = this.tablePosition.from + newTableSource.length;
        this.tablePosition = {
            from: this.tablePosition.from,
            to: newToPosition,
        };
    }

    private addRow(index: number) {
        const lines = this.source.split("\n");

        const colCount = lines[0].split("|").length - 2; // Exclude leading/trailing
        const newRow =
            "|" +
            " "
                .repeat(colCount)
                .split("")
                .map(() => "   ")
                .join("|") +
            "|";

        lines.splice(index, 0, newRow);
        this.updateTableSource(lines.join("\n"));
    }

    private addColumn(index: number) {
        const lines = this.source.split("\n");

        const updatedLines = lines.map((line, idx) => {
            if (!line.trim()) return line;

            const cells = line.split("|");

            // Handle separator row
            // index + 1 to account for leading pipe
            if (idx === 1) {
                cells.splice(index + 1, 0, "---");
            } else {
                cells.splice(index + 1, 0, "   ");
            }

            return cells.join("|");
        });

        this.updateTableSource(updatedLines.join("\n"));
    }

    private updateTableSource(newSource: string) {
        if (!this.editorView || !this.tablePosition) return;

        // Reset editing state so the table gets re-rendered
        this.isEditing = false;

        this.editorView.dispatch({
            changes: {
                from: this.tablePosition.from,
                to: this.tablePosition.to,
                insert: newSource,
            },
        });
    }
}

function renderTables(state: EditorState, from?: number, to?: number) {
    const decorations: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
        from,
        to,
        enter(node) {
            if (node.name !== "Table") return;

            const text = state.doc.sliceString(node.from, node.to);
            const decoration = Decoration.replace({
                widget: new TableWidget(text, node.from, node.to),
                block: true,
            });

            decorations.push(decoration.range(node.from, node.to));
        },
    });

    return decorations;
}

export function tableRendererPlugin(): Extension {
    return [
        StateField.define<DecorationSet>({
            create(state) {
                return RangeSet.of(renderTables(state), true);
            },

            update(decorations, transaction) {
                if (transaction.docChanged) {
                    return RangeSet.of(renderTables(transaction.state), true);
                }

                return decorations.map(transaction.changes);
            },

            provide(field) {
                return EditorView.decorations.from(field);
            },
        }),

        EditorView.updateListener.of((update) => {
            if (update.view) {
                // Find all table widgets and set their editor context
                const widgets =
                    update.view.dom.querySelectorAll(".cm-table-widget");
                widgets.forEach((widgetElement) => {
                    const widget = (widgetElement as any).__tableWidget;
                    if (widget && widget instanceof TableWidget) {
                        // Update the EditorView reference
                        if (widget.tablePosition) {
                            widget.setEditorContext(update.view);
                        }
                    }
                });
            }
        }),
    ];
}
