import { Decoration, WidgetType, EditorView } from "@codemirror/view";
import { RangeSet, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

import type { DecorationSet } from "@codemirror/view";
import type { EditorState, Extension, Range } from "@codemirror/state";

class TableWidget extends WidgetType {
    rendered: string;
    private editorView: EditorView | null = null;
    public tablePosition: { from: number; to: number } | null = null;
    private isEditing: boolean = false;

    constructor(public source: string, from: number, to: number) {
        super();

        this.tablePosition = { from, to };

        // Parse the source as markdown table and convert to HTML
        const lines = source.trim().split("\n");
        let html = '<table class="md-table">';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.match(/^\|[\s\-\|:]+\|$/)) continue; // Skip separator rows

            const cells = line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim());
            const tag = i === 0 ? "th" : "td";

            html += "<tr>";
            for (const cell of cells) {
                // html += `<${tag}><input class="cell-input" value ="${cell}"</${tag}>`;
                html += `<${tag} class="md-editable-cell" contenteditable="true">${cell}</${tag}>`;
            }
            html += "</tr>";
        }

        html += "</table>";
        this.rendered = html;
    }

    onCellInput(cell: HTMLElement, cellIndex: number) {
        if (this.editorView && this.tablePosition) {
            const newContent = cell.textContent || "";
            this.updateTableInEditor(cellIndex, newContent);
        }
    }

    setEditorContext(editorView: EditorView | null) {
        this.editorView = editorView;
    }

    eq(widget: TableWidget): boolean {
        // Don't rerender if currently editing
        if (this.isEditing || widget.isEditing) return true;
        return this.source === widget.source;
    }

    toDOM(): HTMLElement {
        let content = document.createElement("div");
        content.className = "cm-table-widget";
        content.innerHTML = this.rendered;

        // Store reference to this widget instance
        (content as any).__tableWidget = this;

        // Attach event listeners to all editable cells
        const cells = content.querySelectorAll(".md-editable-cell");
        cells.forEach((cell, cellIndex) => {
            cell.addEventListener("input", (event) =>
                this.onCellInput(event?.target as HTMLElement, cellIndex)
            );

            cell.addEventListener("focus", () => {
                this.isEditing = true;
            });

            cell.addEventListener("blur", () => {
                this.isEditing = false;
            });
        });

        return content;
    }

    private updateTableInEditor(cellIndex: number, newContent: string) {
        if (!this.editorView || !this.tablePosition) return;

        // Parse current table and update specific cell
        const lines = this.source.trim().split("\n");

        // Calculate which row and column based on cellIndex, skipping separator rows
        let currentCellIndex = 0;
        let dataRowIndex = 0;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex].trim();

            // Skip separator rows
            if (!line || line.match(/^\|[\s\-\|:]+\|$/)) continue;

            const cells = line.split("|").slice(1, -1);

            for (let colIndex = 0; colIndex < cells.length; colIndex++) {
                if (currentCellIndex === cellIndex) {
                    // Update this cell
                    const updatedCells = [...cells];
                    updatedCells[colIndex] = ` ${newContent} `;
                    const updatedLine = `|${updatedCells.join("|")}|`;

                    // Reconstruct the entire table preserving original structure
                    const updatedLines = [...lines];
                    updatedLines[lineIndex] = updatedLine;

                    const newTableSource = updatedLines.join("\n");

                    // Dispatch transaction to update editor
                    this.editorView.dispatch({
                        changes: {
                            from: this.tablePosition.from,
                            to: this.tablePosition.to,
                            insert: newTableSource,
                        },
                    });
                    return;
                }
                currentCellIndex++;
            }
            dataRowIndex++;
        }
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
