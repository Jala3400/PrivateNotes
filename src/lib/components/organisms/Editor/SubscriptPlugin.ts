import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Handler for subscript nodes
 */
export function decorateSubscript(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const decoration = Decoration.mark({
        class: "md-subscript",
    });

    decorations.push(decoration.range(node.from, node.to));
}
