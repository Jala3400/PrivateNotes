import { StateField, RangeSetBuilder, Range } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

// Helper to check if a line is a separator line (|----|-----|)
function isSeparatorLine(line: string): boolean {
    const trimmed = line.trim();
    return /^\|?[\s\-:|]+\|?$/.test(trimmed) && trimmed.includes("-");
}

// Parse table structure and extract cell information
interface TableCell {
    from: number;
    to: number;
    content: string;
    isHeader: boolean;
    row: number;
    col: number;
}

interface TableInfo {
    from: number;
    to: number;
    cells: TableCell[];
    rows: number;
    cols: number;
}

// StateField to track and decorate tables
const tableStateField = StateField.define<DecorationSet>({
    create(state) {
        return buildTableDecorations(state);
    },
    update(decorations, tr) {
        if (!tr.docChanged && !tr.selection) {
            return decorations;
        }
        return buildTableDecorations(tr.state);
    },
    provide: (f) => EditorView.decorations.from(f),
});

function buildTableDecorations(state: any): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const decorations: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
        enter(node) {
            if (node.name === "Table") {
                const tableFrom = node.from;
                const tableTo = node.to;
                const doc = state.doc;
                
                // Add table-wide background decoration
                decorations.push(
                    Decoration.line({
                        class: "cm-table-line",
                    }).range(doc.lineAt(tableFrom).from)
                );

                // Parse each line of the table
                let pos = tableFrom;
                while (pos < tableTo) {
                    const line = doc.lineAt(pos);
                    const lineText = doc.sliceString(line.from, line.to);
                    
                    if (isSeparatorLine(lineText)) {
                        // Style separator lines
                        decorations.push(
                            Decoration.line({
                                class: "cm-table-separator-line",
                            }).range(line.from)
                        );
                        decorations.push(
                            Decoration.mark({
                                class: "cm-table-separator",
                            }).range(line.from, line.to)
                        );
                    } else {
                        // Style regular table rows
                        decorations.push(
                            Decoration.line({
                                class: "cm-table-row",
                            }).range(line.from)
                        );
                        
                        // Highlight pipes
                        let pipePos = line.from;
                        while (pipePos < line.to) {
                            const char = doc.sliceString(pipePos, pipePos + 1);
                            if (char === "|") {
                                decorations.push(
                                    Decoration.mark({
                                        class: "cm-table-pipe",
                                    }).range(pipePos, pipePos + 1)
                                );
                            }
                            pipePos++;
                        }
                    }
                    
                    pos = line.to + 1;
                }

                // Check if first non-separator line should be treated as header
                const firstLine = doc.lineAt(tableFrom);
                const secondLine = pos < tableTo ? doc.lineAt(Math.min(firstLine.to + 1, tableTo)) : null;
                
                if (secondLine && isSeparatorLine(doc.sliceString(secondLine.from, secondLine.to))) {
                    // First line is header
                    decorations.push(
                        Decoration.line({
                            class: "cm-table-header-line",
                        }).range(firstLine.from)
                    );
                    decorations.push(
                        Decoration.mark({
                            class: "cm-table-header",
                        }).range(firstLine.from, firstLine.to)
                    );
                }
            }
        },
    });

    // Sort decorations by position
    decorations.sort((a, b) => a.from - b.from);
    
    for (const deco of decorations) {
        builder.add(deco.from, deco.to, deco.value);
    }

    return builder.finish();
}

// ViewPlugin for hover effects and cell highlighting
const tableViewPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        hoveredCell: { line: number; col: number } | null = null;

        constructor(view: EditorView) {
            this.decorations = Decoration.none;
            this.setupEventListeners(view);
        }

        update(update: ViewUpdate) {
            // Could add hover-based decorations here if needed
        }

        setupEventListeners(view: EditorView) {
            // Optional: Add mouse event listeners for cell hover effects
            // This would require more complex state management
        }

        destroy() {
            // Cleanup if needed
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

// Theme/styling for table elements
const tableTheme = EditorView.baseTheme({
    ".cm-table-line": {
        backgroundColor: "var(--background-dark-lighter, rgba(255, 255, 255, 0.02))",
    },
    ".cm-table-row": {
        borderLeft: "2px solid transparent",
    },
    ".cm-table-separator-line": {
        backgroundColor: "var(--background-dark-lighter, rgba(255, 255, 255, 0.03))",
    },
    ".cm-table-separator": {
        color: "var(--text-muted, #666)",
        fontWeight: "300",
    },
    ".cm-table-pipe": {
        color: "var(--accent-color, #888)",
        fontWeight: "bold",
        padding: "0 2px",
    },
    ".cm-table-header-line": {
        backgroundColor: "var(--background-dark-lighter, rgba(100, 150, 255, 0.1))",
        fontWeight: "600",
    },
    ".cm-table-header": {
        color: "var(--text-primary, #fff)",
        fontWeight: "600",
    },
    ".cm-table-cell": {
        padding: "2px 8px",
        cursor: "text",
    },
    ".cm-table-header-cell": {
        padding: "2px 8px",
        cursor: "text",
        fontWeight: "600",
    },
});

export function tableRendererPlugin() {
    return [tableStateField, tableViewPlugin, tableTheme];
}
