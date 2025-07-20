import type { ConfigurationGroup } from "$lib/types";
import {
    appearanceConfig,
    appearanceConfigSections,
    setAppearanceConfig,
} from "./configs/appearanceConfig";
import {
    editorConfig,
    editorConfigSections,
    setEditorConfig,
} from "./configs/editorConfig";

// Unified config group list
export const configGroupList: ConfigurationGroup[] = [
    {
        name: "Appearance",
        store: appearanceConfig,
        sections: appearanceConfigSections,
        setter: setAppearanceConfig,
    },
    {
        name: "Editor",
        store: editorConfig,
        sections: editorConfigSections,
        setter: setEditorConfig,
    },
];

export function loadConfigFile(config: Record<string, Record<string, any>>) {
    Object.entries(config).forEach(([key, value]) => {
        const store = configGroupList.find(
            (item) => item.name.toLowerCase() === key.toLowerCase()
        )?.store;

        if (store) {
            store.update((current) => ({
                ...current,
                ...value,
            }));
        }
    });
}
