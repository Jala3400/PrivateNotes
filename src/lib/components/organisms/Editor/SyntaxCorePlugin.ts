import { syntaxTree } from "@codemirror/language";
import type { Extension, Range } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";

// Import handlers from each plugin
import { decorateBlockquote } from "./BlockquotePlugin";
import { decorateSeparatorLine } from "./SeparatorLinePlugin";
import { decorateSubAndSuperscript } from "./SubAndSuperscriptPlugin";
import { decorateTaskList } from "./TaskListPlugin";

export function syntaxCorePlugin(): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.selectionSet
                ) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const decorations: Range<Decoration>[] = [];
                const { state } = view;

                syntaxTree(state).iterate({
                    enter: (node) => {
                        switch (node.name) {
                            case "HorizontalRule":
                                decorateSeparatorLine(node, view, decorations);
                                break;
                            case "Superscript":
                            case "Subscript":
                                decorateSubAndSuperscript(
                                    node,
                                    view,
                                    decorations
                                );
                                break;
                            case "QuoteMark":
                                decorateBlockquote(node, view, decorations);
                                break;
                            case "Task":
                                decorateTaskList(node, view, decorations);
                                break;
                            // Add more cases as needed
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
