import { Decoration, WidgetType, EditorView } from "@codemirror/view";
import { RangeSet, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { keymap } from "@codemirror/view";

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

            cell.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                this.showContextMenu(event as MouseEvent, cell as HTMLElement);
            });

            cell.addEventListener("keydown", (event) => {
                this.handleCellKeydown(
                    event as KeyboardEvent,
                    cell as HTMLElement,
                    container
                );
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

        // Take in count the separator row
        if (index <= 1) {
            // Swap the second an third row if adding above the separator
            [lines[1], lines[2]] = [lines[2], lines[1]];
        }

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

    private deleteRow(rowIndex: number) {
        const lines = this.source.split("\n");
        lines.splice(rowIndex, 1);

        // Take in count the separator row
        if (rowIndex == 0) {
            [lines[0], lines[1]] = [lines[1], lines[0]];
        }

        this.updateTableSource(lines.join("\n"));
    }

    private deleteColumn(colIndex: number) {
        const lines = this.source.split("\n");
        const deleteIndex = colIndex + 1; // Account for leading pipe

        const updatedLines = lines.map((line) => {
            if (!line.trim()) return line;
            const cells = line.split("|");
            cells.splice(deleteIndex, 1);
            return cells.join("|");
        });

        this.updateTableSource(updatedLines.join("\n"));
    }

    private moveRowUp(rowIndex: number) {
        if (rowIndex <= 0) return; // Can't move header row or first data row above header

        const lines = this.source.split("\n");

        // Handle separator row (skip it in calculations)

        if (rowIndex >= lines.length) return;

        // Swap with previous row
        [lines[rowIndex], lines[rowIndex - 1]] = [
            lines[rowIndex - 1],
            lines[rowIndex],
        ];

        this.updateTableSource(lines.join("\n"));
    }

    private moveRowDown(rowIndex: number) {
        const lines = this.source.split("\n");

        // Handle separator row (skip it in calculations)
        let actualRowIndex = rowIndex;

        if (actualRowIndex >= lines.length - 1) return; // Can't move last row down

        // Swap with next row
        [lines[actualRowIndex], lines[actualRowIndex + 1]] = [
            lines[actualRowIndex + 1],
            lines[actualRowIndex],
        ];

        this.updateTableSource(lines.join("\n"));
    }

    private moveColumnLeft(colIndex: number) {
        if (colIndex <= 0) return; // Can't move leftmost column

        const lines = this.source.split("\n");
        const moveIndex = colIndex + 1; // Account for leading pipe

        const updatedLines = lines.map((line) => {
            if (!line.trim()) return line;
            const cells = line.split("|");

            // Swap columns
            [cells[moveIndex], cells[moveIndex - 1]] = [
                cells[moveIndex - 1],
                cells[moveIndex],
            ];

            return cells.join("|");
        });

        this.updateTableSource(updatedLines.join("\n"));
    }

    private moveColumnRight(colIndex: number) {
        const lines = this.source.split("\n");
        const firstLine = lines[0];
        const maxCols = firstLine.split("|").length - 2; // Exclude leading/trailing pipes

        if (colIndex >= maxCols - 1) return; // Can't move rightmost column

        const moveIndex = colIndex + 1; // Account for leading pipe

        const updatedLines = lines.map((line) => {
            if (!line.trim()) return line;
            const cells = line.split("|");

            // Swap columns
            [cells[moveIndex], cells[moveIndex + 1]] = [
                cells[moveIndex + 1],
                cells[moveIndex],
            ];

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

    private showContextMenu(event: MouseEvent, cell: HTMLElement): void {
        const row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");

        // Remove any existing context menu
        this.removeContextMenu();

        const menu = document.createElement("div");
        menu.className = "table-context-menu";
        menu.style.setProperty("--menu-x", `${event.pageX}px`);
        menu.style.setProperty("--menu-y", `${event.pageY}px`);

        const menuItems = [
            { text: "Add Row Above", action: () => this.addRow(row) },
            { text: "Add Row Below", action: () => this.addRow(row + 1) },
            { text: "Add Column Left", action: () => this.addColumn(col) },
            { text: "Add Column Right", action: () => this.addColumn(col + 1) },
            { text: "---", action: null }, // Separator
            { text: "Move Row Up", action: () => this.moveRowUp(row) },
            { text: "Move Row Down", action: () => this.moveRowDown(row) },
            {
                text: "Move Column Left",
                action: () => this.moveColumnLeft(col),
            },
            {
                text: "Move Column Right",
                action: () => this.moveColumnRight(col),
            },
            { text: "---", action: null }, // Separator
            { text: "Delete Row", action: () => this.deleteRow(row) },
            { text: "Delete Column", action: () => this.deleteColumn(col) },
        ];

        menuItems.forEach((item) => {
            if (item.text === "---") {
                const separator = document.createElement("div");
                separator.className = "table-context-menu-separator";
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement("div");
                menuItem.className = "table-context-menu-item";
                menuItem.textContent = item.text;

                if (item.action) {
                    menuItem.addEventListener("click", () => {
                        item.action!();
                        this.removeContextMenu();
                    });
                }

                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                this.removeContextMenu();
                document.removeEventListener("click", closeMenu);
                document.removeEventListener("keydown", closeMenuOnEsc);
            }
        };

        const closeMenuOnEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                this.removeContextMenu();
                document.removeEventListener("click", closeMenu);
                document.removeEventListener("keydown", closeMenuOnEsc);
            }
        };

        setTimeout(() => {
            document.addEventListener("click", closeMenu);
            document.addEventListener("keydown", closeMenuOnEsc);
        }, 0);
    }

    private removeContextMenu(): void {
        const existingMenu = document.querySelector(".table-context-menu");
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    private handleCellKeydown(
        event: KeyboardEvent,
        cell: HTMLElement,
        container: HTMLElement
    ): void {
        let row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");
        const table = container.querySelector("table");
        if (!table) return;

        const maxRow = table.rows.length; // Not -1 because we include the separator row
        const maxCol = table.rows[0].cells.length - 1;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (row === maxRow) {
                    // Exit table when at the last row
                    if (this.editorView && this.tablePosition) {
                        const pos = this.tablePosition.to + 1;
                        this.editorView.focus();
                        this.editorView.dispatch({
                            selection: { anchor: pos, head: pos },
                        });
                    }
                } else {
                    if (row === 0) {
                        row += 1; // Take in count the separator row
                    }
                    this.focusCellAt(container, row + 1, col);
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (row === 0) {
                    // Exit table when at the first row
                    if (this.editorView && this.tablePosition) {
                        const pos = this.tablePosition.from - 1;
                        this.editorView.focus();
                        this.editorView.dispatch({
                            selection: { anchor: pos, head: pos },
                        });
                    }
                } else {
                    if (row === 2) {
                        row -= 1; // Take in count the separator row
                    }
                    this.focusCellAt(container, row - 1, col);
                }
                break;
            case "Tab":
                event.preventDefault();
                if (event.shiftKey) {
                    // Shift+Tab: move to previous cell
                    if (row === 0 && col === 0) {
                        // Exit table from the top
                        if (this.editorView && this.tablePosition) {
                            const pos = this.tablePosition.from - 1;
                            this.editorView.focus();
                            this.editorView.dispatch({
                                selection: { anchor: pos, head: pos },
                            });
                        }
                    } else {
                        // Move to previous cell. It is done this way to place the cursor at the end of the cell
                        const prevCol = col - 1 >= 0 ? col - 1 : maxCol;
                        let prevRow = col === 0 ? row - 1 : row;
                        if (prevRow === 1) {
                            prevRow -= 1; // Take in count the separator row
                        }
                        this.focusCellAt(container, prevRow, prevCol);
                    }
                } else {
                    // Tab: move to next cell
                    if (col === maxCol && row === maxRow) {
                        // Exit table and focus editor after the table
                        if (this.editorView && this.tablePosition) {
                            const pos = this.tablePosition.to + 1;
                            this.editorView.focus();
                            this.editorView.dispatch({
                                selection: { anchor: pos, head: pos },
                            });
                        }
                    } else {
                        // Move to next cell. It is done this way to place the cursor at the end of the cell
                        const nextCol = col + 1 <= maxCol ? col + 1 : 0;
                        let nextRow = nextCol === 0 ? row + 1 : row;
                        if (nextRow === 1) {
                            // Take in count the separator row
                            nextRow += 1;
                        }
                        this.focusCellAt(container, nextRow, nextCol);
                    }
                }
        }
    }

    private focusCellAt(
        container: HTMLElement,
        row: number,
        col: number
    ): void {
        const targetCell = container.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        ) as HTMLElement;

        if (targetCell) {
            targetCell.focus();
            // Place cursor at the beginning of the cell
            const range = document.createRange();
            const selection = window.getSelection();
            if (selection) {
                range.setStart(targetCell, targetCell.childNodes.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Checks if the cursor position is at the top of the table
    public shouldEnterTableFromTop(cursorPos: number): boolean {
        if (!this.tablePosition) return false;
        return cursorPos === this.tablePosition.from - 1;
    }

    // Checks if the cursor position is at the bottom of the table
    public shouldEnterTableFromBottom(cursorPos: number): boolean {
        if (!this.tablePosition) return false;
        return cursorPos === this.tablePosition.to + 1;
    }

    // Focuses the first cell when entering from the top
    public enterTableFromTop(container: HTMLElement): void {
        const firstCell = container.querySelector(
            ".md-editable-cell"
        ) as HTMLElement;

        if (firstCell) {
            firstCell.focus();
            // Place cursor at the end of the cell
            const range = document.createRange();
            const selection = window.getSelection();
            if (selection) {
                range.setStart(firstCell, firstCell.childNodes.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Focuses the last cell when entering from the bottom
    public enterTableFromBottom(container: HTMLElement): void {
        const lastCell = container.querySelector(
            "tr:last-child .md-editable-cell"
        ) as HTMLElement;

        if (lastCell) {
            lastCell.focus();
            // Place cursor at the end of the cell
            const range = document.createRange();
            const selection = window.getSelection();
            if (selection) {
                range.setStart(lastCell, lastCell.childNodes.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    public enterTableFromLeft(container: HTMLElement): void {
        const firstCell = container.querySelector(
            "tr:last-child .md-editable-cell:last-child"
        ) as HTMLElement;

        if (firstCell) {
            firstCell.focus();
            // Place cursor at the end of the cell
            const range = document.createRange();
            const selection = window.getSelection();
            if (selection) {
                range.setStart(firstCell, firstCell.childNodes.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
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

function enterTableFromTopKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = view.dom.querySelectorAll(".cm-table-widget");
    for (const widgetElement of widgets) {
        const widget = (widgetElement as any).__tableWidget;
        if (widget && widget instanceof TableWidget) {
            if (widget.shouldEnterTableFromTop(cursorPos)) {
                widget.enterTableFromTop(widgetElement as HTMLElement);
                return true; // Prevent default behavior
            }
        }
    }
    return false; // Allow default behavior
}

function enterTableFromBottomKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = view.dom.querySelectorAll(".cm-table-widget");
    for (const widgetElement of widgets) {
        const widget = (widgetElement as any).__tableWidget;
        if (widget && widget instanceof TableWidget) {
            if (widget.shouldEnterTableFromBottom(cursorPos)) {
                widget.enterTableFromBottom(widgetElement as HTMLElement);
                return true; // Prevent default behavior
            }
        }
    }
    return false; // Allow default behavior
}

function enterTableFromLeftKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = view.dom.querySelectorAll(".cm-table-widget");
    for (const widgetElement of widgets) {
        const widget = (widgetElement as any).__tableWidget;
        if (widget && widget instanceof TableWidget) {
            if (widget.shouldEnterTableFromBottom(cursorPos)) {
                widget.enterTableFromLeft(widgetElement as HTMLElement);
                return true; // Prevent default behavior
            }
        }
    }
    return false; // Allow default behavior
}

const tableKeymap = [
    {
        key: "ArrowRight",
        run: (view: EditorView) => {
            return enterTableFromTopKeymap(view);
        },
    },
    {
        key: "ArrowDown",
        run: (view: EditorView) => {
            return enterTableFromTopKeymap(view);
        },
    },
    {
        key: "ArrowLeft",
        run: (view: EditorView) => {
            return enterTableFromLeftKeymap(view);
        },
    },
    {
        key: "ArrowUp",
        run: (view: EditorView) => {
            return enterTableFromBottomKeymap(view);
        },
    },
];

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

        keymap.of(tableKeymap),
    ];
}
