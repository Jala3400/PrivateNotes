import { OptionType, type ConfigGroup, type ConfigOptions } from "$lib/types";
import { writable } from "svelte/store";

export const editorConfigDescription: ConfigGroup = [
    [
        "General",
        [
            [
                "tabSize",
                { label: "Tab Size", defaultValue: 4, min: 0 },
                OptionType.NUMBER,
            ],
            [
                "renderMd",
                { label: "Render Markdown", defaultValue: true },
                OptionType.BOOLEAN,
            ],
            [
                "lineWrapping",
                { label: "Line Wrapping", defaultValue: true },
                OptionType.BOOLEAN,
            ],
        ],
    ],

    [
        "Gutter",
        [
            [
                "lineNumbers",
                { label: "Line Numbers", defaultValue: true },
                OptionType.BOOLEAN,
            ],
            [
                "foldGutter",
                { label: "Fold Gutter", defaultValue: true },
                OptionType.BOOLEAN,
            ],
        ],
    ],

    [
        "Features",
        [
            [
                "autoCloseBrackets",
                { label: "Auto Close Brackets", defaultValue: true },
                OptionType.BOOLEAN,
            ],
            [
                "vimMode",
                { label: "Vim Mode", defaultValue: false },
                OptionType.BOOLEAN,
            ],
        ],
    ],
];

const initialConfig = Object.fromEntries(
    editorConfigDescription
        .flatMap(([_, options]) => options)
        .map(([key, value]) => [key, value.defaultValue])
);

export const editorConfig = writable<ConfigOptions>(initialConfig);

export function setEditorConfig(newConfig: ConfigOptions) {
    editorConfig.set(newConfig);
}
