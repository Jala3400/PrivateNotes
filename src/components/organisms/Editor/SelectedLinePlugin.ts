import { Decoration, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { Extension, Range } from "@codemirror/state";

/**
 * Simple plugin to add a class to selected lines
 */
export function selectedLinePlugin(): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.selectionSet) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const decorations: Range<Decoration>[] = [];
                const selection = view.state.selection;

                for (const range of selection.ranges) {
                    const startLine = view.state.doc.lineAt(range.from);
                    const endLine = view.state.doc.lineAt(range.to);

                    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
                        const line = view.state.doc.line(lineNum);
                        
                        const lineDecoration = Decoration.line({
                            class: "cm-selected-line"
                        });

                        decorations.push(lineDecoration.range(line.from));
                    }
                }

                return Decoration.set(decorations);
            }
        },
        {
            decorations: v => v.decorations
        }
    );
}
