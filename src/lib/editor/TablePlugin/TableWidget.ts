import { WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import { ParsedTable } from "./tableParser";

export class TableWidget extends WidgetType {
    private editorView: EditorView | null = null;
    private parsedTable: ParsedTable;
    private isEditing: boolean = false;
    public tablePosition: { from: number; to: number } | null = null;
    public widget: HTMLDivElement | null = null;

    constructor(parsedTable: ParsedTable, from: number, to: number) {
        super();
        this.tablePosition = { from, to };
        this.parsedTable = parsedTable;
    }

    // Checks if this widget should be rerendered
    eq(widget: TableWidget): boolean {
        // Don't rerender if currently editing or the table loses focus
        // todo: check if the rerendering is really necessary
        return this.isEditing;
    }

    // Converts the widget to a DOM element
    toDOM(view: EditorView): HTMLElement {
        // Store the view reference when the widget is rendered
        this.editorView = view;

        let content = document.createElement("div");
        content.className = "cm-table-widget";

        // Generate the HTML table from the parsed table
        let html = '<table class="md-table">';
        const rows = this.parsedTable.getAllRows();

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];

            // Skip separator lines
            if (row.isSeparator) continue;

            // Get cells (excluding leading/trailing empty cells from pipe split)
            const cells = row.cells.slice(1, -1).map((cell) => cell.trim());
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

        // Update the cell in the parsed table
        this.parsedTable.updateCell(row, col, newContent);

        const newTableSource = this.parsedTable.toString();

        // Dispatch transaction to update editor
        this.editorView.dispatch({
            changes: {
                from: this.tablePosition.from,
                to: this.tablePosition.to,
                insert: newTableSource,
            },
        });

        // Update the table position for future edits
        const newToPosition = this.tablePosition.from + newTableSource.length;
        this.tablePosition = {
            from: this.tablePosition.from,
            to: newToPosition,
        };
    }

    /**
     * Add a row at the specified index
     */
    public addRow(index: number) {
        this.parsedTable.addRow(index);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Add a column at the specified index
     */
    public addColumn(index: number) {
        this.parsedTable.addColumn(index);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Delete a row at the specified index
     */
    public deleteRow(rowIndex: number) {
        this.parsedTable.deleteRow(rowIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Delete a column at the specified index
     */
    public deleteColumn(colIndex: number) {
        this.parsedTable.deleteColumn(colIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Move a row up
     */
    public moveRowUp(rowIndex: number) {
        this.parsedTable.moveRowUp(rowIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Move a row down
     */
    public moveRowDown(rowIndex: number) {
        this.parsedTable.moveRowDown(rowIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Move a column left
     */
    public moveColumnLeft(colIndex: number) {
        this.parsedTable.moveColumnLeft(colIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    /**
     * Move a column right
     */
    public moveColumnRight(colIndex: number) {
        this.parsedTable.moveColumnRight(colIndex);
        this.updateTableSource(this.parsedTable.toString());
    }

    private updateTableSource(newSource: string) {
        if (!this.editorView || !this.tablePosition) return;

        // Update the editor source
        this.editorView.dispatch({
            changes: {
                from: this.tablePosition.from,
                to: this.tablePosition.to,
                insert: newSource,
            },
        });

        // Reset editing state so the table gets re-rendered
        this.isEditing = false;
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

    /**
     * Get the current cell position (row, col) from the focused cell
     */
    public getCurrentCellPosition(): { row: number; col: number } | null {
        if (!this.widget) return null;

        const activeElement = document.activeElement;
        if (!activeElement || !this.widget.contains(activeElement)) {
            return null;
        }

        const cell = activeElement as HTMLElement;
        if (!cell.classList.contains("md-editable-cell")) {
            return null;
        }

        const row = parseInt(cell.dataset.row || "0");
        const col = parseInt(cell.dataset.col || "0");

        return { row, col };
    }
}
