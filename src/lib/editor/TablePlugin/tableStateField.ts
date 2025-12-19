import { RangeSet, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { buildTableDecorations } from "./tableHelpers";

/**
 * StateField for table decorations (required for block decorations)
 */
export const tableStateField = StateField.define<DecorationSet>({
    create(state) {
        return RangeSet.of(buildTableDecorations(state), true);
    },

    update(decorations, transaction) {
        if (transaction.docChanged) {
            return RangeSet.of(
                buildTableDecorations(transaction.state),
                true
            );
        }
        return decorations.map(transaction.changes);
    },

    provide(field) {
        return EditorView.decorations.from(field);
    },
});
