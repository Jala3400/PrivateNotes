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
        const headerMatch = content.match(/^(#{1,6}\s+)(.*)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const headerClass = `md-h${level}`;

            decorations.push(
                Decoration.line({
                    class: `md-header ${headerClass}`,
                }).range(line.from)
            );

            // Add decoration for the header symbols and space
            decorations.push(
                Decoration.mark({
                    class: "md-syntax",
                }).range(line.from, line.from + headerMatch[1].length)
            );

            return;
        }

        // Blockquotes
        const quoteMatch = content.match(/^(>\s*)+/);
        if (quoteMatch) {
            const quotePrefix = quoteMatch[0];
            const nestingLevel = (quotePrefix.match(/>/g) || []).length;

            // Highlight the md-syntax for the quote symbol
            decorations.push(
                Decoration.mark({
                    class: "md-syntax",
                }).range(line.from, line.from + quotePrefix.length)
            );

            // Mark each quote symbol and space separately with quote styling
            let pos = line.from;
            for (let i = 0; i < nestingLevel; i++) {
                const quoteSymbolMatch = content
                    .substring(pos - line.from)
                    .match(/^>\s*/);
                if (quoteSymbolMatch) {
                    decorations.push(
                        Decoration.mark({
                            class: `md-quote`,
                        }).range(line.from, line.to)
                    );
                    pos += quoteSymbolMatch[0].length;
                }
            }

            return;
        }

        // Lists
        const listMatch = content.match(/^(\s*)([-*+]|\d+\.\s)+(.*)$/);
        if (listMatch) {
            const indentation = listMatch[1];
            const symbol = listMatch[2];
            const symbolStart = line.from + indentation.length;
            const symbolEnd = symbolStart + symbol.length;

            decorations.push(
                Decoration.line({
                    class: `md-list-item`,
                }).range(line.from)
            );

            // Add decoration for the list symbol and space
            decorations.push(
                Decoration.mark({
                    class: "md-syntax",
                }).range(symbolStart, symbolEnd)
            );

            return;
        } // Trim the line after processing lines that need special handling
        content = content.trim();

        // Code inline
        this.applyCodeDecorations(content, line, decorations);

        // Links
        this.applyLinkDecorations(content, line, decorations);
    }

    private applyCodeDecorations(
        content: string,
        line: any,
        decorations: Range<Decoration>[]
    ) {
        const regex = /(`)(.*?)(`)/g;
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(content)) !== null) {
            const start = line.from + match.index;
            const openTick = match[1];
            const codeContent = match[2];

            // Mark the code content
            decorations.push(
                Decoration.mark({ class: "md-code-inline" }).range(
                    start,
                    start + match[0].length
                )
            );

            // Mark opening backtick
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    start,
                    start + openTick.length
                )
            );

            // Mark closing backtick
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    start + openTick.length + codeContent.length,
                    start + match[0].length
                )
            );
        }
    }

    private applyLinkDecorations(
        content: string,
        line: any,
        decorations: Range<Decoration>[]
    ) {
        const regex = /(\[)([^\]]+)(\])(\()([^)]+)(\))/g;
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(content)) !== null) {
            const start = line.from + match.index;
            const [
                ,
                openBracket,
                linkText,
                closeBracket,
                openParen,
                url,
                closeParen,
            ] = match;

            let pos = start;

            // Mark opening bracket
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    pos,
                    pos + openBracket.length
                )
            );
            pos += openBracket.length + linkText.length;

            // Mark closing bracket
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    pos,
                    pos + closeBracket.length
                )
            );
            pos += closeBracket.length;

            // Mark opening parenthesis
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    pos,
                    pos + openParen.length
                )
            );
            pos += openParen.length + url.length;

            // Mark URL
            decorations.push(
                Decoration.mark({ class: "md-link-url" }).range(
                    pos - url.length,
                    pos
                )
            );

            // Mark closing parenthesis
            decorations.push(
                Decoration.mark({ class: "md-syntax" }).range(
                    pos,
                    pos + closeParen.length
                )
            );
        }
    }
}

export function createMarkdownPreviewPlugin() {
    return ViewPlugin.fromClass(MarkdownPreviewPluginClass, {
        decorations: (v) => v.decorations,
    });
}
