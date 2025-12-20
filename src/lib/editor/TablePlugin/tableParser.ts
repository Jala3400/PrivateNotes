/**
 * Represents a parsed row in a markdown table
 */
export interface TableRow {
    /** The raw cells including empty leading/trailing from pipe splits */
    cells: string[];
    /** Whether this row is a separator row (contains ---) */
    isSeparator: boolean;
    /** The original line content */
    original: string;
}

/**
 * ParsedTable provides an efficient representation of a markdown table
 * that avoids repeated string splitting operations.
 */
export class ParsedTable {
    private rows: TableRow[] = [];
    private _columnCount: number = 0;
    private _trimmedLength: number = 0;

    constructor(source: string) {
        this.parse(source);
    }

    /**
     * Parse the markdown table source into structured data.
     * Also calculates the trimmed length by excluding trailing non-table rows.
     */
    private parse(source: string): void {
        const lines = source.split("\n");
        this.rows = [];

        for (const line of lines) {
            const trimmed = line.trim();
            const isSeparator =
                /^[\|\s\-:]+$/.test(trimmed) &&
                trimmed.includes("-") &&
                trimmed.includes("|");

            const cells = line.split("|");

            this.rows.push({
                cells,
                isSeparator,
                original: line,
            });
        }

        // Find last valid table row and trim invalid trailing rows
        let lastValidIndex = this.rows.length - 1;
        for (let i = this.rows.length - 1; i >= 0; i--) {
            if (ParsedTable.isValidTableRow(this.rows[i].original)) {
                lastValidIndex = i;
                break;
            }
        }

        // Remove trailing invalid rows
        if (lastValidIndex < this.rows.length - 1) {
            this.rows = this.rows.slice(0, lastValidIndex + 1);
        }

        // Calculate trimmed length (sum of all row lengths + newlines)
        this._trimmedLength = this.rows.reduce(
            (acc, row, idx) =>
                acc +
                row.original.length +
                (idx < this.rows.length - 1 ? 1 : 0),
            0
        );

        // Calculate column count from first row (excluding leading/trailing empty cells)
        if (this.rows.length > 0) {
            this._columnCount = this.rows[0].cells.length - 2;
        }
    }

    /**
     * Get the number of rows in the table
     */
    get rowCount(): number {
        return this.rows.length;
    }

    /**
     * Get the number of columns in the table
     */
    get columnCount(): number {
        return this._columnCount;
    }

    /**
     * Get the length of the valid table source (excluding trailing non-table lines)
     */
    get trimmedLength(): number {
        return this._trimmedLength;
    }

    /**
     * Calculate the valid end position given the node start position
     */
    getEndPosition(nodeFrom: number): number {
        return nodeFrom + this._trimmedLength;
    }

    /**
     * Get a specific row by index
     */
    getRow(index: number): TableRow | undefined {
        return this.rows[index];
    }

    /**
     * Get all rows
     */
    getAllRows(): TableRow[] {
        return this.rows;
    }

    /**
     * Get the content rows (excluding separator)
     */
    getContentRows(): { row: TableRow; index: number }[] {
        return this.rows.reduce<{ row: TableRow; index: number }[]>(
            (acc, row, index) => {
                if (!row.isSeparator) {
                    acc.push({ row, index });
                }
                return acc;
            },
            []
        );
    }

    /**
     * Get cell content at a specific position (handles pipe offset)
     * @param rowIndex The row index
     * @param colIndex The column index (0-based, not including leading pipe)
     */
    getCellContent(rowIndex: number, colIndex: number): string | undefined {
        const row = this.rows[rowIndex];
        if (!row) return undefined;
        // +1 to account for leading pipe creating empty first element
        return row.cells[colIndex + 1]?.trim();
    }

    /**
     * Update a cell's content
     * @param rowIndex The row index
     * @param colIndex The column index (0-based, not including leading pipe)
     * @param content The new content
     */
    updateCell(rowIndex: number, colIndex: number, content: string): void {
        const row = this.rows[rowIndex];
        if (!row) return;
        // +1 to account for leading pipe
        row.cells[colIndex + 1] = ` ${content} `;
        row.original = row.cells.join("|");
    }

    /**
     * Add a new row at the specified index
     */
    addRow(index: number): void {
        const newCells = ["", ...Array(this._columnCount).fill("   "), ""];
        const newRow: TableRow = {
            cells: newCells,
            isSeparator: false,
            original: newCells.join("|"),
        };

        this.rows.splice(index, 0, newRow);

        // Handle separator row positioning
        if (index <= 1) {
            // Swap the second and third row if adding above the separator
            [this.rows[1], this.rows[2]] = [this.rows[2], this.rows[1]];
        }
    }

    /**
     * Add a new column at the specified index
     */
    addColumn(index: number): void {
        const insertIndex = index + 1; // Account for leading pipe

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            const newCell = row.isSeparator ? "---" : "   ";
            row.cells.splice(insertIndex, 0, newCell);
            row.original = row.cells.join("|");
        }

        this._columnCount++;
    }

    /**
     * Delete a row at the specified index
     */
    deleteRow(rowIndex: number): void {
        this.rows.splice(rowIndex, 1);

        // Handle separator row positioning
        if (rowIndex === 0 && this.rows.length >= 2) {
            // Swap the first and second rows if deleting the header
            [this.rows[0], this.rows[1]] = [this.rows[1], this.rows[0]];
        }
    }

    /**
     * Delete a column at the specified index
     */
    deleteColumn(colIndex: number): void {
        const deleteIndex = colIndex + 1; // Account for leading pipe

        for (const row of this.rows) {
            row.cells.splice(deleteIndex, 1);
            row.original = row.cells.join("|");
        }

        this._columnCount--;
    }

    /**
     * Move a row up
     */
    moveRowUp(rowIndex: number): void {
        if (rowIndex <= 0) return;
        if (rowIndex >= this.rows.length) return;

        const destRowIndex = rowIndex === 2 ? 0 : rowIndex - 1;
        [this.rows[rowIndex], this.rows[destRowIndex]] = [
            this.rows[destRowIndex],
            this.rows[rowIndex],
        ];
    }

    /**
     * Move a row down
     */
    moveRowDown(rowIndex: number): void {
        if (rowIndex >= this.rows.length - 1) return;

        const destRowIndex = rowIndex === 0 ? 2 : rowIndex + 1;
        [this.rows[rowIndex], this.rows[destRowIndex]] = [
            this.rows[destRowIndex],
            this.rows[rowIndex],
        ];
    }

    /**
     * Move a column left
     */
    moveColumnLeft(colIndex: number): void {
        if (colIndex <= 0) return;

        const moveIndex = colIndex + 1; // Account for leading pipe

        for (const row of this.rows) {
            [row.cells[moveIndex], row.cells[moveIndex - 1]] = [
                row.cells[moveIndex - 1],
                row.cells[moveIndex],
            ];
            row.original = row.cells.join("|");
        }
    }

    /**
     * Move a column right
     */
    moveColumnRight(colIndex: number): void {
        if (colIndex >= this._columnCount - 1) return;

        const moveIndex = colIndex + 1; // Account for leading pipe

        for (const row of this.rows) {
            [row.cells[moveIndex], row.cells[moveIndex + 1]] = [
                row.cells[moveIndex + 1],
                row.cells[moveIndex],
            ];
            row.original = row.cells.join("|");
        }
    }

    /**
     * Convert the parsed table back to a markdown string
     */
    toString(): string {
        return this.rows.map((row) => row.original).join("\n");
    }

    /**
     * Create a new ParsedTable from source
     */
    static fromSource(source: string): ParsedTable {
        return new ParsedTable(source);
    }

    /**
     * Check if a line is a valid table row (starts with |)
     */
    static isValidTableRow(line: string): boolean {
        return line.length > 0 && line[0] === "|";
    }
}
