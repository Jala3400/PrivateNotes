import { syntaxTree } from "@codemirror/language";
import { RangeSet, StateField } from "@codemirror/state";
import { Decoration, EditorView, keymap, WidgetType } from "@codemirror/view";

import type { EditorState, Extension, Range } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";

class TableWidget extends WidgetType {
    private editorView: EditorView | null = null;
    private source: string;
    private isEditing: boolean = false;
    public tablePosition: { from: number; to: number } | null = null;
    public widget: HTMLDivElement | null = null;

    constructor(source: string, from: number, to: number) {
        super();
        this.tablePosition = { from, to };
        this.source = source;
    }

    setView(view: EditorView) {
        this.editorView = view;
    }

    // Checks if this widget should be rerendered
    eq(widget: TableWidget): boolean {
        // Don't rerender if currently editing or the table loses focus
        // todo: check if the rerenderin is really necessary
        return this.isEditing;
    }

    // Converts the widget to a DOM element
    toDOM(): HTMLElement {
        let content = document.createElement("div");
        content.className = "cm-table-widget";

        // Generate the HTML table from the source
        const lines = this.source.split("\n");
        let html = '<table class="md-table">';
        for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
            const line = lines[rowIndex];
            const trimmed = line.trim();

            // Skip separator lines
            if (
                /^[\|\s\-:]+$/.test(trimmed) &&
                trimmed.includes("-") &&
                trimmed.includes("|")
            )
                continue;

            // Split the line into cells
            const cells = line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim());
            const tag = rowIndex === 0 ? "th" : "td";

            // For each cell, create a table cell
            html += "<tr>";
            for (let colIndex = 0; colIndex < cells.length; colIndex++) {
                const cell = cells[colIndex];
                html += `<${tag} class="md-editable-cell" contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}">${cell}</${tag}>`;
            }
            html += "</tr>";
        }

        html += "</table>";
        content.innerHTML = html;

        // Add extra functionality
        this.addCellEventListeners(content);
        this.addHoverButtons(content);

        this.widget = content;

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
                event.stopPropagation();
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

        // Add column button
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

        // Add row button
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

        // Validate row and column indices
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
        // Split the source into lines
        const lines = this.source.split("\n");

        const colCount = lines[0].split("|").length - 2; // Exclude leading/trailing pipes
        const newRow =
            "|" +
            " "
                .repeat(colCount)
                .split("")
                .map(() => "   ")
                .join("|") +
            "|";

        // Insert the new row at the specified index
        lines.splice(index, 0, newRow);

        // Take in count the separator row
        if (index <= 1) {
            // Swap the second an third row if adding above the separator
            [lines[1], lines[2]] = [lines[2], lines[1]];
        }

        // Commit the changes to the editor
        this.updateTableSource(lines.join("\n"));
    }

    private addColumn(index: number) {
        // Split the source into lines
        const lines = this.source.split("\n");

        // Add a new column to each row
        const updatedLines = lines.map((line, idx) => {
            // Skip empty lines
            if (!line.trim()) return line;

            // Split the line into cells
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

        // Commit the changes to the editor
        this.updateTableSource(updatedLines.join("\n"));
    }

    private deleteRow(rowIndex: number) {
        // Split the source into lines
        const lines = this.source.split("\n");

        // Delete the specified row
        lines.splice(rowIndex, 1);

        // Take in count the separator row
        if (rowIndex == 0) {
            // Swap the first and second rows if deleting the header
            [lines[0], lines[1]] = [lines[1], lines[0]];
        }

        // Commit the changes to the editor
        this.updateTableSource(lines.join("\n"));
    }

    private deleteColumn(colIndex: number) {
        // Split the source into lines
        const lines = this.source.split("\n");

        const deleteIndex = colIndex + 1; // Account for leading pipe

        // Delete the specified column from each row
        const updatedLines = lines.map((line) => {
            // Skip empty lines
            if (!line.trim()) return line;

            // Split the line into cells
            const cells = line.split("|");

            // Delete the specified column
            cells.splice(deleteIndex, 1);

            return cells.join("|");
        });

        // Commit the changes to the editor
        this.updateTableSource(updatedLines.join("\n"));
    }

    private moveRowUp(rowIndex: number) {
        if (rowIndex <= 0) return; // Can't move first row up

        // Split the source into lines
        const lines = this.source.split("\n");

        // Validate row index
        if (rowIndex >= lines.length) return;

        const destRowIndex = rowIndex == 2 ? 0 : rowIndex - 1;

        // Swap with previous row
        [lines[rowIndex], lines[destRowIndex]] = [
            lines[destRowIndex],
            lines[rowIndex],
        ];

        // Commit the changes to the editor
        this.updateTableSource(lines.join("\n"));
    }

    private moveRowDown(rowIndex: number) {
        // Split the source into lines
        const lines = this.source.split("\n");

        // Handle separator row (skip it in calculations)
        let actualRowIndex = rowIndex;

        if (actualRowIndex >= lines.length - 1) return; // Can't move last row down

        const destRowIndex = rowIndex == 0 ? 2 : rowIndex + 1;

        // Swap with next row
        [lines[actualRowIndex], lines[destRowIndex]] = [
            lines[destRowIndex],
            lines[actualRowIndex],
        ];

        this.updateTableSource(lines.join("\n"));
    }

    private moveColumnLeft(colIndex: number) {
        if (colIndex <= 0) return; // Can't move left leftmost column

        // Split the source into lines
        const lines = this.source.split("\n");

        const moveIndex = colIndex + 1; // Account for leading pipe

        // Move the column left for each row
        const updatedLines = lines.map((line) => {
            // Skip empty lines
            if (!line.trim()) return line;

            // Split the line into cells
            const cells = line.split("|");

            // Swap columns
            [cells[moveIndex], cells[moveIndex - 1]] = [
                cells[moveIndex - 1],
                cells[moveIndex],
            ];

            return cells.join("|");
        });

        // Commit the changes to the editor
        this.updateTableSource(updatedLines.join("\n"));
    }

    private moveColumnRight(colIndex: number) {
        // Split the source into lines
        const lines = this.source.split("\n");
        const firstLine = lines[0];
        const maxCols = firstLine.split("|").length - 2; // Exclude leading/trailing pipes

        if (colIndex >= maxCols - 1) return; // Can't move rightmost column

        const moveIndex = colIndex + 1; // Account for leading pipe

        // Move the column right for each row
        const updatedLines = lines.map((line) => {
            // Skip empty lines
            if (!line.trim()) return line;

            // Split the line into cells
            const cells = line.split("|");

            // Swap columns
            [cells[moveIndex], cells[moveIndex + 1]] = [
                cells[moveIndex + 1],
                cells[moveIndex],
            ];

            return cells.join("|");
        });

        // Commit the changes to the editor
        this.updateTableSource(updatedLines.join("\n"));
    }

    private updateTableSource(newSource: string) {
        if (!this.editorView || !this.tablePosition) return;

        // Reset editing state so the table gets re-rendered
        this.isEditing = false;

        // Update the editor source
        this.editorView.dispatch({
            changes: {
                from: this.tablePosition.from,
                to: this.tablePosition.to,
                insert: newSource,
            },
        });
    }

    private showContextMenu(event: MouseEvent, cell: HTMLElement): void {
        // Get the row and column indices from the cell
        const row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");

        // Remove any existing context menu
        this.removeContextMenu();

        // Create a new context menu
        const menu = document.createElement("div");
        menu.className = "context-menu";
        menu.style.setProperty("--menu-x", `${event.pageX}px`);
        menu.style.setProperty("--menu-y", `${event.pageY}px`);

        // Specify menu items
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

        // Create menu items
        menuItems.forEach((item) => {
            if (item.text === "---") {
                // Create a separator
                const separator = document.createElement("div");
                separator.className = "context-menu-separator";
                menu.appendChild(separator);
            } else {
                // Create a menu item
                const menuItem = document.createElement("button");
                menuItem.className = "context-menu-item";
                menuItem.textContent = item.text;

                // Assign action if provided
                menuItem.onclick = (e) => {
                    e.stopPropagation();
                    if (item.action) {
                        item.action();
                    }
                    this.removeContextMenu();
                };

                // Append the menu item to the menu
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

        // Close menu when pressing Escape
        const closeMenuOnEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                this.removeContextMenu();
                document.removeEventListener("click", closeMenu);
                document.removeEventListener("keydown", closeMenuOnEsc);
            }
        };

        // Add event listeners to close the menu
        // Use setTimeout to ensure the menu is rendered before adding listeners
        setTimeout(() => {
            document.addEventListener("click", closeMenu);
            document.addEventListener("keydown", closeMenuOnEsc);
        }, 0);
    }

    private removeContextMenu(): void {
        document
            .querySelectorAll(".context-menu")
            .forEach((menu) => menu.remove());
    }

    private handleCellKeydown(
        event: KeyboardEvent,
        cell: HTMLElement,
        container: HTMLElement
    ): void {
        // Get the current row and column indices from the cell
        let row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");
        const table = container.querySelector("table");
        if (!table) return;

        const maxRow = table.rows.length; // Not -1 because we include the separator row
        const maxCol = table.rows[0].cells.length - 1;

        switch (event.key) {
            case "ArrowDown":
            case "Enter":
                // Move to the next cell down or exit the table
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
                // Move to the previous cell up or exit the table
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
                // Move backward or forward through the table cells
                event.preventDefault();
                if (event.shiftKey) {
                    // Move to previous cell or exit the table
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

                        // Take in count the separator row
                        if (prevRow === 1) {
                            prevRow -= 1;
                        }

                        this.focusCellAt(container, prevRow, prevCol);
                    }
                } else {
                    // Move to next cell or exit the table
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

                        // Take in count the separator row
                        if (nextRow === 1) {
                            nextRow += 1;
                        }

                        this.focusCellAt(container, nextRow, nextCol);
                    }
                }
                break;
        }
    }

    private focusCellAt(
        container: HTMLElement,
        row: number,
        col: number
    ): void {
        // Find the target cell using data attributes
        const targetCell = container.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        ) as HTMLElement;

        if (targetCell) {
            // Focus the target cell
            targetCell.focus();

            // Place cursor at the end of the cell
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
    public enterTableFromTop(): void {
        if (!this.widget) return;

        // Find the first cell in the table
        const firstCell = this.widget.querySelector(
            ".md-editable-cell"
        ) as HTMLElement;

        if (firstCell) {
            // Focus the first cell
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
    public enterTableFromBottom(): void {
        if (!this.widget) return;

        // Find the first cell in the last row
        const lastCell = this.widget.querySelector(
            "tr:last-child .md-editable-cell"
        ) as HTMLElement;

        if (lastCell) {
            // Focus the last cell
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

    public enterTableFromLeft(): void {
        if (!this.widget) return;

        // Find the first cell in the last row
        const firstCell = this.widget.querySelector(
            "tr:last-child .md-editable-cell:last-child"
        ) as HTMLElement;

        if (firstCell) {
            // Focus the first cell
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

function buildTableDecorations(
    state: EditorState,
    from?: number,
    to?: number
) {
    const decorations: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
        from,
        to,
        enter(node) {
            // Check if the node is a Table node
            if (node.name !== "Table") return;

            // Create a new TableWidget with the text content of the node
            const text = state.doc.sliceString(node.from, node.to);
            const lines = text.split("\n");

            let endPos = node.to;

            // Find the last line that is a valid table row
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i][0] !== "|") {
                    // If the last line is not a table row, adjust the end position
                    endPos = endPos - lines[i].length - 1;
                } else {
                    break; // Stop at the first valid table row
                }
            }

            const widget = new TableWidget(
                state.doc.sliceString(node.from, endPos),
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

function getTableWidgets(view: EditorView): TableWidget[] {
    const widgets: TableWidget[] = [];
    const field = view.state.field(tableStateField, false);
    
    if (field) {
        field.between(0, view.state.doc.length, (from, to, value) => {
            if (value.spec.widget instanceof TableWidget) {
                const widget = value.spec.widget as TableWidget;
                widget.setView(view);
                widgets.push(widget);
            }
        });
    }
    
    return widgets;
}

function enterTableFromTopKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = getTableWidgets(view);
    for (const widget of widgets) {
        if (widget.shouldEnterTableFromTop(cursorPos) && widget.widget) {
            widget.enterTableFromTop();
            return true;
        }
    }
    return false;
}

function enterTableFromBottomKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = getTableWidgets(view);
    for (const widget of widgets) {
        if (widget.shouldEnterTableFromBottom(cursorPos) && widget.widget) {
            widget.enterTableFromBottom();
            return true;
        }
    }
    return false;
}

function enterTableFromLeftKeymap(view: EditorView): boolean {
    const cursorPos = view.state.selection.main.head;
    const widgets = getTableWidgets(view);
    for (const widget of widgets) {
        if (widget.shouldEnterTableFromBottom(cursorPos) && widget.widget) {
            widget.enterTableFromLeft();
            return true;
        }
    }
    return false;
}

const tableKeymap = [
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

// StateField is required for block decorations (ViewPlugin cannot provide them)
const tableStateField = StateField.define<DecorationSet>({
    create(state) {
        return RangeSet.of(buildTableDecorations(state), true);
    },

    update(decorations, transaction) {
        if (transaction.docChanged) {
            return RangeSet.of(
                buildTableDecorations(transaction.state),
                true
            );
        }
        return decorations.map(transaction.changes);
    },

    provide(field) {
        return EditorView.decorations.from(field);
    },
});

export function tableRendererPlugin(): Extension {
    return [
        // StateField for block decorations (required by CodeMirror)
        tableStateField,

        // Register keyboard shortcuts for table navigation
        keymap.of(tableKeymap),
    ];
}
