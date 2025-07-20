import {
    OptionType,
    type ConfigurationGroup,
    type ConfigurationSection,
    type Options,
} from "$lib/types";
import { writable } from "svelte/store";
import { initialConfig, optionsFromSections } from "./configUtils";

const editorConfigSections: ConfigurationSection[] = [
    {
        name: "General",
        options: [
            {
                key: "tabSize",
                name: "Tab Size",
                defaultValue: 4,
                min: 0,
                type: OptionType.NUMBER,
            },
            {
                key: "renderMd",
                name: "Render Markdown",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "lineWrapping",
                name: "Line Wrapping",
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
                name: "Line Numbers",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "foldGutter",
                name: "Fold Gutter",
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
                name: "Auto Close Brackets",
                defaultValue: true,
                type: OptionType.BOOLEAN,
            },
            {
                key: "vimMode",
                name: "Vim Mode",
                defaultValue: false,
                type: OptionType.BOOLEAN,
            },
        ],
    },
];

const initialEditorConfig = optionsFromSections(editorConfigSections);

const editorKey = "editor";

export const editorConfig = writable<Options>({
    ...initialEditorConfig,
    ...initialConfig[editorKey],
});

function setEditorConfig(newConfig: Options) {
    editorConfig.set(newConfig);
}

export const editorConfigGroup: ConfigurationGroup = {
    name: "Editor",
    key: editorKey,
    store: editorConfig,
    sections: editorConfigSections,
    setter: setEditorConfig,
};
