import type { Range } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";

/**
 * Function to hide spoiler text (||text||) until cursor is inside
 */
export function decorateSpoiler(
    node: any,
    view: EditorView,
    decorations: Range<Decoration>[]
) {
    const state = view.state;
    const selections = state.selection.ranges;

    // Check if cursor is inside the spoiler text
    const isCursorInside = selections.some(
        ({ from, to }) => from >= node.from + 1 && to <= node.to - 1
    );

    // If cursor is not inside, hide the content
    if (!isCursorInside) {
        const decoration = Decoration.mark({
            class: "md-spoiler-hidden",
        });
        decorations.push(decoration.range(node.from, node.to));
    } else {
        // When cursor is inside, show the content with visible markers
        const decoration = Decoration.mark({
            class: "md-spoiler-visible",
        });
        decorations.push(decoration.range(node.from, node.to));
    }
}
