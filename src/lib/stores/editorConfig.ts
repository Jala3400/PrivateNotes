import {
    OptionType,
    type ConfigOptions,
    type ConfigOptionsDescription,
} from "$lib/types";
import { writable } from "svelte/store";

export const editorConfigDescription: ConfigOptionsDescription = [
    [
        "tabSize",
        { label: "Tab Size", defaultValue: 4, min: 0 },
        OptionType.NUMBER,
    ],
    [
        "lineNumbers",
        { label: "Line Numbers", defaultValue: true },
        OptionType.BOOLEAN,
    ],
    [
        "lineWrapping",
        { label: "Line Wrapping", defaultValue: true },
        OptionType.BOOLEAN,
    ],
    [
        "autoCloseBrackets",
        { label: "Auto Close Brackets", defaultValue: true },
        OptionType.BOOLEAN,
    ],
    [
        "foldGutter",
        { label: "Fold Gutter", defaultValue: true },
        OptionType.BOOLEAN,
    ],
    ["vimMode", { label: "Vim Mode", defaultValue: false }, OptionType.BOOLEAN],
];

const initialConfig = Object.fromEntries(
    editorConfigDescription.map(([key, value]) => [key, value.defaultValue])
);

export const editorConfig = writable<ConfigOptions>(initialConfig);
