import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Function to style blockquote text in the editor
 */

// Handler for the core plugin
export function decorateBlockquote(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const decoration = Decoration.mark({
        class: "md-quote-mark",
    });

    decorations.push(decoration.range(node.from, node.to));
}
