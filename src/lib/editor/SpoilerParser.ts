import type { MarkdownExtension } from "@lezer/markdown";

const spoilerExtension: MarkdownExtension = {
    defineNodes: [
        { name: "Spoiler" }, // new Lezer node type
    ],
    parseInline: [
        {
            name: "spoiler",
            // very simple example: parse ||word|| as Spoiler node
            parse(cx, next, pos) {
                let match = /^\|\|([^\|]+)\|\|/.exec(cx.slice(pos, cx.end));
                if (!match) return -1; // no match
                let from = pos,
                    to = pos + match[0].length;
                cx.addElement(cx.elt("Spoiler", from, to)); // emit Spoiler node
                return to;
            },
        },
    ],
};

export { spoilerExtension };
