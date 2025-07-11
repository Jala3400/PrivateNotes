import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { Extension, Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/**
 * Simple plugin to add a class to selected lines
 */
export function separatorLinePlugin(): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const decorations: Range<Decoration>[] = [];
                const state = view.state;

                // Use syntax tree iteration for better performance
                syntaxTree(state).iterate({
                    enter: (node) => {
                        if (node.name !== "HorizontalRule") return;

                        const decoration = Decoration.line({
                            class: "md-separator",
                        });

                        decorations.push(decoration.range(node.from));
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
