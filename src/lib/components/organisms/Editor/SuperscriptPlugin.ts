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
export function superscriptPlugin(): Extension {
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
                        if (node.name === "Superscript") {
                            const decoration = Decoration.mark({
                                class: "md-superscript",
                            });
                            decorations.push(
                                decoration.range(node.from, node.to)
                            );
                        }
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
