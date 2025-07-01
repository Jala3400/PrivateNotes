import { Decoration, WidgetType, EditorView } from "@codemirror/view";
import { RangeSet, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

import type { DecorationSet } from "@codemirror/view";
import type { EditorState, Range } from "@codemirror/state";

class TableWidget extends WidgetType {
    rendered: string;

    constructor(public source: string) {
        super();

        // Parse the source as markdown table and convert to HTML
        const lines = source.trim().split("\n");
        let html = '<table class="md-table">';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.match(/^\|[\s\-\|:]+\|$/)) continue; // Skip separator rows

            const cells = line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim());
            const tag = i === 0 ? "th" : "td";

            html += "<tr>";
            for (const cell of cells) {
                html += `<${tag}>${cell}</${tag}>`;
            }
            html += "</tr>";
        }

        html += "</table>";
        this.rendered = html;
    }

    eq(widget: TableWidget): boolean {
        return this.source === widget.source;
    }

    toDOM(): HTMLElement {
        let content = document.createElement("div");
        content.className = "cm-table-widget";
        content.innerHTML = this.rendered;
        return content;
    }
}

function renderTables(state: EditorState, from?: number, to?: number) {
    const decorations: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
        from,
        to,
        enter(node) {
            if (node.name !== "Table") return;

            const text = state.doc.sliceString(node.from, node.to);
            const decoration = Decoration.replace({
                widget: new TableWidget(text),
                block: true,
            });

            decorations.push(decoration.range(node.from, node.to));
        },
    });

    return decorations;
}

export function tableRendererPlugin() {
    return StateField.define<DecorationSet>({
        create(state) {
            return RangeSet.of(renderTables(state), true);
        },

        update(decorations, transaction) {
            return RangeSet.of(renderTables(transaction.state), true);
        },

        provide(field) {
            return EditorView.decorations.from(field);
        },
    });
}
