import {
    appearanceConfig,
    appearanceConfigDescription,
    setAppearanceConfig,
} from "./configs/appearanceConfig";
import {
    editorConfig,
    editorConfigDescription,
    setEditorConfig,
} from "./configs/editorConfig";

// Unified config group list
export const configGroupList = [
    {
        name: "Appearance",
        store: appearanceConfig,
        description: appearanceConfigDescription,
        setter: setAppearanceConfig,
    },
    {
        name: "Editor",
        store: editorConfig,
        description: editorConfigDescription,
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
