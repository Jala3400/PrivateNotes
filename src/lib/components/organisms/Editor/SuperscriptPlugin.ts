import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Handler for superscript nodes
 */
export function decorateSuperscript(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const decoration = Decoration.mark({
        class: "md-superscript",
    });

    decorations.push(decoration.range(node.from, node.to));
}
