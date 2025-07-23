import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Function to style separator lines in the editor
 */

// Handler for the core plugin
export function decorateSeparatorLine(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const decoration = Decoration.line({
        class: "md-separator",
    });

    decorations.push(decoration.range(node.from));
}
