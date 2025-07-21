import {
    OptionType,
    type Options,
    type ConfigurationSection,
    type ConfigurationGroup,
} from "$lib/types";
import { writable } from "svelte/store";
import { initialConfig, optionsFromSections } from "./configUtils";

const appearanceConfigSections: ConfigurationSection[] = [
    {
        name: "Theme",
        options: [
            {
                key: "fontSize",
                name: "Font Size",
                defaultValue: 16,
                min: 10,
                max: 32,
                type: OptionType.NUMBER,
            },
            {
                key: "fontFamily",
                name: "Font Family",
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
                name: "Sidebar Collapsed",
                defaultValue: false,
                type: OptionType.BOOLEAN,
            },
        ],
    },
];

const defaultAppearanceConfig = optionsFromSections(appearanceConfigSections);

const appearanceKey = "appearance";

export const appearanceConfig = writable<Options>({
    ...defaultAppearanceConfig,
    ...initialConfig[appearanceKey],
});

function setAppearanceConfig(newConfig: Options) {
    appearanceConfig.set(newConfig);
}

export const appearanceConfigGroup: ConfigurationGroup = {
    name: "Appearance",
    key: appearanceKey,
    sections: appearanceConfigSections,
    defaults: defaultAppearanceConfig,
    store: appearanceConfig,
    setter: setAppearanceConfig,
};
