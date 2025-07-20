import {
    OptionType,
    type ConfigurationSection,
    type Options,
} from "$lib/types";
import { writable } from "svelte/store";

export const editorConfigSections: ConfigurationSection[] = [
    {
        name: "General",
        options: [
            {
                key: "tabSize",
                label: "Tab Size",
                defaultValue: 4,
                min: 0,
                type: OptionType.NUMBER,
            },
            {
                key: "renderMd",
                label: "Render Markdown",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "lineWrapping",
                label: "Line Wrapping",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
        ],
    },
    {
        name: "Gutter",
        options: [
            {
                key: "lineNumbers",
                label: "Line Numbers",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "foldGutter",
                label: "Fold Gutter",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
        ],
    },
    {
        name: "Features",
        options: [
            {
                key: "autoCloseBrackets",
                label: "Auto Close Brackets",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "vimMode",
                label: "Vim Mode",
                defaultValue: false,
                type: OptionType.BOOLEAN,
            },
        ],
    },
];

const initialConfig = Object.fromEntries(
    editorConfigSections
        .flatMap((group) => group.options)
        .map((option) => [option.key, option.defaultValue])
);

export const editorConfig = writable<Options>(initialConfig);

export function setEditorConfig(newConfig: Options) {
    editorConfig.set(newConfig);
}
