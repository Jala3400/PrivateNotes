import {
    OptionType,
    type Options,
    type ConfigurationSection,
} from "$lib/types";
import { writable } from "svelte/store";

export const appearanceConfigSections: ConfigurationSection[] = [
    {
        name: "Theme",
        options: [
            {
                key: "fontSize",
                label: "Font Size",
                defaultValue: 16,
                min: 10,
                max: 32,
                type: OptionType.NUMBER,
            },
            {
                key: "fontFamily",
                label: "Font Family",
                defaultValue: "Segoe UI",
                options: [
                    "Segoe UI",
                    "Monospace",
                    "Arial",
                    "Helvetica",
                    "Roboto",
                    "sans-serif",
                    "Courier New",
                    "Times New Roman",
                    "Georgia",
                    "Comic Sans MS",
                ],
                type: OptionType.SELECT,
            },
        ],
    },
    {
        name: "Layout",
        options: [
            {
                key: "sidebarCollapsed",
                label: "Sidebar Collapsed",
                defaultValue: false,
                type: OptionType.BOOLEAN,
            },
        ],
    },
];

const initialAppearanceConfig = Object.fromEntries(
    appearanceConfigSections
        .flatMap((group) => group.options)
        .map((option) => [option.key, option.defaultValue])
);

export const appearanceConfig = writable<Options>(initialAppearanceConfig);

export function setAppearanceConfig(newConfig: Options) {
    appearanceConfig.set(newConfig);
}
