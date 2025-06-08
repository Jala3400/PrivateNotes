import {
    EditorView,
    Decoration,
    type DecorationSet,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import { Line, Range } from "@codemirror/state";

class MarkdownPreviewPluginClass {
    decorations: DecorationSet;

    constructor(view: EditorView) {
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

        for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
            const line = doc.line(lineNum);

            if (line.text.length === 0) {
                continue;
            }

            // Apply styling decorations for all lines
            this.applyMarkdownStyling(line.text, line, decorations);
        }
        return Decoration.set(decorations);
    }

    private applyMarkdownStyling(
        content: string,
        line: Line,
        decorations: Range<Decoration>[]
    ) {
        // Headers
        const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const headerClass = `md-h${level}`;

            decorations.push(
                Decoration.line({
                    class: `md-header ${headerClass}`,
                }).range(line.from)
            );
            return;
        }

        // Blockquotes
        if (content.startsWith(">")) {
            decorations.push(
                Decoration.line({
                    class: `md-quote`,
                }).range(line.from)
            );
            return;
        }

        // Lists
        const listMatch = content.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (listMatch) {
            decorations.push(
                Decoration.line({
                    class: `md-list-item`,
                }).range(line.from)
            );
            return;
        }

        // Trim the line after processing lines that need special handling
        content = content.trim();

        // Code inline
        this.applyInlineDecorations(
            content,
            line,
            decorations,
            /`(.*?)`/g,
            "md-code-inline"
        );

        // Links
        this.applyInlineDecorations(
            content,
            line,
            decorations,
            /\[([^\]]+)\]\(([^)]+)\)/g,
            "md-link"
        );
    }

    private applyInlineDecorations(
        content: string,
        line: any,
        decorations: Range<Decoration>[],
        regex: RegExp,
        className: string
    ) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const start = line.from + match.index;
            const end = start + match[0].length;

            decorations.push(
                Decoration.mark({
                    class: className,
                }).range(start, end)
            );
        }
    }
}

export function createMarkdownPreviewPlugin() {
    return ViewPlugin.fromClass(MarkdownPreviewPluginClass, {
        decorations: (v) => v.decorations,
    });
}
