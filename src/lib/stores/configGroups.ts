import { appearanceConfig } from "./configs/appearanceConfig";
import { editorConfig } from "./configs/editorConfig";

const configStores = {
    appearance: appearanceConfig,
    editor: editorConfig,
};

export function loadConfigFile(config: Record<string, Record<string, any>>) {
    Object.entries(config).forEach(([key, value]) => {
        const store = configStores[key as keyof typeof configStores];
        if (store) {
            store.update((current) => ({
                ...current,
                ...value,
            }));
        }
    });
}
