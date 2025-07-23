import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Function to style superscript text in the editor
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
