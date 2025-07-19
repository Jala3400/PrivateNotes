import { OptionType, type ConfigGroupDescription, type ConfigOptions } from "$lib/types";
import { writable } from "svelte/store";

export const appearanceConfigDescription: ConfigGroupDescription = [
    [
        "Theme",
        [
            [
                "fontSize",
                { label: "Font Size", defaultValue: 16, min: 10, max: 32 },
                OptionType.NUMBER,
            ],
            [
                "fontFamily",
                {
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
                },
                OptionType.SELECT,
            ],
        ],
    ],

    [
        "Layout",
        [
            [
                "sidebarCollapsed",
                { label: "Sidebar Collapsed", defaultValue: false },
                OptionType.BOOLEAN,
            ],
        ],
    ],
];

const initialAppearanceConfig = Object.fromEntries(
    appearanceConfigDescription
        .flatMap(([_, options]) => options)
        .map(([key, value]) => [key, value.defaultValue])
);

export const appearanceConfig = writable<ConfigOptions>(
    initialAppearanceConfig
);

export function setAppearanceConfig(newConfig: ConfigOptions) {
    appearanceConfig.set(newConfig);
}
