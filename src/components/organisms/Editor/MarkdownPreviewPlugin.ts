import {
    EditorView,
    Decoration,
    type DecorationSet,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { Range } from "@codemirror/state";
import MarkdownIt from "markdown-it";

class MarkdownPreviewWidget extends WidgetType {
    constructor(private html: string) {
        super();
    }

    toDOM() {
        const span = document.createElement("div");
        span.innerHTML = this.html;
        span.className = "md-preview";
        return span;
    }

    eq(other: MarkdownPreviewWidget) {
        return this.html === other.html;
    }
}

class MarkdownPreviewPluginClass {
    decorations: DecorationSet;
    private md: MarkdownIt;

    constructor(view: EditorView) {
        this.md = new MarkdownIt();
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (
            update.docChanged ||
            update.selectionSet ||
            update.viewportChanged
        ) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view: EditorView): DecorationSet {
        const decorations: Range<Decoration>[] = [];
        const doc = view.state.doc;
        const cursorLine = view.state.doc.lineAt(
            view.state.selection.main.head
        ).number;

        for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
            const line = doc.line(lineNum);
            const lineContent = line.text.trim();

            if (lineContent.length === 0 || lineNum === cursorLine) {
                continue;
            }

            const html = this.md.render(lineContent);
            const widget = new MarkdownPreviewWidget(html);

            decorations.push(
                Decoration.replace({
                    widget,
                }).range(line.from, line.to)
            );
        }
        return Decoration.set(decorations);
    }
}

export function createMarkdownPreviewPlugin() {
    return ViewPlugin.fromClass(MarkdownPreviewPluginClass, {
        decorations: (v) => v.decorations,
    });
}
