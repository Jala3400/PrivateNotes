import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Plugin to add a class to selected lines
 */

// Handler for the core plugin
export function decorateSubAndSuperscript(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    if (node.name === "Superscript") {
        const decoration = Decoration.mark({
            class: "md-superscript",
        });
        decorations.push(decoration.range(node.from, node.to));
    } else if (node.name === "Subscript") {
        const decoration = Decoration.mark({
            class: "md-subscript",
        });
        decorations.push(decoration.range(node.from, node.to));
    }
}
